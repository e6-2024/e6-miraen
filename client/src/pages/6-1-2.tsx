import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, Sky, useProgress } from '@react-three/drei'
import Model from '../components/6-1-2/Model'
import ResultModel from '../components/6-1-2/ResultModel'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import IntroMouseCameraController from '@/components/intro/IntroMouseCameraController'
import { ContactShadows, AccumulativeShadows, RandomizedLight } from '@react-three/drei'

const VEHICLE_SPEEDS = {
  train: 200,
  car: 70,
  horse: 60,
  bicycle: 30,
  runner: 20,
}

const VEHICLES = [
  { id: 'train', name: '기차', speed: VEHICLE_SPEEDS.train, meshName: 'cap1', audioPath: '/sounds/6-1-2/train.mp3' },
  { id: 'car', name: '자동차', speed: VEHICLE_SPEEDS.car, meshName: 'Wheel_A', audioPath: '/sounds/6-1-2/car.mp3' },
  { id: 'horse', name: '말', speed: VEHICLE_SPEEDS.horse, meshName: 'Horse_fur', audioPath: '/sounds/6-1-2/horse.mp3' },
  {
    id: 'bicycle',
    name: '자전거',
    speed: VEHICLE_SPEEDS.bicycle,
    meshName: 'Male_Head',
    audioPath: '/sounds/6-1-2/bicycle.mp3',
  },
  {
    id: 'runner',
    name: '달리는 사람',
    speed: VEHICLE_SPEEDS.runner,
    meshName: 'female_genericMesh2',
    audioPath: '/sounds/6-1-2/runner.mp3',
  },
]

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

function NarrationSubtitle({ visible, text }: { visible: boolean; text: string }) {
  if (!visible) return null

  return (
    <div className='fixed bottom-[120px] left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white px-6 py-4 rounded-xl shadow-2xl z-[2000] text-base font-bold max-w-[80vw] text-center backdrop-blur-sm border border-white border-opacity-10 animate-in slide-in-from-bottom-5 fade-in duration-400'>
      {text}
    </div>
  )
}

function CameraController({
  viewMode,
  selectedVehicle,
  isAnimationPlaying,
  sceneRef,
  showIntro,
  showResult,
}: {
  viewMode: 'start' | 'firstPerson' | 'approaching' | 'free'
  selectedVehicle: string
  isAnimationPlaying: boolean
  sceneRef: React.RefObject<THREE.Group>
  showIntro: boolean
  showResult: boolean
}) {
  const { camera } = useThree()
  const orbitControlsRef = useRef<any>()
  const timeRef = useRef(0)
  const frozenCameraState = useRef<{
    position: THREE.Vector3
    lookAtTarget: THREE.Vector3
  } | null>(null)

  const prevSelectedVehicle = useRef(selectedVehicle)
  useEffect(() => {
    if (prevSelectedVehicle.current !== selectedVehicle) {
      frozenCameraState.current = null
      prevSelectedVehicle.current = selectedVehicle
    }
  }, [selectedVehicle])

  const prevViewMode = useRef(viewMode)
  useEffect(() => {
    if (prevViewMode.current !== viewMode) {
      frozenCameraState.current = null
      prevViewMode.current = viewMode
    }
  }, [viewMode])

  useEffect(() => {
    if (showResult) {
      camera.position.set(2.078, 1.235, -4.222)
      camera.lookAt(0, 0, 0)

      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.set(0, 0, 0)
        orbitControlsRef.current.update()
      }
    }
  }, [showResult, camera])

  const getVehiclePosition = (vehicleId: string) => {
    if (!sceneRef.current) return new THREE.Vector3(0, 0, 0)

    const vehicle = VEHICLES.find((v) => v.id === vehicleId)
    if (!vehicle) return new THREE.Vector3(0, 0, 0)

    let vehicleObject: THREE.Object3D | null = null
    sceneRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === vehicle.meshName) {
        vehicleObject = child
      }
    })

    if (vehicleObject) {
      const position = new THREE.Vector3()
      vehicleObject.getWorldPosition(position)
      return position
    }
    return new THREE.Vector3(0, 0, 0)
  }

  useFrame((state, delta) => {
    if (showIntro || showResult) return

    timeRef.current += delta

    switch (viewMode) {
      case 'start':
        camera.position.set(2.078, 1.235, -4.222)
        camera.lookAt(0, 0, 0)

        if (orbitControlsRef.current) {
          orbitControlsRef.current.target.set(0, 0, 0)
        }
        break

      case 'firstPerson':
        const vehiclePos = getVehiclePosition(selectedVehicle)

        let cameraOffset = { x: 0, y: 0.2, z: 0 }
        let lookAheadDistance = 1.0

        switch (selectedVehicle) {
          case 'train':
            cameraOffset = { x: 0.03, y: 0.14, z: -1.4 }
            lookAheadDistance = 1.5
            break
          case 'car':
            cameraOffset = { x: -0.12, y: 0.2, z: -0.72 }
            lookAheadDistance = 1.5
            break
          case 'horse':
            cameraOffset = { x: 0, y: 0.32, z: -0.6 }
            lookAheadDistance = 1.2
            break
          case 'bicycle':
            cameraOffset = { x: 0, y: 0.2, z: -0.5 }
            lookAheadDistance = 1.0
            break
          case 'runner':
            cameraOffset = { x: 0, y: 0.2, z: -0.2 }
            lookAheadDistance = 0.8
            break
        }

        const cameraPosition = new THREE.Vector3(
          vehiclePos.x + cameraOffset.x,
          vehiclePos.y + cameraOffset.y,
          vehiclePos.z + cameraOffset.z,
        )

        const lookAtTarget = new THREE.Vector3(
          vehiclePos.x,
          vehiclePos.y + cameraOffset.y - 0.05,
          vehiclePos.z + lookAheadDistance,
        )

        if (!isAnimationPlaying && frozenCameraState.current) {
          camera.position.copy(frozenCameraState.current.position)
          camera.lookAt(frozenCameraState.current.lookAtTarget)
          if (orbitControlsRef.current) {
            orbitControlsRef.current.target.copy(frozenCameraState.current.lookAtTarget)
          }
        } else {
          camera.position.copy(cameraPosition)
          camera.lookAt(lookAtTarget)

          if (orbitControlsRef.current) {
            orbitControlsRef.current.target.copy(lookAtTarget)
          }

          frozenCameraState.current = {
            position: cameraPosition.clone(),
            lookAtTarget: lookAtTarget.clone(),
          }
        }
        break

      case 'approaching':
        camera.position.set(-0.2814, 0.18, 39.885)
        camera.lookAt(0, 0.1, 0)

        if (orbitControlsRef.current) {
          orbitControlsRef.current.target.set(0, 0.1, 0)
        }
        break

      case 'free':
        break
    }
  })

  return (
    <OrbitControls
      ref={orbitControlsRef}
      enabled={(viewMode === 'free' && !showIntro) || (!isAnimationPlaying && viewMode !== 'firstPerson') || showResult}
      enablePan={
        (viewMode === 'free' && !showIntro) || (!isAnimationPlaying && viewMode !== 'firstPerson') || showResult
      }
      enableZoom={
        (viewMode === 'free' && !showIntro) || (!isAnimationPlaying && viewMode !== 'firstPerson') || showResult
      }
      enableRotate={
        (viewMode === 'free' && !showIntro) || (!isAnimationPlaying && viewMode !== 'firstPerson') || showResult
      }
      minDistance={0}
      maxDistance={7}
      minPolarAngle={0}
      maxPolarAngle={Math.PI/2}
    />
  )
}

export default function Home() {
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false)
  const [isAnimationPaused, setIsAnimationPaused] = useState(false)
  const [animationCompleted, setAnimationCompleted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [resetTrigger, setResetTrigger] = useState(false)
  const [viewMode, setViewMode] = useState<'start' | 'firstPerson' | 'approaching' | 'free'>('start')
  const [selectedVehicle, setSelectedVehicle] = useState('train')
  const sceneRef = useRef<THREE.Group>(null)

  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null)

  const [showNarrationSubtitle, setShowNarrationSubtitle] = useState(false)
  const [narrationText, setNarrationText] = useState('')

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

  const playNarrationAudio = (audioPath: string, subtitleText: string, autoHideDelay?: number) => {
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause()
      narrationAudioRef.current.currentTime = 0
    }

    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.8
      narrationAudioRef.current = audio

      audio.play().catch((error) => {
        console.log('나레이션 오디오 재생 실패:', error.name)
      })

      setNarrationText(subtitleText)
      setShowNarrationSubtitle(true)

      if (autoHideDelay) {
        setTimeout(() => {
          setShowNarrationSubtitle(false)
          setNarrationText('')
        }, autoHideDelay)
      }

      audio.onended = () => {
        if (narrationAudioRef.current === audio) {
          narrationAudioRef.current = null
        }
        if (!autoHideDelay) {
          setShowNarrationSubtitle(false)
          setNarrationText('')
        }
      }
    } catch (error) {
      console.log('나레이션 오디오 생성 실패:', error)
    }
  }

  const playVehicleAudio = (vehicleId: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }

    const vehicle = VEHICLES.find((v) => v.id === vehicleId)
    if (vehicle && vehicle.audioPath) {
      try {
        const audio = new Audio(vehicle.audioPath)
        audio.volume = 0.8
        currentAudioRef.current = audio

        audio.play().catch((error) => {
          console.log(`${vehicle.name} 오디오 재생 실패:`, error.name)
        })

        audio.onended = () => {
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null
          }
        }
      } catch (error) {
        console.log(`${vehicle?.name} 오디오 생성 실패:`, error)
      }
    }
  }

  const handleEnterExperience = () => {
    playClickSound()
    setTimeout(() => {
      setShowIntro(false)
      setTimeout(() => {
        playNarrationAudio(
          '/sounds/6-1-2/narration/6-1-2-A.MP3',
          '운동 시작하기 버튼을 눌러 물체를 움직여 보세요.',
          5000,
        )
      }, 500)
    }, 300)
  }

  const handleToggleAnimation = () => {
    if (!isAnimationPlaying) {
      setIsAnimationPlaying(true)
      setIsAnimationPaused(false)
    } else {
      setIsAnimationPaused(!isAnimationPaused)

      if (!isAnimationPaused) {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause()
          currentAudioRef.current.currentTime = 0
          currentAudioRef.current = null
        }
      } else {
        if (viewMode === 'firstPerson') {
          playVehicleAudio(selectedVehicle)
        }
      }
    }
  }

  const handleResetAnimation = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }

    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause()
      narrationAudioRef.current.currentTime = 0
      narrationAudioRef.current = null
    }

    setShowNarrationSubtitle(false)
    setNarrationText('')

    setIsAnimationPlaying(false)
    setIsAnimationPaused(false)
    setAnimationCompleted(false)
    setShowResult(false)
    setViewMode('start')
    setResetTrigger(true)

    setTimeout(() => setResetTrigger(false), 100)
  }

  const handleAnimationComplete = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }

    setAnimationCompleted(true)
    setIsAnimationPlaying(false)
    setIsAnimationPaused(false)
  }

  const handleShowResult = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }

    setShowResult(true)
    setViewMode('start')

    setTimeout(() => {
      playNarrationAudio(
        '/sounds/6-1-2/narration/6-1-2-C.MP3',
        '기차의 속력은 28 m/s, 자동차의 속력은 23 m/s, 자전거를 타는 사람의 속력은 15 m/s, 달리는 사람의 속력은 14 m/s, 말의 속력은 17 m/s이므로 기차, 자동차, 말, 자전거를 탄 사람, 달리는 사람 순으로 빠릅니다.',
      )
    }, 500)
  }

  const handleBackToAnimation = () => {
    setShowResult(false)
    setViewMode('start')
    setShowNarrationSubtitle(false)
    setNarrationText('')
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause()
      narrationAudioRef.current.currentTime = 0
    }
  }

  const handleViewChange = (mode: 'start' | 'firstPerson' | 'approaching' | 'free') => {
    if (mode !== 'firstPerson' && currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }

    setViewMode(mode)

    if (mode === 'firstPerson' && isAnimationPlaying && !isAnimationPaused) {
      playVehicleAudio(selectedVehicle)
    }
  }

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId)

    if (viewMode === 'firstPerson' && isAnimationPlaying && !isAnimationPaused) {
      playVehicleAudio(vehicleId)
    }
  }

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause()
        narrationAudioRef.current = null
      }
    }
  }, [])

  const viewButtons: Array<{
    name: string
    mode: 'start' | 'firstPerson' | 'approaching' | 'free'
  }> = [
    {
      name: '시작점에서 관찰하기',
      mode: 'start' as const,
    },
    {
      name: '1인칭 시점으로 관찰하기',
      mode: 'firstPerson' as const,
    },
    {
      name: '자유롭게 관찰하기',
      mode: 'free' as const,
    },
  ]

  return (
    <div className='w-screen h-screen bg-white relative'>
      <NarrationSubtitle visible={showNarrationSubtitle} text={narrationText} />

      {!showIntro && (
        <>
          {showResult ? (
            <div className='absolute top-3 right-3 z-10'>
              <button
                onClick={handleBackToAnimation}
                className='w-full px-6 py-3 rounded-lg font-bold bg-gray-500 hover:bg-gray-600 text-white transition-all'>
                다시 돌아가기
              </button>
            </div>
          ) : (
            <>
              <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-4'>
                {!animationCompleted && (
                  <button
                    onClick={handleToggleAnimation}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                      isAnimationPlaying && !isAnimationPaused
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-green-500 hover:bg-blue-600 text-white'
                    }`}>
                    {isAnimationPlaying && !isAnimationPaused
                      ? '일시정지'
                      : isAnimationPaused
                      ? '재생하기'
                      : '운동 시작하기'}
                  </button>
                )}

                {(isAnimationPlaying || isAnimationPaused || animationCompleted) && (
                  <button
                    onClick={handleResetAnimation}
                    className='px-6 py-4 rounded-xl font-bold bg-gray-500 hover:bg-gray-600 text-white transition-all shadow-lg'>
                    처음으로
                  </button>
                )}

                {animationCompleted && (
                  <button
                    onClick={handleShowResult}
                    className='px-8 py-4 rounded-xl font-bold bg-purple-500 hover:bg-purple-600 text-white transition-all shadow-lg'>
                    빠르기 비교하기
                  </button>
                )}
              </div>

              {(isAnimationPlaying || animationCompleted) && (
                <div className='absolute top-6 left-6 z-10 bg-white/90 p-4 rounded-xl shadow-lg'>
                  <h3 className='text-sm font-bold text-gray-700 mb-3'>관찰 시점을 고르세요</h3>
                  <div className='space-y-2'>
                    {viewButtons.map((button, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleViewChange(button.mode)}
                        className={`block font-bold w-full px-4 py-2 rounded-lg font-light transition-all text-m ${
                          viewMode === button.mode
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        }`}>
                        {button.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === 'firstPerson' && (
                <div className='absolute top-6 right-6 z-10 bg-white/90 p-4 rounded-xl shadow-lg'>
                  <h4 className='text-sm font-bold text-gray-700 mb-3'>🚗 관찰하기</h4>
                  <div className='grid grid-cols-1 gap-2 min-w-[160px]'>
                    {VEHICLES.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => handleVehicleSelect(vehicle.id)}
                        className={`px-3 py-2 text-sm rounded-lg font-light transition-all text-left ${
                          selectedVehicle === vehicle.id
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}>
                        <div className='font-bold'>{vehicle.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <Scene camera={{ position: [2.078, 1.235, -4.222], fov: 50, far: 500 }} shadows='soft'>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        <IntroMouseCameraController enabled={showIntro} />
        <directionalLight
          position={[5, 20, 5]}
          intensity={1.2}
          castShadow
          color='#FFF8DC'
          shadow-mapSize-width={4096} // 해상도 대폭 증가
          shadow-mapSize-height={4096}
          shadow-camera-far={100}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
          shadow-bias={-0.001}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[-20, 30, 20]} intensity={0.8} color='#E6F3FF' />
        <mesh position={[0, -0.285, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[130, 130]} />
          <shadowMaterial transparent opacity={0.3} />
        </mesh>

        <group ref={sceneRef}>
          {showResult ? (
            <ResultModel scale={0.1} position={[0, 0, 2]} castShadow={true} receiveShadow={true} />
          ) : (
            <Model
              scale={0.1}
              position={[0, 0, 0]}
              animationSpeed={isAnimationPlaying && !isAnimationPaused ? 1.0 : 0}
              onAnimationComplete={handleAnimationComplete}
              resetTrigger={resetTrigger}
              castShadow={true}
              receiveShadow={true}
            />
          )}
        </group>
        <CameraController
          viewMode={viewMode}
          selectedVehicle={selectedVehicle}
          isAnimationPlaying={isAnimationPlaying && !isAnimationPaused}
          sceneRef={sceneRef}
          showIntro={showIntro}
          showResult={showResult}
        />
        <Sky
          distance={45000}
          sunPosition={[-1, 0.09, -1]}
          inclination={0.49}
          azimuth={0.25}
          rayleigh={1.2}
          turbidity={1}
          mieCoefficient={0.008}
          mieDirectionalG={0.85}
        />
        <Environment preset={'apartment'} />
      </Scene>

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='같은 시간 동안 이동한 물체의 빠르기 비교하기'
          description={['같은 시간 동안 이동한 물체의 빠르기를 비교해 봅시다.']}
          backgroundSvg='/img/cover/6-1-2.svg'
          descriptionSound='/sounds/6-1-2/narration/6-1-2-Goal.MP3'
        />
      )}
    </div>
  )
}
