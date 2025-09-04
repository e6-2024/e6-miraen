import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useProgress, Environment } from '@react-three/drei'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import BG from '@/components/6-2-3/BG'
import * as THREE from 'three'
import { AnimatePresence, motion } from 'framer-motion'
import ConnectedBuzzers from '@/components/6-2-3/ConnectedBuzzers'
import ConnectedLights from '@/components/6-2-3/ConnectedLights'
import ConnectedFans from '@/components/6-2-3/ConnectedFans'
import IntroMouseCameraController from '@/components/intro/IntroMouseCameraController'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { audioManager, playNarration, playEffect, stopNarration, stopAll } from '@/utils/6-2-3/audioManager'
import { NARRATIONS, SOUND_EFFECTS, BACKGROUND_MUSIC, VOLUMES } from '@/utils/6-2-3/narrationConfig'

const BUTTON_THEME = {
  goal: { bg: '#52AE46', border: '#A1CC90', text: '#FFFFFF' },
  guide: { bg: '#52AE46', border: '#A1CC90', text: '#FFFFFF' },
  start: { bg: '#F3921C', border: '#FFDBB0', text: '#FFFFFF' },
}

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

function SummaryPopup({
  mode,
  isOpen,
  onClose,
}: {
  mode: 'light' | 'buzzer' | 'fan'
  isOpen: boolean
  onClose: () => void
}) {
  const summaryTexts = {
    light: '전기 회로에 전지 1 개를 연결할 때보다 전지 2 개를 직렬연결할 때 전구의 밝기가 더 밝습니다.',
    buzzer: '전기 회로에 전지 1 개를 연결할 때보다 전지 2 개를 직렬연결할 때 버저에서 나는 소리가 더 큽니다.',
    fan: '전기 회로에 전지 1 개를 연결할 때보다 전지 2 개를 직렬연결할 때 전동기의 날개가 더 빠르게 돌아갑니다.',
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
        onClick={() => {
          playEffect(SOUND_EFFECTS.BUTTON)
          onClose()
        }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}>
          <CrayonTextBox bg='#FFFFFF' color={BUTTON_THEME.start.border} className='p-8 max-w-lg' animated={true}>
            <h2 className='text-2xl font-bold text-center mb-6 text-gray-800'>정리하기</h2>
            <p className='text-lg text-center font-light text-gray-700 leading-relaxed mb-8'>{summaryTexts[mode]}</p>
            <div className='text-center'>
              <CrayonTextButton
                onClick={() => {
                  playEffect(SOUND_EFFECTS.BUTTON, VOLUMES.SOUND_EFFECT)
                  onClose()
                }}
                bg={BUTTON_THEME.start.bg}
                color={BUTTON_THEME.start.border}
                textcolor='#FFFFFF'
                text='확인'
                innerCircleVisible={false}></CrayonTextButton>
            </div>
          </CrayonTextBox>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function NarrationText() {
  return (
    <CrayonTextBox
      bg='#FFFFFF'
      animated={true}
      text='스위치를 닫아 전구의 밝기를 비교해 보세요.'
    />
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const getRandomMode = useCallback((): 'light' | 'buzzer' | 'fan' => {
    const modes: ('light' | 'buzzer' | 'fan')[] = ['light', 'buzzer', 'fan']
    return modes[Math.floor(Math.random() * modes.length)]
  }, [])

  const [initialRandomMode] = useState<'light' | 'buzzer' | 'fan'>(() => getRandomMode())
  const [mode, setMode] = useState<'light' | 'buzzer' | 'fan' | null>(null)
  const [showSummaryPopup, setShowSummaryPopup] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [isBackFromMode, setIsBackFromMode] = useState(false)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [subtitleText, setSubtitleText] = useState('')

  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)
  const [showNarration, setShowNarration] = useState(false)

  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const el = new Audio(BACKGROUND_MUSIC)
    el.loop = true
    el.volume = VOLUMES.BACKGROUND_MUSIC
    bgmRef.current = el
    return () => {
      el.pause()
      bgmRef.current = null
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted || !bgmRef.current) return
    try {
      localStorage.setItem('bgmEnabled', JSON.stringify(bgmEnabled))
    } catch {}
    if (bgmEnabled && bgmReady) {
      bgmRef.current.play().catch(() => {})
    } else {
      bgmRef.current.pause()
    }
  }, [bgmEnabled, bgmReady, mounted])

  const toggleBgm = () => setBgmEnabled((v) => !v)

  const playAudioWithSubtitle = useCallback((audioPath: string, subtitle: string, duration: number = 5000) => {
    setSubtitleText(subtitle)
    setShowSubtitle(true)

    playNarration(audioPath, VOLUMES.NARRATION)
      .then(() => {
        setShowSubtitle(false)
      })
      .catch((error) => {
        console.log('나레이션 재생 실패:', error)
        setShowSubtitle(false)
      })

    setTimeout(() => {
      setShowSubtitle(false)
    }, duration)
  }, [])

  const handleLoadingComplete = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleModeSelect = useCallback(
    (selectedMode: 'light' | 'buzzer' | 'fan') => {
      playEffect(SOUND_EFFECTS.CLICK)
      setMode(selectedMode)
      setShowIntro(false)
      setBgmReady(true)
      setTimeout(() => {
        playAudioWithSubtitle(NARRATIONS.BATTERY_CONNECT, '전기 회로에 전지를 연결해 보세요.', 6000)
      }, 500)
    },
    [playAudioWithSubtitle],
  )

  const handleBackToModeSelection = useCallback(() => {
    playEffect(SOUND_EFFECTS.BUTTON)
    stopAll()
    stopNarration()
    setMode(null)
    setShowIntro(true)
    setIsBackFromMode(true)
    setShowSubtitle(false)
  }, [])

  const handleBackToIntro = useCallback(() => {
    playEffect(SOUND_EFFECTS.BUTTON)
    stopAll()
    stopNarration()
    setShowIntro(true)
    setIsBackFromMode(false)
    setMode(null)
  }, [])

  const handleSummaryClick = useCallback(() => {
    if (!mode) return

    playEffect(SOUND_EFFECTS.BUTTON)

    const summaryAudioMap = {
      light: NARRATIONS.LIGHT_SUMMARY,
      buzzer: NARRATIONS.BUZZER_SUMMARY,
      fan: NARRATIONS.FAN_SUMMARY,
    }

    playNarration(summaryAudioMap[mode], VOLUMES.NARRATION).catch((error) => {
      console.log('정리하기 나레이션 재생 실패:', error)
    })

    setShowSummaryPopup(true)
  }, [mode])

  const handleCloseSummaryPopup = useCallback(() => {
    setShowSummaryPopup(false)
    stopNarration()
  }, [])

  useEffect(() => {
    return () => {
      stopAll()
    }
  }, [])

  const getCurrentComponents = useMemo(() => {
    const currentMode = showIntro ? initialRandomMode : mode

    switch (currentMode) {
      case 'light':
        return <ConnectedLights key='connected-lights' scale={1} position={[0, 0, 0]} />
      case 'buzzer':
        return <ConnectedBuzzers key='connected-buzzers' scale={1} position={[0, 0, 0]} />
      case 'fan':
        return <ConnectedFans key='connected-fans' scale={1} position={[0, 0, 0]} />
      default:
        return null
    }
  }, [mode, showIntro, initialRandomMode])

  const modeButtons = useMemo(
    () => [
      {
        mode: 'light' as const,
        label: '전구를 연결한 전기 회로',
        color: '#ffbc04',
        hoverColor: '#f5c951',
      },
      {
        mode: 'buzzer' as const,
        label: '버저를 연결한 전기 회로',
        color: '#2dc46e',
        hoverColor: '#48dd89',
      },
      {
        mode: 'fan' as const,
        label: '전동기를 연결한 전기 회로',
        color: '#b73ce8',
        hoverColor: '#ba5ae1',
      },
    ],
    [],
  )

  return (
    <div className='w-screen h-screen bg-white flex flex-col'>
      <CrayonTextButton
        ariaLabel={'첫 화면으로'}
        icon={'home'}
        position='absolute'
        iconPosition='left'
        onClick={handleBackToIntro}
        width={108}
        height={108}
        color='#ffffff'
        textcolor='#ffffff'
        bg='rgba(255,255,255,0.10)'
        className='background-blur z-[200] mix-blend-difference'
        right={138}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />
      <CrayonTextButton
        icon={bgmEnabled ? 'volume2' : 'volumeX'}
        position='absolute'
        iconPosition='left'
        onClick={toggleBgm}
        width={108}
        height={108}
        color='#fff'
        textcolor='#fff'
        bg='rgba(255,255,255,0.10)'
        className='backdrop-blur z-[1000] mix-blend-difference'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />
      <AnimatePresence>
        {!showIntro && mode !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute top-4 left-4 z-10 w-fit h-fit'>
            <CrayonTextButton
              ariaLabel='모드 선택 화면으로 돌아가기'
              text='첫 화면으로'
              icon='arrow-left'
              iconPosition='left'
              width={170}
              height={75}
              iconSize={30}
              bg={BUTTON_THEME.start.bg}
              color={BUTTON_THEME.start.border}
              textcolor='#FFFFFF'
              onClick={handleBackToModeSelection}
              innerCircleVisible={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {mode !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute bottom-4 right-4 z-10 w-fit h-fit'>
            <CrayonTextButton
              onClick={handleSummaryClick}
              width={170}
              height={75}
              icon={'PencilLine'}
              iconSize={18}
              iconPosition='left'
              bg={BUTTON_THEME.goal.bg}
              color={BUTTON_THEME.goal.border}
              textcolor={BUTTON_THEME.goal.text}
              text='정리하기'
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className='flex-1 relative overflow-hidden'>
        <Scene
          shadows
          gl={{
            shadowMap: { enabled: true, type: THREE.PCFSoftShadowMap },
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.8,
          }}
          camera={{ position: [14, 8, 15], fov: 50 }}>
          <LoadingTracker onLoadingComplete={handleLoadingComplete} />
          <fog attach='fog' args={['#0c0c0cff', 10, 25]} />
          <fogExp2 attach='fog' color={'#ffffffff'} density={0.002} />
          <directionalLight
            intensity={mode === 'light' || (showIntro && initialRandomMode === 'light') ? 2 : 4}
            position={[5, 10, 5]}
            castShadow
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
            shadow-camera-far={50}
            shadow-camera-left={-40}
            shadow-camera-right={40}
            shadow-camera-top={40}
            shadow-camera-bottom={-40}
            shadow-bias={-0.0005}
            shadow-normalBias={0.1}
          />

          <hemisphereLight args={['#ffffff', '#404040', 0.2]} />
          <AnimatePresence mode='wait'>
            {getCurrentComponents && (
              <group key={showIntro ? `intro-${initialRandomMode}` : mode}>{getCurrentComponents}</group>
            )}
          </AnimatePresence>
          <BG mode={showIntro ? initialRandomMode : mode} />
          <OrbitControls
            enabled={!showIntro}
            enablePan={true}
            enableRotate={true}
            enableZoom={true}
            minDistance={0}
            maxDistance={17}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 3}
          />
          <Environment
            preset='warehouse'
            backgroundIntensity={mode === 'light' || (showIntro && initialRandomMode === 'light') ? 0.005 : 0.03}
            backgroundBlurriness={0.5}
            environmentIntensity={mode === 'light' || (showIntro && initialRandomMode === 'light') ? 0.2 : 0.8}
          />
        </Scene>
      </div>
      {isLoaded && showIntro && (
        <Intro
          onEnter={() => {}}
          title='전지의 수에 따른 전기 회로의 특징 비교하기'
          description={['전지 1 개를 연결한 전기 회로와 전지 2 개를 직렬연결한', '전기 회로의 특징을 비교해 봅시다.']}
          backgroundSvg='/img/cover/6-2-3.svg'
          descriptionSound={NARRATIONS.GOAL}
          showModeSelection={true}
          modeButtons={modeButtons}
          onModeSelect={handleModeSelect}
          showModeButtonsDirectly={isBackFromMode}
          buttonTheme={BUTTON_THEME}
        />
      )}
      {mode && <SummaryPopup mode={mode} isOpen={showSummaryPopup} onClose={handleCloseSummaryPopup} />}
      <AnimatePresence>
        {showSubtitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className='fixed bottom-8 left-0 right-0 z-50 flex justify-center'>
            <div className='bg-black bg-opacity-80 rounded-xl px-8 py-4 max-w-lg'>
              <div className='text-white text-xl font-bold text-center leading-relaxed whitespace-pre-line'>
                {subtitleText}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
