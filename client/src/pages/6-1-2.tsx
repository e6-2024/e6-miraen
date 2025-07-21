import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, Sky, useProgress } from '@react-three/drei'
import Model from '../components/6-1-2/Model'
import ResultModel from '../components/6-1-2/ResultModel' // 새로운 결과 모델 컴포넌트
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import IntroMouseCameraController from '@/components/IntroMouseCameraController'

const VEHICLE_SPEEDS = {
  train: 200, // 기차
  car: 70, // 자동차
  horse: 60, // 말
  bicycle: 30, // 자전거
  runner: 20, // 달리는 사람
}

const VEHICLES = [
  { id: 'train', name: '기차', speed: VEHICLE_SPEEDS.train, meshName: 'cap1', audioPath: '/sounds/6-1-2/train.mp3' },
  { id: 'car', name: '자동차', speed: VEHICLE_SPEEDS.car, meshName: 'Wheel_A', audioPath: '/sounds/6-1-2/car.mp3' },
  { id: 'horse', name: '말', speed: VEHICLE_SPEEDS.horse, meshName: 'Horse_fur', audioPath: '/sounds/6-1-2/horse.mp3' },
  { id: 'bicycle', name: '자전거', speed: VEHICLE_SPEEDS.bicycle, meshName: 'Male_Head', audioPath: '/sounds/6-1-2/bicycle.mp3' },
  { id: 'runner', name: '달리는 사람', speed: VEHICLE_SPEEDS.runner, meshName: 'female_genericMesh2', audioPath: '/sounds/6-1-2/runner.mp3' },
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

 // 선택된 물체가 변경될 때 frozenCameraState를 초기화
 const prevSelectedVehicle = useRef(selectedVehicle)
 useEffect(() => {
   if (prevSelectedVehicle.current !== selectedVehicle) {
     frozenCameraState.current = null
     prevSelectedVehicle.current = selectedVehicle
   }
 }, [selectedVehicle])

 // 시점 모드가 변경될 때 frozenCameraState를 초기화
 const prevViewMode = useRef(viewMode)
 useEffect(() => {
   if (prevViewMode.current !== viewMode) {
     frozenCameraState.current = null
     prevViewMode.current = viewMode
   }
 }, [viewMode])

 // 결과 화면으로 전환될 때 카메라 위치 초기화
 useEffect(() => {
   if (showResult) {
     camera.position.set(20.78, 12.35, -42.22)
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
       camera.position.set(20.78, 12.35, -42.22)
       camera.lookAt(0, 0, 0)

       if (orbitControlsRef.current) {
         orbitControlsRef.current.target.set(0, 0, 0)
       }
       break

     case 'firstPerson':
       const vehiclePos = getVehiclePosition(selectedVehicle)

       let cameraOffset = { x: 0, y: 2, z: 0 }
       let lookAheadDistance = 10

       switch (selectedVehicle) {
         case 'train':
           cameraOffset = { x: 0.3, y: 1.4, z: -14 }
           lookAheadDistance = 15
           break
         case 'car':
           cameraOffset = { x: -1.2, y: 2.0, z: -7.2 }
           lookAheadDistance = 15
           break
         case 'horse':
           cameraOffset = { x: 0, y: 3.2, z: -6 }
           lookAheadDistance = 12
           break
         case 'bicycle':
           cameraOffset = { x: 0, y: 2, z: -5 }
           lookAheadDistance = 10
           break
         case 'runner':
           cameraOffset = { x: 0, y: 2, z: -2 }
           lookAheadDistance = 8
           break
       }

       const cameraPosition = new THREE.Vector3(
         vehiclePos.x + cameraOffset.x,
         vehiclePos.y + cameraOffset.y,
         vehiclePos.z + cameraOffset.z,
       )

       const lookAtTarget = new THREE.Vector3(
         vehiclePos.x,
         vehiclePos.y + cameraOffset.y - 0.5,
         vehiclePos.z + lookAheadDistance,
       )

       // 일시정지 상태에서 저장된 카메라 상태가 있고, 물체가 변경되지 않았다면 저장된 상태 사용
       if (!isAnimationPlaying && frozenCameraState.current) {
         camera.position.copy(frozenCameraState.current.position)
         camera.lookAt(frozenCameraState.current.lookAtTarget)
         if (orbitControlsRef.current) {
           orbitControlsRef.current.target.copy(frozenCameraState.current.lookAtTarget)
         }
       } else {
         // 애니메이션 재생 중이거나 저장된 상태가 없을 때 현재 위치 적용
         camera.position.copy(cameraPosition)
         camera.lookAt(lookAtTarget)

         if (orbitControlsRef.current) {
           orbitControlsRef.current.target.copy(lookAtTarget)
         }

         // 현재 카메라 상태를 저장 (일시정지를 위해)
         frozenCameraState.current = {
           position: cameraPosition.clone(),
           lookAtTarget: lookAtTarget.clone(),
         }
       }
       break

     case 'approaching':
       camera.position.set(-2.814, 1.8, 398.85)
       camera.lookAt(0, 1, 0)

       if (orbitControlsRef.current) {
         orbitControlsRef.current.target.set(0, 1, 0)
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

  // Intro 관련 상태
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  // 현재 재생 중인 오디오 참조
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  // narration 오디오 참조 (차량 오디오와 별도 관리)
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null)

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

  // 나레이션 오디오 재생 함수
  const playNarrationAudio = (audioPath: string) => {
    // 이전 나레이션이 재생 중이면 중지
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

      // 오디오가 끝나면 참조 해제
      audio.onended = () => {
        if (narrationAudioRef.current === audio) {
          narrationAudioRef.current = null
        }
      }
    } catch (error) {
      console.log('나레이션 오디오 생성 실패:', error)
    }
  }
  const playVehicleAudio = (vehicleId: string) => {
    // 이전 오디오가 재생 중이면 중지
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }

    const vehicle = VEHICLES.find(v => v.id === vehicleId)
    if (vehicle && vehicle.audioPath) {
      try {
        const audio = new Audio(vehicle.audioPath)
        audio.volume = 0.8
        currentAudioRef.current = audio
        
        audio.play().catch((error) => {
          console.log(`${vehicle.name} 오디오 재생 실패:`, error.name)
        })

        // 오디오가 끝나면 참조 해제
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
      // 메인 화면 진입 시 narrationA 재생
      setTimeout(() => {
        playNarrationAudio('/sounds/6-1-2/narration/6-1-2-A.mp3')
      }, 500) // 화면 전환 후 약간의 딜레이
    }, 300)
  }

  const handleToggleAnimation = () => {
    if (!isAnimationPlaying) {
      // 애니메이션 시작 (처음 또는 완료 후)
      setIsAnimationPlaying(true)
      setIsAnimationPaused(false)
    } else {
      // 재생/일시정지 토글
      setIsAnimationPaused(!isAnimationPaused)
      
      // 일시정지할 때 오디오 중지, 재생할 때 1인칭 시점이면 오디오 재생
      if (!isAnimationPaused) {
        // 일시정지하는 경우
        if (currentAudioRef.current) {
          currentAudioRef.current.pause()
          currentAudioRef.current.currentTime = 0
          currentAudioRef.current = null
        }
      } else {
        // 재생하는 경우 - 1인칭 시점이면 오디오 재생
        if (viewMode === 'firstPerson') {
          playVehicleAudio(selectedVehicle)
        }
      }
    }
  }

  const handleResetAnimation = () => {
    // 현재 재생 중인 차량 오디오 중지
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }

    // 나레이션 오디오도 중지
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause()
      narrationAudioRef.current.currentTime = 0
      narrationAudioRef.current = null
    }

    setIsAnimationPlaying(false)
    setIsAnimationPaused(false)
    setAnimationCompleted(false)
    setShowResult(false)
    setViewMode('start')
    setResetTrigger(true)

    // 리셋 트리거를 잠시 후 다시 false로 변경
    setTimeout(() => setResetTrigger(false), 100)
  }

  const handleAnimationComplete = () => {
    // 애니메이션 완료 시 오디오 중지
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
    // 현재 재생 중인 차량 오디오 중지
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }

    setShowResult(true)
    setViewMode('start')
    
    // 결과 화면 진입 시 narrationB 재생
    setTimeout(() => {
      playNarrationAudio('/sounds/6-1-2/narration/6-1-2-B.mp3')
    }, 500) // 화면 전환 후 약간의 딜레이
  }

  const handleBackToAnimation = () => {
    setShowResult(false)
    setViewMode('start') // 원래 화면으로 돌아갈 때는 시작 시점으로
  }

  const handleViewChange = (mode: 'start' | 'firstPerson' | 'approaching' | 'free') => {
    // 1인칭 시점이 아닌 다른 시점으로 변경할 때 오디오 중지
    if (mode !== 'firstPerson' && currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }

    setViewMode(mode)

    // 1인칭 시점으로 변경할 때 애니메이션이 진행 중이면 현재 선택된 차량의 오디오 재생
    if (mode === 'firstPerson' && isAnimationPlaying && !isAnimationPaused) {
      playVehicleAudio(selectedVehicle)
    }
  }

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId)
    
    // 1인칭 시점이고 애니메이션이 진행 중일 때만 오디오 재생
    if (viewMode === 'firstPerson' && isAnimationPlaying && !isAnimationPaused) {
      playVehicleAudio(vehicleId)
    }
  }

  // 컴포넌트 언마운트 시 오디오 정리
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
  ]

  return (
    <div className='w-screen h-screen bg-white relative'>
      {/* Intro가 보일 때는 UI 숨김 */}
      {!showIntro && (
        <>
          {/* 결과 화면일 때 */}
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
              {/* 메인 애니메이션 제어 - 하단 중앙 */}
              <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-4'>
                {/* 애니메이션이 완료되지 않았을 때만 재생/일시정지 버튼 표시 */}
                {!animationCompleted && (
                  <button
                    onClick={handleToggleAnimation}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                      isAnimationPlaying && !isAnimationPaused
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
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

              {/* 시점 변경 버튼들 - 좌상단 */}
              {(isAnimationPlaying || animationCompleted) && (
                <div className='absolute top-6 left-6 z-10 bg-white/90 p-4 rounded-xl shadow-lg'>
                  <h3 className='text-sm font-bold text-gray-700 mb-3'>관찰 시점을 고르세요</h3>
                  <div className='space-y-2'>
                    {viewButtons.map((button, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleViewChange(button.mode)}
                        className={`block font-bold w-full px-4 py-2 rounded-lg font-medium transition-all text-m ${
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

              {/* 1인칭 시점일 때 물체 선택 - 우상단 */}
              {viewMode === 'firstPerson' && (
                <div className='absolute top-6 right-6 z-10 bg-white/90 p-4 rounded-xl shadow-lg'>
                  <h4 className='text-sm font-bold text-gray-700 mb-3'>🚗 관찰할 물체</h4>
                  <div className='grid grid-cols-1 gap-2 min-w-[160px]'>
                    {VEHICLES.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => handleVehicleSelect(vehicle.id)}
                        className={`px-3 py-2 text-sm rounded-lg font-medium transition-all text-left ${
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

      <Scene camera={{ position: [20.78, 12.35, -42.22], fov: 50, far: 1000 }} shadows='soft'>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        <IntroMouseCameraController enabled={showIntro} />

        <ambientLight intensity={0.2} />

        <directionalLight
          position={[50, 40, 50]}
          intensity={10}
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-far={200}
          shadow-camera-left={-200}
          shadow-camera-right={200}
          shadow-camera-top={200}
          shadow-camera-bottom={-200}
          shadow-bias={-0.001}
        />

        <group ref={sceneRef}>
          {showResult ? (
            <ResultModel scale={1} position={[0, 0, 20]} castShadow={true} receiveShadow={true} />
          ) : (
            <Model
              scale={1}
              position={[0, 0, 0]}
              animationSpeed={isAnimationPlaying && !isAnimationPaused ? 0.7 : 0}
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
          distance={450000}
          sunPosition={[-10, 0.9, -10]}
          inclination={0.49}
          azimuth={0.25}
          rayleigh={1.2}
          turbidity={1}
          mieCoefficient={0.008}
          mieDirectionalG={0.85}
        />
        <Environment preset={'apartment'} />

        <OrbitControls />
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