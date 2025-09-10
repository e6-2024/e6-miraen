import { useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Lightformer,
  PerformanceMonitor,
  AccumulativeShadows,
  RandomizedLight,
  useProgress,
} from '@react-three/drei'
import { useEffect } from 'react'
import Fish from '@/components/5-2-2/models/Fish'
import Meat from '@/components/5-2-2/models/Meat'
import Stove from '@/components/5-2-2/models/Stove'
import Scene from '@/components/canvas/Scene'
import Flame from '@/components/5-2-2/Flame'
import Intro from '@/components/intro/Intro'
import Pan from '@/components/5-2-2/models/Pan'
import { BG } from '@/components/5-2-2/models/BG'
import { Dish } from '@/components/5-2-2/models/Dish'
import CameraLogger from '@/hook/CameraLogger'
import StoveController from '@/components/5-2-2/models/StoveController'
import IntroMouseCameraController from '@/components/intro/IntroMouseCameraController'
import { TiltOnMouse } from '@/components/common/Tilt'

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
    <div className='absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm p-4 shadow-lg border border-gray-200 min-w-[300px]'>
      <div className='text-center mb-3'>
        <h3 className='text-lg font-bold text-gray-800'>{foodName} 가열 중</h3>
        {isHeatingComplete && <p className='text-sm text-green-600 font-bold'>가열 완료! 불을 꺼주세요</p>}
      </div>

      <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-2'>
        <div
          className={`h-4 rounded-full transition-all duration-300 font-light ${
            progress >= 100 ? 'bg-green-500' : 'bg-orange-500'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className='flex justify-center text-xs text-gray-600 font-light'>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

function SummaryButton({
  visible,
  selectedFood,
  onClick,
}: {
  visible: boolean
  selectedFood: 'fish' | 'meat' | null
  onClick: () => void
}) {
  if (!visible || !selectedFood) return null

  return (
    <div className='absolute bottom-4 right-4 z-10'>
      <button
        onClick={onClick}
        className='px-6 py-3 bg-white text-black font-bold transition-all duration-300 shadow-lg hover:scale-105 active:scale-95'>
        정리하기
      </button>
    </div>
  )
}

function SummaryMessage({
  visible,
  selectedFood,
  onClose,
}: {
  visible: boolean
  selectedFood: 'fish' | 'meat' | null
  onClose: () => void
}) {
  if (!visible || !selectedFood) return null

  const message =
    selectedFood === 'fish'
      ? '프라이팬이 가열되면 뜨거운 프라이팬에서 생선으로 열이 이동하여 생선이 익습니다.'
      : '프라이팬이 가열되면 뜨거운 프라이팬에서 고기로 열이 이동하여 고기가 익습니다.'

  return (
    <div className='absolute inset-0 bg-black/50 flex items-center justify-center z-30'>
      <div className='bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-xl'>
        <h3 className='text-xl font-bold mb-4 text-gray-800'>정리하기</h3>
        <p className='text-gray-700 mb-6 leading-relaxed font-light'>{message}</p>
        <button onClick={onClose} className='px-6 py-2 bg-white text-black border-2 border-black font-light'>
          확인
        </button>
      </div>
    </div>
  )
}

function TurnOffFireMessage({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <div className='absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce'>
      <p className='text-center font-bold'>🔥 손잡이를 돌려 불을 끄세요!</p>
    </div>
  )
}

export default function Home() {
  const [perfSucks, degrade] = useState(false)
  const [isThermalMode, setIsThermalMode] = useState(false)
  const [isHeating, setIsHeating] = useState(false)
  const [heatingTime, setHeatingTime] = useState(0)
  const [heatingProgress, setHeatingProgress] = useState(0)
  const heatingIntervalRef = useRef(null)

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

  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const heatingAudioRef = useRef<HTMLAudioElement | null>(null)

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const playNarration = (audioPath: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }

    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch((error) => {
        console.log('나레이션 재생 실패:', error.name)
      })
      currentAudioRef.current = audio

      audio.addEventListener('ended', () => {
        currentAudioRef.current = null
      })
    } catch (error) {
      console.log('나레이션 생성 실패:', error)
    }
  }

  // 가스레인지 버튼 사운드 (클릭 시 즉시 재생)
  const playStoveButtonSound = () => {
    try {
      const audio = new Audio('/sounds/5-2-2/5-2-2-2_gas-stove-version-2-338042.mp3')
      audio.volume = 0.5
      audio.play().catch((error) => {
        console.log('가스레인지 버튼 소리 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('가스레인지 버튼 소리 생성 실패:', error)
    }
  }

  // 가열 사운드 (가열 시작 후 5초 뒤 재생)
  const playHeatingSound = () => {
    if (heatingAudioRef.current) {
      heatingAudioRef.current.pause()
      heatingAudioRef.current.currentTime = 0
    }

    try {
      const audio = new Audio('/sounds/5-2-2/5-2-2-3_food-cooking-in-frying-pan-71250.mp3')
      audio.volume = 0.5
      audio.loop = true

      // 5초 후 가열 소리 재생
      setTimeout(() => {
        audio.play().catch((error) => {
          console.log('가열 소리 재생 실패:', error.name)
        })
      }, 5000)

      heatingAudioRef.current = audio
    } catch (error) {
      console.log('가열 소리 생성 실패:', error)
    }
  }

  // 가열 소리 정지 함수
  const stopHeatingSound = () => {
    if (heatingAudioRef.current) {
      try {
        heatingAudioRef.current.pause()
        heatingAudioRef.current.currentTime = 0
        heatingAudioRef.current = null
      } catch (error) {
        console.log('가열 소리 정지 중 오류:', error)
        heatingAudioRef.current = null
      }
    }
  }

  const handleControllerRotation = (rotation: number) => {
    if (!foodOnPan) return // 음식이 없으면 가열 불가

    const wasHeating = isHeating
    const shouldHeat = rotation > 0

    if (shouldHeat && !wasHeating) {
      // 가열 시작
      setIsHeating(true)
      setHeatingTime(0)
      setHeatingProgress(0)
      setIsHeatingComplete(false)
      setFireOff(false)

      // 가스레인지 버튼 사운드 즉시 재생
      playStoveButtonSound()

      // 가열 소리는 별도로 관리 (5초 후 재생)
      playHeatingSound()

      heatingIntervalRef.current = setInterval(() => {
        setHeatingTime((prev) => {
          const newTime = prev + 0.1
          const newProgress = (newTime / 20) * 100

          setHeatingProgress(newProgress)

          if (newProgress >= 50) {
            setShowSummaryButton(true)
          }

          if (newProgress >= 100) {
            // 가열은 계속 유지하되, 완료 상태로 표시
            setIsHeatingComplete(true)
            setShowTurnOffMessage(true)

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
      // 가열 중지 (가열이 완료된 후에만 가능)
      if (isHeatingComplete) {
        setIsHeating(false)
        setFireOff(true)
        setShowTurnOffMessage(false) // 완료 후 불을 끌 때만 메시지 숨김

        // 가열 소리 즉시 정지
        stopHeatingSound()

        if (heatingIntervalRef.current) {
          clearInterval(heatingIntervalRef.current)
          heatingIntervalRef.current = null
        }
      }
      // 가열이 완료되지 않았다면 아무것도 하지 않음 (메시지 유지)
    }

    setControllerRotation(rotation)
  }

  const handleEnterExperience = () => {
    playClickSound()
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }

  const handleFoodClick = (food: 'fish' | 'meat') => {
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

    // 가열 소리 즉시 정지
    stopHeatingSound()

    if (heatingIntervalRef.current) {
      clearInterval(heatingIntervalRef.current)
      heatingIntervalRef.current = null
    }
  }

  const handleFireOff = () => {
    // 손잡이를 0 위치로 되돌리기
    setControllerRotation(0)
    setFireOff(true)
    setShowTurnOffMessage(false)
    setIsHeating(false) // 여기서만 가열을 중지
    setIsThermalMode(false)

    // 가열 소리 즉시 정지
    stopHeatingSound()

    if (heatingIntervalRef.current) {
      clearInterval(heatingIntervalRef.current)
      heatingIntervalRef.current = null
    }
  }

  const handleResetHeating = () => {
    // 가열 소리 즉시 정지 (최우선)
    stopHeatingSound()

    // 모든 오디오 정지
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }

    // 가열 인터벌 정지
    if (heatingIntervalRef.current) {
      clearInterval(heatingIntervalRef.current)
      heatingIntervalRef.current = null
    }

    // 상태 초기화 (모든 상태를 강제로 초기화)
    setIsHeating(false)
    setIsHeatingComplete(false)
    setControllerRotation(0)
    setResetTrigger((prev) => prev + 1) // StoveController 초기화 트리거
    setHeatingTime(0)
    setHeatingProgress(0)
    setSelectedFood(null)
    setFoodOnPan(null)
    setShowTurnOffMessage(false)
    setShowSummaryButton(false)
    setShowSummaryMessage(false)
    setFireOff(false)
    setIsThermalMode(false)
  }

  const handleSummaryClick = () => {
    playGeneralButtonSound()
    setShowSummaryMessage(true)

    const audioPath = selectedFood === 'fish' ? '/sounds/5-2-2/5-2-2-C.MP3' : '/sounds/5-2-2/5-2-2-D.MP3'
    playNarration(audioPath)
  }

  const handleSummaryClose = () => {
    playGeneralButtonSound()
    setShowSummaryMessage(false)

    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
  }

  const createCircularFlames = () => {
    const flames = []
    const flameCount = 20
    const radius = 0.13

    for (let i = 0; i < flameCount; i++) {
      const angle = (i / flameCount) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      flames.push(
        <Flame
          key={i}
          position={[x + 0.05, -0.93, z - 0.4]}
          scale={isHeating && !fireOff ? 0.3 : 0}
          opacity={isThermalMode ? 0.3 : 1}
        />,
      )
    }

    return flames
  }

  const playGeneralButtonSound = () => {
    try {
      const audio = new Audio('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
      audio.volume = 0.5
      audio.play().catch((error) => {
        console.log('일반 버튼 소리 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('일반 버튼 소리 생성 실패:', error)
    }
  }

  useEffect(() => {
    return () => {
      if (heatingIntervalRef.current) {
        clearInterval(heatingIntervalRef.current)
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
      }
      // 가열 소리 정리
      if (heatingAudioRef.current) {
        heatingAudioRef.current.pause()
        heatingAudioRef.current.currentTime = 0
      }
    }
  }, [])

  return (
    <div className='w-screen h-screen bg-white flex flex-col relative overflow-hidden'>
      <HeatingGauge
        progress={heatingProgress}
        isHeating={isHeating}
        selectedFood={selectedFood}
        isHeatingComplete={isHeatingComplete}
      />

      {!showIntro && (
        <div className='absolute top-4 right-4 z-10 flex flex-col gap-3'>
          {!fireOff && (
            <button
              onClick={() => {
                playGeneralButtonSound()
                setIsThermalMode(!isThermalMode)
              }}
              className='px-6 py-2 font-light bg-white text-black border-black border-2'>
              {isThermalMode ? '돌아가기' : '열화상 카메라로 보기'}
            </button>
          )}

          <button
            onClick={() => {
              playGeneralButtonSound()
              handleResetHeating()
            }}
            className='px-6 py-2 font-light bg-white text-black border-black border-2'>
            처음으로
          </button>
        </div>
      )}

      <TurnOffFireMessage visible={showTurnOffMessage && isHeatingComplete} />

      <SummaryButton
        visible={showSummaryButton && !showSummaryMessage}
        selectedFood={selectedFood}
        onClick={handleSummaryClick}
      />

      <SummaryMessage visible={showSummaryMessage} selectedFood={selectedFood} onClose={handleSummaryClose} />

      <Scene camera={{ position: [0, 1.2, 2.2], fov: 50 }}>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />

        <ambientLight intensity={isThermalMode ? 0.1 : 1} />
        <PerformanceMonitor onDecline={() => degrade(true)} />

        <TiltOnMouse enabled={showIntro} maxDeg={10} position={[0, 0, 0]}>
          {!isThermalMode && (
            <Environment frames={perfSucks ? 1 : Infinity} preset='studio' resolution={256} background={false} blur={1}>
              <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
              <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
              <group rotation={[Math.PI / 2, 1, 0]}>
                <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
                <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[50, 2, 1]} />
              </group>
              <Lightformer
                intensity={2}
                form='ring'
                color='white'
                rotation-y={Math.PI / 2}
                position={[1, 1, 1]}
                scale={[4, 4, 1]}
              />
            </Environment>
          )}
          <fog attach='fog' args={['#0c0c0cff', 1, 25]} />
          <fogExp2 attach='fog' color={'#ffffffff'} density={0.09} />
          <ContactShadows
            position={[0, 0, 0]}
            opacity={isThermalMode ? 0.1 : 0.9}
            scale={30}
            blur={0.8}
            far={2}
            color='black'
            frames={2}
          />
          <directionalLight position={[2, 2, 2]} intensity={isThermalMode ? 0.1 : 1} />

          <group
            onClick={() => {
              handleFoodClick('fish')
              playGeneralButtonSound()
              playNarration('/sounds/5-2-2/5-2-2-A.MP3')
            }}>
            <Fish
              scale={1}
              position={foodOnPan === 'fish' ? [0.0, -0.87, -0.5] : [1.2, -0.9, 0.3]}
              thermalMode={isThermalMode}
              isHeating={isHeating && foodOnPan === 'fish'}
              heatingTime={foodOnPan === 'fish' ? heatingTime : 0}
              heatingProgress={foodOnPan === 'fish' ? heatingProgress : 0}
            />
          </group>

          <group
            onClick={() => {
              handleFoodClick('meat')
              playGeneralButtonSound()
              playNarration('/sounds/5-2-2/5-2-2-A.MP3')
            }}>
            <Meat
              scale={1}
              position={foodOnPan === 'meat' ? [0.0, -0.87, -0.4] : [-1, -1, 0.3]}
              thermalMode={isThermalMode}
              isHeating={isHeating && foodOnPan === 'meat'}
              heatingTime={foodOnPan === 'meat' ? heatingTime : 0}
              heatingProgress={foodOnPan === 'meat' ? heatingProgress : 0}
            />
          </group>

          <group onClick={showTurnOffMessage ? handleFireOff : undefined}>
            <Stove
              scale={1}
              position={[0, -1, 0]}
              thermalMode={isThermalMode}
              isHeating={isHeating && !fireOff}
              heatingTime={heatingTime}
            />
          </group>

          <Pan
            scale={1}
            position={[0, -0.88, -0.4]}
            thermalMode={isThermalMode}
            isHeating={isHeating && !fireOff}
            heatingTime={heatingTime}
          />
          <Dish position={[0, -1, 0.3]} thermalMode={isThermalMode} isHeating={isHeating} heatingTime={0} />
          <Dish position={[2.2, -1, 0.3]} thermalMode={isThermalMode} isHeating={isHeating} heatingTime={0} />
          <BG position={[0, -1, 0]} thermalMode={isThermalMode} isHeating={isHeating} heatingTime={heatingTime} />
          {createCircularFlames()}

          <OrbitControls
            enableRotate={!showIntro}
            enableZoom={!showIntro}
            enablePan={!showIntro}
            minDistance={0}
            maxDistance={6}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={0}
          />
          <StoveController
            position={[0.04, -0.96, 0.13]}
            thermalMode={isThermalMode}
            isHeating={isHeating}
            foodOnPan={foodOnPan}
            heatingTime={0}
            onRotationChange={handleControllerRotation}
            disabled={!foodOnPan || showIntro || (isHeating && !isHeatingComplete)}
            resetTrigger={resetTrigger}
          />
        </TiltOnMouse>
      </Scene>

      {isThermalMode && !showIntro && <div className='absolute inset-0 bg-black opacity-30 pointer-events-none' />}

      {!showIntro && !foodOnPan && (
        <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white text-black px-6 py-3 border-2 border-black font-light'>
          <p className='text-center font-medium'>생선 또는 고기를 클릭하여 프라이팬에 올려보세요!</p>
        </div>
      )}

      {!showIntro && foodOnPan && !isHeating && (
        <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white text-black px-6 py-3 border-2 border-black font-light'>
          <p className='text-center font-medium'>가스레인지 손잡이를 클릭하여 가열해보세요!</p>
        </div>
      )}

      {!showIntro && isHeating && !isHeatingComplete && (
        <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white text-black px-6 py-3 border-2 border-black font-light'>
          <p className='text-center font-medium'>가열 중입니다... 완료될 때까지 기다려주세요!</p>
        </div>
      )}

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='열과 우리 생활'
          description={['온도가 다른 두 물체가 접촉할 때 두 물체 사이에서 열의 이동을 알아봅시다.']}
          backgroundSvg='/img/cover/5-2-2.svg'
          descriptionSound='/sounds/5-2-2/5-2-2-Goal.MP3'
        />
      )}
    </div>
  )
}
