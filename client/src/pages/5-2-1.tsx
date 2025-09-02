import { useState, useRef, useEffect } from 'react'
import { Physics } from '@react-three/cannon'
import { useProgress, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import Scene from '@/components/canvas/Scene'
import SieveSimulation from '@/scenes/SieveSimulation'
import Intro from '@/components/intro/Intro'
import { Environment, OrbitControls } from '@react-three/drei'

function SievePreview({ level }: { level: number }) {
  const { scene } = useGLTF('/models/5-2-1/Strainers.gltf')
  const mesh = scene.children[level]?.clone()

  return (
    <div className='w-42 h-42 mb-4'>
      <Scene camera={{ position: [0, 2, 4], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 2, 2]} intensity={0.6} />
        <Environment preset='warehouse' backgroundIntensity={0.1} />
        {mesh && (
          <primitive
            object={mesh}
            position={[0, -0.5, -0.5]}
            scale={0.125}
            rotation={[-1, 3.1, 0]}
            bn={[0.4, 0.1, 0]}
          />
        )}
        <OrbitControls enablePan={false} enableZoom={false} />
      </Scene>
    </div>
  )
}

function ParticlePreview({ radius, color }: { radius: number; color: string }) {
  return (
    <div className='w-20 h-20 mx-auto mb-2'>
      <Scene camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 2, 2]} intensity={0.6} />
        <Environment preset='warehouse' backgroundIntensity={0.1} />
        <mesh castShadow>
          <sphereGeometry args={[radius, 16, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={4} />
      </Scene>
    </div>
  )
}

function SieveSelectionPage({ onSelectSieve }: { onSelectSieve: (selectedLevel: number) => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedSieve, setSelectedSieve] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const playNarration = () => {
      try {
        const audio = new Audio('/sounds/5-2-1/5-2-1-intro.MP3')
        audio.volume = 0.5
        audio.play().catch((error) => {
          console.log('나레이션 재생 실패:', error.name)
        })
      } catch (error) {
        console.log('나레이션 생성 실패:', error)
      }
    }

    playNarration()
  }, [])

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

  const handleSieveSelect = (level: number) => {
    setSelectedSieve(level)
  }

  const handleStartExperiment = () => {
    if (selectedSieve !== null) {
      playClickSound()
      setIsVisible(false)
      setTimeout(() => onSelectSieve(selectedSieve), 300)
    }
  }

  const sieveTypes = [
    {
      level: 0,
      title: '눈의 크기가 큰 구슬보다 큰 체',
      color: 'from-red-200 to-red-400',
    },
    {
      level: 2,
      title: '눈의 크기가 큰 구슬보다 작고 작은 구슬보다 큰 체',
      color: 'from-green-200 to-green-400',
    },
    {
      level: 1,
      title: '눈의 크기가 작은 구슬보다 작은 체',
      color: 'from-blue-200 to-blue-400',
    },
  ]

  return (
    <div className='fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50'>
      <div
        className={`bg-white rounded-2xl p-8 max-w-7xl mx-4 transform transition-all duration-500 shadow-2xl ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>
        <div className='text-center w-[600px] mb-4 left-1/2 relative -translate-x-1/2'>
          <h1 className='text-2xl font-bold text-black mb-2'>
            구슬과 체의 눈 크기를 비교한 뒤,눈의 크기가 알맞은 체를 골라 구슬 혼합물을 분리해 보세요.
          </h1>
        </div>

        <div className='mb-4 p-6 bg-gray-50 rounded-xl'>
          <div className='flex justify-center items-center space-x-12'>
            <div className='text-center font-light'>
              <ParticlePreview radius={0.5} color='orange' />
              <p className='text-sm font-medium text-gray-700'>큰 구슬</p>
            </div>
            <div className='text-4xl text-gray-400'>+</div>
            <div className='text-center font-light'>
              <ParticlePreview radius={0.3} color='limegreen' />
              <p className='text-sm font-medium text-gray-700'>작은 구슬</p>
            </div>
          </div>
        </div>

        <div className='flex gap-3 mb-4'>
          {sieveTypes.map((sieve) => (
            <div
              key={sieve.level}
              className={`cursor-pointer transform transition-all duration-300 ${
                selectedSieve === sieve.level ? 'ring-4 ring-blue-500 shadow-xl' : 'hover:shadow-lg'
              }`}
              onClick={() => handleSieveSelect(sieve.level)}>
              <div className={`bg-gradient-to-br ${sieve.color} rounded-xl p-6 h-full`}>
                <div className='text-center mb-4'>
                  <h3 className='font-bold text-gray-800 mb-4'>{sieve.title}</h3>
                  <div className='bg-white rounded-lg p-4 mb-4 shadow-inner'>
                    <SievePreview level={sieve.level} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className='text-center'>
          <button
            onClick={handleStartExperiment}
            disabled={selectedSieve === null}
            className={`px-8 py-3 my-2 font-bold rounded-lg shadow-lg transition-all duration-300 ${
              selectedSieve !== null
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}>
            {selectedSieve !== null ? '선택한 체로 실험하기' : '체를 선택해주세요'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SummaryPopup({ onClose }: { onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const playNarration = () => {
      try {
        const audio = new Audio('/sounds/5-2-1/5-2-1-D.MP3')
        audio.volume = 0.5
        audio.play().catch((error) => {
          console.log('나레이션 재생 실패:', error.name)
        })
      } catch (error) {
        console.log('나레이션 생성 실패:', error)
      }
    }

    playNarration()
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div
        className={`bg-white rounded-lg p-8 max-w-md mx-4 transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>
        <h2 className='text-xl font-bold mb-4 text-center text-gray-800'>실험 정리</h2>

        <div className='space-y-4 text-gray-700'>
          <div className='flex items-start space-x-2'>
            <span className='text-blue-600 font-bold'>•</span>
            <p className='text-s font-bold'>
              알갱이의 크기가 다른 고체 혼합물은 알갱이의 크기 차이를 이용해 체로 분리할 수 있습니다.
            </p>
          </div>

          <div className='flex items-start space-x-2'>
            <span className='text-blue-600 font-bold'>•</span>
            <p className='text-s font-bold'>
              체를 사용할 때에는 알갱이의 크기와 체의 눈 크기를 비교해 알맞은 것을 골라야 합니다.
            </p>
          </div>
        </div>

        <div className='mt-6 flex justify-center'>
          <button
            onClick={handleClose}
            className='px-6 py-2 bg-blue-600 text-white font-light rounded hover:bg-blue-700 transition-colors'>
            확인
          </button>
        </div>
      </div>
    </div>
  )
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

function ShadowLighting() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
    </>
  )
}

export default function Home() {
  const [triggerSpawn, setTriggerSpawn] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState(0)
  const [gravity, setGravity] = useState<[number, number, number]>([0, -9.81, 0])
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showSieveSelection, setShowSieveSelection] = useState(false)
  const [physicsKey, setPhysicsKey] = useState(0)
  const [showSummaryButton, setShowSummaryButton] = useState(false)
  const [showSummaryPopup, setShowSummaryPopup] = useState(false)

  const handleSpawn = () => {
    setTriggerSpawn(true)

    if (selectedLevel === 0) {
      setTimeout(() => {
        playBallSound()
      }, 1000)
      setTimeout(() => {
        playNarration2()
      }, 5000)
    }

    if (selectedLevel === 1) {
      setTimeout(() => {
        playBallSound()
      }, 1000)
      setTimeout(() => {
        playNarration2()
        playBallSound()
      }, 5000)
    }
    if (selectedLevel === 2) {
      setTimeout(() => {
        playBallSound()
      }, 1000)
    }
  }

  const handleSpawnHandled = () => {
    setTriggerSpawn(false)
  }

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

  const playGeneralButton = (audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const playNarration1 = (audioPath: string = '/sounds/5-2-1/5-2-1-A.MP3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const playNarration2 = (audioPath: string = '/sounds/5-2-1/5-2-1-B.MP3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const playNarration3 = (audioPath: string = '/sounds/5-2-1/5-2-1-C.MP3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const playBallSound = (audioPath: string = '/sounds/5-2-1/5-2-1-2_ball-drop-and-sniff-85127.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
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
      playNarration1()
      setShowSieveSelection(true)
    }, 300)
  }

  const handleSelectSieve = (selectedLevel: number) => {
    setSelectedLevel(selectedLevel)
    setShowSieveSelection(false)
  }

  const handleReset = () => {
    setGravity([0, -9.81, 0])
    setPhysicsKey((prev) => prev + 1)
    setShowSummaryButton(false)
  }

  const handleLevelChange = (level: number) => {
    console.log(`Changing level to ${level} and resetting physics`)
    setSelectedLevel(level)
    setPhysicsKey((prev) => prev + 1)
    setShowSummaryButton(false)
  }

  const handleSeparationComplete = () => {
    if (selectedLevel === 2) {
      setShowSummaryButton(true)
      playNarration3()
    }
  }

  const handleSummaryClick = () => {
    playClickSound()
    setShowSummaryPopup(true)
  }

  const handleCloseSummaryPopup = () => {
    setShowSummaryPopup(false)
  }

  return (
    <div className='w-screen h-screen relative'>
      <div className={`absolute inset-0 ${showSieveSelection ? 'invisible' : 'visible'}`}>
        <Scene
          shadows
          camera={{ position: [0, 10, 10], fov: 50 }}
          gl={{
            shadowMap: {
              enabled: true,
              type: THREE.PCFSoftShadowMap,
            },
          }}>
          <LoadingTracker onLoadingComplete={handleLoadingComplete} />
          <ShadowLighting />

          <Physics
            key={physicsKey}
            gravity={gravity}
            allowSleep={true}
            iterations={15}
            defaultContactMaterial={{
              friction: 0.3,
              restitution: 0.2,
            }}
            tolerance={0.001}>
            <SieveSimulation
              triggerSpawn={triggerSpawn}
              onSpawnHandled={handleSpawnHandled}
              selectedLevel={selectedLevel}
              setGravity={setGravity}
              onSeparationComplete={handleSeparationComplete}
            />
          </Physics>

          <Environment preset='warehouse' backgroundIntensity={0.1} />
          <OrbitControls minDistance={1} maxDistance={15} />
        </Scene>
      </div>

      {!showIntro && !showSieveSelection && (
        <>
          <div className='absolute top-5 right-5 flex flex-col gap-2 z-10'>
            <div className='flex gap-2 font-light'>
              {[0, 2, 1].map((level) => (
                <button
                  key={level}
                  className={`px-4 py-2 border-2 border-black text-white transition-colors ${
                    selectedLevel === level
                      ? 'bg-white text-black hover:bg-black hover:text-white'
                      : 'bg-white text-black hover:bg-black hover:text-white'
                  }`}
                  onClick={() => {
                    handleLevelChange(level)
                    playGeneralButton()
                  }}>
                  {level === 0
                    ? '눈의 크기가 큰 구슬보다 큰 체'
                    : level === 1
                    ? '눈의 크기가 작은 구슬보다 작은 체'
                    : '눈의 크기가 큰 구슬보다 작고 작은 구슬보다 큰 체'}
                </button>
              ))}
            </div>
          </div>

          <div className='flex absolute bottom-5 right-5 z-10 gap-2 font-light'>
            <button
              className='px-4 py-2 bg-white border-2 border-black text-black hover:bg-black hover:text-white'
              onClick={() => {
                handleSpawn()
                playGeneralButton()
              }}>
              구슬 혼합물 넣기
            </button>

            {showSummaryButton && (
              <button
                className='px-4 py-2 bg-green-600 border-2 border-green-600 text-white hover:bg-green-700 hover:border-green-700 transition-colors'
                onClick={handleSummaryClick}>
                정리하기
              </button>
            )}

            <button
              className='px-4 py-2 bg-white text-black hover:bg-black hover:text-white border-2 border-black'
              onClick={() => {
                handleReset()
                playGeneralButton()
              }}>
              다시하기
            </button>
          </div>
        </>
      )}

      {showIntro && (
        <div className='absolute inset-0 z-30'>
          <Intro
            onEnter={handleEnterExperience}
            title='크기가 다른 구슬 혼합물 분리하기'
            description={[
              '알갱이의 크기가 다른 고체 혼합물은 어떻게 분리할 수 있는지 알아봅시다.',
            ]}
            backgroundSvg='/img/cover/5-2-1.svg'
            descriptionSound='/sounds/5-2-1/5-2-1-Goal.MP3'
          />
        </div>
      )}

      {showSieveSelection && <SieveSelectionPage onSelectSieve={handleSelectSieve} />}

      {showSummaryPopup && <SummaryPopup onClose={handleCloseSummaryPopup} />}
    </div>
  )
}