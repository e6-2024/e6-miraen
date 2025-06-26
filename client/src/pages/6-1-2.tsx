// pages/index.tsx or App.tsx
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, Sky, useProgress } from '@react-three/drei'
import Model from '../components/6-1-2/Model'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { LensFlare } from '@andersonmancini/lens-flare'
import { EffectComposer } from '@react-three/postprocessing'

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

// 카메라 컨트롤 컴포넌트
function CameraController({
  targetName,
  isFollowing,
  sceneRef,
  showIntro
}: {
  targetName: string | null
  isFollowing: boolean
  sceneRef: React.RefObject<THREE.Group>
  showIntro: boolean
}) {
  const { camera } = useThree()
  const orbitControlsRef = useRef<any>()

  // 각 오브젝트별 카메라 오프셋 설정
  const getCameraOffset = (targetName: string) => {
    switch (targetName) {
      case 'Mesh123': // 말
        return { x: 0, y: 2.5, z: -1 }
      case 'Wheel_A': // 자동차
        return { x: -1.2, y: 2, z: -2.9 }
      case 'female_genericMesh2': // 사람
        return { x: 0, y: 1.5, z: -3 }
      case 'Male_Head': // 자전거
        return { x: 0, y: 1.5, z: -3 }
      case 'bridge': // 기차
        return { x: 0, y: -0.2, z: -14 }
      default:
        return { x: 0, y: 2, z: -5 }
    }
  }

  // 특정 이름의 오브젝트를 찾는 함수
  const findTargetByName = (targetName: string) => {
    if (!sceneRef.current) return null

    let targetObject: THREE.Object3D | null = null

    sceneRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === targetName) {
        targetObject = child
      }
    })

    if (targetObject) {
      console.log(`Object with name "${targetName}" not found`)
      // 사용 가능한 객체들을 다시 보여줌
      const allObjects: string[] = []
      sceneRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name) {
          allObjects.push(child.name)
        }
      })
      console.log('Available object names:', allObjects.slice(0, 250)) // 처음 20개만 표시
    }

    return targetObject
  }

  useFrame(() => {
    if (isFollowing && targetName && sceneRef.current) {
      const targetObject = findTargetByName(targetName)

      if (targetObject) {
        // 타겟 오브젝트의 위치 가져오기
        const targetPosition = new THREE.Vector3()
        targetObject.getWorldPosition(targetPosition)

        // 오브젝트별 맞춤 offset 적용 (카메라 위치만 조절)
        const offsetConfig = getCameraOffset(targetName)
        const offset = new THREE.Vector3(offsetConfig.x, offsetConfig.y, offsetConfig.z)
        const cameraPosition = targetPosition.clone().add(offset)

        // 카메라 위치를 즉시 업데이트 (lerp 제거로 지연 없음)
        camera.position.copy(cameraPosition)

        // 카메라가 항상 +X축 방향을 바라보도록 설정 (절대 방향)
        const lookAtDirection = camera.position.clone().add(new THREE.Vector3(0, 0, 1))
        camera.lookAt(lookAtDirection)

        // OrbitControls 타겟도 즉시 업데이트
        if (orbitControlsRef.current) {
          orbitControlsRef.current.target.copy(lookAtDirection)
        }
      }
    }
  })

  return (
    <OrbitControls
      ref={orbitControlsRef}
      enabled={!isFollowing && !showIntro} // 따라가기 모드이거나 Intro가 보일 때는 수동 조작 비활성화
    />
  )
}

export default function Home() {
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false)
  const [currentView, setCurrentView] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const sceneRef = useRef<THREE.Group>(null)

  // Intro 관련 상태 추가
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const handleLoadingComplete = () => {
    setIsLoaded(true)
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

  const handleStartAnimation = () => {
    setIsAnimationPlaying(true)
  }

  const handleViewChange = (targetName: string) => {
    setCurrentView(targetName)
    setIsFollowing(true)
  }

  const handleResetView = () => {
    setIsFollowing(false)
    setCurrentView(null)
  }

  const handleOffsetChange = (axis: 'x' | 'y' | 'z', value: number) => {
    // UI 조정 기능 제거됨 - 이제 코드에서 직접 설정
  }

  const viewButtons = [
    { name: '달리는 말 시점', targetName: 'Mesh123' }, // 말의 몸체
    { name: '자동차 시점', targetName: 'Wheel_A' }, // 자동차 메인 메쉬
    { name: '달리는 사람 시점', targetName: 'female_genericMesh2' }, // 사람 베이스 메쉬
    { name: '자전거 시점', targetName: 'Male_Head' }, // 자전거 바퀴
    { name: '기차 시점', targetName: 'bridge' }, // 기차 브릿지/본체
  ]

  const presetOffsets = [
    // UI 조정 기능 제거됨 - 이제 코드에서 직접 설정
  ]

  return (
    <div className='w-screen h-screen bg-white relative'>
      {/* 컨트롤 패널 - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div className='absolute top-4 right-4 z-10 space-y-2 bg-white/90 p-4 rounded-lg shadow-lg max-w-xs'>
          <button
            onClick={handleStartAnimation}
            disabled={isAnimationPlaying}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
              isAnimationPlaying
                ? 'bg-green-500 text-white cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}>
            {isAnimationPlaying ? '속도 관찰' : '시작하기'}
          </button>

          {isAnimationPlaying && (
            <>
              <div className='space-y-1'>
                {viewButtons.map((button, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleViewChange(button.targetName)}
                    className={`block w-full px-4 py-2 rounded-lg font-medium transition-all ${
                      currentView === button.targetName
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}>
                    {button.name}
                  </button>
                ))}

                <button
                  onClick={handleResetView}
                  className='block w-full px-4 py-2 rounded-lg font-medium bg-gray-500 hover:bg-gray-600 text-white transition-all'>
                  자유 시점
                </button>
              </div>

              {/* 카메라 오프셋 조정 패널 제거됨 - 이제 코드에서 직접 설정 */}
            </>
          )}
        </div>
      )}

      <Scene camera={{ position: [16, 3, 20], fov: 50 }} shadows='soft'>
        {/* 로딩 추적 컴포넌트 추가 */}
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        
        <ambientLight intensity={0.2} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.0001}
        />

        <group ref={sceneRef}>
          <Model
            scale={1}
            position={[0, 0, 0]}
            animationSpeed={isAnimationPlaying ? 0.4 : 0}
            castShadow={true}
            receiveShadow={true}
          />
        </group>

        <CameraController 
          targetName={currentView} 
          isFollowing={isFollowing} 
          sceneRef={sceneRef}
          showIntro={showIntro}
        />

        <Sky
          distance={450000}
          sunPosition={[-10, 0.9, -10]}
          inclination={0.49}
          azimuth={0.25}
          rayleigh={1.2}
          turbidity={1}
          mieCoefficient={0.008}
          mieDirectionalG={0.85}
        />
        <Environment preset={'apartment'} />
      </Scene>

      {/* Intro 오버레이 - 로딩 완료 후 표시 */}
      {isLoaded && showIntro && (
        <Intro 
          onEnter={handleEnterExperience}
          title="물체의 운동"
          description={[
            "운동하는 물체의 이동 거리와 속도를 다양한 시점에서 관찰해 봅시다."
          ]}
          simbolSvgPath="/img/icon/물체의운동.svg"
        />
      )}
    </div>
  )
}