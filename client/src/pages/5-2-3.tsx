import { useState, useEffect, useRef } from 'react'
import { OrbitControls, useProgress, Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import Model from '../components/5-2-3/Model'
import Scene from '@/components/canvas/Scene'
import CameraLogger from '@/components/CameraLogger'
import Intro from '@/components/intro/Intro'
import { Environment } from '@react-three/drei'
import { SpeechBubble } from '@/components/5-2-3/SpeechBubble'
import IntroMouseCameraController from '@/components/IntroMouseCameraController'

const INITIAL_CAMERA_POSITION: [number, number, number] = [-20, -15, 22];
const INITIAL_CAMERA_TARGET: [number, number, number] = [-20, -15, 20];

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

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={true}
      onUpdate={() => {
      }}
    />
  )
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
    <div className='absolute z-20 bg-white rounded-lg p-3 shadow-lg' style={position}>
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

        <div className='absolute right-0 h-28 flex flex-col justify-between text-xs text-gray-500'>
          <span>40°</span>
          <span>30°</span>
          <span>20°</span>
          <span>10°</span>
          <span>0°</span>
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

const Sun = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
    <circle cx='12' cy='12' r='4' />
    <path d='m12 2 0 2' />
    <path d='m12 20 0 2' />
    <path d='m4.93 4.93 1.41 1.41' />
    <path d='m17.66 17.66 1.41 1.41' />
    <path d='m2 12 2 0' />
    <path d='m20 12 2 0' />
    <path d='m6.34 17.66-1.41 1.41' />
    <path d='m19.07 4.93-1.41 1.41' />
  </svg>
)

const Moon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
    <path d='M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' />
  </svg>
)

const Wind = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
    <path d='M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2' />
    <path d='M9.6 4.6A2 2 0 1 1 11 8H2' />
    <path d='M12.6 19.4A2 2 0 1 0 14 16H2' />
  </svg>
)

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
        audioRef.current.volume = 0.7
        audioRef.current.play().catch((error) => {
          console.log('나레이션 재생 실패:', error)
        })
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
      className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ${
        isVisible ? 'bg-black bg-opacity-40' : 'bg-black bg-opacity-0'
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
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
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
    setShowPopup(false)
    setCurrentStep('initial') 
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
        setTimeout(() => {
          setCurrentStep('ready-for-pressure')
        }, 0)
      }
    }, 100)
  }

  const handlePressureButtonClick = () => {
    setCurrentStep('pressure-animation')
    setShowPressureDisplay(true)

    setTimeout(() => {
      setCurrentStep('ready-for-wind')
    }, 1500)
  }

  const handleWindButtonClick = () => {
    setCurrentStep('wind-animation')
    setShowWind(true)

    setCameraTarget({
      position: [-23, -15, 22],
      lookAt: [-22, -15, 20],
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

  return (
    <div className='w-screen h-screen bg-red flex flex-col relative'>
      <div
        className={`absolute inset-0 transition-opacity duration-1000 z-5 ${
          !isDay ? 'bg-black opacity-60' : 'opacity-0'
        } pointer-events-none`}
      />

      {showTemperatureDisplay && (
        <>
          <Thermometer
            temperature={seaTemperature}
            label='바다 온도'
            color={isDay ? '#3b82f6' : '#ef4444'}
            position={{ top: '100px', left: '20px' }}
          />
          <Thermometer
            temperature={landTemperature}
            label='육지 온도'
            color={isDay ? '#ef4444' : '#3b82f6'}
            position={{ top: '100px', right: '20px' }}
          />
        </>
      )}

      <Scene camera={{ position: [30, 20, 80], fov: 50, far: 1000 }} shadows>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        <IntroMouseCameraController enabled={showIntro} />
        <ambientLight intensity={isDay ? 1.0 : 0.3} />
        <Model
          scale={1.0}
          rotation={[0, -Math.PI / 2, 0]}
          position={[-0, -20, 50]}
          windEnabled={showWind}
          windDirection={isDay ? 'sea-to-land' : 'land-to-sea'}
          windSpeed={0.2}
          isDay={isDay}
        />

        {cameraTarget ? (
          <CameraController
            targetPosition={cameraTarget.position}
            targetLookAt={cameraTarget.lookAt}
            onComplete={() => {
            }}
          />
        ) : (
          <OrbitControls enabled={!showIntro && !showPopup} minDistance={0} maxDistance={130} />
        )}

        <CameraLogger />
        <Environment preset={isDay ? 'sunset' : 'night'} blur={0.8} resolution={512} />

        {showPressureDisplay && (
          <>
            <SpeechBubble
              position={[-45, -15, 0]}
              html={`바다<br/><strong style="color: ${isDay ? '#ef4444' : '#3b82f6'}">${
                isDay ? '고기압' : '저기압'
              }</strong><br/><div style="font-size: 20px">${isDay ? 'H' : 'L'}</div>`}
              pointColor={isDay ? '#ef4444' : '#3b82f6'}
              bubbleOffset={[0, 2, 0]}
            />
            <SpeechBubble
              position={[15, -15, 0]}
              html={`육지<br/><strong style="color: ${isDay ? '#3b82f6' : '#ef4444'}">${
                isDay ? '저기압' : '고기압'
              }</strong><br/><div style="font-size: 20px">${isDay ? 'L' : 'H'}</div>`}
              pointColor={isDay ? '#3b82f6' : '#ef4444'}
              bubbleOffset={[0, 2, 0]}
            />
          </>
        )}
      </Scene>

      {!showIntro && (
        <div className='absolute top-4 right-4 flex gap-2 z-30'>
          <button
            onClick={handleDayClick}
            className={`p-3 rounded-full ${
              isDay ? 'bg-yellow-400 text-white' : 'bg-white text-yellow-400'
            } hover:scale-110 transition-transform shadow-lg`}>
            <Sun size={24} />
          </button>
          <button
            onClick={handleNightClick}
            className={`p-3 rounded-full ${
              !isDay ? 'bg-purple-600 text-white' : 'bg-white text-purple-600'
            } hover:scale-110 transition-transform shadow-lg`}>
            <Moon size={24} />
          </button>
        </div>
      )}

      {!showIntro && (
        <div className='absolute bottom-4 left-1/2 text-2xl -transform-x-1/2 flex flex-col gap-2 z-30 font-bold'>
          {currentStep === 'day-selected' && (
            <button
              onClick={handleTemperatureButtonClick}
              className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg animate-pulse'>
              온도
            </button>
          )}

          {currentStep === 'ready-for-pressure' && (
            <button
              onClick={handlePressureButtonClick}
              className='px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg animate-pulse'>
              기압
            </button>
          )}

          {currentStep === 'ready-for-wind' && (
            <button
              onClick={handleWindButtonClick}
              className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg animate-pulse flex items-center gap-2'>
              <Wind size={16} />
              바람의 방향
            </button>
          )}
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