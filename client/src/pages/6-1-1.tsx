import { Canvas } from '@react-three/fiber'
import { CleaningProgressUI, GameMessages, SolutionSelector } from '@/components/6-1-1/UI'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useState, useEffect } from 'react'
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
      <div className='absolute w-fit top-4 left-4 z-10 flex gap-4'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}>
          <button
            onClick={onBack}
            disabled={isAnimating}
            className='px-6 pt-3 pb-4 bg-[#FF8026] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#ff9b54] hover:shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(152,0,0,0.50)] transition-all duration-300'
            aria-label='모드 선택 화면으로 돌아가기'>
            <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
              첫 화면으로
            </div>
          </button>
        </motion.div>

        {currentMission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}>
            <button
              onClick={onRestart}
              disabled={isAnimating}
              className='px-6 pt-3 pb-4 bg-[#52AE46] rounded-[20px] shadow-[inset_0px_-6px_8px_0px_rgba(65,87,51,0.50)] inline-flex justify-center items-center overflow-hidden hover:bg-[#6BC05D] inline-flex justify-center items-center gap-2.5 overflow-hidden active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(152,0,0,0.50)] transition-all duration-300'
              aria-label='다시하기'>
              <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                다시하기
              </div>
            </button>
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

  // 커스텀 훅들
  const audio = useAudioManager()
  const { controlsRef, moveToTarget, resetCamera } = useCameraController(gameState, gameActions)
  const { handleSolutionSelect, handleSpray, handleWiping, restartCurrentMission, resetMission } = useGameHandlers(
    gameState,
    gameActions,
  )

  // 계산된 값들
  const splashOpacities = {
    splash01: (100 - gameState.cleaningProgress.splash01) / 100,
    splash02: (100 - gameState.cleaningProgress.splash02) / 100,
    splash03: (100 - gameState.cleaningProgress.splash03) / 100,
    splash04: (100 - gameState.cleaningProgress.splash04) / 100,
  } as const

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

    // 나레이션 재생
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

  // 마우스 이벤트 리스너들
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (gameState.gamePhase === 'wiping') {
        handleWiping(event)
      }
    }

    const handleClick = (event: MouseEvent) => {
      if (gameState.gamePhase === 'spraying' && gameState.selectedSolution && gameState.currentMission) {
        const target = event.target as HTMLElement
        if (!target.closest('button') && !target.closest('.absolute')) {
          handleSpray()
        }
      }
    }

    if (gameState.gamePhase === 'wiping') {
      window.addEventListener('mousemove', handleMouseMove)
    }

    if (gameState.gamePhase === 'spraying' && gameState.selectedSolution) {
      const timeoutId = setTimeout(() => {
        window.addEventListener('click', handleClick)
      }, 0)

      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('click', handleClick)
      }
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [
    gameState.gamePhase,
    gameState.sprayCount,
    gameState.currentMission,
    gameState.mouseVelocity,
    gameState.lastMousePosition,
    gameState.selectedSolution,
  ])

  return (
    <div className='w-screen h-screen bg-white flex flex-col'>
      <BackButton
        isZoomed={gameState.isZoomed}
        showIntro={gameState.showIntro}
        onBack={resetCamera}
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
        onSolutionSelect={handleSolutionSelect}
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
          splashOpacities={splashOpacities}
        />
      </Scene>

      {isLoaded && gameState.showIntro && (
        <Intro
          onEnter={() => {
            audio.playSound('/sounds/Enter_Cute.mp3')
            setTimeout(() => gameActions.setShowIntro(false), 300)
          }}
          title='산성 용액과 염기성 용액을 이용하는 예 알아보기'
          description={['산성 용액과 염기성 용액이 집 안에서 어떻게 이용되는지 알아봅시다.']}
          backgroundSvg='/img/cover/6-1-1.svg'
          descriptionSound='/sounds/6-1-1/narration/6-1-1-Goal.MP3'
          onActivityGuide={handleShowActivityGuide}
        />
      )}

      <ActivityGuideModal isOpen={gameState.showActivityGuide} onClose={handleCloseActivityGuide} />
    </div>
  )
}
