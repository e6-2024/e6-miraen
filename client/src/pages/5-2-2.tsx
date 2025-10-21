import { useState, useRef, useCallback, useEffect } from 'react'
import {
  useProgress,
  OrbitControls,
  Environment,
  ContactShadows,
  Lightformer,
  PerformanceMonitor,
  AccumulativeShadows,
  RandomizedLight,
} from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import * as THREE from 'three'

import Fish from '@/components/5-2-2/models/Fish'
import Meat from '@/components/5-2-2/models/Meat'
import Stove from '@/components/5-2-2/models/Stove'
import Scene from '@/components/canvas/Scene'
import Flame from '@/components/5-2-2/Flame'
import Intro from '@/components/intro/Intro'
import Pan from '@/components/5-2-2/models/Pan'
import { BG } from '@/components/5-2-2/models/BG'
import { Dish } from '@/components/5-2-2/models/Dish'
import { Dish2 } from '@/components/5-2-2/models/Dish2'
import StoveController from '@/components/5-2-2/models/StoveController'
import { TiltOnMouse } from '@/components/common/Tilt'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { useAudio } from '@/hook/5-2-2/useAudio'
import { ThermalTemperatureGauge } from '@/components/5-2-2/ThermalTemperatureGauge'
import { SpeechBubble } from '@/components/5-2-2/SpeechBubble'

type ButtonStyle = { bg: string; border: string; text: string }

type StoveTheme = {
  goal: ButtonStyle
  guide: ButtonStyle
  start: ButtonStyle
}

const stoveTheme: StoveTheme = {
  goal: { bg: '#52AE46', border: '#A1CC90', text: '#FFFFFF' },
  guide: { bg: '#52AE46', border: '#A1CC90', text: '#FFFFFF' },
  start: { bg: '#EB7200', border: '#F4B476', text: '#FFFFFF' },
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

function HeatingGauge({
  progress,
  isHeating,
  selectedFood,
  isHeatingComplete,
}: {
  progress: number
  isHeating: boolean
  selectedFood: 'fish' | 'meat' | null
  isHeatingComplete: boolean
}) {
  if (!selectedFood) return null

  const foodName = selectedFood === 'fish' ? '생선' : '고기'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className='absolute inset-x-0 top-4 flex justify-center z-[20]'>
        <CrayonTextBox color={stoveTheme.start.bg} bg='#FFF' width={320} animated={true}>
          <div className='text-center mb-3'>
            <h3 className='text-lg font-bold text-gray-800'>
              {foodName} {progress >= 100 ? '가열 완료' : '가열 중'}
            </h3>
          </div>

          <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-2'>
            <div
              className={'h-4 rounded-full transition-all duration-300 bg-[#EB7200]'}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className='flex justify-center text-xs text-gray-600'>
            <span>{Math.round(progress)}%</span>
          </div>
        </CrayonTextBox>
      </motion.div>
    </AnimatePresence>
  )
}

function TurnOffFireMessage({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className='absolute inset-x-0 top-1/3 flex justify-center z-[20]'>
        <CrayonTextBox color={stoveTheme.start.border} bg='#FFF' animated={true}>
          <p className='text-center font-light text-black'>손잡이를 클릭하여 불을 끄세요.</p>
        </CrayonTextBox>
      </motion.div>
    </AnimatePresence>
  )
}

function StatusMessage({
  foodOnPan,
  isHeating,
  isHeatingComplete,
}: {
  foodOnPan: string | null
  isHeating: boolean
  isHeatingComplete: boolean
}) {
  const getMessage = () => {
    if (!foodOnPan) return '고기 또는 생선을 클릭하여 프라이팬에 올려 보세요.'
    if (!isHeating) return '가스레인지의 손잡이를 클릭하여 불을 켜세요.'
    if (isHeating && !isHeatingComplete) return '가열 중입니다. 가열이 완료될 때까지 기다려 주세요.'
    return ''
  }

  const message = getMessage()
  if (!message) return null

  return (
    <div className='absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40'>
      <CrayonTextBox color={stoveTheme.start.bg} bg='#FFF' animated={true}>
        <p className='text-center font-light'>{message}</p>
      </CrayonTextBox>
    </div>
  )
}

function SummaryPopup({
  isVisible,
  selectedFood,
  onClose,
}: {
  isVisible: boolean
  selectedFood: 'fish' | 'meat' | null
  onClose: () => void
}) {
  if (!isVisible || !selectedFood) return null

  const message =
    selectedFood === 'fish'
      ? '프라이팬이 가열되면 뜨거운 프라이팬에서 생선으로 열이 이동하여 생선이 익습니다.'
      : '프라이팬이 가열되면 뜨거운 프라이팬에서 고기로 열이 이동하여 고기가 익습니다.'

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}>
        <CrayonTextBox color={stoveTheme.start.bg} bg='#FFF' width={500} animated={true}>
          <div className='text-center p-4'>
            <h3 className='text-2xl font-bold mb-4 text-gray-800'>정리하기</h3>
            <p className='text-gray-700 font-light mb-6 leading-relaxed'>{message}</p>
            <CrayonTextButton
              text='확인'
              onClick={onClose}
              width={120}
              bg={stoveTheme.start.bg}
              color='#fff'
              textcolor='#fff'
            />
          </div>
        </CrayonTextBox>
      </motion.div>
    </div>
  )
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [perfSucks, degrade] = useState(false)
  const [isThermalMode, setIsThermalMode] = useState(false)
  const [isHeating, setIsHeating] = useState(false)
  const [heatingTime, setHeatingTime] = useState(0)
  const [heatingProgress, setHeatingProgress] = useState(0)
  const heatingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [selectedFood, setSelectedFood] = useState<'fish' | 'meat' | null>(null)
  const [foodOnPan, setFoodOnPan] = useState<'fish' | 'meat' | null>(null)
  const [isHeatingComplete, setIsHeatingComplete] = useState(false)
  const [showTurnOffMessage, setShowTurnOffMessage] = useState(false)
  const [showSummaryButton, setShowSummaryButton] = useState(false)
  const [showSummaryMessage, setShowSummaryMessage] = useState(false)
  const [fireOff, setFireOff] = useState(false)

  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [controllerRotation, setControllerRotation] = useState(0)
  const [resetTrigger, setResetTrigger] = useState(0)

  const { playSound, playNarration, stopNarration, stopCookingSound, cleanup } = useAudio()

  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const el = new Audio('/sounds/5-2-2/5-2-2-BGM.mp3')
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
    setBgmReady(true)
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }, [playSound, playNarration])

  const handleBackToIntro = useCallback(() => {
    setShowIntro(true)
    handleResetHeating()
  }, [])

  const handleControllerRotation = useCallback(
    (rotation: number) => {
      if (!foodOnPan) return

      const wasHeating = isHeating
      const shouldHeat = rotation > 0

      if (shouldHeat && !wasHeating) {
        setIsHeating(true)
        setHeatingTime(0)
        setHeatingProgress(0)
        setIsHeatingComplete(false)
        setFireOff(false)

        playSound('/sounds/5-2-2/5-2-2-2_gas-stove-version.MP3', 0.5)

        playSound('/sounds/5-2-2/5-2-2-3_food-cooking.MP3', 0.5, true)

        heatingIntervalRef.current = setInterval(() => {
          setHeatingTime((prev) => {
            const newTime = prev + 0.1
            const newProgress = (newTime / 20) * 100

            setHeatingProgress(newProgress)

            if (newProgress >= 50) {
              setShowSummaryButton(true)
            }

            if (newProgress >= 100) {
              setIsHeatingComplete(true)
              // setShowTurnOffMessage(true)
              playNarration('/sounds/5-2-2/5-2-2-B.MP3')

              if (heatingIntervalRef.current) {
                clearInterval(heatingIntervalRef.current)
                heatingIntervalRef.current = null
              }
              return 20
            }

            return newTime
          })
        }, 100)
      } else if (!shouldHeat && wasHeating) {
        if (isHeatingComplete) {
          setIsHeating(false)
          setFireOff(true)
          setShowTurnOffMessage(false)
          stopNarration()
          stopCookingSound()

          if (heatingIntervalRef.current) {
            clearInterval(heatingIntervalRef.current)
            heatingIntervalRef.current = null
          }
        }
      }

      setControllerRotation(rotation)
    },
    [foodOnPan, isHeating, isHeatingComplete, playSound, playNarration, stopNarration, stopCookingSound],
  )

  const handleFoodClick = useCallback(
    (food: 'fish' | 'meat') => {
      if (isHeating) return

      setSelectedFood(food)
      setFoodOnPan(food)
      setHeatingTime(0)
      setHeatingProgress(0)
      setIsHeatingComplete(false)
      setShowTurnOffMessage(false)
      setShowSummaryButton(false)
      setShowSummaryMessage(false)
      setFireOff(false)
      setIsHeating(false)
      stopNarration()
      stopCookingSound()

      if (heatingIntervalRef.current) {
        clearInterval(heatingIntervalRef.current)
        heatingIntervalRef.current = null
      }

      playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
      playNarration('/sounds/5-2-2/5-2-2-A-1.MP3')
    },
    [isHeating, playSound, playNarration, stopNarration, stopCookingSound],
  )

  const handleResetHeating = useCallback(() => {
    stopCookingSound()
    stopNarration()
    if (heatingIntervalRef.current) {
      clearInterval(heatingIntervalRef.current)
      heatingIntervalRef.current = null
    }

    setIsHeating(false)
    setIsHeatingComplete(false)
    setControllerRotation(0)
    setResetTrigger((prev) => prev + 1)
    setHeatingTime(0)
    setHeatingProgress(0)
    setSelectedFood(null)
    setFoodOnPan(null)
    setShowTurnOffMessage(false)
    setShowSummaryButton(false)
    setShowSummaryMessage(false)
    setFireOff(false)
    setIsThermalMode(false)
  }, [stopNarration, stopCookingSound])

  const handleSummaryClick = useCallback(() => {
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
    setShowSummaryMessage(true)

    const audioPath = selectedFood === 'fish' ? '/sounds/5-2-2/5-2-2-C.MP3' : '/sounds/5-2-2/5-2-2-D.MP3'
    playNarration(audioPath)
  }, [selectedFood, playSound, playNarration])

  const handleSummaryClose = useCallback(() => {
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
    setShowSummaryMessage(false)
    stopNarration()
  }, [playSound, stopNarration])

  const toggleThermalMode = useCallback(() => {
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
    setIsThermalMode(!isThermalMode)
  }, [isThermalMode, playSound])

  const createCircularFlames = () => {
    const flames = []
    const flameCount = 40
    const radius = 0.15

    for (let i = 0; i < flameCount; i++) {
      const angle = (i / flameCount) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      flames.push(
        <Flame
          key={i}
          position={[x + 0.05, -0.9, z - 0.125]}
          scale={isHeating && !fireOff ? 0.1 : 0}
          thermalMode={isThermalMode}
          opacity={isThermalMode ? 1 : 1}
        />,
      )
    }

    return flames
  }

  useEffect(() => {
    return () => {
      cleanup()
      if (heatingIntervalRef.current) {
        clearInterval(heatingIntervalRef.current)
      }
    }
  }, [cleanup])

  return (
    <div className='w-screen h-screen bg-[#999] flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      <CrayonTextButton
        ariaLabel={'첫 화면으로'}
        icon={'home'}
        position='absolute'
        iconPosition='left'
        onClick={handleBackToIntro}
        width={96}
        height={96}
        color='#ffffff'
        textcolor='#ffffff'
        bg={stoveTheme.start.bg}
        className='z-[200]'
        right={120}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
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
        bg={stoveTheme.start.bg}
        className='z-[200]'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {!showIntro && (
        <div className='absolute top-4 left-4 z-40 flex flex-col gap-0'>
          {!fireOff && (
            <CrayonTextButton
              text={isThermalMode ? '돌아가기' : '열화상 카메라로 보기'}
              onClick={toggleThermalMode}
              width={isThermalMode ? 120 : 200}
              bg={stoveTheme.start.bg}
              color='#fff'
              textcolor='#FFFFFF'
            />
          )}

          <CrayonTextButton
            text='처음으로'
            onClick={handleResetHeating}
            width={120}
            bg={stoveTheme.goal.bg}
            color='#fff'
            textcolor='#FFFFFF'
          />
        </div>
      )}

      <HeatingGauge
        progress={heatingProgress}
        isHeating={isHeating}
        selectedFood={selectedFood}
        isHeatingComplete={isHeatingComplete}
      />

      {/* <TurnOffFireMessage visible={showTurnOffMessage && isHeatingComplete} /> */}

      {showSummaryButton && !showSummaryMessage && (
        <div className='absolute bottom-5 right-5 z-40'>
          <CrayonTextButton
            text='정리하기'
            onClick={handleSummaryClick}
            width={140}
            bg={stoveTheme.goal.bg}
            color='#FFF'
            textcolor='#FFFFFF'
          />
        </div>
      )}

      <SummaryPopup isVisible={showSummaryMessage} selectedFood={selectedFood} onClose={handleSummaryClose} />

      {isThermalMode && !showIntro && (
        <>
          <div className='absolute inset-0 bg-black opacity-30 pointer-events-none' />
          <ThermalTemperatureGauge />
        </>
      )}

      {!showIntro && (
        <StatusMessage foodOnPan={foodOnPan} isHeating={isHeating} isHeatingComplete={isHeatingComplete} />
      )}

      <div className='flex-1'>
        <Scene
          shadows
          camera={{ position: [0, 1.2, 2.5], fov: 50 }}
          gl={{
            shadowMap: {
              enabled: true,
              type: THREE.PCFSoftShadowMap,
            },
            antialias: true,
          }}>
          <ambientLight intensity={isThermalMode ? 0.1 : 0.4} />
          <PerformanceMonitor onDecline={() => degrade(true)} />
          <TiltOnMouse enabled={showIntro} maxDeg={10} position={[0, 0, 0]}>
            {!isThermalMode && (
              <Environment
                frames={perfSucks ? 1 : Infinity}
                preset='studio'
                resolution={512}
                background={false}
                blur={1}>
                <Lightformer intensity={1} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
                <Lightformer intensity={1} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
                <Lightformer
                  intensity={1}
                  form='ring'
                  rotation-y={Math.PI / 2}
                  position={[1, 1, 1]}
                  scale={[4, 4, 1]}
                />
              </Environment>
            )}

            <fogExp2 attach='fog' color={'#ffffffff'} density={0.3} />
            <directionalLight
              castShadow
              position={[12, 6, 5]}
              intensity={isThermalMode ? 0.1 : 2.0}
              shadow-mapSize-width={4096}
              shadow-mapSize-height={4096}
              shadow-camera-far={50}
              shadow-camera-left={-20}
              shadow-camera-right={10}
              shadow-camera-top={10}
              shadow-camera-bottom={-10}
              shadow-bias={-0.0001}
              shadow-normalBias={0.1}
            />
            <ContactShadows position={[0, -0.6, 0]} scale={7} blur={1.0} opacity={1.0} far={5} />
            <group position={[0, 0.4, 0]}>
              <SpeechBubble
                position={[-0.33, -1.7, 0.45]}
                html={'손잡이'}
                visible={!isHeating && !showIntro}
                delay={0.5}
              />

              <mesh receiveShadow position={[0, -3.1, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={!isThermalMode}>
                <planeGeometry args={[20, 20]} />
                <shadowMaterial opacity={0.3} />
              </mesh>
              <group onClick={() => handleFoodClick('fish')}>
                <Fish
                  scale={1}
                  position={foodOnPan === 'fish' ? [0.0, -0.87, -0.15] : [1.07, -1.01, 0.25]}
                  thermalMode={isThermalMode}
                  isHeating={isHeating && foodOnPan === 'fish'}
                  heatingTime={foodOnPan === 'fish' ? heatingTime : 0}
                  heatingProgress={foodOnPan === 'fish' ? heatingProgress : 0}
                />
              </group>
              <group onClick={() => handleFoodClick('meat')}>
                <Meat
                  scale={1}
                  position={foodOnPan === 'meat' ? [0.02, -0.87, -0.13] : [-1, -1.03, 0.3]}
                  thermalMode={isThermalMode}
                  isHeating={isHeating && foodOnPan === 'meat'}
                  heatingTime={foodOnPan === 'meat' ? heatingTime : 0}
                  heatingProgress={foodOnPan === 'meat' ? heatingProgress : 0}
                />
              </group>
              <Stove
                scale={1}
                position={[0, -0.97, 0.3]}
                thermalMode={isThermalMode}
                isHeating={isHeating && !fireOff}
                heatingTime={heatingTime}
              />
              <StoveController
                position={[0.04, -0.922, 0.435]}
                scale={1.1}
                thermalMode={isThermalMode}
                isHeating={isHeating}
                foodOnPan={foodOnPan}
                heatingTime={0}
                onRotationChange={handleControllerRotation}
                disabled={!foodOnPan || showIntro || (isHeating && !isHeatingComplete)}
                resetTrigger={resetTrigger}
              />
              <Pan
                scale={1}
                position={[0.04, -0.88, -0.12]}
                thermalMode={isThermalMode}
                isHeating={isHeating && !fireOff}
                heatingTime={heatingTime}
              />
              <Dish2 position={[0, -1.043, 0.3]} thermalMode={isThermalMode} isHeating={isHeating} heatingTime={0} />
              <Dish position={[2.07, -1.043, 0.3]} thermalMode={isThermalMode} isHeating={isHeating} heatingTime={0} />
              <BG position={[0, -1, 0]} thermalMode={isThermalMode} isHeating={isHeating} heatingTime={heatingTime} />
              {createCircularFlames()}
            </group>

            <OrbitControls
              enableRotate={!showIntro}
              enableZoom={!showIntro}
              enablePan={!showIntro}
              minDistance={0}
              maxDistance={6}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={0}
            />
          </TiltOnMouse>
        </Scene>
      </div>

      {isThermalMode && !showIntro && <div className='absolute inset-0 bg-black opacity-30 pointer-events-none' />}

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='접촉한 두 물체 사이에서 열의 이동 알아보기'
          description={['온도가 다른 두 물체가 접촉할 때 두 물체 사이에서 열의 이동을 알아봅시다.']}
          backgroundSvg='/img/cover/5-2-2.svg'
          descriptionSound='/sounds/5-2-2/5-2-2-Goal.MP3'
          buttonTheme={stoveTheme}
        />
      )}
    </div>
  )
}
