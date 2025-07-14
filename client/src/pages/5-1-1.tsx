import { OrbitControls, useGLTF, Environment, useProgress } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import Model from '../components/5-1-1/Model'
import Ocean from '../components/5-1-1/Ocean'
import { useEffect, useState, useRef } from 'react'
import UnderwaterEnvironment from '@/components/5-1-1/Underwater'
import * as THREE from 'three'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { EffectComposer, TiltShift2, N8AO } from '@react-three/postprocessing'
import { SpeechBubble } from '../components/6-1-1/SpeechBubble'
import CameraLogger from '@/components/CameraLogger'
import NavigationUI from '@/components/5-1-1/NavigationUI'

const modelPaths = [
  'models/5-1-1/1/Dino.gltf',
  'models/5-1-1/2/Dino.gltf',
  'models/5-1-1/3/Dino.gltf',
  'models/5-1-1/4/Dino.gltf',
]

const sceneDescriptions = [
  '공룡이 살아있을 때의 모습입니다.',
  '죽은 공룡의 몸체가 호수나 바다 밑에 가라 앉습니다.',
  '시간이 지나면서 죽은 생물의 몸체 위로 퇴적물이 쌓입니다.',
  '시간이 지나 지층이 깎여서 사라지면 지층 속에 있던 화석이 지표에 드러나 발견됩니다.',
]

const cameraPositions = [
  new THREE.Vector3(-30.01, 3.108, -5.557),
  new THREE.Vector3(14, 19, 14),
  new THREE.Vector3(23.613311588485445, 13.162826461554463, 22.863629867778908),
  new THREE.Vector3(14, 12.25, 15.685),
]

// 각 스텝별 애니메이션 속도 설정
const animationSpeeds = {
  0: 2.0,   // Step 1: 기본 속도
  1: 0.4,   // Step 2: 조금 느리게
  2: 1.5,   // Step 3: 빠르게
  3: 0.2,   // Step 4: 조금 빠르게
}

// ====== 하위 컴포넌트들 ======

// 로딩 트래커 컴포넌트
function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

// 물 상자 컴포넌트
function WaterBox({
  position = [0, 0, 0],
  waterLevel = -2.0,
}: {
  position?: [number, number, number]
  waterLevel?: number
}) {
  const width = 22.5
  const height = 4.0
  const depth = 23.5

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

// 카메라 컨트롤러 컴포넌트
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

// 애니메이션 컨트롤러 (물 애니메이션과 모델 애니메이션 모두 관리)
function AnimationController({
  sceneIndex,
  modelLoaded,
  onWaterLevelUpdate,
  animationTrigger,
  onModelAnimationTrigger,
  onAnimationComplete,
}: {
  sceneIndex: number
  modelLoaded: boolean
  onWaterLevelUpdate: (level: number) => void
  animationTrigger: boolean
  onModelAnimationTrigger?: (trigger: number) => void
  onAnimationComplete: () => void
}) {
  const animationStateRef = useRef({
    isAnimating: false,
    currentWaterLevel: -2.0,
    lastSceneIndex: -1,
    animationIntervalId: null as NodeJS.Timeout | null,
  })

  // 씬 변경 시 초기화
  useEffect(() => {
    const state = animationStateRef.current

    if (state.lastSceneIndex !== sceneIndex) {
      state.lastSceneIndex = sceneIndex
      state.isAnimating = false

      if (state.animationIntervalId) {
        clearInterval(state.animationIntervalId)
        state.animationIntervalId = null
      }

      // 씬별 초기 물 높이 설정
      if (sceneIndex === 1) {
        state.currentWaterLevel = -0.5
      } else {
        state.currentWaterLevel = -2.0
      }

      onWaterLevelUpdate(state.currentWaterLevel)
    }
  }, [sceneIndex, onWaterLevelUpdate])

  useEffect(() => {
    if (animationTrigger && modelLoaded) {
      const state = animationStateRef.current

      setTimeout(() => {
        switch (sceneIndex) {
          case 0:
            // Step 1: 모델 애니메이션 즉시 시작
            startModelAnimation()
            break
          case 1:
            // Step 2: 물 애니메이션 먼저, 완료 후 모델 애니메이션
            startWaterLevelAnimation(state, onWaterLevelUpdate, () => {
              // 물 애니메이션 완료 후 모델 애니메이션 시작
              setTimeout(() => {
                startModelAnimation()
              }, 500)
            })
            break
          case 2:
          case 3:
            // Step 3, 4: 플레이 버튼을 눌러야만 모델 애니메이션 시작
            console.log(`Scene ${sceneIndex}: 플레이 버튼 대기 중...`)
            startModelAnimation()
            break
        }
      }, 300)
    }
  }, [animationTrigger, modelLoaded, sceneIndex, onWaterLevelUpdate])

  const startModelAnimation = () => {
    const newTrigger = Date.now()
    console.log(`Scene ${sceneIndex}: Starting model animation with trigger ${newTrigger}`)
    onModelAnimationTrigger && onModelAnimationTrigger(newTrigger)
    
    // 애니메이션 완료를 위한 타이머 (실제 애니메이션 길이에 맞게 조정)
    setTimeout(() => {
      onAnimationComplete()
    }, 5000) // 5초 후 완료로 가정 (실제 애니메이션 길이에 맞게 수정)
  }

  const startWaterLevelAnimation = (
    state: any, 
    updateCallback: (level: number) => void,
    onComplete?: () => void
  ) => {
    if (state.isAnimating || state.animationIntervalId) return

    state.isAnimating = true

    const startLevel = -0.5
    const targetLevel = 1.52
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
        
        // 물 애니메이션 완료 콜백 실행
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

// 3D 모델 렌더링 컴포넌트 (모든 씬에서 동일하게 처리)
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
  const modelPosition: [number, number, number] = sceneIndex === 1 ? [-2.6, -7, -2.0] : [1.5, -7, -2.0]

  return (
    <Model
      key={`model-${sceneIndex}-${currentModelPath}`}
      path={currentModelPath}
      scale={3.7}
      position={modelPosition}
      sceneIndex={sceneIndex}
      onLoaded={onModelLoaded}
      animationTrigger={modelAnimationTrigger}
      animationSpeed={animationSpeeds[sceneIndex as keyof typeof animationSpeeds]}
    />
  )
}

// 3D 씬 컨텐츠
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
}) {
  const [modelAnimationTrigger, setModelAnimationTrigger] = useState(0)
  const showWater = sceneIndex === 1
  const modelLoaded = true

  useEffect(() => {
    console.log(`Scene changed to ${sceneIndex}, resetting modelAnimationTrigger`)
    setModelAnimationTrigger(0)
  }, [sceneIndex])

  const handleModelAnimationTrigger = (trigger: number) => {
    console.log(`Setting modelAnimationTrigger to: ${trigger}`)
    setModelAnimationTrigger(trigger)
  }

  return (
    <>
      <SceneCameraController sceneIndex={sceneIndex} />
      <AnimationController
        sceneIndex={sceneIndex}
        modelLoaded={modelLoaded}
        onWaterLevelUpdate={handleWaterLevelUpdate}
        animationTrigger={animationTrigger}
        onModelAnimationTrigger={handleModelAnimationTrigger}
        onAnimationComplete={onAnimationComplete}
      />

      <CameraController targetPosition={cameraTarget} onMoveComplete={onCameraMoveComplete} />

      {!showWater && (
        <>
          <fog attach='fog' args={['black', 0, 3000]} />
          <hemisphereLight intensity={0.5} color='white' groundColor='#f88' />
          <directionalLight
            color='orange'
            intensity={2}
            position={[30, 20, 30]}
            castShadow
            shadow-mapSize={1024}
            shadow-bias={-0.0004}
          />
          <EffectComposer multisampling={8}>
            <N8AO aoRadius={10} distanceFalloff={0.9} intensity={3} screenSpaceRadius halfRes />
            <TiltShift2 />
          </EffectComposer>
        </>
      )}

      <ModelRenderer
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
        enablePan={!showIntro}
        enableZoom={!showIntro}
        enableRotate={!showIntro}
        minDistance={0.1}
        maxDistance={35}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
      />

      <CameraLogger />
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

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const handleSceneChange = (newSceneIndex: number) => {
    setSceneIndex(newSceneIndex)
    setIsLoaded(false)
    setAnimationTrigger(false)
    setShowSpeechBubble(false)
    setCameraTarget(null)
  }

  const handleWaterLevelUpdate = (level: number) => {
    setWaterLevel(level)
  }

  const handleModelLoaded = () => {
    // 모델 로드 완료 처리
  }

  const handleAnimationComplete = () => {
    // Step 2에서만 speech bubble 표시
    if (sceneIndex === 2) {
      setShowSpeechBubble(true)
    }
  }

  const handleSpeechBubbleClick = () => {
    const targetPosition = new THREE.Vector3(5, 2, 5)
    setCameraTarget(targetPosition)
    setShowSpeechBubble(false)
  }

  const handleCameraMoveComplete = () => {
    setCameraTarget(null)
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
      setAnimationTrigger(true)

      setTimeout(() => {
        setAnimationTrigger(false)
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
          />
        </Scene>
      </div>

      {!showIntro && isLoaded && (
        <div className='absolute bottom-0 left-[50%] text-center p-4 bg-black text-white translate-x-[-50%]'>
          <p className='text-lg font-medium'>{sceneDescriptions[sceneIndex]}</p>
        </div>
      )}

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title={`공룡 화석이 만들어지는 \n과정 알아보기`}
          description={['공룡 화석은 어떻게 만들어지는지 알아봅시다.']}
          backgroundSvg='/img/cover/5-1-1.svg'
        />
      )}
    </div>
  )
}