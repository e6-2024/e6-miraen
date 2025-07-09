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
  new THREE.Vector3(14, 19, 14),
  new THREE.Vector3(10.45, 4.68, 4.93),
  new THREE.Vector3(16.498, 8.874, 4.258),
]

function LoadingTracker({ onLoadingComplete }) {
  const { progress, active } = useProgress()
  
  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])
  
  return null
}

function BoxWithoutTop({ position = [0, 0, 0], waterLevel = -2.0 }) {
  const width = 22.5
  const height = 3.5
  const depth = 23.5
  
  const adjustedPosition = [position[0], waterLevel - height/2, position[2]]
  
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

function SceneCameraController({ sceneIndex }) {
  const { camera } = useThree()

  useEffect(() => {
    const pos = cameraPositions[sceneIndex]
    camera.position.copy(pos)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [sceneIndex, camera])

  return null
}

// 각 STEP별 애니메이션 컨트롤러
function StepAnimationController({ sceneIndex, modelLoaded, onWaterLevelUpdate, animationTrigger, onModelAnimationTrigger }) {
  const animationStateRef = useRef({
    isAnimating: false,
    currentWaterLevel: -2.0,
    lastSceneIndex: -1,
    animationIntervalId: null
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
      
      // 각 씬별 초기 상태 설정
      if (sceneIndex === 1) {
        state.currentWaterLevel = -0.5
      } else if (sceneIndex === 2) {
        state.currentWaterLevel = -0.5
      } else {
        state.currentWaterLevel = -2.0
      }
      
      onWaterLevelUpdate(state.currentWaterLevel)
    }
  }, [sceneIndex, onWaterLevelUpdate])

  // Play 버튼 클릭 시 각 STEP에 맞는 애니메이션 실행
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
          case 2: // STEP 3 - 퇴적물 애니메이션 (구현 예정)
            startSedimentAnimation()
            break
          case 3: // STEP 4 - 화석 발견 애니메이션 (구현 예정)
            startFossilDiscoveryAnimation()
            break
        }
      }, 300)
    }
  }, [animationTrigger, modelLoaded, sceneIndex, onWaterLevelUpdate])

  // STEP 1: 공룡 모델 애니메이션
  const startDinosaurAnimation = () => {
    console.log('공룡 애니메이션 시작')
    // Model 컴포넌트에 애니메이션 트리거 신호 전송 (매번 새로운 값으로)
    onModelAnimationTrigger && onModelAnimationTrigger(Date.now())
  }

  // STEP 2: 물 레벨 애니메이션
  const startWaterLevelAnimation = (state, updateCallback) => {
    if (state.isAnimating || state.animationIntervalId) return
    
    console.log('물 레벨 애니메이션 시작')
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
        console.log('물 레벨 애니메이션 완료')
      }
    }, 50)
  }

  // STEP 3: 퇴적물 애니메이션 (구현 예정)
  const startSedimentAnimation = () => {
    console.log('퇴적물 애니메이션 시작 (구현 예정)')
    // TODO: 퇴적물이 쌓이는 애니메이션 구현
    // 예: 파티클 시스템으로 퇴적물이 천천히 쌓이는 효과
  }

  // STEP 4: 화석 발견 애니메이션 (구현 예정)
  const startFossilDiscoveryAnimation = () => {
    console.log('화석 발견 애니메이션 시작 (구현 예정)')
    // TODO: 지층이 깎이면서 화석이 드러나는 애니메이션 구현
    // 예: 지층 메쉬가 서서히 사라지면서 화석이 드러나는 효과
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

function SceneContent({ sceneIndex, waterLevel, handleWaterLevelUpdate, handleModelLoaded, showIntro, animationTrigger }) {
  const [modelAnimationTrigger, setModelAnimationTrigger] = useState(0) // number로 변경
  const showWater = sceneIndex === 1
  const currentModelPath = modelPaths[sceneIndex]
  const modelLoaded = true
  
  const modelPosition = sceneIndex === 1 ? [-2.6, -7, -2.0] : [1.5, -7, -2.0]

  const handleModelAnimationTrigger = (trigger) => {
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

      <Model
        key={`model-${sceneIndex}-${currentModelPath}`}
        path={currentModelPath}
        scale={3.7}
        position={modelPosition}
        sceneIndex={sceneIndex}
        onLoaded={handleModelLoaded}
        animationTrigger={sceneIndex === 0 ? modelAnimationTrigger : 0}
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
    </>
  )
}

export default function FossilViewer() {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [waterLevel, setWaterLevel] = useState(-2.0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const [isPlayButtonPressed, setIsPlayButtonPressed] = useState(false)

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const handleSceneChange = (newSceneIndex) => {
    setSceneIndex(newSceneIndex)
    setIsLoaded(false)
    setAnimationTrigger(false) // 씬 변경 시 애니메이션 트리거 초기화
  }

  const handleWaterLevelUpdate = (level) => {
    setWaterLevel(level)
  }

  const handleModelLoaded = () => {
    // 모델 로드 완료 처리
  }

  const playClickSound = (audioPath = '/sounds/Enter_Cute.mp3') => {
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
      setAnimationTrigger(prev => !prev) // 애니메이션 트리거
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