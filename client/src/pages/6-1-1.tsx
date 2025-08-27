import { Canvas } from '@react-three/fiber'
import { CleaningProgressUI, GameMessages, SolutionSelector } from '@/components/6-1-1/UI'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import IntroMouseCameraController from '@/components/IntroMouseCameraController'
import { SplashType, initialCamera, solutionColors } from '../types/6-1-1'
import { AnimatePresence, motion } from 'framer-motion'
import ActivityGuideModal from '@/components/6-1-1/ActivityGuideModal'
import { useGameState } from '@/components/6-1-1/GameStateManager'
import { useCameraController } from '@/components/6-1-1/useCameraController'
import { useGameHandlers } from '@/components/6-1-1/useGameHandlers'
import { useAudioManager } from '@/components/6-1-1/useAudioManager'
import { GameScene } from '@/components/6-1-1/GameScene'
import { CrayonTextButton } from '@/components/CrayonUIButton'

type ButtonStyle = { bg: string; border: string; text: string }

type RoomTheme = {
  goal: ButtonStyle
  guide: ButtonStyle
  start: ButtonStyle
}

const roomTheme: RoomTheme = {
  goal: { bg: '#05A8A4', border: '#7BCACA', text: '#FFFFFF' },
  guide: { bg: '#05A8A4', border: '#7BCACA', text: '#FFFFFF' },
  start: { bg: '#9B1CDF', border: '#DFB2FA', text: '#FFFFFF' },
}

function BackButton({
  isZoomed,
  showIntro,
  onBack,
  onRestart,
  isAnimating,
  gamePhase,
  currentMission,
}: {
  isZoomed: boolean
  showIntro: boolean
  onBack: () => void
  onRestart: () => void
  isAnimating: boolean
  gamePhase: string
  currentMission: SplashType | null
}) {
  if (!isZoomed || showIntro || gamePhase === 'wiping') return null

  return (
    <>
      <div className='absolute w-fit top-4 left-4 z-10 flex'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}>
          <CrayonTextButton
            ariaLabel='모드 선택 화면으로 돌아가기'
            text='첫 화면으로'
            icon='arrow-left'
            iconPosition='left'
            width={170}
            height={75}
            iconSize={30}
            bg='#01A7A2'
            color='#78C9C9'
            textcolor='#FFFFFF'
            onClick={onBack}
            innerCircleVisible={false}
          />
        </motion.div>
        {currentMission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}>
            <CrayonTextButton
              ariaLabel='모드 선택 화면으로 돌아가기'
              text='다시하기'
              icon='replay'
              iconPosition='left'
              width={170}
              height={75}
              iconSize={30}
              bg='#01A7A2'
              color='#78C9C9'
              textcolor='#FFFFFF'
              onClick={onRestart}
              innerCircleVisible={false}
            />
          </motion.div>
        )}
      </div>
    </>
  )
}

export default function Home() {
  // 상태 관리
  const [gameState, gameActions] = useGameState()
  const [isLoaded, setIsLoaded] = useState(false)
  const [perfSucks, degrade] = useState(false)
  
  // 마우스 위치 및 화면 크기 추적
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [screenSize, setScreenSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1920, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1080 
  })

  // 오디오 매니저 상태
  const [isAudioManagerStarted, setIsAudioManagerStarted] = useState(false)

  // --- BGM 상태 ---
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // localStorage -> 상태 동기화 (마운트 후)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [])

  // BGM 인스턴스 준비
  useEffect(() => {
    const el = new Audio('/sounds/6-1-1/6-1-1-BGM.mp3')
    el.loop = true
    el.volume = 0.05
    bgmRef.current = el
    return () => {
      el.pause()
      bgmRef.current = null
    }
  }, [])

  // 탭 가시성에 따른 일시정지/재개
  useEffect(() => {
    const handleVisibility = () => {
      const el = bgmRef.current
      if (!el) return
      if (document.visibilityState === 'hidden') el.pause()
      else if (bgmEnabled && bgmReady) el.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [bgmEnabled, bgmReady])


  // 상태 반영(저장/재생/일시정지)
  useEffect(() => {
    const el = bgmRef.current
    if (!el) return
    try {
      localStorage.setItem('bgmEnabled', JSON.stringify(bgmEnabled))
    } catch {}
    const run = async () => {
      if (bgmEnabled && bgmReady) {
        await el.play().catch(() => {})
      } else {
        el.pause()
      }
    }
    run()
  }, [bgmEnabled, bgmReady])

  const toggleBgm = () => {
    setBgmEnabled((v) => {
      const next = !v
      if (next) setBgmReady(true)
      return next
    })
  }

  // 커스텀 훅들
  const audio = useAudioManager()
  const { controlsRef, moveToTarget, resetCamera } = useCameraController(gameState, gameActions)
  const { 
    handleSolutionSelect, 
    handleSpray, 
    handleAnimationComplete, 
    handleWiping, 
    restartCurrentMission, 
    resetMission 
  } = useGameHandlers(gameState, gameActions)

  // 마우스 위치 및 화면 크기 추적
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
      
      // wiping 단계에서의 기존 로직도 유지
      if (gameState.gamePhase === 'wiping') {
        handleWiping(event)
      }
    }

    const handleResize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight })
    }

    // 항상 마우스 움직임을 추적 (wiping 도구 애니메이션용)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
    }
  }, [gameState.gamePhase, gameState.currentMission, gameState.mouseVelocity, gameState.lastMousePosition])

  // 계산된 값들
  const splashOpacities = {
    splash01: (100 - gameState.cleaningProgress.splash01) / 100,
    splash02: (100 - gameState.cleaningProgress.splash02) / 100,
    splash03: (100 - gameState.cleaningProgress.splash03) / 100,
    splash04: (100 - gameState.cleaningProgress.splash04) / 100,
  } as const

  const handleGoBack = () => {
    resetCamera()
    setIsAudioManagerStarted(false)
    audio.stopAllAudio()
  }

  const resetToIntro = () => {
    resetCamera()
    setIsAudioManagerStarted(false)
    audio.stopAllAudio()
    gameActions.setShowIntro(true)
    gameActions.setCurrentMission(null)
  }

  // 이벤트 핸들러들
  const handleShowActivityGuide = () => {
    gameActions.setShowActivityGuide(true)
  }

  const handleCloseActivityGuide = () => {
    gameActions.setShowActivityGuide(false)
  }

  const handleMissionClick = (
    missionId: string,
    position: [number, number, number],
    cameraPosition: [number, number, number],
  ) => {
    moveToTarget(position, cameraPosition, missionId as SplashType)
    if (!gameState.completedMissions[missionId as SplashType]) {
      const narrationFiles = {
        splash01: '/sounds/6-1-1/narration/6-1-1-A-1.MP3',
        splash02: '/sounds/6-1-1/narration/6-1-1-C-1.MP3',
        splash03: '/sounds/6-1-1/narration/6-1-1-E-1.MP3',
        splash04: '/sounds/6-1-1/narration/6-1-1-G-1.MP3',
      }

      setTimeout(() => {
        audio.playNarration(narrationFiles[missionId as SplashType])
      }, 1000)
    }
  }

  const handleEnterExperience = () => {
    audio.playSound('/sounds/Enter_Cute.mp3')
    setBgmReady(true)
    setTimeout(() => gameActions.setShowIntro(false), 300)
  }

  return (
    <div className='w-screen h-screen bg-white flex flex-col'>
      {mounted && (
        <>
          <CrayonTextButton
            ariaLabel={'첫 화면으로'}
            icon={'home'}
            position='absolute'
            iconPosition='left'
            onClick={resetToIntro}
            width={108}
            height={108}
            color='#ffffff'
            textcolor='#ffffff'
            bg='rgba(255,255,255,0.10)'
            className='background-blur z-[300] right-[108px] border-white/20 '
            right={16}
            top={16}
            iconSize={40}
          />
          <CrayonTextButton
            ariaLabel={bgmEnabled ? '배경음악 끄기' : '배경음악 켜기'}
            icon={(bgmEnabled ? 'volume2' : 'volumeX').toLowerCase()}
            position='absolute'
            iconPosition='left'
            onClick={toggleBgm}
            width={108}
            height={108}
            color='#ffffff'
            textcolor='#ffffff'
            bg='rgba(255,255,255,0.10)'
            className='background-blur border-white/20 z-[1300]'
            right={16}
            top={16}
            iconSize={40}
          />
        </>
      )}

      <BackButton
        isZoomed={gameState.isZoomed}
        showIntro={gameState.showIntro}
        onBack={handleGoBack}
        onRestart={restartCurrentMission}
        isAnimating={gameState.isAnimating}
        gamePhase={gameState.gamePhase}
        currentMission={gameState.currentMission}
      />

      <GameMessages
        showMessage={gameState.showMessage}
        showIntro={gameState.showIntro}
        gamePhase={gameState.gamePhase}
        material={gameState.showClickMessage}
        wipingProgress={gameState.currentMission ? gameState.wipingProgress[gameState.currentMission] : 0}
        showLiquidMessage={gameState.showLiquidMessage}
      />

      <SolutionSelector
        gamePhase={gameState.gamePhase}
        showIntro={gameState.showIntro}
        selectedSolution={gameState.selectedSolution}
        onSolutionSelect={(solution: any) => {
          handleSolutionSelect(solution)
          setIsAudioManagerStarted(true)
        }}
      />

      <CleaningProgressUI
        cleaningProgress={gameState.cleaningProgress}
        completedMissions={gameState.completedMissions}
        showIntro={gameState.showIntro}
        isZoomed={gameState.isZoomed}
        onReset={resetMission}
      />

      <Scene
        shadows
        camera={{ position: initialCamera.position, fov: 50 }}
        gl={{
          shadowMap: {
            enabled: true,
            type: THREE.PCFSoftShadowMap,
          },
        }}>
        <IntroMouseCameraController enabled={gameState.showIntro} />

        <GameScene
          gameState={gameState}
          controlsRef={controlsRef}
          onLoadingComplete={() => setIsLoaded(true)}
          onPerfDecline={() => degrade(true)}
          onMissionClick={handleMissionClick}
          onSpray={handleSpray}
          onAnimationComplete={handleAnimationComplete}
          splashOpacities={splashOpacities}
          isAudioManagerStarted={isAudioManagerStarted}
          mousePosition={mousePosition}
          screenSize={screenSize}
        />
      </Scene>

      {isLoaded && gameState.showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='산성 용액과 염기성 용액을 이용하는 예 알아보기'
          description={['산성 용액과 염기성 용액이 집 안에서 어떻게 이용되는지 알아봅시다.']}
          backgroundSvg='/img/cover/6-1-1.svg'
          descriptionSound='/sounds/6-1-1/narration/6-1-1-Goal.MP3'
          onActivityGuide={handleShowActivityGuide}
          buttonTheme={roomTheme}
        />
      )}

      <ActivityGuideModal isOpen={gameState.showActivityGuide} onClose={handleCloseActivityGuide} />
    </div>
  )
}