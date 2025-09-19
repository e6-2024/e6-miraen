import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'
import dynamic from 'next/dynamic'

import Scene from '../components/canvas/Scene'
import Intro from '../components/intro/Intro'
import { CandleExperiment } from '@/components/6-2-2/CandleExperiment'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { useAudio } from '@/hook/6-2-2/useAudio'
import { TiltOnMouse } from '@/components/common/Tilt'
import { ExperimentPhase } from '@/types/6-2-2/types'
import CameraLogger from '@/hook/CameraLogger'
import { ExperimentConfig } from '@/types/6-2-2/types'
import { EXPERIMENT_CONFIG } from '@/utils/6-2-2/utils'

type ButtonStyle = { bg: string; border: string; text: string }

type ParticleTheme = {
  goal: ButtonStyle
  guide: ButtonStyle
  start: ButtonStyle
}

const particleTheme: ParticleTheme = {
  goal: { bg: '#9B1CDF', border: '#DFB2FA', text: '#FFFFFF' },
  guide: { bg: '#9B1CDF', border: '#DFB2FA', text: '#FFFFFF' },
  start: { bg: '#01A7A2', border: '#78C9C9', text: '#FFFFFF' },
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

function ExperimentStatus({
  experimentStarted,
  experimentFinished,
  currentPhase,
  onReset,
  onCoverCandles,
}: {
  experimentStarted: boolean
  experimentFinished: boolean
  currentPhase: ExperimentPhase
  onReset: () => void
  onCoverCandles: () => void
}) {
  if (currentPhase === 'readyToCover') {
    return (
      <div className='absolute bottom-5 left-1/2 transform -translate-x-1/2'>
        <CrayonTextButton
          text='촛불 덮기'
          onClick={onCoverCandles}
          width={180}
          height={60}
          bg='#ff6600'
          color='#ffaa66'
          textcolor='#FFFFFF'
        />
      </div>
    )
  }

  return (
    <div className='absolute bottom-5 left-1/2 transform -translate-x-1/2'>
      <CrayonTextButton
        text='다시 실험하기'
        onClick={onReset}
        width={180}
        height={60}
        bg='#9B1CDF'
        color='#DFB2FA'
        textcolor='#FFFFFF'
      />
    </div>
  )
}

function ExperimentInstructions({
  experimentStarted,
  experimentFinished,
  currentPhase,
}: {
  experimentStarted: boolean
  experimentFinished: boolean
  currentPhase: ExperimentPhase
}) {
  const getInstructionText = () => {
    if (!experimentStarted) {
      return '실험을 시작해보세요.'
    }

    switch (currentPhase) {
      case 'selectingCup':
        return '오른쪽 아크릴 통에 산소를 공급해 보세요.'
      case 'oxygenCanAppearing':
        return '산소캔이 준비되고 있습니다...'
      case 'oxygenSupply':
        return '산소 캔의 버튼을 눌러 산소를 공급해 보세요.'
      case 'oxygenSupplying':
        return '산소가 공급되고 있습니다...'
      case 'oxygenCanDisappearing':
        return '산소 공급이 완료되었습니다.'
      case 'cameraTrackOut':
        return '카메라가 조정되고 있습니다...'
      case 'readyToCover':
        return '촛불 덮기 버튼을 눌러 실험을 계속하세요.'
      case 'covering':
        return '아크릴 통이 촛불을 덮고 있습니다...'
      case 'burning':
        return '촛불의 변화를 관찰해보세요.'
      case 'rightOut':
        return '오른쪽 촛불이 꺼지고 있습니다...'
      case 'finished':
        return '실험이 완료되었습니다. 다시 실험해보세요!'
      default:
        return '실험을 진행해주세요.'
    }
  }

  return (
    <div className='absolute font-light top-5 left-1/2 transform -translate-x-1/2'>
      <CrayonTextBox color='#01A7A2' bg='#FFF' textcolor='#333' width='500px' animated={true}>
        {getInstructionText()}
      </CrayonTextBox>
    </div>
  )
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [experimentStarted, setExperimentStarted] = useState(false)
  const [experimentFinished, setExperimentFinished] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<ExperimentPhase>('waiting')
  const [experimentKey, setExperimentKey] = useState(0)

  const { playSound, playNarration, stopNarration } = useAudio()

  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const el = new Audio('/sounds/6-2-2/6-2-2-BGM.mp3')
    el.loop = true
    el.volume = 0.2
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

  const handleLoadingComplete = useCallback(() => setIsLoaded(true), [])

  const handleEnterExperience = useCallback(() => {
    playSound('/sounds/Enter_Cute.mp3')
    setTimeout(() => {
      setShowIntro(false)
      setBgmReady(true)
    }, 300)
    setExperimentStarted(true)
  }, [playSound])

  const handleBackToIntro = useCallback(() => {
    setShowIntro(true)
    setExperimentStarted(false)
    setExperimentFinished(false)
    setCurrentPhase('waiting')
    setExperimentKey((prev) => prev + 1)
    stopNarration()
  }, [stopNarration])

  const handleStartExperiment = useCallback(() => {
    setExperimentStarted(true)
    setExperimentFinished(false)
    setCurrentPhase('selectingCup')
    playSound('/sounds/6-2-2/experiment-start.mp3')
  }, [playSound])

  const handleResetExperiment = useCallback(() => {
    setExperimentStarted(false)
    setExperimentFinished(false)
    setCurrentPhase('waiting')
    setExperimentKey((prev) => prev + 1)
    playSound('/sounds/6-2-2/experiment-reset.mp3')
  }, [playSound])

  const handleCoverCandles = useCallback(() => {
    // Call the exposed function from CandleExperiment
    if ((window as any).handleCoverCandles) {
      ;(window as any).handleCoverCandles()
    }
    playSound('/sounds/6-2-2/cover-candles.mp3')
  }, [playSound])

  const handleExperimentFinished = useCallback(() => {
    setExperimentFinished(true)
    playNarration('/sounds/6-2-2/narration/6-2-2-B.MP3')
  }, [playNarration])

  const handlePhaseChange = useCallback(
    (phase: ExperimentPhase) => {
      setCurrentPhase(phase)

      // Play appropriate sounds for each phase
      switch (phase) {
        case 'selectingCup':
          playNarration('/sounds/6-2-2/narration/6-2-2-A.MP3')
          break
        case 'oxygenSupply':
          playSound('/sounds/6-2-2/oxygen-instruction.mp3')
          break
        case 'oxygenSupplying':
          playSound('/sounds/6-2-2/oxygen-sound.mp3')
          break
        case 'readyToCover':
          playSound('/sounds/6-2-2/cover-instruction.mp3')
          break
        case 'burning':
          playNarration('/sounds/6-2-2/narration/6-2-2-burning.mp3')
          break
        case 'finished':
          playNarration('/sounds/6-2-2/narration/6-2-2-B.MP3')
          break
      }
    },
    [playSound, playNarration],
  )

  return (
    <div className='w-screen h-screen bg-gradient-to-b from-blue-200 to-blue-300 flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      <CrayonTextButton
        ariaLabel='첫 화면으로'
        icon='home'
        position='absolute'
        iconPosition='left'
        onClick={handleBackToIntro}
        width={108}
        height={108}
        color='#ffffff'
        textcolor='#ffffff'
        bg='rgba(255,255,255,0.10)'
        className='backdrop-blur z-[200] mix-blend-difference'
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
        className='backdrop-blur z-[200] mix-blend-difference'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      <div className='flex-1'>
        <Scene shadows camera={{ position: EXPERIMENT_CONFIG.cameraPositions.initial, fov: 50 }}>
          <color attach='background' args={['lightblue']} />

          <CameraLogger />

          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-camera-near={1}
            shadow-camera-far={80}
            shadow-bias={-0.0001}
            shadow-normalBias={0.2}
          />

          <TiltOnMouse enabled={showIntro} maxDeg={3}>
            <group position={[0, -6, 0]}>
              <CandleExperiment
                key={experimentKey}
                experimentStarted={experimentStarted}
                experimentFinished={experimentFinished}
                onExperimentFinished={handleExperimentFinished}
                onPhaseChange={handlePhaseChange}
              />
            </group>
          </TiltOnMouse>
        </Scene>
      </div>

      {!showIntro && isLoaded && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}>
            <ExperimentInstructions
              experimentStarted={experimentStarted}
              experimentFinished={experimentFinished}
              currentPhase={currentPhase}
            />

            <ExperimentStatus
              experimentStarted={experimentStarted}
              experimentFinished={experimentFinished}
              currentPhase={currentPhase}
              onReset={handleResetExperiment}
              onCoverCandles={handleCoverCandles}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='양초가 타는 시간 비교하기'
          description={['물질이 타려면 무엇이 필요한지 알아봅시다.']}
          backgroundSvg='/img/cover/6-2-2.svg'
          buttonTheme={particleTheme}
          descriptionSound='/sounds/6-2-2/narration/6-2-2-Goal.MP3'
        />
      )}
    </div>
  )
}
