import { useState, useRef, useEffect, useCallback } from 'react'
import { Physics } from '@react-three/cannon'
import { useProgress, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import Scene from '@/components/canvas/Scene'
import SieveSimulation from '@/scenes/SieveSimulation'
import Intro from '@/components/intro/Intro'
import { Environment, OrbitControls } from '@react-three/drei'
import { playSound } from '@/utils/5-2-1/audioManger'
import { BACKGROUND_MUSIC, NARRATIONS, SOUND_EFFECTS, VOLUMES } from '@/utils/5-2-1/narratonConfig'
import { SIEVE_CONFIG, PHYSICS_CONFIG } from '@/utils/5-2-1/sieveConfig'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'

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
    playSound(NARRATIONS.INTRO, VOLUMES.NARRATION)
  }, [])

  const handleSieveSelect = (level: number) => {
    setSelectedSieve(level)
  }

  const handleStartExperiment = () => {
    if (selectedSieve !== null) {
      playSound(SOUND_EFFECTS.CLICK, VOLUMES.SOUND_EFFECT)
      setIsVisible(false)
      setTimeout(() => onSelectSieve(selectedSieve), 300)
    }
  }

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
          {SIEVE_CONFIG.LEVELS.map((sieve) => (
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
    playSound(NARRATIONS.SUMMARY, VOLUMES.NARRATION)
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
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [triggerSpawn, setTriggerSpawn] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState(0)
  const [gravity, setGravity] = useState<[number, number, number]>(PHYSICS_CONFIG.gravity)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showSieveSelection, setShowSieveSelection] = useState(false)
  const [physicsKey, setPhysicsKey] = useState(0)
  const [showSummaryButton, setShowSummaryButton] = useState(false)
  const [showSummaryPopup, setShowSummaryPopup] = useState(false)

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
    const el = new Audio('/sounds/5-2-1/5-2-1-BGM.mp3')
    el.loop = true
    el.volume = 0.1
    bgmRef.current = el
    return () => {
      el.pause()
      bgmRef.current = null
    }
  }, [mounted])

  // 상태 반영 (재생/일시정지 + 저장)
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

  const handleSpawn = () => {
    setTriggerSpawn(true)

    if (selectedLevel === 0) {
      setTimeout(() => {
        playSound(SOUND_EFFECTS.BALL_SOUND, VOLUMES.BALL_SOUND)
      }, 1000)
      setTimeout(() => {
        playSound(NARRATIONS.BALL_DROP, VOLUMES.NARRATION)
      }, 5000)
    }

    if (selectedLevel === 1) {
      setTimeout(() => {
        playSound(SOUND_EFFECTS.BALL_SOUND, VOLUMES.BALL_SOUND)
      }, 1000)
      setTimeout(() => {
        playSound(NARRATIONS.BALL_DROP, VOLUMES.NARRATION)
        playSound(SOUND_EFFECTS.BALL_SOUND, VOLUMES.BALL_SOUND)
      }, 5000)
    }
    if (selectedLevel === 2) {
      setTimeout(() => {
        playSound(SOUND_EFFECTS.BALL_SOUND, VOLUMES.BALL_SOUND)
      }, 1000)
    }
  }

  const handleSpawnHandled = () => {
    setTriggerSpawn(false)
  }

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const handleBackToIntro = () => {
    setShowIntro(true)
  }

  const handleEnterExperience = () => {
    playSound(SOUND_EFFECTS.CLICK, VOLUMES.SOUND_EFFECT)
    setShowIntro(false)
    playSound(NARRATIONS.EXPERIMENT_START, VOLUMES.NARRATION)
    setShowSieveSelection(true)
    setBgmReady(true)
  }

  const handleSelectSieve = (selectedLevel: number) => {
    setSelectedLevel(selectedLevel)
    setShowSieveSelection(false)
  }

  const handleReset = () => {
    setGravity(PHYSICS_CONFIG.gravity)
    setPhysicsKey((prev) => prev + 1)
    setShowSummaryButton(false)
  }

  const handleLevelChange = (level: number) => {
    setSelectedLevel(level)
    setPhysicsKey((prev) => prev + 1)
    setShowSummaryButton(false)
  }

  const handleSeparationComplete = () => {
    if (selectedLevel === 2) {
      setShowSummaryButton(true)
      playSound(NARRATIONS.SEPARATION_COMPLETE, VOLUMES.NARRATION)
    }
  }

  const handleSummaryClick = () => {
    playSound(SOUND_EFFECTS.CLICK, VOLUMES.SOUND_EFFECT)
    setShowSummaryPopup(true)
  }

  const handleCloseSummaryPopup = () => {
    setShowSummaryPopup(false)
  }

  return (
    <div className='w-screen h-screen bg-white relative flex flex-col overflow-hidden '>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      <CrayonTextButton
        icon={bgmEnabled ? 'volume2' : 'volumeX'}
        position='absolute'
        iconPosition='left'
        onClick={toggleBgm}
        width={108}
        height={108}
        color='#ffffff'
        textcolor='#ffffff'
        bg='rgba(255,255,255,0.10)'
        className='background-blur z-[200] right-[0px] mix-blend-difference'
        right={16}
        top={16}
        innerCircleVisible={true}
        iconSize={40}
      />
      <CrayonTextButton
        ariaLabel={'첫 화면으로'}
        icon={'home'}
        position='absolute'
        iconPosition='left'
        onClick={handleBackToIntro}
        width={108}
        height={108}
        color='#ffffff'
        textcolor='#ffffff'
        bg='rgba(255,255,255,0.10)'
        className='background-blur z-[200] right-[108px] mix-blend-difference'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />
      <div className={`flex-1 ${showSieveSelection ? 'invisible' : 'visible'}`}>
        <Scene
          shadows
          camera={{ position: [0, 10, 10], fov: 50 }}
          gl={{
            shadowMap: {
              enabled: true,
              type: THREE.PCFSoftShadowMap,
            },
          }}>
          <ShadowLighting />

          <Physics
            key={physicsKey}
            gravity={gravity}
            allowSleep={true}
            iterations={15}
            defaultContactMaterial={{
              friction: PHYSICS_CONFIG.friction,
              restitution: PHYSICS_CONFIG.restitution,
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
              {[0, 2, 1].map((level) => {
                const sieveConfig = SIEVE_CONFIG.LEVELS.find((s) => s.level === level)
                return (
                  <button
                    key={level}
                    className={`px-4 py-2 border-2 border-black text-white transition-colors ${
                      selectedLevel === level
                        ? 'bg-white text-black hover:bg-black hover:text-white'
                        : 'bg-white text-black hover:bg-black hover:text-white'
                    }`}
                    onClick={() => {
                      handleLevelChange(level)
                      playSound(SOUND_EFFECTS.BUTTON, VOLUMES.SOUND_EFFECT)
                    }}>
                    {sieveConfig?.title}
                  </button>
                )
              })}
            </div>
          </div>

          <div className='flex absolute bottom-5 right-5 z-10 gap-2 font-light'>
            <button
              className='px-4 py-2 bg-white border-2 border-black text-black hover:bg-black hover:text-white'
              onClick={() => {
                handleSpawn()
                playSound(SOUND_EFFECTS.BUTTON, VOLUMES.SOUND_EFFECT)
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
                playSound(SOUND_EFFECTS.BUTTON, VOLUMES.SOUND_EFFECT)
              }}>
              다시하기
            </button>
          </div>
        </>
      )}

      {isLoaded && showIntro && (
        <div className='absolute inset-0 z-30'>
          <Intro
            onEnter={handleEnterExperience}
            title='크기가 다른 구슬 혼합물 분리하기'
            description={['알갱이의 크기가 다른 고체 혼합물은 어떻게 분리할 수 있는지 알아봅시다.']}
            backgroundSvg='/img/cover/5-2-1.svg'
            descriptionSound={NARRATIONS.GOAL}
          />
        </div>
      )}

      {showSieveSelection && <SieveSelectionPage onSelectSieve={handleSelectSieve} />}

      {showSummaryPopup && <SummaryPopup onClose={handleCloseSummaryPopup} />}
    </div>
  )
}
