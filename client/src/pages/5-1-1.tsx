import { OrbitControls, useGLTF, Environment, useProgress } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import Model from '../components/5-1-1/Model'
import Ocean from '../components/5-1-1/Ocean'
import { useEffect, useState, Suspense, useRef } from 'react'
import UnderwaterEnvironment from '@/components/5-1-1/Underwater'
import * as THREE from 'three'
import CameraLogger from '@/components/CameraLogger'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'

const modelPaths = [
  'models/5-1-1/0/Dino.gltf',
  'models/5-1-1/1/Dino.gltf',
  'models/5-1-1/2/Dino.gltf',
  'models/5-1-1/3/Dino.gltf',
  'models/5-1-1/4/Dino.gltf',
]

const sceneDescriptions = [
  "공룡이 살아있을 때의 모습입니다",
  "죽은 생물의 몸체가 호수나 바다에 가라 앉습니다",
  "생물의 몸체 위로 퇴적물이 빠르게 쌓입니다", 
  "퇴적물이 계속 쌓여 지층이 만들어지고, 지층 속에 있던 생물의 몸체는 화석이 됩니다",
  "지층이 드러난 다음 지층이 깎여 화석이 보입니다"
]

// 로딩 상태를 추적하는 컴포넌트
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
  new THREE.Vector3(-34.01, 3.108, -5.557), //씬 0
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

// 애니메이션 컨트롤러 컴포넌트
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

// Scene 내부의 모든 컨텐츠
function SceneContent({ 
  sceneIndex, 
  modelLoaded, 
  waterLevel, 
  handleWaterLevelUpdate, 
  handleModelLoaded, 
  modelPosition, 
  showWater,
  showIntro
}: {
  sceneIndex: number
  modelLoaded: boolean
  waterLevel: number
  handleWaterLevelUpdate: (level: number) => void
  handleModelLoaded: () => void
  modelPosition: [number, number, number]
  showWater: boolean
  showIntro: boolean
}) {
  // 디버깅을 위한 로그 추가
  console.log('SceneContent rendering:', {
    sceneIndex,
    modelPath: modelPaths[sceneIndex],
    pathExists: !!modelPaths[sceneIndex]
  })

  // 유효한 sceneIndex인지 확인
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
      {/* 로딩 추적 컴포넌트 추가 */}
      <LoadingTracker onLoadingComplete={() => {}} />
      
      <SceneCameraController sceneIndex={sceneIndex} />
      <AnimationController 
        sceneIndex={sceneIndex}
        modelLoaded={modelLoaded}
        onWaterLevelUpdate={handleWaterLevelUpdate}
      />
      <CameraLogger />

      {!showWater && (
        <>
          <ambientLight intensity={0.3} />
          <directionalLight 
            castShadow 
            position={[10, 20, 5]} 
            intensity={1.2}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-camera-near={0.1}
            shadow-camera-far={50}
            shadow-bias={-0.0001}
          />
          <pointLight 
            position={[-10, 10, -10]} 
            intensity={0.5}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
        </>
      )}

      <fogExp2 attach="fog" args={['#001122', 0.01]} />

      {/* 모델 로딩 - 안전성 검사 추가 */}
      <Model
        key={`${sceneIndex}-${currentModelPath}`} // 더 구체적인 key
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

      <Environment preset='sunset' />

      {!showWater && (
        <mesh 
          position={[0, -2, 0]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          receiveShadow
        />
      )}

      <OrbitControls 
        enablePan={!showIntro} // Intro가 보일 때는 OrbitControls 비활성화
        enableZoom={!showIntro}
        enableRotate={!showIntro}
        minDistance={10}
        maxDistance={100}
      />
    </>
  )
}

export default function FossilViewer() {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [globalLoaded, setGlobalLoaded] = useState(false) // 전체 프리로드 상태
  const [currentModelLoaded, setCurrentModelLoaded] = useState(false) // 현재 모델 로드 상태
  const [waterLevel, setWaterLevel] = useState(-5)

  // Intro 관련 상태 추가
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const showWater = sceneIndex === 1 || sceneIndex === 2

  // 전체 모델 프리로드
  useEffect(() => {
    async function preloadAll() {
      try {
        console.log('모든 모델 프리로드 시작...')
        await Promise.all(modelPaths.map((path) => useGLTF.preload(path)))
        console.log('모든 모델 프리로드 완료!')
        setGlobalLoaded(true)
        setIsLoaded(true) // 프리로드 완료 시 isLoaded도 true로 설정
      } catch (err) {
        console.error('모델 로딩 실패:', err)
        setGlobalLoaded(true)
        setIsLoaded(true)
      }
    }
    preloadAll()
  }, [])

  // 씬이 변경될 때마다 현재 모델 로드 상태 리셋
  useEffect(() => {
    console.log('씬 변경:', sceneIndex)
    setCurrentModelLoaded(false)
  }, [sceneIndex])

  const handleWaterLevelUpdate = (level: number) => {
    setWaterLevel(level)
  }

  const modelPosition: [number, number, number] = 
    sceneIndex === 2
      ? [-2.0, -7, -2.0]
      : [1.5, -7, -2.0]

  const handleModelLoaded = () => {
    console.log('Model loaded for scene:', sceneIndex)
    if (!currentModelLoaded) {
      setCurrentModelLoaded(true)
    }
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
    // 효과음 재생
    playClickSound()
    
    // 효과음이 재생될 시간을 확보한 후 Intro 숨김
    setTimeout(() => {
      setShowIntro(false)
    }, 300) // 300ms 지연
  }


  return (
    <div className="w-screen h-screen bg-black flex flex-col overflow-hidden">
      {/* 상단 컨트롤 패널 - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div className="flex justify-center gap-2 p-4 bg-gray-900/90 text-white z-10">
          {[0, 1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => setSceneIndex(num)}
              className={`px-4 py-2 rounded-lg transition-all ${
                sceneIndex === num 
                  ? 'bg-blue-500 shadow-lg' 
                  : 'bg-gray-700/80 hover:bg-gray-600'
              }`}
            >
             STEP {num}
            </button>
          ))}
        </div>
      )}

      {/* 설명 텍스트 - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div className="text-center p-4 bg-black text-white">
          <p className="text-lg font-medium">
            {sceneDescriptions[sceneIndex]}
          </p>
        </div>
      )}

      <div className="flex-1">
        <Scene
          shadows
          camera={{ position: [0, 0, 0], fov: 50 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true
            gl.shadowMap.type = THREE.PCFSoftShadowMap
          }}
        >
          <SceneContent
            sceneIndex={sceneIndex}
            modelLoaded={currentModelLoaded}
            waterLevel={waterLevel}
            handleWaterLevelUpdate={handleWaterLevelUpdate}
            handleModelLoaded={handleModelLoaded}
            modelPosition={modelPosition}
            showWater={showWater}
            showIntro={showIntro}
          />
        </Scene>
      </div>

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