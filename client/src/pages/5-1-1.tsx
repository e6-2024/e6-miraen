import { OrbitControls, useGLTF, Environment, useProgress } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import Model from '../components/5-1-1/Model'
import Ocean from '../components/5-1-1/Ocean'
import { useEffect, useState, useRef } from 'react'
import UnderwaterEnvironment from '@/components/5-1-1/Underwater'
import * as THREE from 'three'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { EffectComposer, TiltShift2, N8AO} from '@react-three/postprocessing'
import { SpeechBubble } from '../components/6-1-1/SpeechBubble'
import CameraLogger from '@/components/CameraLogger'

const modelPaths = [
  'models/5-1-1/1/Dino.gltf',
  'models/5-1-1/2/Dino.gltf',
  'models/5-1-1/3/Dino.gltf',
  'models/5-1-1/4/Dino.gltf',
]

const sceneDescriptions = [
  "공룡이 살아있을 때의 모습입니다.",
  "죽은 공룡의 몸체가 호수나 바다 밑에 가라 앉습니다.",
  "시간이 지나면서 죽은 생물의 몸체 위로 퇴적물이 쌓입니다.", 
  "시간이 지나 지층이 깎여서 사라지면 지층 속에 있던 화석이 지표에 드러나 발견됩니다."
]

const cameraPositions = [
  new THREE.Vector3(-30.01, 3.108, -5.557),
  new THREE.Vector3(14, 19, 14),
  new THREE.Vector3(23.613311588485445, 13.162826461554463, 22.863629867778908),
  new THREE.Vector3(14, 12.25, 15.685)
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

function BoxWithoutTop({ position = [0, 0, 0], waterLevel = -2.0 }: {
  position?: [number, number, number];
  waterLevel?: number;
}) {
  const width = 22.5
  const height = 3.5
  const depth = 23.5
  
  const adjustedPosition: [number, number, number] = [position[0], waterLevel - height/2, position[2]]
  
  return (
    <group position={adjustedPosition}>
      <mesh position={[0, 0, -depth/2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#0084FF" transparent opacity={0.65} side={THREE.DoubleSide}/>
      </mesh>
      
      <mesh position={[0, -height/2, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#0084FF" transparent opacity={0.65} side={THREE.DoubleSide}/>
      </mesh>
      
      <mesh position={[0, 0, depth/2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#0084FF" transparent opacity={0.65} side={THREE.DoubleSide}/>
      </mesh>
      
      <mesh position={[-width/2, 0, 0]} rotation={[0, Math.PI/2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color="#0084FF" transparent opacity={0.65} side={THREE.DoubleSide}/>
      </mesh>
      
      <mesh position={[width/2, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color="#0084FF" transparent opacity={0.65} side={THREE.DoubleSide}/>
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

function LayerRevealShader({ 
  modelRef, 
  animationProgress 
}: {
  modelRef: React.RefObject<THREE.Group>
  animationProgress: number
}) {
  useFrame(() => {
    if (!modelRef.current) return

    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mesh = child as THREE.Mesh
        
        const worldPosition = new THREE.Vector3()
        mesh.getWorldPosition(worldPosition)
        
        const box = new THREE.Box3().setFromObject(modelRef.current!)
        const minY = box.min.y
        const maxY = box.max.y
        const totalHeight = maxY - minY
        
        const normalizedY = (worldPosition.y - minY) / totalHeight
        
        const revealThreshold = animationProgress
        
        if (normalizedY <= revealThreshold) {
          const fadeZone = 0.1 
          const fadeStart = Math.max(0, revealThreshold - fadeZone)
          const opacity = normalizedY >= fadeStart 
            ? (revealThreshold - normalizedY) / fadeZone 
            : 1.0
          
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => {
              mat.transparent = true
              mat.opacity = Math.max(0, Math.min(1, opacity))
              mat.needsUpdate = true
            })
          } else {
            mesh.material.transparent = true
            mesh.material.opacity = Math.max(0, Math.min(1, opacity))
            mesh.material.needsUpdate = true
          }
          
          mesh.visible = true
        } else {
          mesh.visible = false
        }
      }
    })
  })

  return null
}

// 카메라 이동 컴포넌트
function CameraController({ 
  targetPosition, 
  onMoveComplete 
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

    const duration = 2.0 // 2초 동안 이동
    animationProgress.current += delta / duration

    if (animationProgress.current >= 1) {
      // 애니메이션 완료
      camera.position.copy(targetPosition)
      camera.lookAt(0, 0, 0)
      isAnimating.current = false
      animationProgress.current = 0
      onMoveComplete()
      return
    }

    // 부드러운 easing
    const t = animationProgress.current
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    // 위치 보간
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

// 각 STEP별 애니메이션 컨트롤러
function StepAnimationController({ 
  sceneIndex, 
  modelLoaded, 
  onWaterLevelUpdate, 
  animationTrigger, 
  onModelAnimationTrigger,
  onLayerAnimationComplete,
  layerAnimationProgress,
  setLayerAnimationProgress
}: {
  sceneIndex: number;
  modelLoaded: boolean;
  onWaterLevelUpdate: (level: number) => void;
  animationTrigger: boolean;
  onModelAnimationTrigger?: (trigger: number) => void;
  onLayerAnimationComplete: () => void;
  layerAnimationProgress: number;
  setLayerAnimationProgress: (progress: number) => void;
}) {
  const animationStateRef = useRef({
    isAnimating: false,
    currentWaterLevel: -2.0,
    lastSceneIndex: -1,
    animationIntervalId: null,
    layerAnimationId: null
  })

  // 씬 변경 시 초기화
  useEffect(() => {
    const state = animationStateRef.current
    
    if (state.lastSceneIndex !== sceneIndex) {
      state.lastSceneIndex = sceneIndex
      state.isAnimating = false
      
      // 기존 애니메이션 정리
      if (state.animationIntervalId) {
        clearInterval(state.animationIntervalId)
        state.animationIntervalId = null
      }
      if (state.layerAnimationId) {
        clearInterval(state.layerAnimationId)
        state.layerAnimationId = null
      }
      
      // 각 씬별 초기 상태 설정
      if (sceneIndex === 1) {
        state.currentWaterLevel = -0.5
      } else if (sceneIndex === 2) {
        state.currentWaterLevel = -0.5
      } else {
        state.currentWaterLevel = -2.0
      }
      
      onWaterLevelUpdate(state.currentWaterLevel)
      setLayerAnimationProgress(0) // 지층 애니메이션 진행도 초기화
    }
  }, [sceneIndex, onWaterLevelUpdate, setLayerAnimationProgress])

  useEffect(() => {
    if (animationTrigger && modelLoaded) {
      const state = animationStateRef.current
      
      setTimeout(() => {
        switch (sceneIndex) {
          case 0: // STEP 1 - 공룡 모델 애니메이션
            startDinosaurAnimation()
            break
          case 1: // STEP 2 - 물 레벨 애니메이션
            startWaterLevelAnimation(state, onWaterLevelUpdate)
            break
          case 2: // STEP 3 - 지층 누적 애니메이션
            startLayerAccumulationAnimation(state)
            break
          case 3: // STEP 4 - 화석 발견 애니메이션 (구현 예정)
            startFossilDiscoveryAnimation()
            break
        }
      }, 300)
    }
  }, [animationTrigger, modelLoaded, sceneIndex, onWaterLevelUpdate, setLayerAnimationProgress])

  const startDinosaurAnimation = () => {
    const newTrigger = Date.now()
    onModelAnimationTrigger && onModelAnimationTrigger(newTrigger)
  }

  // STEP 2: 물 레벨 애니메이션
  const startWaterLevelAnimation = (state: any, updateCallback: (level: number) => void) => {
    if (state.isAnimating || state.animationIntervalId) return
    
    state.isAnimating = true
    
    const startLevel = -0.5
    const targetLevel = 2.52
    const duration = 10000
    const startTime = Date.now()
    
    state.animationIntervalId = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1.0)
      
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      const currentLevel = startLevel + (targetLevel - startLevel) * eased
      state.currentWaterLevel = currentLevel
      
      updateCallback(currentLevel)

      if (progress >= 1.0) {
        clearInterval(state.animationIntervalId)
        state.animationIntervalId = null
        state.isAnimating = false
      }
    }, 50)
  }

  // STEP 3: 지층 누적 애니메이션
  const startLayerAccumulationAnimation = (state: any) => {
    if (state.isAnimating || state.layerAnimationId) return
    
    state.isAnimating = true
    
    const duration = 8000 // 8초 동안 지층 누적
    const startTime = Date.now()
    
    state.layerAnimationId = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1.0)
      
      // 부드러운 easing 적용
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      setLayerAnimationProgress(eased)

      if (progress >= 1.0) {
        clearInterval(state.layerAnimationId)
        state.layerAnimationId = null
        state.isAnimating = false
        onLayerAnimationComplete()
      }
    }, 50)
  }

  // STEP 4: 화석 발견 애니메이션 (구현 예정)
  const startFossilDiscoveryAnimation = () => {
    console.log('화석 발견 애니메이션 시작 (구현 예정)')
  }

  useEffect(() => {
    return () => {
      const state = animationStateRef.current
      if (state.animationIntervalId) {
        clearInterval(state.animationIntervalId)
      }
      if (state.layerAnimationId) {
        clearInterval(state.layerAnimationId)
      }
    }
  }, [])

  return null
}

function SceneContent({ 
  sceneIndex, 
  waterLevel, 
  handleWaterLevelUpdate, 
  handleModelLoaded, 
  showIntro, 
  animationTrigger,
  layerAnimationProgress,
  setLayerAnimationProgress,
  onLayerAnimationComplete,
  showSpeechBubble,
  onSpeechBubbleClick,
  cameraTarget,
  onCameraMoveComplete
}: {
  sceneIndex: number;
  waterLevel: number;
  handleWaterLevelUpdate: (level: number) => void;
  handleModelLoaded: () => void;
  showIntro: boolean;
  animationTrigger: boolean;
  layerAnimationProgress: number;
  setLayerAnimationProgress: (progress: number) => void;
  onLayerAnimationComplete: () => void;
  showSpeechBubble: boolean;
  onSpeechBubbleClick: () => void;
  cameraTarget: THREE.Vector3 | null;
  onCameraMoveComplete: () => void;
}) {
  const [modelAnimationTrigger, setModelAnimationTrigger] = useState(0)
  const modelRef = useRef<THREE.Group>(null!) // step3 모델 참조용
  const showWater = sceneIndex === 1
  const currentModelPath = modelPaths[sceneIndex]
  const modelLoaded = true
  
  const modelPosition: [number, number, number] = sceneIndex === 1 ? [-2.6, -7, -2.0] : [1.5, -7, -2.0]

  // sceneIndex가 변경될 때마다 modelAnimationTrigger 초기화
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
      <StepAnimationController 
        sceneIndex={sceneIndex}
        modelLoaded={modelLoaded}
        onWaterLevelUpdate={handleWaterLevelUpdate}
        animationTrigger={animationTrigger}
        onModelAnimationTrigger={handleModelAnimationTrigger}
        layerAnimationProgress={layerAnimationProgress}
        setLayerAnimationProgress={setLayerAnimationProgress}
        onLayerAnimationComplete={onLayerAnimationComplete}
      />
      
      {/* 카메라 컨트롤러 */}
      <CameraController 
        targetPosition={cameraTarget}
        onMoveComplete={onCameraMoveComplete}
      />
      
      {!showWater && (
        <>
          <fog attach="fog" args={['black', 0, 3000]} />
          <hemisphereLight intensity={0.5} color="white" groundColor="#f88" />
          <directionalLight 
            color="orange" 
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

      {/* Step3에서는 특별한 처리를 위해 별도로 렌더링 */}
      {sceneIndex === 2 ? (
        <group ref={modelRef}>
          <Model
            key={`model-${sceneIndex}-${currentModelPath}`}
            path={currentModelPath}
            scale={3.7}
            position={modelPosition}
            sceneIndex={sceneIndex}
            onLoaded={handleModelLoaded}
            animationTrigger={0} // step3에서는 모델 애니메이션 사용 안함
          />
          {/* Step3 모델에 지층 쌓이는 효과 적용 */}
          <LayerRevealShader 
            modelRef={modelRef}
            animationProgress={layerAnimationProgress}
          />
        </group>
      ) : (
        <Model
          key={`model-${sceneIndex}-${currentModelPath}`}
          path={currentModelPath}
          scale={3.7}
          position={modelPosition}
          sceneIndex={sceneIndex}
          onLoaded={handleModelLoaded}
          animationTrigger={sceneIndex === 0 ? modelAnimationTrigger : 0}
        />
      )}

      {/* STEP 3에서 지층 애니메이션 완료 후 말풍선 표시 */}
      {sceneIndex === 2 && showSpeechBubble && (
        <SpeechBubble
          position={[0, 0, 0]}
          pointColor='#ff6b6b'
          html='<mark>화석을 자세히 관찰</mark>해보세요!'
          onBubbleClick={onSpeechBubbleClick}
          bubbleOffset={[0, 2, 0]}
        />
      )}

      {showWater && (
        <>
          <Ocean 
            textureScale={1.0}
            textureOpacity={0.83}
            timeSpeed={0.9}
            flowSpeed={0.9}
            waterLevel={waterLevel}
          />
          <BoxWithoutTop waterLevel={waterLevel} />
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

      <CameraLogger/>
    </>
  )
}

export default function FossilViewer() {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [waterLevel, setWaterLevel] = useState(-2.0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [animationTrigger, setAnimationTrigger] = useState(false)
  const [isPlayButtonPressed, setIsPlayButtonPressed] = useState(false)
  const [layerAnimationProgress, setLayerAnimationProgress] = useState(0)
  const [showSpeechBubble, setShowSpeechBubble] = useState(false)
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null)

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const handleSceneChange = (newSceneIndex: number) => {
    setSceneIndex(newSceneIndex)
    setIsLoaded(false)
    setAnimationTrigger(false)
    setLayerAnimationProgress(0)
    setShowSpeechBubble(false)
    setCameraTarget(null)
  }

  const handleWaterLevelUpdate = (level: number) => {
    setWaterLevel(level)
  }

  const handleModelLoaded = () => {
    // 모델 로드 완료 처리
  }

  const handleLayerAnimationComplete = () => {
    setShowSpeechBubble(true)
  }

  const handleSpeechBubbleClick = () => {
    const targetPosition = new THREE.Vector3(5, 2, 5) // 지층을 가까이서 볼 수 있는 위치
    setCameraTarget(targetPosition)
    setShowSpeechBubble(false)
  }

  const handleCameraMoveComplete = () => {
    setCameraTarget(null)
  }

  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch(error => {
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
    }, 300)
  }

  // Play 버튼 클릭 핸들러
  const handlePlayButtonClick = () => {
    playClickSound()
    setIsPlayButtonPressed(true)
    
    // 버튼 눌림 효과
    setTimeout(() => {
      setIsPlayButtonPressed(false)
      setAnimationTrigger(true)
      
      // 트리거를 즉시 false로 리셋하여 한 번만 실행되도록
      setTimeout(() => {
        setAnimationTrigger(false)
      }, 200)
    }, 150)
  }

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden ">
      {!showIntro && (
        <div className="absolute flex flex-row left-1/2 top-4 transform -translate-x-1/2 z-10 justify-center items-center">
          <div className="flex items-center justify-center p-4 text-white z-10">
            {[1, 2, 3, 4].map((num) => (
              <>
                <button
                  key={num-1}
                  onClick={() => handleSceneChange(num-1)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    sceneIndex === num -1
                      ? 'bg-blue-500 shadow-lg' 
                      : 'bg-gray-700/80 hover:bg-gray-600'
                  }`}
                >
                  STEP {num}
                </button>
                {num < 4 && (
                  <div className={`w-5 h-0.5 bg-white`} />
                )}
              </>
            ))}
          </div>

          {/* Play 버튼 */}
          <button
            onClick={handlePlayButtonClick}
            className="w-20 h-20 relative ml-4 z-10 cursor-pointer transition-all duration-150 hover:scale-105"
          >
            {/* 그림자 효과 */}
            <div className={`w-full h-full left-0 absolute bg-amber-700 rounded-full transition-all duration-150 ${
              isPlayButtonPressed ? 'top-0' : 'top-[5px]'
            }`}></div>
            
            {/* 메인 버튼 */}
            <div className={`w-full h-full left-0 absolute bg-gradient-to-b from-amber-400 to-amber-600 rounded-full transition-all duration-150 ${
              isPlayButtonPressed ? 'top-[3px] scale-95' : 'top-0'
            }`}></div>
            
            {/* 아이콘 */}
            <img 
              src='/img/icon/Polygon 1.svg' 
              alt="지층 아이콘" 
              className={`w-10 h-10 absolute ml-1 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
                isPlayButtonPressed ? 'scale-90' : ''
              }`} 
            />
          </button>
        </div>
      )}      

      <div className="flex-1">
        <Scene 
          shadows
          camera={{ position: [0, 10, 10], fov: 50, near: 0.1, far: 5000 }}
          gl={{ 
            shadowMap: { 
              enabled: true, 
              type: THREE.PCFSoftShadowMap
            } 
          }}
        >
          <LoadingTracker onLoadingComplete={handleLoadingComplete} />

          <SceneContent
            sceneIndex={sceneIndex}
            waterLevel={waterLevel}
            handleWaterLevelUpdate={handleWaterLevelUpdate}
            handleModelLoaded={handleModelLoaded}
            showIntro={showIntro}
            animationTrigger={animationTrigger}
            layerAnimationProgress={layerAnimationProgress}
            setLayerAnimationProgress={setLayerAnimationProgress}
            onLayerAnimationComplete={handleLayerAnimationComplete}
            showSpeechBubble={showSpeechBubble}
            onSpeechBubbleClick={handleSpeechBubbleClick}
            cameraTarget={cameraTarget}
            onCameraMoveComplete={handleCameraMoveComplete}
          />
        </Scene>
      </div>

      {!showIntro && isLoaded && (
        <div className="absolute bottom-0 left-[50%] text-center p-4 bg-black text-white translate-x-[-50%]">
          <p className="text-lg font-medium">
            {sceneDescriptions[sceneIndex]}
          </p>
        </div>
      )}

      {isLoaded && showIntro && (
        <Intro 
          onEnter={handleEnterExperience}
          title="지층과 화석"
          description={[
            "옛날에 살았던 생물의 몸체나 흔적이 암석이나 지층 속에 남아 있는 것을 화석이라고 합니다.", 
            "화석을 관찰 하고 화석이 만들어지는 과정을 알아봅시다."
          ]}
          simbolSvgPath="/img/icon/지층.svg"
        />
      )}
    </div>
  )
}