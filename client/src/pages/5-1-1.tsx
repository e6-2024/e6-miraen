import { OrbitControls, useGLTF, Environment, useProgress, Sky } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import Model from '../components/5-1-1/Model'
import Ocean from '../components/5-1-1/Ocean'
import { useEffect, useState, Suspense, useRef } from 'react'
import UnderwaterEnvironment from '@/components/5-1-1/Underwater'
import * as THREE from 'three'
import CameraLogger from '@/components/CameraLogger'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { EffectComposer, TiltShift2, N8AO} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'


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

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()
  
  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])
  
  return null
}

function BoxWithoutTop({ position = [0, 0, 0] as [number, number, number]  }) {
  const width = 24
  const height = 5
  const depth = 24
  
  return (
    <group position={position}>
      <mesh position={[0, 0, -depth/2]} rotation={[0, 0, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} side={THREE.DoubleSide}/>
      </mesh>

      <mesh position={[0, -height/2, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} side={THREE.DoubleSide}/>
      </mesh>
      
      {/* 앞면 */}
      <mesh position={[0, 0, depth/2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} side={THREE.DoubleSide}/>
      </mesh>
      
      {/* 왼쪽면 */}
      <mesh position={[-width/2, 0, 0]} rotation={[0, Math.PI/2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} side={THREE.DoubleSide}/>
      </mesh>
      
      {/* 오른쪽면 */}
      <mesh position={[width/2, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} side={THREE.DoubleSide}/>
      </mesh>
    </group>
  )
}

const cameraPositions = [
  new THREE.Vector3(-30.01, 3.108, -5.557), //씬 0
  new THREE.Vector3(14, 19, 14),   // 씬 1
  new THREE.Vector3(14, 19, 14),   // 씬 2
  new THREE.Vector3(10.45, 4.68, 4.93),   // 씬 3
  new THREE.Vector3(16.498, 8.874, 4.258),   // 씬 4
]

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

function AnimationController({ 
  sceneIndex, 
  modelLoaded, 
  onWaterLevelUpdate 
}: { 
  sceneIndex: number
  modelLoaded: boolean
  onWaterLevelUpdate: (level: number) => void 
}) {
  const animationStateRef = useRef({
    isAnimating: false,
    hasStarted: false,
    currentWaterLevel: 2,
    lastSceneIndex: -1,
    modelLoadTime: null as number | null
  })

  useEffect(() => {
    const state = animationStateRef.current
    
    if (state.lastSceneIndex !== sceneIndex) {
      console.log('씬 변경 감지:', sceneIndex)
      state.lastSceneIndex = sceneIndex
      state.isAnimating = false
      state.hasStarted = false
      state.modelLoadTime = null
      
      if (sceneIndex === 1) {
        state.currentWaterLevel = 2.52
      } else {
        state.currentWaterLevel = 2.52
      }
      
      onWaterLevelUpdate(state.currentWaterLevel)
    }
  }, [sceneIndex, onWaterLevelUpdate])

  useEffect(() => {
    const state = animationStateRef.current
    if (modelLoaded && sceneIndex === 1 && !state.modelLoadTime) {
      state.modelLoadTime = Date.now()
      console.log('모델 로드 시점 기록')
    }
  }, [modelLoaded, sceneIndex])

  return null
}

function SceneContent({ 
  sceneIndex, 
  modelLoaded, 
  waterLevel, 
  handleWaterLevelUpdate, 
  handleModelLoaded, 
  modelPosition, 
  showWater,
  showIntro,
  sceneChangeId
}: {
  sceneIndex: number
  modelLoaded: boolean
  waterLevel: number
  handleWaterLevelUpdate: (level: number) => void
  handleModelLoaded: () => void
  modelPosition: [number, number, number]
  showWater: boolean
  showIntro: boolean
  sceneChangeId: number
}) {
  console.log('SceneContent rendering:', {
    sceneIndex,
    modelPath: modelPaths[sceneIndex],
    pathExists: !!modelPaths[sceneIndex],
    sceneChangeId
  })

  if (sceneIndex < 0 || sceneIndex >= modelPaths.length) {
    console.error('Invalid sceneIndex:', sceneIndex)
    return null
  }

  const currentModelPath = modelPaths[sceneIndex]
  
  if (!currentModelPath) {
    console.error('No model path found for sceneIndex:', sceneIndex)
    return null
  }

  return (
    <>
      <SceneCameraController sceneIndex={sceneIndex} />
      <AnimationController 
        sceneIndex={sceneIndex}
        modelLoaded={modelLoaded}
        onWaterLevelUpdate={handleWaterLevelUpdate}
      />
      
      {!showWater && (
        <>
          <fog attach="fog" args={['black', 0, 3000]} />
          <hemisphereLight intensity={0.5} color="white" groundColor="#f88" />
          <directionalLight color="orange" intensity={2} position={[30, 20, 30]} castShadow shadow-mapSize={1024} shadow-bias={-0.0004}>
          </directionalLight>
          <EffectComposer multisampling={8}>
          <N8AO aoRadius={10} distanceFalloff={0.9} intensity={3} screenSpaceRadius halfRes />
            <TiltShift2 />
          </EffectComposer>
        </>
      )}

      <Model
        key={`model-${sceneIndex}-${currentModelPath}-${sceneChangeId}`}
        path={currentModelPath}
        scale={3.7}
        position={modelPosition}
        sceneIndex={sceneIndex}
        onLoaded={handleModelLoaded}
      />

      {showWater && (
        <>
          <Ocean 
            textureScale={1.0}
            textureOpacity={0.83}
            timeSpeed={0.9}
            flowSpeed={0.9}
            waterLevel={waterLevel}
          />
          <BoxWithoutTop />
          <UnderwaterEnvironment sceneIndex={sceneIndex} />
        </>
      )}

      {/* 커스텀 Environment 설정 */}
      <Environment 
        preset='sunset'
        background
        blur={0.6}
      />

      {!showWater && (
        <mesh 
          position={[0, -2, 0]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          receiveShadow
        >
        </mesh>
      )}

      <OrbitControls 
        enablePan={!showIntro}
        enableZoom={!showIntro}
        enableRotate={!showIntro}
        minDistance={0.1}
        maxDistance={35}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
      />
    </>
  )
}

export default function FossilViewer() {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [globalLoaded, setGlobalLoaded] = useState(false)
  const [modelLoadedStates, setModelLoadedStates] = useState<{ [key: number]: boolean }>({})
  const [waterLevel, setWaterLevel] = useState(-5)
  const [sceneChangeId, setSceneChangeId] = useState(0)

  // Intro 관련 상태
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const showWater = sceneIndex === 1

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  // 씬 변경 함수 수정
  const handleSceneChange = (newSceneIndex: number) => {
    console.log('씬 변경 요청:', newSceneIndex)
    setSceneIndex(newSceneIndex)
    setSceneChangeId(prev => prev + 1) // 강제 리마운트를 위한 ID 증가
    
    // 해당 씬의 모델 로드 상태를 false로 리셋
    setModelLoadedStates(prev => ({
      ...prev,
      [newSceneIndex]: false
    }))
  }

  // 현재 씬의 모델 로드 상태 가져오기
  const currentModelLoaded = modelLoadedStates[sceneIndex] || false

  const handleWaterLevelUpdate = (level: number) => {
    setWaterLevel(level)
  }

  const modelPosition: [number, number, number] = 
    sceneIndex === 1
      ? [-2.0, -7, -2.0]
      : [1.5, -7, -2.0]

  const handleModelLoaded = () => {
    console.log('Model loaded for scene:', sceneIndex)
    setModelLoadedStates(prev => ({
      ...prev,
      [sceneIndex]: true
    }))
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

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      {/* 상단 컨트롤 패널 */}
      {!showIntro && (
        <div className="absolute flex justify-center gap-2 p-4 text-white z-10">
          {[1, 2, 3, 4].map((num) => (
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
          ))}
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
            modelLoaded={currentModelLoaded}
            waterLevel={waterLevel}
            handleWaterLevelUpdate={handleWaterLevelUpdate}
            handleModelLoaded={handleModelLoaded}
            modelPosition={modelPosition}
            showWater={showWater}
            showIntro={showIntro}
            sceneChangeId={sceneChangeId}
          />
        </Scene>
      </div>

      {!showIntro && (
        <div className="text-center p-4 bg-black text-white">
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