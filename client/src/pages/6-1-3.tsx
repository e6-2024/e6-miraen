import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, Sky, TransformControls, useProgress } from '@react-three/drei'
import { Model } from '../components/6-1-3/Model'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useState, useRef, useEffect, useMemo, Suspense } from 'react'
import * as THREE from 'three'
import { WaterFlowAnimation } from '../components/6-1-3/WaterFlowAnimation'
import { ControlPoint } from '../components/6-1-3/ControlPoint'

// 카메라 애니메이션 컴포넌트
function CameraAnimator({ 
  targetPosition, 
  targetLookAt, 
  onAnimationComplete 
}: { 
  targetPosition: THREE.Vector3 | null
  targetLookAt: THREE.Vector3 | null
  onAnimationComplete: () => void 
}) {
  const { camera } = useThree()
  const startPosition = useRef<THREE.Vector3>(new THREE.Vector3())
  const startLookAt = useRef<THREE.Vector3>(new THREE.Vector3())
  const animationProgress = useRef(0)
  const isAnimating = useRef(false)

  useFrame((state, delta) => {
    if (!targetPosition || !targetLookAt || !isAnimating.current) return

    const duration = 2.0 // 애니메이션 지속 시간 (초)
    animationProgress.current += delta / duration

    if (animationProgress.current >= 1) {
      // 애니메이션 완료
      camera.position.copy(targetPosition)
      camera.lookAt(targetLookAt)
      isAnimating.current = false
      animationProgress.current = 0
      onAnimationComplete()
      return
    }

    // 부드러운 easing (easeInOutCubic)
    const t = animationProgress.current
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    // 위치 보간
    const currentPosition = startPosition.current.clone().lerp(targetPosition, eased)
    const currentLookAt = startLookAt.current.clone().lerp(targetLookAt, eased)

    camera.position.copy(currentPosition)
    camera.lookAt(currentLookAt)
  })

  useEffect(() => {
    if (targetPosition && targetLookAt) {
      startPosition.current.copy(camera.position)
      startLookAt.current.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(10))
      animationProgress.current = 0
      isAnimating.current = true
    }
  }, [targetPosition, targetLookAt, camera])

  return null
}

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

// 로딩 스피너 컴포넌트
function LoadingSpinner() {
  return (
    <div className='absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
        <p className='text-gray-600'>3D 모델 로딩 중...</p>
      </div>
    </div>
  )
}

export default function Home() {
  // 기본 경로 정의 (하나만!)
  const [basePathPoints, setBasePathPoints] = useState([
    new THREE.Vector3(3.48, -2.42, 1.82),   // 시작점 (뿌리 부근)
    new THREE.Vector3(1.62, -1.42, 0.92),
    new THREE.Vector3(1.62, -1, 0.2),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 1.52, 0.24),
    new THREE.Vector3(-0.07, 3.61, 0.27),
    new THREE.Vector3(0.35, 6.28, 0.37),
    new THREE.Vector3(0.35, 8.18, 0.37),
    new THREE.Vector3(0.83, 8.11, 1.07),
    new THREE.Vector3(1.16, 8.11, 1.84),
    new THREE.Vector3(1.16, 8.65, 1.38),
    new THREE.Vector3(1.16, 9.34, 1.51),
    new THREE.Vector3(2.15, 10.1, 1.36),  // 끝점 (잎 끝)
  ])

  // 3개 경로의 설정 (회전과 색상만)
  const waterFlowConfigs = [
    { rotation: 0, color: '#4fc3f7', name: '물길 1', isActive: true },
    { rotation: Math.PI * 2 / 3, color: '#81c784', name: '물길 2', isActive: true }, // 120도 회전
    { rotation: Math.PI * 4 / 3, color: '#ff8a65', name: '물길 3', isActive: true }, // 240도 회전
  ]

  const [activeConfigs, setActiveConfigs] = useState(waterFlowConfigs)
  const sceneRef = useRef<THREE.Group>(null)
  const orbitControlsRef = useRef<any>(null)
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(true)
  const [showPath, setShowPath] = useState(true)
  const [showTransformControls, setShowTransformControls] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const [selectedPointPosition, setSelectedPointPosition] = useState<THREE.Vector3 | null>(null)

  // Intro 관련 상태 추가
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  // 루프 관련 상태
  const [isLooping, setIsLooping] = useState(true)
  const [animationSpeed, setAnimationSpeed] = useState(0.8)
  const [trailCount, setTrailCount] = useState(12)
  const [trailSpacing, setTrailSpacing] = useState(0.06)

  // 카메라 애니메이션 관련 상태
  const [cameraTarget, setCameraTarget] = useState<{
    position: THREE.Vector3
    lookAt: THREE.Vector3
  } | null>(null)
  const [isViewingSpecificPart, setIsViewingSpecificPart] = useState(false)
  const [originalCameraState, setOriginalCameraState] = useState<{
    position: THREE.Vector3
    lookAt: THREE.Vector3
  } | null>(null)

  // 카메라 위치 프리셋
  const cameraPresets = {
    default: {
      position: new THREE.Vector3(16, 3, 20),
      lookAt: new THREE.Vector3(0, 0, 0)
    },
    leaf: {
      position: new THREE.Vector3(4, 10, 6),
      lookAt: new THREE.Vector3(3, 8.5, 1.4) // 잎 부분 중심
    },
    root: {
      position: new THREE.Vector3(8, -4, 12),
      lookAt: new THREE.Vector3(3, -2, 1.5) // 뿌리 부분 중심
    }
  }

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
    playClickSound()
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }

  // 카메라 애니메이션 핸들러
  const handleCameraMove = (preset: 'leaf' | 'root' | 'default') => {
    // 카메라 이동 버튼에서는 소리 제거
    
    // 첫 번째 이동이면 현재 카메라 상태 저장
    if (!isViewingSpecificPart && preset !== 'default') {
      setOriginalCameraState({
        position: new THREE.Vector3(16, 3, 20),
        lookAt: new THREE.Vector3(0, 0, 0)
      })
    }

    const targetPreset = cameraPresets[preset]
    setCameraTarget(targetPreset)
    
    // OrbitControls 비활성화 (특정 부분 보기 시)
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false
    }
    
    if (preset === 'default') {
      setIsViewingSpecificPart(false)
    } else {
      setIsViewingSpecificPart(true)
    }
  }

  const handleCameraAnimationComplete = () => {
    // OrbitControls는 전체 뷰일 때만 활성화
    if (orbitControlsRef.current && !isViewingSpecificPart) {
      orbitControlsRef.current.enabled = true
    }
    setCameraTarget(null)
  }

  // 모델 로딩 상태 관리
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // 애니메이션 시작 시 편집 모드 비활성화
  useEffect(() => {
    if (isAnimationPlaying && showTransformControls) {
      setShowTransformControls(false)
      setSelectedPointIndex(null)
      setSelectedPointPosition(null)
    }
  }, [isAnimationPlaying, showTransformControls])

  // 경로 활성화/비활성화
  const togglePathActive = (index: number) => {
    setActiveConfigs(prev => prev.map((config, i) => 
      i === index 
        ? { ...config, isActive: !config.isActive }
        : config
    ))
  }

  const handleStartAnimation = () => {
    if (!isLoading) {
      setIsAnimationPlaying(true)
      console.log(`물 애니메이션 시작 - 루프: ${isLooping ? '활성' : '비활성'}`)
    }
  }

  const handleStopAnimation = () => {
    setIsAnimationPlaying(false)
    console.log('물 애니메이션 정지')
  }

  const handleAnimationComplete = () => {
    if (!isLooping) {
      console.log('물 이동 애니메이션 완료!')
      setIsAnimationPlaying(false)
    }
  }

  // TransformControls로 점 위치 변경 핸들러
  const handlePointPositionChange = (index: number, newPosition: THREE.Vector3) => {
    const newPoints = [...basePathPoints]
    newPoints[index] = newPosition.clone()
    setBasePathPoints(newPoints)
  }

  // 드래그 시작/종료 핸들러
  const handleDragStart = (index: number) => {
    console.log('Drag started for point', index)
    setIsDragging(true)
    setSelectedPointIndex(index)
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false
    }
  }

  const handleDragEnd = () => {
    console.log('Drag ended')
    setIsDragging(false)
    setTimeout(() => {
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = true
      }
    }, 150)
  }

  // 점 선택 핸들러
  const handlePointSelect = (index: number, position: THREE.Vector3) => {
    setSelectedPointIndex(index)
    setSelectedPointPosition(position.clone())
  }

  // 좌표 직접 입력 핸들러
  const handleCoordinateChange = (axis: 'x' | 'y' | 'z', value: string) => {
    if (selectedPointIndex === null) return

    const numValue = parseFloat(value)
    if (isNaN(numValue)) return

    const newPoints = [...basePathPoints]
    const currentPos = newPoints[selectedPointIndex].clone()
    currentPos[axis] = numValue
    newPoints[selectedPointIndex] = currentPos
    setBasePathPoints(newPoints)
    setSelectedPointPosition(currentPos.clone())
  }

  // 경로 리셋 함수
  const resetPath = () => {
    const defaultPoints = [
      new THREE.Vector3(1.48, -5.0, 0.82),
      new THREE.Vector3(1.62, -3.42, 0.92),
      new THREE.Vector3(1.6, -2.01, 1.9),
      new THREE.Vector3(-0.18, 0.17, 0.47),
      new THREE.Vector3(0, 1.52, 0.24),
      new THREE.Vector3(-0.07, 3.61, 0.27),
      new THREE.Vector3(0.35, 6.28, 0.37),
      new THREE.Vector3(0.35, 8.18, 0.37),
      new THREE.Vector3(1.16, 9.34, 1.51),
      new THREE.Vector3(2.15, 10.1, 1.36),
    ]
    setBasePathPoints(defaultPoints)
    setSelectedPointIndex(null)
    setSelectedPointPosition(null)
  }

  return (
    <div className='w-screen h-screen bg-white relative'>
      {isLoading && <LoadingSpinner />}

      {/* 카메라 컨트롤 버튼들 */}
      {!showIntro && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={() => handleCameraMove('leaf')}
            disabled={cameraTarget !== null}
            className="bg-white rounded-lg px-4 py-2 hover:bg-black hover:text-white"
          >
            잎 보기
          </button>
          
          <button
            onClick={() => handleCameraMove('root')}
            disabled={cameraTarget !== null}
            className="bg-white rounded-lg px-4 py-2 hover:bg-black hover:text-white"
          >
            뿌리 보기
          </button>
          
          {isViewingSpecificPart && (
            <button
              onClick={() => handleCameraMove('default')}
              disabled={cameraTarget !== null}
              className="bg-white rounded-lg px-4 py-2 hover:bg-black hover:text-white"
            >
              되돌아가기
            </button>
          )}
        </div>
      )}

      <Scene camera={{ position: [16, 10, 20], fov: 50 }} shadows='soft'>
        <Suspense fallback={null}>
          <LoadingTracker onLoadingComplete={handleLoadingComplete} />
          
          {/* 카메라 애니메이션 컨트롤러 */}
          <CameraAnimator
            targetPosition={cameraTarget?.position || null}
            targetLookAt={cameraTarget?.lookAt || null}
            onAnimationComplete={handleCameraAnimationComplete}
          />
          
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

          <group ref={sceneRef} position={[0,-2,0]}>
            <Model />

            {/* 활성화된 경로들을 회전시켜서 렌더링 */}
            {activeConfigs
              .filter(config => config.isActive)
              .map((config, index) => (
                <group key={`waterflow-${index}`} rotation={[0, config.rotation, 0]}>
                  <WaterFlowAnimation
                    arrowSize={4}
                    lineWidth={3}
                    isPlaying={isAnimationPlaying}
                    speed={animationSpeed}
                    pathPoints={basePathPoints} // 모든 경로가 같은 기본 경로 사용
                    showPath={showPath}
                    onComplete={handleAnimationComplete}
                    loop={isLooping}
                    trailCount={trailCount}
                    trailSpacing={trailSpacing}
                  />
                </group>
              ))}

          </group>

          <Sky
            distance={4500}
            sunPosition={[-10, 0.7, -10]}
            inclination={0.49}
            azimuth={0.25}
            rayleigh={1.2}
            turbidity={1}
            mieCoefficient={0.08}
            mieDirectionalG={0.85}
          />
          <Environment preset={'sunset'} />
        </Suspense>

        <OrbitControls
          ref={orbitControlsRef}
          enableZoom={!showIntro && !isViewingSpecificPart}
          enablePan={!showIntro && !isViewingSpecificPart}
          enableRotate={!showIntro && !isViewingSpecificPart}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={0}
          target={[0, 0, 0]}
          enabled={(!showTransformControls || !isDragging) && !showIntro && !isViewingSpecificPart}
        />
      </Scene>

      {/* Intro 오버레이 */}
      {isLoaded && showIntro && (
        <Intro 
          onEnter={handleEnterExperience}
          title="식물의 구조와 기능"
          description={[
            "식물은 필요한 물을 뿌리에서 흡수합니다. 식물에 흡수된 물이 어떻게 되는지 알아봅시다."
          ]}
          simbolSvgPath="/img/icon/식물의구조와기능.svg"
        />
      )}
    </div>
  )
}