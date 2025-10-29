import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'

import Scene from '../components/canvas/Scene'
import Intro from '../components/intro/Intro'
import { CandleExperiment } from '@/components/6-2-2/CandleExperiment'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { useAudio } from '@/hook/6-2-2/useAudio'
import { TiltOnMouse } from '@/components/common/Tilt'
import { ExperimentPhase } from '@/types/6-2-2/types'
import { EXPERIMENT_CONFIG } from '@/utils/6-2-2/utils'
import { TimeAnimation } from '@/components/6-2-2/TimeAnimation'
import ActivityGuideModal from '@/components/6-2-2/ActivityGuideModal'
import AudioManager from '@/components/6-2-2/AudioManager'

type ButtonStyle = { bg: string; border: string; text: string }
type ParticleTheme = { goal: ButtonStyle; guide: ButtonStyle; start: ButtonStyle }

const PARTICLE_THEME: ParticleTheme = {
  goal: { bg: '#9B1CDF', border: '#DFB2FA', text: '#FFFFFF' },
  guide: { bg: '#9B1CDF', border: '#DFB2FA', text: '#FFFFFF' },
  start: { bg: '#01A7A2', border: '#78C9C9', text: '#FFFFFF' },
}

const INSTRUCTION_TEXTS: Record<ExperimentPhase, string> = {
  selectingCup: '오른쪽 아크릴 통을 클릭하여 아크릴 통 안에 산소 캔과 연결된 고무관을 넣어 보세요.',
  oxygenCanAppearing: '',
  oxygenSupply: '산소 캔의 버튼을 눌러 산소를 공급해 보세요.',
  oxygenSupplying: '',
  oxygenCanDisappearing: '',
  cameraTrackOut: '',
  readyToCover: '',
  covering: '',
  burning: '시간이 지남에 따라 촛불은 어떻게 되는지 관찰해 보세요.',
  leftOut: '산소를 공급하지 않은 촛불은 먼저 꺼집니다.',
  rightOut: '산소를 공급한 촛불은 더 오래 탑니다.',
  finished: '산소를 공급한 촛불은 더 오래 탑니다.',
}

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()
  useEffect(() => {
    if (!active && progress === 100) onLoadingComplete()
  }, [active, progress, onLoadingComplete])
  return null
}

const ExperimentStatus = ({
  currentPhase,
  onReset,
  onCoverCandles,
  showPopup,
}: {
  currentPhase: ExperimentPhase
  onReset: () => void
  onCoverCandles: () => void
  showPopup: () => void
}) => {
  if (currentPhase === 'readyToCover') {
    return (
      <div className='absolute bottom-5 left-1/2 transform -translate-x-1/2'>
        <CrayonTextButton text='촛불 덮기' onClick={onCoverCandles} bg='#ff6600' color='#ffaa66' textcolor='#FFFFFF' />
      </div>
    )
  }
  
  if (currentPhase === 'finished') {
    return (
      <div className='absolute flex gap-2 bottom-5 left-1/2 transform -translate-x-1/2'>
        <CrayonTextButton text='다시 실험하기' onClick={onReset} bg='#9B1CDF' color='#DFB2FA' textcolor='#FFFFFF' />
        <CrayonTextButton text='정리하기' onClick={showPopup} bg='#01A7A2' color='#78C9C9' textcolor='#FFFFFF' />
      </div>
    )
  }
  
  return null
}

const ExperimentInstructions = ({ currentPhase }: { currentPhase: ExperimentPhase }) => {
  const instructionText = useMemo(() => INSTRUCTION_TEXTS[currentPhase], [currentPhase])

  if (!instructionText) return null

  return (
    <div className='absolute font-light top-5 left-1/2 transform -translate-x-1/2'>
      <CrayonTextBox color='#01A7A2' bg='#FFF' textcolor='#333' padding={40} paddingY={12} animated>
        {instructionText}
      </CrayonTextBox>
    </div>
  )
}

export default function Page() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [experimentStarted, setExperimentStarted] = useState(false)
  const [experimentFinished, setExperimentFinished] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<ExperimentPhase>('selectingCup')
  const [experimentKey, setExperimentKey] = useState(0)

  const [showPopup, setShowPopup] = useState(false)
  const [showActivityGuide, setShowActivityGuide] = useState(false)

  const audioManager = useMemo(() => AudioManager.getInstance(), [])
  const { playSound, playNarration, stopNarration } = useAudio()

  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}

    const audio = new Audio('/sounds/6-2-2/6-2-2-BGM.mp3')
    audio.loop = true
    audio.volume = 0.2
    bgmRef.current = audio

    return () => {
      audio.pause()
      bgmRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!bgmRef.current) return
    
    try {
      localStorage.setItem('bgmEnabled', JSON.stringify(bgmEnabled))
    } catch {}

    if (bgmEnabled && bgmReady) {
      bgmRef.current.play().catch(() => {})
    } else {
      bgmRef.current.pause()
    }
  }, [bgmEnabled, bgmReady])

  const toggleBgm = useCallback(() => setBgmEnabled((v) => !v), [])
  const handleLoadingComplete = useCallback(() => setIsLoaded(true), [])

  const handleShowActivityGuide = useCallback(() => {
    audioManager.playGeneralButton()
    setShowActivityGuide(true)
  }, [audioManager])

  const handleCloseActivityGuide = useCallback(() => setShowActivityGuide(false), [])

  const handleEnterExperience = useCallback(() => {
    setExperimentFinished(false)
    setCurrentPhase('selectingCup')
    setShowPopup(false)

    playSound('/sounds/Enter_Cute.mp3')
    playNarration('/sounds/6-2-2/narration/6-2-2-A-1.MP3')

    setTimeout(() => {
      setShowIntro(false)
      setBgmReady(true)
      setExperimentStarted(true)
    }, 300)
  }, [playSound, playNarration])

  const handleBackToIntro = useCallback(() => {
    audioManager.stopAll()
    stopNarration()
    
    if (bgmRef.current) {
      bgmRef.current.pause()
      bgmRef.current.currentTime = 0
    }
    setBgmReady(false)

    setShowIntro(true)
    setExperimentStarted(false)
    setExperimentFinished(false)
    setCurrentPhase('selectingCup')
    setShowPopup(false)
    setExperimentKey((prev) => prev + 1)
  }, [stopNarration, audioManager])

  const handleResetExperiment = useCallback(() => {
    setExperimentStarted(false)
    setExperimentFinished(false)
    setCurrentPhase('selectingCup')
    
    setTimeout(() => {
      setExperimentStarted(true)
      playNarration('/sounds/6-2-2/narration/6-2-2-A-1.MP3')
      setExperimentKey((prev) => prev + 1)
    }, 50)
  }, [playNarration])

  const handleCoverCandles = useCallback(() => {
    if ((window as any).handleCoverCandles) {
      ;(window as any).handleCoverCandles()
    }
  }, [])

  const handleExperimentFinished = useCallback(() => {
    setExperimentFinished(true)
  }, [])

  const handlePhaseChange = useCallback(
    (phase: ExperimentPhase) => {
      setCurrentPhase(phase)
      switch (phase) {
        case 'selectingCup':
          playNarration('/sounds/6-2-2/narration/6-2-2-A-1.MP3')
          break
        case 'oxygenSupply':
          playNarration('/sounds/6-2-2/narration/6-2-2-B.MP3')
          break
        case 'oxygenSupplying':
          playSound('/sounds/6-2-2/6-2-2-4.MP3')
          break
        case 'burning':
          playNarration('/sounds/6-2-2/narration/6-2-2-F.MP3')
          break
        case 'leftOut':
          playNarration('/sounds/6-2-2/narration/6-2-2-C.MP3')
          break
        case 'rightOut':
          playNarration('/sounds/6-2-2/narration/6-2-2-D.MP3')
          break
      }
    },
    [playSound, playNarration],
  )

  const handleShowPopup = useCallback(() => {
    setShowPopup(true)
    playNarration('/sounds/6-2-2/narration/6-2-2-E.MP3')
  }, [playNarration])

  const handlePopupClose = useCallback(() => {
    setShowPopup(false)
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
  }, [playSound])

  const shouldShowInstructions = useMemo(() => {
    return (
      !showIntro &&
      isLoaded &&
      (currentPhase === 'selectingCup' ||
        currentPhase === 'oxygenSupply' ||
        currentPhase === 'burning' ||
        currentPhase === 'leftOut' ||
        currentPhase === 'rightOut' ||
        currentPhase === 'finished')
    )
  }, [showIntro, isLoaded, currentPhase])

  const shouldShowTimeAnimation = useMemo(() => {
    return !showIntro && isLoaded && (currentPhase === 'burning' || currentPhase === 'leftOut')
  }, [showIntro, isLoaded, currentPhase])

  return (
    <div className='w-screen h-screen bg-[#E79CC2] flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      <CrayonTextButton
        ariaLabel='첫 화면으로'
        icon='home'
        position='absolute'
        iconPosition='left'
        onClick={handleBackToIntro}
        width={96}
        height={96}
        color='#ffffff'
        textcolor='#ffffff'
        bg='#D64B98'
        className='z-[200]'
        right={120}
        top={16}
        iconSize={40}
        innerCircleVisible
      />

      <CrayonTextButton
        icon={bgmEnabled ? 'volume2' : 'volumeX'}
        position='absolute'
        iconPosition='left'
        onClick={toggleBgm}
        width={96}
        height={96}
        color='#fff'
        textcolor='#fff'
        bg='#D64B98'
        className='z-[200]'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible
      />

      <div className='flex-1'>
        <Scene shadows camera={{ position: EXPERIMENT_CONFIG.cameraPositions.initial, fov: 50 }}>
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
                showIntro={showIntro}
              />
            </group>
          </TiltOnMouse>
        </Scene>
      </div>

      <AnimatePresence>
        {shouldShowInstructions && (
          <motion.div
            key='instructions'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}>
            <ExperimentInstructions currentPhase={currentPhase} />
          </motion.div>
        )}
      </AnimatePresence>

      {shouldShowTimeAnimation && (
        <TimeAnimation isAnimating={currentPhase === 'burning' || currentPhase === 'leftOut'} visible />
      )}

      {!showIntro && isLoaded && (
        <ExperimentStatus
          currentPhase={currentPhase}
          onReset={handleResetExperiment}
          onCoverCandles={handleCoverCandles}
          showPopup={handleShowPopup}
        />
      )}

      <AnimatePresence>
        {showPopup && (
          <motion.div
            key='popup'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}>
              <CrayonTextBox color={PARTICLE_THEME.goal.bg} bg='#FFF' padding={40} paddingY={40} animated>
                <p className='font-bold text-[#333] text-3xl p-4'>물질이 타려면 산소가 필요합니다.</p>
                <div className='text-center pt-4'>
                  <CrayonTextButton
                    onClick={handlePopupClose}
                    textcolor='#fff'
                    text='확인'
                    color={PARTICLE_THEME.goal.border}
                    bg={PARTICLE_THEME.goal.bg}
                    innerCircleVisible={false}
                  />
                </div>
              </CrayonTextBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='양초가 타는 시간 비교하기'
          description={['물질이 타려면 무엇이 필요한지 알아봅시다.']}
          backgroundSvg='/img/cover/6-2-2.svg'
          buttonTheme={PARTICLE_THEME}
          onActivityGuide={handleShowActivityGuide}
          descriptionSound='/sounds/6-2-2/narration/6-2-2-Goal.MP3'
        />
      )}

      <ActivityGuideModal isOpen={showActivityGuide} onClose={handleCloseActivityGuide} />
    </div>
  )
}