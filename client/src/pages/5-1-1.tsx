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
import NavigationUI from '@/components/5-1-1/NavigationUI'

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
function WaterBox({ position = [0, 0, 0], waterLevel = -2.0 }: {
  position?: [number, number, number];
  waterLevel?: number;
}) {
  const width = 22.5
  const height = 4.0
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

// Step 3 지층 누적 애니메이션
function LayerAccumulationAnimation({ 
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

// Step 4 화석 발견 애니메이션
function FossilDiscoveryAnimation({ 
 modelRef, 
 animationProgress,
 onAnimationComplete 
}: {
 modelRef: React.RefObject<THREE.Group>
 animationProgress: number
 onAnimationComplete?: () => void
}) {
 const originalPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map())
 const hasCompletedRef = useRef(false)

 useEffect(() => {
   if (!modelRef.current) return
   
   const sceneGroup = modelRef.current.children[0]?.children[0]
   if (sceneGroup) {
     // 지층 그룹(index 1) 내부의 index 0 저장
     const layerGroup = sceneGroup.children[0]
     if (layerGroup && layerGroup.children[0]) {
       originalPositionsRef.current.set('layer-0', layerGroup.children[0].position.clone())
     }
     
     // 식물들(index 2+) 저장
     sceneGroup.children.forEach((child, index) => {
       if (index >= 2 && child.position) {
         originalPositionsRef.current.set(`scene-${index}`, child.position.clone())
       }
     })
   }
 }, [modelRef.current])

 useFrame(() => {
   if (!modelRef.current || originalPositionsRef.current.size === 0) return

   const sceneGroup = modelRef.current.children[0]?.children[0]
   if (!sceneGroup) return

   const moveDistance = animationProgress * -0.5

   const layerGroup = sceneGroup.children[1]
   if (layerGroup && layerGroup.children[0]) {
     const originalPos = originalPositionsRef.current.get('layer-0')
     if (originalPos) {
       layerGroup.children[0].position.y = originalPos.y - moveDistance
     }
   }

   sceneGroup.children.forEach((child, index) => {
     if (index >= 2) {
       const originalPos = originalPositionsRef.current.get(`scene-${index}`)
       if (child && originalPos) {
         child.position.x = originalPos.x + moveDistance
       }
     }
   })

   if (animationProgress >= 1.0 && !hasCompletedRef.current) {
     hasCompletedRef.current = true
     onAnimationComplete?.()
   }
 })

 useEffect(() => {
   if (animationProgress === 0) {
     hasCompletedRef.current = false
     
     const sceneGroup = modelRef.current?.children[0]?.children[0]
     if (sceneGroup) {
       // 지층 그룹 내부 index 0 복원
       const layerGroup = sceneGroup.children[1]
       if (layerGroup && layerGroup.children[0]) {
         const originalPos = originalPositionsRef.current.get('layer-0')
         if (originalPos) {
           layerGroup.children[0].position.copy(originalPos)
         }
       }
       
       // 식물들 복원
       sceneGroup.children.forEach((child, index) => {
         if (index >= 2) {
           const originalPos = originalPositionsRef.current.get(`scene-${index}`)
           if (child && originalPos) {
             child.position.copy(originalPos)
           }
         }
       })
     }
   }
 }, [animationProgress])

 return null
}

// 애니메이션 컨트롤러
function AnimationController({ 
  sceneIndex, 
  modelLoaded, 
  onWaterLevelUpdate, 
  animationTrigger, 
  onModelAnimationTrigger,
  onAnimationComplete,
  animationProgress,
  setAnimationProgress
}: {
  sceneIndex: number;
  modelLoaded: boolean;
  onWaterLevelUpdate: (level: number) => void;
  animationTrigger: boolean;
  onModelAnimationTrigger?: (trigger: number) => void;
  onAnimationComplete: () => void;
  animationProgress: number;
  setAnimationProgress: (progress: number) => void;
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
      
      if (state.animationIntervalId) {
        clearInterval(state.animationIntervalId)
        state.animationIntervalId = null
      }
      if (state.layerAnimationId) {
        clearInterval(state.layerAnimationId)
        state.layerAnimationId = null
      }
      
      if (sceneIndex === 1) {
        state.currentWaterLevel = -0.5
      } else if (sceneIndex === 2) {
        state.currentWaterLevel = -0.5
      } else {
        state.currentWaterLevel = -2.0
      }
      
      onWaterLevelUpdate(state.currentWaterLevel)

      if (sceneIndex === 2) {
        setAnimationProgress(1.0)
      } else if (sceneIndex === 3) {
        setAnimationProgress(0)
      } else {
        setAnimationProgress(0)
      }
    }
  }, [sceneIndex, onWaterLevelUpdate, setAnimationProgress])

  useEffect(() => {
    if (animationTrigger && modelLoaded) {
      const state = animationStateRef.current
      
      setTimeout(() => {
        switch (sceneIndex) {
          case 0:
            startDinosaurAnimation()
            break
          case 1:
            startWaterLevelAnimation(state, onWaterLevelUpdate)
            break
          case 2:
          case 3:
            startLayerAnimation(state)
            break
        }
      }, 300)
    }
  }, [animationTrigger, modelLoaded, sceneIndex, onWaterLevelUpdate, setAnimationProgress])

  const startDinosaurAnimation = () => {
    const newTrigger = Date.now()
    onModelAnimationTrigger && onModelAnimationTrigger(newTrigger)
  }

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

  const startLayerAnimation = (state: any) => {
    if (state.isAnimating || state.layerAnimationId) return
    
    state.isAnimating = true
    
    const duration = 8000
    const startTime = Date.now()
    
    state.layerAnimationId = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1.0)
      
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      setAnimationProgress(eased)

      if (progress >= 1.0) {
        clearInterval(state.layerAnimationId)
        state.layerAnimationId = null
        state.isAnimating = false
        onAnimationComplete()
      }
    }, 50)
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

// 3D 모델 렌더링 컴포넌트
function ModelRenderer({ 
  sceneIndex, 
  modelAnimationTrigger, 
  animationProgress, 
  onModelLoaded, 
  onAnimationComplete 
}: {
  sceneIndex: number;
  modelAnimationTrigger: number;
  animationProgress: number;
  onModelLoaded: () => void;
  onAnimationComplete: () => void;
}) {
  const modelRef = useRef<THREE.Group>(null!)
  const currentModelPath = modelPaths[sceneIndex]
  const modelPosition: [number, number, number] = sceneIndex === 1 ? [-2.6, -7, -2.0] : [1.5, -7, -2.0]

  if (sceneIndex === 2) {
    // Step 3: 지층 누적 애니메이션
    return (
      <group ref={modelRef}>
        <Model
          key={`model-${sceneIndex}-${currentModelPath}`}
          path={currentModelPath}
          scale={3.7}
          position={modelPosition}
          sceneIndex={sceneIndex}
          onLoaded={onModelLoaded}
          animationTrigger={0}
        />
        <LayerAccumulationAnimation 
          modelRef={modelRef}
          animationProgress={animationProgress}
        />
      </group>
    )
  } else if (sceneIndex === 3) {
    // Step 4: 화석 발견 애니메이션
    return (
      <group ref={modelRef}>
        <Model
          key={`model-${sceneIndex}-${currentModelPath}`}
          path={currentModelPath}
          scale={3.7}
          position={modelPosition}
          sceneIndex={sceneIndex}
          onLoaded={onModelLoaded}
          animationTrigger={0}
        />
        <FossilDiscoveryAnimation
          modelRef={modelRef}
          animationProgress={animationProgress}
          onAnimationComplete={onAnimationComplete}
        />
      </group>
    )
  } else {
    // Step 1, 2: 일반 모델 렌더링
    return (
      <Model
        key={`model-${sceneIndex}-${currentModelPath}`}
        path={currentModelPath}
        scale={3.7}
        position={modelPosition}
        sceneIndex={sceneIndex}
        onLoaded={onModelLoaded}
        animationTrigger={sceneIndex === 0 ? modelAnimationTrigger : 0}
      />
    )
  }
}

// 3D 씬 컨텐츠
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
        animationProgress={layerAnimationProgress}
        setAnimationProgress={setLayerAnimationProgress}
        onAnimationComplete={onLayerAnimationComplete}
      />
      
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

      <ModelRenderer
        sceneIndex={sceneIndex}
        modelAnimationTrigger={modelAnimationTrigger}
        animationProgress={layerAnimationProgress}
        onModelLoaded={handleModelLoaded}
        onAnimationComplete={onLayerAnimationComplete}
      />

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
      audio.volume = 0.7
      audio.play().catch(error => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const playClickButtonSound = (audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch(error => {
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
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      {!showIntro && (
        <NavigationUI
          sceneIndex={sceneIndex}
          onSceneChange={handleSceneChange}
          onPlayClick={handlePlayButtonClick}
          isPlayButtonPressed={isPlayButtonPressed}
        />
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
          title="공룡 화석이 만들어지는 과정 알아보기"
          description={[
            "공룡 화석은 어떻게 만들어지는지 알아봅시다."
          ]}
          simbolSvgPath="/img/icon/background1.svg"
        />
      )}
    </div>
  )
}