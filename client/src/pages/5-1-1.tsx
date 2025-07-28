import { OrbitControls, useGLTF, Environment, useProgress } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import Model from '../components/5-1-1/Model'
import Ocean from '../components/5-1-1/Ocean'
import { useEffect, useState, useRef, useCallback } from 'react'
import UnderwaterEnvironment from '@/components/5-1-1/Underwater'
import * as THREE from 'three'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { EffectComposer, TiltShift2, N8AO } from '@react-three/postprocessing'
import { SpeechBubble } from '../components/6-1-1/SpeechBubble'
import CameraLogger from '@/hook/CameraLogger'
import NavigationUI from '@/components/5-1-1/NavigationUI'
import { AnimatePresence, motion } from 'framer-motion'
import AudioManager from '@/components/5-1-1/AudioManager'

const modelPaths = [
  'models/5-1-1/1/Dino.gltf',
  'models/5-1-1/2/Dino.gltf',
  'models/5-1-1/3/Dino.gltf',
  'models/5-1-1/4/Dino.gltf',
]

const sceneDescriptions = [
  '활발하게 살아가던 공룡은 수명이 다하면 죽습니다',
  '죽은 공룡의 몸체가 호수나 바다 밑에 가라 앉습니다.',
  '간이 지나면서 죽은 생물의 몸체 위로 퇴적물이 쌓이며 지층이 만들어집니다.',
  '시간이 지나 지층이 깎여서 사라지면 지층 속에 있던 화석이 지표에 드러나 발견됩니다.',
]

const cameraPositions = [
  new THREE.Vector3(-30.01, 3.108, -5.557),
  new THREE.Vector3(40, 30, 40),
  new THREE.Vector3(40, 30, 40),
  new THREE.Vector3(40, 30, 40),
]

const animationSpeeds = {
  0: 2.0,
  1: 0.2,
  2: 0.4,
  3: 0.2,
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

function IntroMouseCameraController({ enabled }: { enabled: boolean }) {
  const { camera } = useThree()
  const mouseRef = useRef({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })
  const basePositionRef = useRef(new THREE.Vector3())

  useEffect(() => {
    if (enabled) {
      basePositionRef.current.copy(camera.position)
    }
  }, [enabled, camera])

  useEffect(() => {
    if (!enabled) return

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [enabled])

  useFrame(() => {
    if (!enabled) return

    targetRef.current.x += (mouseRef.current.x - targetRef.current.x) * 0.05
    targetRef.current.y += (mouseRef.current.y - targetRef.current.y) * 0.05
    const lookAtX = -targetRef.current.x * 3
    const lookAtY = -targetRef.current.y * 3
    camera.lookAt(lookAtX, lookAtY, 0)
  })

  return null
}

function WaterBox({
  position = [0, 1, 0],
  waterLevel = -1.0,
}: {
  position?: [number, number, number]
  waterLevel?: number
}) {
  const width = 25.42
  const height = 4.4
  const depth = 25.42

  const adjustedPosition: [number, number, number] = [position[0], waterLevel - height / 2, position[2]]

  return (
    <group position={adjustedPosition}>
      <mesh position={[0, 0, -depth / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color='#0084FF' transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, -height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color='#0084FF' transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 0, depth / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color='#0084FF' transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[-width / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color='#0084FF' transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[width / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color='#0084FF' transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function SceneCameraController({ sceneIndex }: { sceneIndex: number }) {
  const { camera } = useThree()

  useEffect(() => {
    const pos = cameraPositions[sceneIndex]
    camera.position.copy(pos)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [sceneIndex, camera])

  return null
}

function CameraController({
  targetPosition,
  onMoveComplete,
}: {
  targetPosition: THREE.Vector3 | null
  onMoveComplete: () => void
}) {
  const { camera } = useThree()
  const startPosition = useRef<THREE.Vector3>(new THREE.Vector3())
  const animationProgress = useRef(0)
  const isAnimating = useRef(false)

  useFrame((state, delta) => {
    if (!targetPosition || !isAnimating.current) return

    const duration = 2.0
    animationProgress.current += delta / duration

    if (animationProgress.current >= 1) {
      camera.position.copy(targetPosition)
      camera.lookAt(0, 0, 0)
      isAnimating.current = false
      animationProgress.current = 0
      onMoveComplete()
      return
    }

    const t = animationProgress.current
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    const currentPosition = startPosition.current.clone().lerp(targetPosition, eased)
    camera.position.copy(currentPosition)
    camera.lookAt(0, 0, 0)
  })

  useEffect(() => {
    if (targetPosition) {
      startPosition.current.copy(camera.position)
      animationProgress.current = 0
      isAnimating.current = true
    }
  }, [targetPosition, camera])

  return null
}

function AnimationController({
  sceneIndex,
  modelLoaded,
  onWaterLevelUpdate,
  animationTrigger,
  onModelAnimationTrigger,
  onAnimationComplete,
  playButtonTrigger,
  onShowDescription,
  onCleanup,
}: {
  sceneIndex: number
  modelLoaded: boolean
  onWaterLevelUpdate: (level: number) => void
  animationTrigger: boolean
  onModelAnimationTrigger?: (trigger: number) => void
  onAnimationComplete: () => void
  playButtonTrigger: boolean
  onShowDescription: () => void
  onCleanup?: (cleanup: () => void) => void
}) {
  const animationStateRef = useRef({
    isAnimating: false,
    currentWaterLevel: -5.0,
    lastSceneIndex: -1,
    animationIntervalId: null as NodeJS.Timeout | null,
  })

  const cleanup = useCallback(() => {
    const state = animationStateRef.current
    if (state.animationIntervalId) {
      clearInterval(state.animationIntervalId)
      state.animationIntervalId = null
    }
    state.isAnimating = false
    state.currentWaterLevel = -5.0
    state.lastSceneIndex = -1
  }, [])

  useEffect(() => {
    if (onCleanup) {
      onCleanup(cleanup)
    }
  }, [cleanup, onCleanup])

  useEffect(() => {
    const state = animationStateRef.current

    if (state.lastSceneIndex !== sceneIndex) {
      console.log(`Scene changed from ${state.lastSceneIndex} to ${sceneIndex} - resetting animation state`)
      state.lastSceneIndex = sceneIndex
      state.isAnimating = false

      if (state.animationIntervalId) {
        clearInterval(state.animationIntervalId)
        state.animationIntervalId = null
      }
      if (sceneIndex === 1) {
        state.currentWaterLevel = 1
      }
      onWaterLevelUpdate(state.currentWaterLevel)
    }
  }, [sceneIndex, onWaterLevelUpdate])

  useEffect(() => {
    if (playButtonTrigger && modelLoaded) {
      const state = animationStateRef.current

      onShowDescription()

      setTimeout(() => {
        switch (sceneIndex) {
          case 0:
            startModelAnimation()
            break
          case 1:
            startModelAnimation()
            startWaterLevelAnimation(state, onWaterLevelUpdate, () => {
              onAnimationComplete()
            })
            break
          case 2:
            startModelAnimation()
            startWaterLevelAnimation(state, onWaterLevelUpdate, () => {
              onAnimationComplete()
            })
          case 3:
            startModelAnimation()
            break
        }
      }, 300)
    }
  }, [playButtonTrigger, modelLoaded, sceneIndex, onWaterLevelUpdate, onShowDescription])

  useEffect(() => {
    if (animationTrigger && modelLoaded) {
      console.log(`Scene ${sceneIndex}: animationTrigger received but will be handled by playButtonTrigger`)
    }
  }, [animationTrigger, modelLoaded, sceneIndex])

  const startModelAnimation = () => {
    const newTrigger = Date.now()
    onModelAnimationTrigger && onModelAnimationTrigger(newTrigger)

    setTimeout(() => {
      console.log(`Scene ${sceneIndex}: Model animation completed`)
      onAnimationComplete()
    }, 5000)
  }

  const startModel4Animation = () => {
    const newTrigger = Date.now()
    onModelAnimationTrigger && onModelAnimationTrigger(newTrigger)

    setTimeout(() => {
      console.log(`Scene ${sceneIndex}: Model animation completed`)
      onAnimationComplete()
    }, 5000)
  }

  const startWaterLevelAnimation = (state: any, updateCallback: (level: number) => void, onComplete?: () => void) => {
    if (state.isAnimating || state.animationIntervalId) return

    console.log(`Scene ${sceneIndex}: Starting water level animation`)
    state.isAnimating = true

    const startLevel = 1
    const targetLevel = 2.5
    const duration = 6000
    const startTime = Date.now()

    state.animationIntervalId = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1.0)

      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

      const currentLevel = startLevel + (targetLevel - startLevel) * eased
      state.currentWaterLevel = currentLevel

      updateCallback(currentLevel)

      if (progress >= 1.0) {
        clearInterval(state.animationIntervalId!)
        state.animationIntervalId = null
        state.isAnimating = false

        if (onComplete) {
          onComplete()
        }
      }
    }, 50)
  }

  useEffect(() => {
    return () => {
      const state = animationStateRef.current
      if (state.animationIntervalId) {
        clearInterval(state.animationIntervalId)
      }
    }
  }, [])

  return null
}

function ModelRenderer({
  sceneIndex,
  modelAnimationTrigger,
  onModelLoaded,
}: {
  sceneIndex: number
  modelAnimationTrigger: number
  onModelLoaded: () => void
}) {
  const currentModelPath = modelPaths[sceneIndex]

  const modelPosition: [number, number, number] = sceneIndex === 1 ? [-2.44, -7, -1.31] : [1.5, -7, -2.0]

  return (
    <Model
      key={`model-${sceneIndex}`}
      path={currentModelPath}
      scale={3.7}
      position={modelPosition}
      sceneIndex={sceneIndex}
      onLoaded={onModelLoaded}
      animationTrigger={modelAnimationTrigger}
      animationSpeed={animationSpeeds[sceneIndex as keyof typeof animationSpeeds]}
      customAnimation={sceneIndex === 3 ? 'fadeAndMove' : null}
    />
  )
}

function SceneContent({
  sceneIndex,
  waterLevel,
  handleWaterLevelUpdate,
  handleModelLoaded,
  showIntro,
  animationTrigger,
  onAnimationComplete,
  showSpeechBubble,
  onSpeechBubbleClick,
  cameraTarget,
  onCameraMoveComplete,
  playButtonTrigger,
  onShowDescription,
  onAnimationCleanup,
  resetKey,
}: {
  sceneIndex: number
  waterLevel: number
  handleWaterLevelUpdate: (level: number) => void
  handleModelLoaded: () => void
  showIntro: boolean
  animationTrigger: boolean
  onAnimationComplete: () => void
  showSpeechBubble: boolean
  onSpeechBubbleClick: () => void
  cameraTarget: THREE.Vector3 | null
  onCameraMoveComplete: () => void
  playButtonTrigger: boolean
  onShowDescription: () => void
  onAnimationCleanup?: (cleanup: () => void) => void
  resetKey?: number
}) {
  const [modelAnimationTrigger, setModelAnimationTrigger] = useState(0)
  const showWater = sceneIndex === 1
  const modelLoaded = true

  useEffect(() => {
    console.log(`Scene changed to ${sceneIndex}, resetting modelAnimationTrigger to 0`)
    setModelAnimationTrigger(0)
  }, [sceneIndex, resetKey])

  const handleModelAnimationTrigger = (trigger: number) => {
    console.log(`SceneContent: Setting modelAnimationTrigger to: ${trigger} for scene ${sceneIndex}`)
    setModelAnimationTrigger(trigger)
  }

  return (
    <>
      <SceneCameraController sceneIndex={sceneIndex} />
      <IntroMouseCameraController enabled={showIntro} />
      <AnimationController
        key={`animation-${resetKey}`}
        sceneIndex={sceneIndex}
        modelLoaded={modelLoaded}
        onWaterLevelUpdate={handleWaterLevelUpdate}
        animationTrigger={animationTrigger}
        onModelAnimationTrigger={handleModelAnimationTrigger}
        onAnimationComplete={onAnimationComplete}
        playButtonTrigger={playButtonTrigger}
        onShowDescription={onShowDescription}
        onCleanup={onAnimationCleanup}
      />

      <CameraController targetPosition={cameraTarget} onMoveComplete={onCameraMoveComplete} />

      {!showWater && (
        <>
          <fog attach='fog' args={['black', 0, 3000]} />
          <hemisphereLight intensity={0.5} color='white' groundColor='#f88' />
          <directionalLight
            color='orange'
            intensity={2}
            scale={3}
            position={[30, 3, 30]}
            castShadow
            shadow-camera-far={100}
            shadow-mapSize={2048}
            shadow-bias={-0.0001}
            shadow-normalBias = {0.2}
          />
          <EffectComposer multisampling={8}>
            <N8AO aoRadius={10} distanceFalloff={0.9} intensity={3} screenSpaceRadius halfRes />
            <TiltShift2 />
          </EffectComposer>
        </>
      )}

      <ModelRenderer
        key={`model-${sceneIndex}-${resetKey}`}
        sceneIndex={sceneIndex}
        modelAnimationTrigger={modelAnimationTrigger}
        onModelLoaded={handleModelLoaded}
      />

      {showWater && (
        <>
          <Ocean textureScale={1.0} textureOpacity={0.83} timeSpeed={0.9} flowSpeed={0.9} waterLevel={waterLevel} />
          <WaterBox waterLevel={waterLevel} />
          <UnderwaterEnvironment sceneIndex={sceneIndex} />
        </>
      )}

      <Environment preset='sunset' background blur={0.6} />

      <OrbitControls
        enablePan={false}
        enableZoom={!showIntro}
        enableRotate={!showIntro}
        minDistance={0.1}
        maxDistance={35}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  )
}

export default function Home() {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [waterLevel, setWaterLevel] = useState(-2.0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [animationTrigger, setAnimationTrigger] = useState(false)
  const [isPlayButtonPressed, setIsPlayButtonPressed] = useState(false)
  const [showSpeechBubble, setShowSpeechBubble] = useState(false)
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null)
  const [playButtonTrigger, setPlayButtonTrigger] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const audioManager = AudioManager.getInstance()
  const animationCleanupRef = useRef<(() => void) | null>(null)

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const handleAnimationCleanup = useCallback((cleanup: () => void) => {
    animationCleanupRef.current = cleanup
  }, [])

  const handleBackToModeSelection = useCallback(() => {
    audioManager.playGeneralButton()
    audioManager.stopAll()
    
    if (animationCleanupRef.current) {
      animationCleanupRef.current()
    }
    
    setSceneIndex(0)
    setWaterLevel(-2.0)
    setIsLoaded(false)
    setAnimationTrigger(false)
    setIsPlayButtonPressed(false)
    setShowSpeechBubble(false)
    setCameraTarget(null)
    setPlayButtonTrigger(false)
    setShowDescription(false)
    setResetKey(prev => prev + 1)
    animationCleanupRef.current = null
    
    setTimeout(() => {
      setShowIntro(true)
    }, 100)
  }, [audioManager])

  const handleSceneChange = (newSceneIndex: number) => {
    console.log(`Scene changing from ${sceneIndex} to ${newSceneIndex}`)
    setSceneIndex(newSceneIndex)
    setIsLoaded(false)
    setAnimationTrigger(false)
    setShowSpeechBubble(false)
    setCameraTarget(null)
    setPlayButtonTrigger(false)
    setShowDescription(false)
  }

  const handleWaterLevelUpdate = (level: number) => {
    setWaterLevel(level)
  }

  const handleModelLoaded = () => {
  }

  const handleAnimationComplete = () => {
    console.log(`Animation completed for scene ${sceneIndex}`)
  }

  const handleSpeechBubbleClick = () => {
    const targetPosition = new THREE.Vector3(5, 2, 5)
    setCameraTarget(targetPosition)
    setShowSpeechBubble(false)
  }

  const handleCameraMoveComplete = () => {
    setCameraTarget(null)
  }

  const handleShowDescription = () => {
    setShowDescription(true)
  }

  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
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

  const playClickButtonSound = (audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
      audio.play().catch((error) => {
        console.log('버튼 클릭 효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('버튼 클릭 효과음 생성 실패:', error)
    }
  }

  const handleEnterExperience = () => {
    playClickSound()
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }

  const handlePlayButtonClick = () => {
    playClickButtonSound()
    setIsPlayButtonPressed(true)

    setTimeout(() => {
      setIsPlayButtonPressed(false)

      console.log(`Play button clicked for scene ${sceneIndex}`)
      setPlayButtonTrigger(true)

      setTimeout(() => {
        setPlayButtonTrigger(false)
      }, 200)
    }, 150)
  }

  return (
    <div className='w-screen h-screen flex flex-col overflow-hidden'>
      {!showIntro && (
        <NavigationUI
          sceneIndex={sceneIndex}
          onSceneChange={handleSceneChange}
          onPlayClick={handlePlayButtonClick}
          isPlayButtonPressed={isPlayButtonPressed}
        />
      )}

      {!showIntro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className='absolute top-4 left-4 z-10 w-fit h-fit'>
          <button
            onClick={() => {
              audioManager.playGeneralButton()
              handleBackToModeSelection()
            }}
            className='px-6 pt-3 pb-4 bg-[#FF8026] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#ff9b54] hover:shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(152,0,0,0.50)] transition-all duration-300'
            aria-label='모드 선택 화면으로 돌아가기'>
            <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
              뒤로가기
            </div>
          </button>
        </motion.div>
      )}

      <div className='flex-1'>
        <Scene
          shadows
          camera={{ position: [0, 10, 10], fov: 50, near: 0.1, far: 5000 }}
          gl={{
            shadowMap: {
              enabled: true,
              type: THREE.PCFSoftShadowMap,
            },
          }}>
          <LoadingTracker onLoadingComplete={handleLoadingComplete} />

          <SceneContent
            sceneIndex={sceneIndex}
            waterLevel={waterLevel}
            handleWaterLevelUpdate={handleWaterLevelUpdate}
            handleModelLoaded={handleModelLoaded}
            showIntro={showIntro}
            animationTrigger={animationTrigger}
            onAnimationComplete={handleAnimationComplete}
            showSpeechBubble={showSpeechBubble}
            onSpeechBubbleClick={handleSpeechBubbleClick}
            cameraTarget={cameraTarget}
            onCameraMoveComplete={handleCameraMoveComplete}
            playButtonTrigger={playButtonTrigger}
            onShowDescription={handleShowDescription}
            onAnimationCleanup={handleAnimationCleanup}
          />
        </Scene>
      </div>

      {!showIntro && isLoaded && showDescription && (
        <div className='absolute bottom-0 left-[50%] text-center p-4 bg-black text-white translate-x-[-50%]'>
          <p className='text-lg font-light'>{sceneDescriptions[sceneIndex]}</p>
        </div>
      )}

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title={`공룡 화석이 만들어지는 \n과정 알아보기`}
          description={['공룡 화석은 어떻게 만들어지는지 알아봅시다.']}
          backgroundSvg='/img/cover/5-1-1.svg'
          descriptionSound='/sounds/5-1-1/5-1-1-Goal.MP3'
        />
      )}
    </div>
  )
}