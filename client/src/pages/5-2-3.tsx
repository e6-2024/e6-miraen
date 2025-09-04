import { useState, useEffect, useRef, useCallback } from 'react'
import { Environment, OrbitControls } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'

import Scene from '@/components/canvas/Scene'
import Model from '@/components/5-2-3/Model'
import Intro from '@/components/intro/Intro'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'

import { TimeSelector } from '@/components/5-2-3/TimeSelector'
import { Thermometer } from '@/components/5-2-3/Thermometer'
import { PressureDisplay } from '@/components/5-2-3/PressureDisplay'
import { StepControls } from '@/components/5-2-3/StepControls'
import { TimeAnimation } from '@/components/5-2-3/TimeAnimation'
import { CameraController } from '@/components/5-2-3/CameraController'
import { Popup } from '@/components/5-2-3/Popup'
import { LoadingTracker } from '@/components/5-2-3/LoadingTracker'

import { useExperiment } from '@/hook/5-2-3/useExperiment'
import { useAudio } from '@/hook/5-2-3/useAudio'
import { TimeOfDay, PopupContent } from '@/types/5-2-3/types'
import { getPopupContent, getWindDirection, getPressures, CAMERA_CONFIGS } from '@/utils/5-2-3/utils'
import { TiltOnMouse } from '@/components/common/Tilt'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'

const BUTTON_THEME = {
  goal: { bg: '#52AE46', border: '#A1CC90', text: '#FFFFFF' },
  guide: { bg: '#52AE46', border: '#A1CC90', text: '#FFFFFF' },
  start: { bg: '#F3921C', border: '#FFDBB0', text: '#FFFFFF' },
}

interface TimeSelectionPopupProps {
  isOpen: boolean
  onTimeSelect: (time: TimeOfDay) => void
}

const TimeSelectionPopup: React.FC<TimeSelectionPopupProps> = ({ isOpen, onTimeSelect }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  const handleTimeSelect = (time: TimeOfDay) => {
    setIsVisible(false)
    setTimeout(() => {
      onTimeSelect(time)
    }, 300)
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 flex items-center justify-center z-50 bg-white bg-opacity-50 transition-all duration-300'>
      <CrayonTextBox width={900} height={600} bg='#fff' color='#52AE46' animated={true}>
        <div className='p-8 blur-none'>
          <h3 className='text-2xl font-bold text-gray-900 mb-8 text-center'>시간대를 선택해 보세요</h3>

          <div className='flex gap-4 justify-center'>
            <button
              onClick={() => handleTimeSelect('day')}
              className='flex flex-col items-center rounded-xl font-bold'>
              <img
                src='/img/5-2-3/day.png'
                alt='낮'
                className='w-full h-full mb-2 object-contain hover:ring-4 hover:ring-gray-300'
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className='text-xl text-black'>낮</span>
            </button>

            <button
              onClick={() => handleTimeSelect('night')}
              className='flex flex-col items-center rounded-xl font-bold'>
              <img
                src='/img/5-2-3/night.png'
                alt='밤'
                className='w-full h-full mb-2 object-contain hover:ring-4 hover:ring-gray-300'
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className='text-xl text-black'>밤</span>
            </button>
          </div>
        </div>
      </CrayonTextBox>
    </div>
  )
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showTimeSelectionPopup, setShowTimeSelectionPopup] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [popupContent, setPopupContent] = useState<PopupContent>({
    title: '',
    content: '',
    narrationPath: '',
  })

  const {
    state,
    cameraTarget,
    setCameraTarget,
    resetExperiment,
    setTimeOfDay,
    startTemperatureAnimation,
    startPressureAnimation,
    startWindAnimation,
    getStepConfig,
  } = useExperiment()

  const { playSound } = useAudio()

  // BGM 관련
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('bgmEnabled-5-2-3')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const el = new Audio('/sounds/5-2-3/5-2-3-BGM.mp3')
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
      localStorage.setItem('bgmEnabled-5-2-3', JSON.stringify(bgmEnabled))
    } catch {}
    if (bgmEnabled && bgmReady) {
      bgmRef.current.play().catch(() => {})
    } else {
      bgmRef.current.pause()
    }
  }, [bgmEnabled, bgmReady, mounted])

  const handleLoadingComplete = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleEnterExperience = useCallback(() => {
    playSound('/sounds/Enter_Cute.mp3')
    setBgmReady(true)
    setTimeout(() => {
      setShowIntro(false)
      // 시간대 선택 팝업 표시
      setShowTimeSelectionPopup(true)
    }, 300)
  }, [playSound])

  const handleBackToIntro = useCallback(() => {
    playSound('/sounds/Enter_Cute.mp3')
    setShowIntro(true)
    setShowTimeSelectionPopup(false)
    resetExperiment()
    setShowPopup(false)
    setBgmReady(false)
  }, [playSound, resetExperiment])

  const handleTimeSelectionFromPopup = useCallback(
    (time: TimeOfDay) => {
      playSound('/sounds/Enter_Cute.mp3')
      setShowTimeSelectionPopup(false)
      setTimeOfDay(time)

      // 카메라 위치 설정
      setCameraTarget({
        position: CAMERA_CONFIGS.initial.position,
        lookAt: CAMERA_CONFIGS.initial.target,
      })

      // 시간대 선택 후 안내 팝업 표시
      setTimeout(() => {
        setShowPopup(true)
        setPopupContent(getPopupContent(time, 'day-selected'))
      }, 500)
    },
    [playSound, setTimeOfDay, setCameraTarget],
  )

  const handleTimeSelect = useCallback(
    (time: TimeOfDay) => {
      playSound('/sounds/Enter_Cute.mp3')
      resetExperiment()
      setTimeOfDay(time)

      setTimeout(() => {
        setShowPopup(true)
        setPopupContent(getPopupContent(time, 'day-selected'))
      }, 100)
    },
    [playSound, resetExperiment, setTimeOfDay],
  )

  const handleStepClick = useCallback(
    (stepId: string) => {
      playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')

      switch (stepId) {
        case 'temperature':
          startTemperatureAnimation()
          break
        case 'pressure':
          startPressureAnimation()
          break
        case 'wind':
          startWindAnimation()
          setTimeout(() => {
            setShowPopup(true)
            setPopupContent(getPopupContent(state.timeOfDay, 'wind-animation'))
          }, 2200)
          break
      }
    },
    [playSound, startTemperatureAnimation, startPressureAnimation, startWindAnimation, state.timeOfDay],
  )

  const toggleBgm = useCallback(() => {
    setBgmEnabled((v) => !v)
  }, [])

  const stepConfigs = ['temperature', 'pressure', 'wind'].map(getStepConfig)
  const showExperimentUI = !showIntro && !showTimeSelectionPopup && state.currentStep !== 'initial'
  const pressures = getPressures(state.timeOfDay)

  return (
    <div className='w-screen h-screen bg-red flex flex-col relative'>
      {/* 밤 오버레이 */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 z-5 ${
          state.timeOfDay === 'night' ? 'bg-black opacity-60' : 'opacity-0'
        } pointer-events-none`}
      />

      {/* 온도 표시 */}
      {state.showTemperatureDisplay && (
        <div className='absolute flex flex-row left-1/2 -translate-x-1/2 top-4 gap-[800px] z-30'>
          <Thermometer
            temperature={state.temperatures.sea}
            label='바다'
            color={state.timeOfDay === 'day' ? '#3b82f6' : '#ef4444'}
          />
          <Thermometer
            temperature={state.temperatures.land}
            label='육지'
            color={state.timeOfDay === 'day' ? '#ef4444' : '#3b82f6'}
          />
        </div>
      )}

      {/* 기압 표시 */}
      {state.showPressureDisplay && (
        <div className='absolute flex flex-row left-1/2 -translate-x-1/2 top-10 gap-[200px] z-30'>
          <PressureDisplay
            type={pressures.sea}
            label='바다'
            color={state.timeOfDay === 'day' ? '#ef4444' : '#3b82f6'}
          />
          <PressureDisplay
            type={pressures.land}
            label='육지'
            color={state.timeOfDay === 'day' ? '#3b82f6' : '#ef4444'}
          />
        </div>
      )}

      {/* 3D Scene */}
      <Scene
        camera={{ position: [0, 1, 3], fov: 50, far: 1000 }}
        shadows={{
          enabled: true,
          type: 'PCFSoftShadowMap',
        }}>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        <TiltOnMouse enabled={showIntro || showTimeSelectionPopup} maxDeg={10} position={[0, 0, 0]}>
          {/* 조명 설정 */}
          <ambientLight
            intensity={state.timeOfDay === 'day' ? 0.4 : 0.2}
            color={state.timeOfDay === 'day' ? '#ffffff' : '#404080'}
          />

          <directionalLight
            position={state.timeOfDay === 'day' ? [15, 20, 10] : [5, 15, 8]}
            intensity={state.timeOfDay === 'day' ? 1.5 : 0.6}
            color={state.timeOfDay === 'day' ? '#ffeaa7' : '#74b9ff'}
            castShadow
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
            shadow-camera-far={100}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-bias={-0.0005}
            shadow-normalBias={0.02}
            shadow-radius={10}
          />

          <directionalLight
            position={state.timeOfDay === 'day' ? [-5, 10, 5] : [-3, 8, 3]}
            intensity={state.timeOfDay === 'day' ? 0.3 : 0.15}
            color={state.timeOfDay === 'day' ? '#81ecec' : '#6c5ce7'}
          />

          <pointLight
            position={[-10, 2, 0]}
            intensity={state.timeOfDay === 'day' ? 0.8 : 0.3}
            color={state.timeOfDay === 'day' ? '#74b9ff' : '#00cec9'}
            distance={30}
            decay={2}
          />

          {/* 3D 모델 */}
          <Model
            scale={0.2}
            rotation={[0, -Math.PI / 2, 0]}
            position={[0, -15, 0]}
            windEnabled={state.showWind}
            windDirection={getWindDirection(state.timeOfDay)}
            windSpeed={0.2}
            isDay={state.timeOfDay === 'day'}
            animationEnabled={state.modelAnimationEnabled}
          />

          {/* 카메라 컨트롤 */}
          {cameraTarget ? (
            <CameraController
              targetPosition={cameraTarget.position}
              targetLookAt={cameraTarget.lookAt}
              enabled={!showIntro && !showTimeSelectionPopup && !showPopup}
            />
          ) : (
            <OrbitControls
              enabled={!showIntro && !showTimeSelectionPopup && !showPopup}
              minDistance={0}
              maxDistance={300}
              minPolarAngle={0}
              maxPolarAngle={Math.PI / 2}
            />
          )}

          <Environment preset={state.timeOfDay === 'day' ? 'sunset' : 'night'} blur={0.8} resolution={512} />
        </TiltOnMouse>
      </Scene>

      {/* 시간 선택기 - 실험 중에만 표시 */}
      <TimeSelector
        timeOfDay={state.timeOfDay}
        onTimeSelect={handleTimeSelect}
        visible={!showIntro && !showTimeSelectionPopup && state.currentStep !== 'initial'}
      />

      <StepControls steps={stepConfigs} onStepClick={handleStepClick} visible={showExperimentUI} />

      <TimeAnimation
        isAnimating={state.isTemperatureAnimating}
        visible={state.currentStep === 'temperature-animation'}
      />

      {/* 홈 버튼 */}
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
        className='backdrop-blur z-[200] right-[108px] mix-blend-difference'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {/* BGM 토글 버튼 */}
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
        className='backdrop-blur z-[1000] right-[0px] mix-blend-difference'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='바닷가에서 부는 바람 방향 알아보기'
          description={['바닷가에서 바람은 어떻게 부는지 알아봅시다.']}
          backgroundSvg='/img/cover/5-2-3.svg'
          descriptionSound='/sounds/5-2-3/narration/5-2-3-Goal.MP3'
          buttonTheme={BUTTON_THEME}
        />
      )}

      <TimeSelectionPopup isOpen={showTimeSelectionPopup} onTimeSelect={handleTimeSelectionFromPopup} />

      <Popup isOpen={showPopup} onClose={() => setShowPopup(false)} content={popupContent} />
    </div>
  )
}
