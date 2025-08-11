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
import NavigationUI, { NavigationUIRef } from '@/components/5-1-1/NavigationUI'
import { AnimatePresence, motion } from 'framer-motion'
import AudioManager from '@/components/5-1-1/AudioManager'
import ActivityGuideModal from '@/components/5-1-1/ActivityGuideModal'

const modelPaths = [
  'models/5-1-1/1/Dino.gltf',
  'models/5-1-1/2/Dino.gltf',
  'models/5-1-1/3/Dino.gltf',
  'models/5-1-1/4/Dino.gltf',
]

const sceneDescriptions = [
  '활발하게 살아가던 공룡은 수명이 다하면 죽습니다',
  '죽은 공룡의 몸체가 호수나 바다 밑에 가라 앉습니다.',
  '시간이 지나면서 죽은 생물의 몸체 위로 퇴적물이 쌓이며 지층이 만들어집니다.',
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
  1: 0.3,
  2: 0.4,
  3: 0.2,
}

interface AnimationState {
  isPlaying: boolean
  isComplete: boolean
  waterLevel: number
  animationKey: number
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
  sceneIndex,
}: {
  position?: [number, number, number]
  waterLevel?: number
  sceneIndex: number
}) {
  const width = sceneIndex === 1 ? 25.42 : 25.2
  const height = sceneIndex === 1 ? 4.4 : 5.0
  const depth = width

  const adjustedPosition: [number, number, number] = [
    position[0],
    waterLevel - height / 2,
    position[2]
  ]

  return (
    <group position={adjustedPosition}>
      {/* 앞 */}
      <mesh position={[0, 0, -depth / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color='#0084FF' transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* 바닥 */}
      <mesh position={[0, -height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color='#0084FF' transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* 뒤 */}
      <mesh position={[0, 0, depth / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color='#0084FF' transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* 왼쪽 */}
      <mesh position={[-width / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color='#0084FF' transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* 오른쪽 */}
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

function useWaterAnimation(sceneIndex: number, shouldAnimate: boolean, animationKey: number) {
  const [waterLevel, setWaterLevel] = useState(-2.0)
  const [waterScale, setWaterScale] = useState(1.0)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let initialLevel = -2.0
    let initialScale = 1.0

    if (sceneIndex === 1) {
      initialLevel = 1
    } else if (sceneIndex === 2) {
      initialLevel = 1.0
      initialScale = 0.9
    }

    setWaterLevel(initialLevel)
    setWaterScale(initialScale)

    if (animationRef.current) {
      clearInterval(animationRef.current)
      animationRef.current = null
    }
  }, [sceneIndex, animationKey])

  useEffect(() => {
    if (!shouldAnimate) return

    if (animationRef.current) {
      clearInterval(animationRef.current)
      animationRef.current = null
    }

    if (sceneIndex === 1) {
      const startLevel = 1
      const targetLevel = 2.5
      const duration = 6000
      const startTime = Date.now()

      console.log(`Water Animation Scene ${sceneIndex}: Starting water rise animation`)

      animationRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1.0)
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
        const currentLevel = startLevel + (targetLevel - startLevel) * eased

        setWaterLevel(currentLevel)

        if (progress >= 1.0) {
          clearInterval(animationRef.current!)
          animationRef.current = null
          console.log(`Water Animation Scene ${sceneIndex}: Water rise completed`)
        }
      }, 50)
    } else if (sceneIndex === 2) {
      const startScale = 1.0
      const targetScale = 0.0
      const duration = 8000
      const startTime = Date.now()

      console.log(`Water Animation Scene ${sceneIndex}: Starting water scale down animation`)

      animationRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1.0)
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
        const currentScale = startScale + (targetScale - startScale) * eased

        setWaterScale(currentScale)

        if (progress >= 1.0) {
          clearInterval(animationRef.current!)
          animationRef.current = null
          console.log(`Water Animation Scene ${sceneIndex}: Water scale down completed`)
        }
      }, 50)
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
        animationRef.current = null
      }
    }
  }, [shouldAnimate, sceneIndex, animationKey])

  return { waterLevel, waterScale }
}

function SceneContent({
  sceneIndex,
  animationState,
  onAnimationComplete,
  showIntro,
}: {
  sceneIndex: number
  animationState: AnimationState
  onAnimationComplete: () => void
  showIntro: boolean
}) {
  const showWater = sceneIndex === 1 || sceneIndex === 2
  const { waterLevel, waterScale } = useWaterAnimation(
    sceneIndex,
    animationState.isPlaying,
    animationState.animationKey,
  )

  const handleModelAnimationComplete = () => {
    console.log(`Model animation completed for scene ${sceneIndex}`)
    onAnimationComplete()
  }

  return (
    <>
      <SceneCameraController sceneIndex={sceneIndex} />
      <IntroMouseCameraController enabled={showIntro} />

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
            shadow-normalBias={0.2}
          />
          <EffectComposer multisampling={8}>
            <N8AO aoRadius={10} distanceFalloff={0.9} intensity={3} screenSpaceRadius halfRes />
            <TiltShift2 />
          </EffectComposer>
        </>
      )}

      <Model
        path={modelPaths[sceneIndex]}
        scale={3.7}
        position={
          sceneIndex === 1
            ? [-2.44, -7.5, -1.31]
            : sceneIndex === 2
            ? [-2.7, -7, -1.1]
            : [1.5, -7, -2.0]
        }
        sceneIndex={sceneIndex}
        shouldAnimate={animationState.isPlaying}
        animationSpeed={animationSpeeds[sceneIndex as keyof typeof animationSpeeds]}
        customAnimation={sceneIndex === 3 ? 'fadeAndMove' : null}
        onAnimationComplete={handleModelAnimationComplete}
        animationKey={animationState.animationKey}
      />

      {showWater && waterScale > 0.01 && (
        <group scale={[1, waterScale, 1]}>
          <Ocean sceneIndex={sceneIndex} textureScale={1.0} textureOpacity={0.7} timeSpeed={0.9} flowSpeed={0.9} waterLevel={waterLevel} />
          <WaterBox waterLevel={waterLevel} sceneIndex={sceneIndex}/>
          <UnderwaterEnvironment sceneIndex={sceneIndex} />
        </group>
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
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showDescription, setShowDescription] = useState(false)
  const [showActivityGuide, setShowActivityGuide] = useState(false)
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    isComplete: false,
    waterLevel: -2.0,
    animationKey: 0,
  })

  const audioManager = AudioManager.getInstance()
  const navigationUIRef = useRef<NavigationUIRef>(null)

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const handleBackToModeSelection = useCallback(() => {
    console.log('뒤로가기 버튼 클릭 - 모든 오디오 정리 시작')

    audioManager.stopAll()

    if (navigationUIRef.current) {
      navigationUIRef.current.stopAllAudios()
    }

    audioManager.playGeneralButton()

    setSceneIndex(0)
    setIsLoaded(false)
    setShowDescription(false)
    setShowActivityGuide(false)
    setAnimationState({
      isPlaying: false,
      isComplete: false,
      waterLevel: -2.0,
      animationKey: 0,
    })

    setTimeout(() => {
      setShowIntro(true)
    }, 100)
  }, [audioManager])

  useEffect(() => {
    return () => {
      console.log('컴포넌트 언마운트 - 모든 오디오 정리')
      audioManager.stopAll()
      if (navigationUIRef.current) {
        navigationUIRef.current.stopAllAudios()
      }
    }
  }, [audioManager])

  const handleSceneChange = (newSceneIndex: number) => {
    console.log(`Scene changing from ${sceneIndex} to ${newSceneIndex}`)

    setSceneIndex(newSceneIndex)
    setIsLoaded(false)
    setShowDescription(false)

    const newKey = Date.now()
    setAnimationState({
      isPlaying: false,
      isComplete: false,
      waterLevel: -2.0,
      animationKey: newKey,
    })

    setTimeout(() => {
      setIsLoaded(true)
    }, 100)
  }

  const handleAnimationComplete = () => {
    console.log(`Animation completed for scene ${sceneIndex}`)
    setAnimationState((prev) => ({
      ...prev,
      isPlaying: false,
      isComplete: true,
    }))
  }

  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
    audioManager.playEffect(audioPath, 0.5)
  }

  const playClickButtonSound = (audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3') => {
    audioManager.playEffect(audioPath, 0.5)
  }

  // 인트로에서 "시작하기" 버튼을 눌렀을 때 - 바로 3D 화면으로 이동
  const handleEnterExperience = () => {
    playClickSound()
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }

  const handleShowActivityGuide = () => {
    audioManager.playGeneralButton()
    setShowActivityGuide(true)
  }

  const handleCloseActivityGuide = () => {
    setShowActivityGuide(false)
  }

  const handlePlayButtonClick = () => {
    playClickButtonSound()

    console.log(`Play button clicked - Scene: ${sceneIndex}, Current state:`, animationState)

    if (animationState.isPlaying || animationState.isComplete) {
      console.log(`Restarting animation for scene ${sceneIndex}`)

      const newKey = Date.now()
      console.log(`Using new animation key: ${newKey}`)

      setAnimationState({
        isPlaying: true,
        isComplete: false,
        waterLevel: -2.0,
        animationKey: newKey,
      })
      setShowDescription(true)
    } else {
      console.log(`Starting animation for scene ${sceneIndex}`)
      setAnimationState((prev) => ({
        ...prev,
        isPlaying: true,
        isComplete: false,
      }))
      setShowDescription(true)
    }
  }

  return (
    <div className='w-screen h-screen flex flex-col overflow-hidden'>
      {!showIntro && (
        <NavigationUI
          ref={navigationUIRef}
          sceneIndex={sceneIndex}
          onSceneChange={handleSceneChange}
          onPlayClick={handlePlayButtonClick}
          isAnimationComplete={animationState.isComplete}
          animationState={animationState}
        />
      )}

      {/* 상단 버튼들 */}
      {!showIntro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className='absolute top-4 left-4 z-10 flex gap-4'>
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => {
              audioManager.playGeneralButton()
              handleBackToModeSelection()
            }}
            className='px-6 pt-3 pb-4 bg-[#FF8026] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#ff9b54] hover:shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(152,0,0,0.50)] transition-all duration-300'
            aria-label='모드 선택 화면으로 돌아가기'>
            <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
              첫 화면으로
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
            animationState={animationState}
            onAnimationComplete={handleAnimationComplete}
            showIntro={showIntro}
          />
        </Scene>
      </div>

      {!showIntro && isLoaded && showDescription && (
        <div className='absolute bottom-0 left-[50%] text-center p-4 bg-black text-white translate-x-[-50%]'>
          <p className='text-lg font-light'>{sceneDescriptions[sceneIndex]}</p>
        </div>
      )}

      {/* 인트로 화면 */}
      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title={`공룡 화석이 만들어지는 \n과정 알아보기`}
          description={['공룡 화석은 어떻게 만들어지는지 알아봅시다.']}
          backgroundSvg='/img/cover/5-1-1.svg'
          descriptionSound='/sounds/5-1-1/5-1-1-Goal.MP3'
          onActivityGuide={handleShowActivityGuide}
        />
      )}

      {/* 활동 방법 모달 */}
      <ActivityGuideModal isOpen={showActivityGuide} onClose={handleCloseActivityGuide} />
    </div>
  )
}
