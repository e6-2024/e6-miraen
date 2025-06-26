import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, Sky, TransformControls, useProgress } from '@react-three/drei'
import { Model } from '../components/6-1-3/Model'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useState, useRef, useEffect, useMemo, Suspense } from 'react'
import * as THREE from 'three'
import { WaterFlowAnimation } from '../components/6-1-3/WaterFlowAnimation'
import { ControlPoint } from '../components/6-1-3/ControlPoint'

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
  // 기본 경로 점들
  const defaultPathPoints = [
    new THREE.Vector3(1.48, -5.0, 0.82), // 1
    new THREE.Vector3(1.62, -3.42, 0.92), // 2
    new THREE.Vector3(1.6, -2.01, 1.9), // 3
    new THREE.Vector3(-0.18, 0.17, 0.47), // 4
    new THREE.Vector3(0, 1.52, 0.24), // 5
    new THREE.Vector3(-0.07, 3.61, 0.27), // 6
    new THREE.Vector3(0.35, 6.28, 0.37), // 7
    new THREE.Vector3(0.35, 8.18, 0.37), // 8
    new THREE.Vector3(0.83, 8.11, 1.07), // 9
    new THREE.Vector3(1.16, 8.11, 1.84), // 10
    new THREE.Vector3(1.16, 8.65, 1.38), // 11
    new THREE.Vector3(1.16, 9.34, 1.51), // 12
    new THREE.Vector3(2.15, 10.1, 1.36), // 13
  ]

  const sceneRef = useRef<THREE.Group>(null)
  const orbitControlsRef = useRef<any>(null)
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false)
  const [showPath, setShowPath] = useState(true)
  const [showTransformControls, setShowTransformControls] = useState(false)
  const [currentPath, setCurrentPath] = useState(defaultPathPoints)
  const [isLoading, setIsLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const [selectedPointPosition, setSelectedPointPosition] = useState<THREE.Vector3 | null>(null)

  // Intro 관련 상태 추가
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  // 루프 관련 상태
  const [isLooping, setIsLooping] = useState(true) // 기본적으로 루프 모드
  const [animationSpeed, setAnimationSpeed] = useState(0.8)
  const [trailCount, setTrailCount] = useState(12) // 트레일 화살표 개수
  const [trailSpacing, setTrailSpacing] = useState(0.06) // 트레일 간격

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

  // 모델 로딩 상태 관리
  useEffect(() => {
    // 컴포넌트가 마운트된 후 잠깐 기다렸다가 로딩 완료로 설정
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
    // 루프 모드가 아닐 때만 애니메이션 종료
    if (!isLooping) {
      console.log('물 이동 애니메이션 완료!')
      setIsAnimationPlaying(false)
    }
  }

  // TransformControls로 점 위치 변경 핸들러
  const handlePointPositionChange = (index: number, newPosition: THREE.Vector3) => {
    const newPath = [...currentPath]
    newPath[index] = newPosition.clone()
    setCurrentPath(newPath)
  }

  // 드래그 시작/종료 핸들러
  const handleDragStart = (index: number) => {
    console.log('Drag started for point', index)
    setIsDragging(true)
    setSelectedPointIndex(index)
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false
      console.log('OrbitControls disabled')
    }
  }

  const handleDragEnd = () => {
    console.log('Drag ended')
    setIsDragging(false)
    // 약간의 지연을 두고 OrbitControls 재활성화
    setTimeout(() => {
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = true
        console.log('OrbitControls re-enabled')
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

    const newPath = [...currentPath]
    const currentPos = newPath[selectedPointIndex].clone()
    currentPos[axis] = numValue
    newPath[selectedPointIndex] = currentPos
    setCurrentPath(newPath)
    setSelectedPointPosition(currentPos.clone())
  }

  // 경로 리셋 함수
  const resetPath = () => {
    setCurrentPath([...defaultPathPoints])
    setSelectedPointIndex(null)
    setSelectedPointPosition(null)
  }

  // 점 삭제 핸들러
  const handleDeletePoint = (indexToDelete: number) => {
    // 시작점과 끝점은 삭제할 수 없음
    if (indexToDelete === 0 || indexToDelete === currentPath.length - 1) {
      alert('시작점과 끝점은 삭제할 수 없습니다.')
      return
    }

    // 최소 3개 점은 유지 (시작점, 중간점 1개, 끝점)
    if (currentPath.length <= 3) {
      alert('최소 3개의 점이 필요합니다.')
      return
    }

    const newPath = currentPath.filter((_, index) => index !== indexToDelete)
    setCurrentPath(newPath)
    setSelectedPointIndex(null)
    setSelectedPointPosition(null)
  }

  // 점 앞에 추가
  const handleAddPointBefore = (targetIndex: number) => {
    let newPosition: THREE.Vector3

    if (targetIndex === 0) {
      // 시작점 앞에 추가 - 시작점에서 약간 뒤로
      const startPos = currentPath[0]
      const secondPos = currentPath[1]
      const direction = startPos.clone().sub(secondPos).normalize()
      newPosition = startPos.clone().add(direction.multiplyScalar(0.3))
    } else {
      // 이전 점과 현재 점의 중간
      const prevPos = currentPath[targetIndex - 1]
      const currentPos = currentPath[targetIndex]
      newPosition = prevPos.clone().lerp(currentPos, 0.5)
    }

    const newPath = [...currentPath]
    newPath.splice(targetIndex, 0, newPosition)
    setCurrentPath(newPath)
    setSelectedPointIndex(targetIndex)
    setSelectedPointPosition(newPosition.clone())
  }

  // 점 뒤에 추가
  const handleAddPointAfter = (targetIndex: number) => {
    let newPosition: THREE.Vector3

    if (targetIndex === currentPath.length - 1) {
      // 끝점 뒤에 추가 - 끝점에서 약간 앞으로
      const endPos = currentPath[currentPath.length - 1]
      const prevPos = currentPath[currentPath.length - 2]
      const direction = endPos.clone().sub(prevPos).normalize()
      newPosition = endPos.clone().add(direction.multiplyScalar(0.3))
    } else {
      // 현재 점과 다음 점의 중간
      const currentPos = currentPath[targetIndex]
      const nextPos = currentPath[targetIndex + 1]
      newPosition = currentPos.clone().lerp(nextPos, 0.5)
    }

    const newPath = [...currentPath]
    newPath.splice(targetIndex + 1, 0, newPosition)
    setCurrentPath(newPath)
    setSelectedPointIndex(targetIndex + 1)
    setSelectedPointPosition(newPosition.clone())
  }

  // 경로 중간에 점 추가 (자동으로 최적 위치 찾기)
  const handleAddPointAuto = () => {
    if (currentPath.length >= 15) {
      alert('최대 15개의 점까지만 추가할 수 있습니다.')
      return
    }

    // 가장 긴 구간을 찾아서 중간에 점 추가
    let maxDistance = 0
    let insertIndex = 1

    for (let i = 0; i < currentPath.length - 1; i++) {
      const distance = currentPath[i].distanceTo(currentPath[i + 1])
      if (distance > maxDistance) {
        maxDistance = distance
        insertIndex = i + 1
      }
    }

    handleAddPointAfter(insertIndex - 1)
  }

  // 경로 유효성 검사
  const validPath = useMemo(() => {
    if (!currentPath || currentPath.length < 2) {
      return defaultPathPoints
    }

    const validPoints = currentPath.filter(
      (point) =>
        point &&
        typeof point.x === 'number' &&
        typeof point.y === 'number' &&
        typeof point.z === 'number' &&
        !isNaN(point.x) &&
        !isNaN(point.y) &&
        !isNaN(point.z),
    )

    return validPoints.length >= 2 ? validPoints : defaultPathPoints
  }, [currentPath])

  return (
    <div className='w-screen h-screen bg-white relative'>
      {isLoading && <LoadingSpinner />}

      {/* 컨트롤 패널 - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div className='absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm'>
          <h3 className='text-lg font-semibold mb-3 text-gray-800'>물의 이동 시뮬레이션</h3>

          {isLoading && (
            <div className='text-center py-4 text-gray-600'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
              모델 로딩 중...
            </div>
          )}

          {!isLoading && (
            <div className='space-y-3'>
              {/* 애니메이션 컨트롤 */}
              <div className='flex gap-2'>
                <button
                  onClick={handleStartAnimation}
                  disabled={isAnimationPlaying}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isAnimationPlaying
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}>
                  시작
                </button>
                <button
                  onClick={handleStopAnimation}
                  disabled={!isAnimationPlaying}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !isAnimationPlaying
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}>
                  정지
                </button>
              </div>

              {/* 표시 옵션 */}
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id='showPath'
                    checked={showPath}
                    onChange={(e) => setShowPath(e.target.checked)}
                    className='rounded'
                  />
                  <label htmlFor='showPath' className='text-sm text-gray-700'>
                    이동 경로 표시
                  </label>
                </div>

                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id='showTransformControls'
                    checked={showTransformControls}
                    disabled={isAnimationPlaying}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setShowTransformControls(checked)
                      if (!checked) {
                        setSelectedPointIndex(null)
                        setSelectedPointPosition(null)
                        setIsDragging(false)
                        // OrbitControls 확실히 활성화
                        if (orbitControlsRef.current) {
                          orbitControlsRef.current.enabled = true
                        }
                      }
                    }}
                    className='rounded disabled:opacity-50'
                  />
                  <label
                    htmlFor='showTransformControls'
                    className={`text-sm ${isAnimationPlaying ? 'text-gray-400' : 'text-gray-700'}`}>
                    경로 편집 모드 {isAnimationPlaying ? '(애니메이션 중 비활성화)' : ''}
                  </label>
                </div>
              </div>

              {/* 경로 편집 관련 버튼 */}
              {showTransformControls && (
                <div className='border-t pt-3 space-y-2'>
                  <button
                    onClick={resetPath}
                    className='w-full px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all'>
                    경로 초기화
                  </button>

                  {/* 선택된 점 정보 */}
                  {selectedPointIndex !== null && selectedPointPosition && (
                    <div className='bg-blue-50 p-3 rounded-lg border border-blue-200'>
                      <div className='text-sm font-medium text-blue-800 mb-2'>
                        점 {selectedPointIndex + 1} 좌표
                        {selectedPointIndex === 0
                          ? ' (시작점)'
                          : selectedPointIndex === validPath.length - 1
                          ? ' (끝점)'
                          : ' (중간점)'}
                      </div>
                      <div className='space-y-2'>
                        {(['x', 'y', 'z'] as const).map((axis) => (
                          <div key={axis} className='flex items-center gap-2'>
                            <span className='w-4 text-xs font-mono uppercase'>{axis}:</span>
                            <input
                              type='number'
                              step='0.1'
                              value={selectedPointPosition[axis].toFixed(2)}
                              onChange={(e) => handleCoordinateChange(axis, e.target.value)}
                              className='flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300'
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='text-xs text-gray-600'>
                    <div className='mb-1 font-medium'>편집 기능:</div>
                    • 빨간점: 시작점 (삭제 불가)
                    <br />
                    • 초록점: 끝점 (삭제 불가)
                    <br />
                    • 주황점: 중간점 (편집 가능)
                    <br />
                    • 노란점: 드래그 중<br />
                    <div className='mt-2 mb-1 font-medium'>조작 방법:</div>
                    • 점 클릭 → 선택 및 좌표 표시
                    <br />
                    • 화살표 드래그 → 점 이동
                    <br />
                    • 좌표 입력창 → 정확한 위치 설정
                    <br />
                    • 앞/뒤 추가 → 선택된 점 기준으로 새 점 추가
                    <br />
                    • 자동 추가 → 가장 긴 구간에 점 추가
                    <br />• 점 삭제 → 중간점만 삭제 가능 (최소 3개 유지)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Scene camera={{ position: [16, 3, 20], fov: 50 }} shadows='soft'>
        <Suspense fallback={null}>
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
            <Model />

            {/* 물 이동 애니메이션 - 로딩 완료 후에만 렌더링 */}
            {!isLoading && validPath.length >= 2 && (
              <WaterFlowAnimation
                arrowSize={4}
                lineWidth={3}
                isPlaying={isAnimationPlaying}
                speed={animationSpeed}
                pathPoints={validPath}
                showPath={showPath}
                onComplete={handleAnimationComplete}
                loop={isLooping} // 루프 모드
                trailCount={trailCount} // 트레일 화살표 개수
                trailSpacing={trailSpacing} // 트레일 간격
              />
            )}

            {/* TransformControls로 조절 가능한 점들 - Intro가 보일 때는 숨김 */}
            {!isLoading &&
              showTransformControls &&
              !showIntro &&
              validPath.map((point, index) => (
                <ControlPoint
                  key={`point-${index}`}
                  position={point}
                  index={index}
                  totalPoints={validPath.length}
                  onPositionChange={handlePointPositionChange}
                  visible={showTransformControls}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onSelect={handlePointSelect}
                  orbitControlsRef={orbitControlsRef}
                />
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
          enableZoom={!showIntro}
          enablePan={!showIntro}
          enableRotate={!showIntro}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={0}
          target={[0, 0, 0]}
          enabled={(!showTransformControls || !isDragging) && !showIntro}
        />
      </Scene>

      {/* Intro 오버레이 - 로딩 완료 후 표시 */}
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