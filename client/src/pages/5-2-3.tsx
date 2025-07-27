import { useState, useEffect, useRef } from 'react'
import { OrbitControls, useProgress, Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import Model from '../components/5-2-3/Model'
import Scene from '@/components/canvas/Scene'
import CameraLogger from '@/hook/CameraLogger'
import Intro from '@/components/intro/Intro'
import { Environment } from '@react-three/drei'
import IntroMouseCameraController from '@/components/IntroMouseCameraController'

const INITIAL_CAMERA_POSITION: [number, number, number] = [-5, -14, 1]
const INITIAL_CAMERA_TARGET: [number, number, number] = [-5, -14, 0]

interface PopupContent {
  title: string
  content: string
  narrationPath: string
}

const CameraController = ({
  targetPosition,
  targetLookAt,
  onComplete,
}: {
  targetPosition: [number, number, number]
  targetLookAt: [number, number, number]
  onComplete?: () => void
}) => {
  const { camera } = useThree()
  const controlsRef = useRef<any>()
  const animationRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)

  useEffect(() => {
    if (isAnimatingRef.current) {
      console.log('Animation already in progress, canceling previous animation')
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    const waitForControls = () => {
      return new Promise<void>((resolve) => {
        const checkControls = () => {
          if (controlsRef.current && controlsRef.current.target) {
            resolve()
          } else {
            setTimeout(checkControls, 50)
          }
        }
        checkControls()
      })
    }

    const startAnimation = async () => {
      try {
        await waitForControls()

        if (!controlsRef.current || !controlsRef.current.target) {
          console.log('Controls still not ready after waiting')
          return
        }

        isAnimatingRef.current = true
        console.log('Starting camera animation')

        const startPosition = camera.position.clone()
        const startLookAt = controlsRef.current.target.clone()

        const duration = 2000
        const startTime = Date.now()

        const animate = () => {
          if (!controlsRef.current || !controlsRef.current.target) {
            console.log('Controls disappeared during animation, stopping')
            isAnimatingRef.current = false
            return
          }

          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)

          const easeInOutCubic = (t: number) => {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
          }

          const easedProgress = easeInOutCubic(progress)

          camera.position.lerpVectors(
            startPosition,
            { x: targetPosition[0], y: targetPosition[1], z: targetPosition[2] } as any,
            easedProgress,
          )

          const newTarget = startLookAt
            .clone()
            .lerp({ x: targetLookAt[0], y: targetLookAt[1], z: targetLookAt[2] } as any, easedProgress)

          controlsRef.current.target.copy(newTarget)
          controlsRef.current.update()

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate)
          } else {
            console.log('Camera animation completed')
            isAnimatingRef.current = false
            animationRef.current = null
            onComplete?.()
          }
        }

        animationRef.current = requestAnimationFrame(animate)
      } catch (error) {
        console.error('Error during camera animation:', error)
        isAnimatingRef.current = false
      }
    }

    startAnimation()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      isAnimatingRef.current = false
    }
  }, [camera, targetPosition, targetLookAt, onComplete])

  return <OrbitControls ref={controlsRef} enabled={true} minDistance={0} maxDistance={10} minPolarAngle={0} maxPolarAngle={Math.PI/2} onUpdate={() => {}} />
}

const Thermometer = ({
  temperature,
  label,
  color = '#ef4444',
  position = { top: '20px', left: '20px' },
}: {
  temperature: number
  label: string
  color?: string
  position?: { top?: string; left?: string; right?: string; bottom?: string }
}) => {
  const maxTemp = 45
  const minTemp = 0
  const tempHeight = ((temperature - minTemp) / (maxTemp - minTemp)) * 120

  return (
    <div className='z-20 bg-white rounded-lg p-3 shadow-lg' style={position}>
      <div className='text-center mb-2'>
        <div className='text-sm font-bold text-gray-700'>{label}</div>
        <div className='text-lg font-bold' style={{ color }}>
          {temperature}°C
        </div>
      </div>

      <div className='relative w-8 h-32 mx-auto'>
        <div className='absolute left-1/2 transform -translate-x-1/2 w-3 h-28 bg-gray-200 rounded-full'></div>

        <div
          className='absolute left-1/2 transform -translate-x-1/2 w-3 rounded-full transition-all duration-300'
          style={{
            backgroundColor: color,
            height: `${tempHeight}px`,
            bottom: '16px',
          }}
        />

        <div
          className='absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full'
          style={{
            backgroundColor: color,
            bottom: '8px',
          }}
        />
      </div>
    </div>
  )
}

const PressureDisplay = ({
  type,
  label,
  color,
  position = { top: '20px', left: '20px' },
}: {
  type: 'high' | 'low'
  label: string
  color: string
  position?: { top?: string; left?: string; right?: string; bottom?: string }
}) => {
  const isHigh = type === 'high'

  return (
    <div className='z-20 bg-white rounded-lg p-4 shadow-lg' style={position}>
      <div className='text-center'>
        <div className='text-sm font-bold text-gray-700 mb-2'>{label}</div>

        <div className='relative w-16 h-16 mx-auto mb-2'>
          <div
            className='absolute inset-0 rounded-full border-4 flex items-center justify-center'
            style={{ borderColor: color }}>
            <div className='text-2xl font-bold' style={{ color }}>
              {isHigh ? 'H' : 'L'}
            </div>
          </div>

          {isHigh ? (
            <>
              <div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2'>
                <div
                  className='w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent'
                  style={{ borderBottomColor: color }}
                />
              </div>
              <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2'>
                <div
                  className='w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent'
                  style={{ borderTopColor: color }}
                />
              </div>
              <div className='absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2'>
                <div
                  className='w-0 h-0 border-t-2 border-b-2 border-r-4 border-transparent'
                  style={{ borderRightColor: color }}
                />
              </div>
              <div className='absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2'>
                <div
                  className='w-0 h-0 border-t-2 border-b-2 border-l-4 border-transparent'
                  style={{ borderLeftColor: color }}
                />
              </div>
            </>
          ) : (
            <>
              <div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2'>
                <div
                  className='w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent'
                  style={{ borderTopColor: color }}
                />
              </div>
              <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2'>
                <div
                  className='w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent'
                  style={{ borderBottomColor: color }}
                />
              </div>
              <div className='absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2'>
                <div
                  className='w-0 h-0 border-t-2 border-b-2 border-l-4 border-transparent'
                  style={{ borderLeftColor: color }}
                />
              </div>
              <div className='absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2'>
                <div
                  className='w-0 h-0 border-t-2 border-b-2 border-r-4 border-transparent'
                  style={{ borderRightColor: color }}
                />
              </div>
            </>
          )}
        </div>

        <div className='text-xs font-bold' style={{ color }}>
          {isHigh ? '고기압' : '저기압'}
        </div>
      </div>
    </div>
  )
}

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    onLoadingComplete()
  }, [active, progress, onLoadingComplete])

  return null
}

const Sun = ({ size = 24 }: { size?: number }) => <div className='font-bold text-black'>낮</div>

const Moon = ({ size = 24 }: { size?: number }) => <div className='font-bold text-black'>밤</div>

interface PopupProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  narrationPath: string
  onComplete?: () => void
}

const Popup = ({ isOpen, onClose, title, content, narrationPath, onComplete }: PopupProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)

      if (narrationPath) {
        audioRef.current = new Audio(narrationPath)
        audioRef.current.volume = 0.5
        
        // 오디오 로드 및 재생
        audioRef.current.load()
        const playPromise = audioRef.current.play()
        
        if (playPromise !== undefined) {
          playPromise
            .catch((error) => {
              const playOnClick = () => {
                if (audioRef.current) {
                  audioRef.current.play().catch(console.error)
                }
                document.removeEventListener('click', playOnClick)
              }
              document.addEventListener('click', playOnClick)
            })
        }
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
    }
  }, [isOpen, narrationPath])

  const handleConfirm = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    setIsVisible(false)
    setTimeout(() => {
      onClose()
      onComplete?.()
    }, 300)
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-300'
      }`}>
      <div
        className={`bg-white rounded-xl shadow-lg max-w-md mx-4 relative transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
        <div className='p-6'>
          <h3 className='text-lg font-bold text-gray-900 mb-3'>{title}</h3>

          <p className='text-gray-600 text-m font-bold leading-relaxed mb-6'>{content}</p>

          <div className='flex justify-end'>
            <button
              onClick={handleConfirm}
              className='px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-light transition-all duration-200'>
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [isDay, setIsDay] = useState(true)

  const [currentStep, setCurrentStep] = useState('initial')
  const [completedSteps, setCompletedSteps] = useState(new Set())

  const [showPopup, setShowPopup] = useState(false)
  const [popupContent, setPopupContent] = useState<PopupContent>({
    title: '',
    content: '',
    narrationPath: '',
  })

  const [seaTemperature, setSeaTemperature] = useState(22)
  const [landTemperature, setLandTemperature] = useState(22)
  const [showTemperatureDisplay, setShowTemperatureDisplay] = useState(false)
  const [isTemperatureAnimating, setIsTemperatureAnimating] = useState(false)

  const [showPressureDisplay, setShowPressureDisplay] = useState(false)
  const [showWind, setShowWind] = useState(false)
  const [modelAnimationEnabled, setModelAnimationEnabled] = useState(false)

  const [cameraTarget, setCameraTarget] = useState<{
    position: [number, number, number]
    lookAt: [number, number, number]
  } | null>(null)

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const playClickSound = (audioPath = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.load()
      const playPromise = audio.play()
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('효과음 재생 실패:', error.name)
        })
      }
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const handleEnterExperience = () => {
    playClickSound()
    setTimeout(() => {
      setShowIntro(false)
      setCameraTarget({
        position: INITIAL_CAMERA_POSITION,
        lookAt: INITIAL_CAMERA_TARGET,
      })
    }, 300)
  }

  const resetAllStates = () => {
    setSeaTemperature(22)
    setLandTemperature(22)
    setShowTemperatureDisplay(false)
    setIsTemperatureAnimating(false)
    setShowPressureDisplay(false)
    setShowWind(false)
    setModelAnimationEnabled(false)
    setShowPopup(false)
    setCurrentStep('initial')
    setCompletedSteps(new Set())
    setCameraTarget({
      position: INITIAL_CAMERA_POSITION,
      lookAt: INITIAL_CAMERA_TARGET,
    })
  }

  useEffect(() => {
    if (!showIntro && currentStep === 'initial') {
      setCameraTarget({
        position: INITIAL_CAMERA_POSITION,
        lookAt: INITIAL_CAMERA_TARGET,
      })
    }
  }, [showIntro, currentStep])

  const handleDayClick = () => {
    resetAllStates()

    setTimeout(() => {
      setIsDay(true)
      setCurrentStep('day-selected')
      setShowPopup(true)
      setPopupContent({
        title: '낮 시간대',
        content: '낮에는 바다와 육지에서 바람은 어떻게 불까요?',
        narrationPath: '/sounds/5-2-3/narration/5-2-3-A.MP3',
      })
    }, 100)
  }

  const handleNightClick = () => {
    resetAllStates()

    setTimeout(() => {
      setIsDay(false)
      setCurrentStep('day-selected')
      setShowPopup(true)
      setPopupContent({
        title: '밤 시간대',
        content: '밤에는 바다와 육지에서 바람은 어떻게 불까요?',
        narrationPath: '/sounds/5-2-3/narration/5-2-3-D.MP3',
      })
    }, 100)
  }

  const handleTemperatureButtonClick = () => {
    if (completedSteps.has('temperature')) return

    setCurrentStep('temperature-animation')
    setShowTemperatureDisplay(true)
    setIsTemperatureAnimating(true)

    let timeElapsed = 0
    const interval = setInterval(() => {
      timeElapsed += 100

      if (isDay) {
        const newSeaTemp = Math.min(23, 22 + timeElapsed / 3000)
        const newLandTemp = Math.min(40, 22 + (timeElapsed / 1000) * 18)
        setSeaTemperature(Math.round(newSeaTemp))
        setLandTemperature(Math.round(newLandTemp))
      } else {
        const newSeaTemp = Math.max(18, 22 - timeElapsed / 3000)
        const newLandTemp = Math.max(5, 22 - (timeElapsed / 1000) * 17)
        setSeaTemperature(Math.round(newSeaTemp))
        setLandTemperature(Math.round(newLandTemp))
      }

      if (timeElapsed >= 3000) {
        clearInterval(interval)
        setIsTemperatureAnimating(false)
        setCompletedSteps((prev) => new Set(prev).add('temperature'))
        setTimeout(() => {
          setCurrentStep('ready-for-pressure')
        }, 0)
      }
    }, 100)
  }

  const handlePressureButtonClick = () => {
    if (completedSteps.has('pressure')) return

    setCurrentStep('pressure-animation')
    setShowPressureDisplay(true)
    setCompletedSteps((prev) => new Set(prev).add('pressure'))

    setTimeout(() => {
      setCurrentStep('ready-for-wind')
    }, 1500)
  }

  const handleWindButtonClick = () => {
    if (completedSteps.has('wind')) return

    setCurrentStep('wind-animation')
    setShowWind(true)
    setModelAnimationEnabled(true)
    setCompletedSteps((prev) => new Set(prev).add('wind'))

    setCameraTarget({
      position: [-5, -14, 3],
      lookAt: [-5, -14, 1],
    })

    setTimeout(() => {
      setShowPopup(true)
      setPopupContent({
        title: `${isDay ? '낮' : '밤'}에 바닷가에서 부는 바람`,
        content: isDay
          ? '낮에는 육지 온도가 바다 온도보다 상대적으로 높아져 바다는 고기압이 되고 육지는 저기압이 되어 바다에서 육지 쪽으로 바람이 분다.'
          : '밤에는 육지 온도가 바다 온도보다 상대적으로 낮아져 바다는 저기압이 되고 육지는 고기압이 되어 육지에서 바다 쪽으로 바람이 분다.',
        narrationPath: isDay ? '/sounds/5-2-3/narration/5-2-3-C.MP3' : '/sounds/5-2-3/narration/5-2-3-F.MP3',
      })
    }, 2200)
  }

  const getButtonStyle = (step: string) => {
    const isCompleted = completedSteps.has(step)
    const isActive =
      !isCompleted &&
      ((step === 'temperature' && currentStep === 'day-selected') ||
        (step === 'pressure' && currentStep === 'ready-for-pressure') ||
        (step === 'wind' && currentStep === 'ready-for-wind'))

    if (isCompleted) {
      return 'px-4 py-2 bg-green-500 text-white rounded-lg cursor-default opacity-90'
    } else if (isActive) {
      return 'px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg animate-pulse cursor-pointer'
    } else {
      return 'px-4 py-2 bg-gray-400 text-gray-200 rounded-lg cursor-not-allowed opacity-50'
    }
  }

  return (
    <div className='w-screen h-screen bg-red flex flex-col relative'>
      <div
        className={`absolute inset-0 transition-opacity duration-1000 z-5 ${
          !isDay ? 'bg-black opacity-60' : 'opacity-0'
        } pointer-events-none`}
      />

      {showTemperatureDisplay && (
        <div className='absolute flex flex-row left-1/2 -translate-x-1/2 top-4 gap-[800px] z-30'>
          <Thermometer temperature={seaTemperature} label='바다' color={isDay ? '#3b82f6' : '#ef4444'} />
          <Thermometer temperature={landTemperature} label='육지' color={isDay ? '#ef4444' : '#3b82f6'} />
        </div>
      )}

      {showPressureDisplay && (
        <div className='absolute flex flex-row left-1/2 -translate-x-1/2 top-10 gap-[200px] z-30'>
          <PressureDisplay type={isDay ? 'high' : 'low'} label='바다' color={isDay ? '#ef4444' : '#3b82f6'} />
          <PressureDisplay type={isDay ? 'low' : 'high'} label='육지' color={isDay ? '#3b82f6' : '#ef4444'} />
        </div>
      )}

      <Scene
        camera={{ position: [0, 0.5, 3], fov: 50, far: 1000 }}
        shadows={{
          enabled: true,
          type: 'PCFSoftShadowMap',
        }}>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        <IntroMouseCameraController enabled={showIntro} />
        
        <ambientLight intensity={isDay ? 0.4 : 0.2} color={isDay ? '#ffffff' : '#404080'} />
        
        <directionalLight
          position={isDay ? [15, 20, 10] : [5, 15, 8]}
          intensity={isDay ? 1.5 : 0.6}
          color={isDay ? '#ffeaa7' : '#74b9ff'}
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
          position={isDay ? [-5, 10, 5] : [-3, 8, 3]}
          intensity={isDay ? 0.3 : 0.15}
          color={isDay ? '#81ecec' : '#6c5ce7'}
        />
        
        <pointLight
          position={[-10, 2, 0]}
          intensity={isDay ? 0.8 : 0.3}
          color={isDay ? '#74b9ff' : '#00cec9'}
          distance={30}
          decay={2}
        />
      
        
        <Model
          scale={0.2}
          rotation={[0, -Math.PI / 2, 0]}
          position={[0, -15, 0]}
          windEnabled={showWind}
          windDirection={isDay ? 'sea-to-land' : 'land-to-sea'}
          windSpeed={0.2}
          isDay={isDay}
          animationEnabled={modelAnimationEnabled}
        />

        {cameraTarget ? (
          <CameraController
            targetPosition={cameraTarget.position}
            targetLookAt={cameraTarget.lookAt}
            onComplete={() => {}}
          />
        ) : (
          <OrbitControls enabled={!showIntro && !showPopup} minDistance={0} maxDistance={10} minPolarAngle={0} maxPolarAngle={Math.PI/2}/>
        )}

        <Environment preset={isDay ? 'sunset' : 'night'} blur={0.8} resolution={512} />
      </Scene>

      {!showIntro && (
        <div className='absolute top-4 left-1/2 transform -translate-x-1/2 text-lg flex gap-2 z-30'>
          <button
            onClick={handleDayClick}
            className={`p-3 rounded-full transition-all duration-300 ${
              isDay
                ? 'bg-yellow-400 text-white opacity-100 scale-110'
                : 'bg-white text-yellow-400 opacity-40 hover:opacity-70'
            } hover:scale-110 shadow-lg`}>
            <Sun size={24} />
          </button>
          <button
            onClick={handleNightClick}
            className={`p-3 rounded-full transition-all duration-300 ${
              !isDay
                ? 'bg-purple-600 text-white opacity-100 scale-110'
                : 'bg-white text-purple-600 opacity-40 hover:opacity-70'
            } hover:scale-110 shadow-lg`}>
            <Moon size={24} />
          </button>
        </div>
      )}

      {!showIntro && currentStep !== 'initial' && (
        <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-30 font-bold'>
          <button onClick={handleTemperatureButtonClick} className={getButtonStyle('temperature')}>
            온도
          </button>

          <button onClick={handlePressureButtonClick} className={getButtonStyle('pressure')}>
            기압
          </button>

          <button onClick={handleWindButtonClick} className={`${getButtonStyle('wind')} flex items-center gap-2`}>
            바람의 방향
          </button>
        </div>
      )}

      {currentStep === 'temperature-animation' && (
        <div className='absolute top-20 left-1/2 transform -translate-x-1/2 z-20'>
          <style
            dangerouslySetInnerHTML={{
              __html: `
        @keyframes clockRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .clock-hand {
          animation: clockRotate 2s linear infinite;
          transform-origin: 50% 50%;
        }
      `,
            }}
          />
          <div className='bg-white rounded-full p-4 shadow-lg'>
            <div className='w-16 h-16 relative'>
              <svg viewBox='0 0 40 40' className='w-full h-full'>
                {Array.from({ length: 12 }, (_, i) => (
                  <line
                    key={i}
                    x1='20'
                    y1='2'
                    x2='20'
                    y2='6'
                    stroke={isTemperatureAnimating ? '#3b82f6' : '#e5e7eb'}
                    strokeWidth='2'
                    transform={`rotate(${i * 30} 20 20)`}
                  />
                ))}
                <line
                  x1='20'
                  y1='20'
                  x2='20'
                  y2='8'
                  stroke='#374151'
                  strokeWidth='2'
                  className={isTemperatureAnimating ? 'clock-hand' : ''}
                  style={{
                    transformOrigin: '20px 20px',
                  }}
                />
                <circle cx='20' cy='20' r='1' fill='#374151' />
              </svg>
            </div>
          </div>
        </div>
      )}

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='바닷가에서 부는 바람 방향 알아보기'
          description={['바닷가에서 바람은 어떻게 부는지 알아봅시다.']}
          backgroundSvg='/img/cover/5-2-3.svg'
          descriptionSound='/sounds/5-2-3/narration/5-2-3-Goal.MP3'
        />
      )}

      <Popup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title={popupContent.title}
        content={popupContent.content}
        narrationPath={popupContent.narrationPath}
      />
    </div>
  )
}