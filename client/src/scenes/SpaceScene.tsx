import { useState, useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Sun, Stars, EarthModel } from '@/components/6-1-4/SpaceObjects'
import { ConstellationModel } from '@/components/6-1-4/ConstellationModel'
import Scene from '@/components/canvas/Scene'

type Season = 'spring' | 'summer' | 'fall' | 'winter'
const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']

interface SpaceSceneProps {
  onEarthClick: (pos: [number, number, number], season: Season) => void
  cameraTarget: [number, number, number] | null
  activeSeason: Season | null
  isLockedToSurface: boolean
  onReset: () => void
}

// 초기 카메라 위치와 타겟을 상수로 정의
const INITIAL_CAMERA_POSITION = new THREE.Vector3(0, 20, 50)
const INITIAL_CAMERA_TARGET = new THREE.Vector3(0, 0, 0)

export default function SpaceScene({
  onEarthClick,
  cameraTarget,
  activeSeason,
  isLockedToSurface,
  onReset,
}: SpaceSceneProps) {
  const controlsRef = useRef<any>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const [resetState, setResetState] = useState<{
    fromPos: THREE.Vector3
    fromTarget: THREE.Vector3
    toPos: THREE.Vector3
    toTarget: THREE.Vector3
  } | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [pendingEarthClick, setPendingEarthClick] = useState<{
    position: [number, number, number]
    season: Season
  } | null>(null)
  const [earthRotationComplete, setEarthRotationComplete] = useState(false)

  const handleEarthClickLocal = (pos: [number, number, number], season: string) => {
    setPendingEarthClick({ position: pos, season: season as Season })
    setEarthRotationComplete(false)
  }

  const handleEarthRotationComplete = () => {
    if (earthRotationComplete) return // 무한 루프 방지

    setEarthRotationComplete(true)

    if (pendingEarthClick) {
      onEarthClick(pendingEarthClick.position, pendingEarthClick.season)
    }
  }

  const handleResetClick = () => {
    if (controlsRef.current) {
      setIsResetting(true)

      const ctrl = controlsRef.current
      const fromPos = ctrl.object.position.clone()
      const fromTarget = ctrl.target.clone()
      
      // 초기 위치로 돌아가도록 수정
      const toPos = INITIAL_CAMERA_POSITION.clone()
      const toTarget = INITIAL_CAMERA_TARGET.clone()

      setTimeout(() => {
        setResetState({ fromPos, fromTarget, toPos, toTarget })
      }, 50)
    }
  }

  const onResetFinished = () => {
    setResetState(null)
    setIsResetting(false)
    setPendingEarthClick(null)
    setEarthRotationComplete(false)
    setIsInteracting(false)
    onReset()
  }

  const onMoveFinished = () => {
    setIsInteracting(true)

    // 카메라 도착 후 OrbitControls 타겟을 ConstellationModel의 실제 위치로 설정
    if (controlsRef.current && cameraTarget) {
      const earthCenter = new THREE.Vector3(...cameraTarget)
      const constellationCenter = earthCenter.clone().add(new THREE.Vector3(0, -5, 0))

      controlsRef.current.target.copy(constellationCenter)

      // 별자리 관찰 모드에서 줌 감도 증가
      controlsRef.current.zoomSpeed = 2.0 // 기본값은 보통 1.0
      controlsRef.current.panSpeed = 1.5 // 패닝 속도도 증가

      // 줌 범위도 조정 (더 가까이, 더 멀리 갈 수 있도록)
      controlsRef.current.minDistance = 0.5
      controlsRef.current.maxDistance = 20

      controlsRef.current.update()
    }
  }

  return (
    <div className='absolute inset-0'>
      {/* 돌아가기 버튼 */}
      {isLockedToSurface && (
        <button
          className='fixed top-4 left-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-lg'
          style={{ zIndex: 9999 }}
          onClick={handleResetClick}>
          돌아가기
        </button>
      )}

      <Scene camera={{ position: [0, 20, 50], fov: 40 }} shadows>
        <ambientLight intensity={0.5} />
        <pointLight color='white' intensity={50} />

        {/* 별자리 관찰 모드가 아닐 때만 태양과 별 표시 */}
        {!isLockedToSurface && (
          <>
            <Sun />
            <Stars />
          </>
        )}

        {SEASONS.map((season, i) => {
          const ang = (i * Math.PI) / 2
          const pos: [number, number, number] = [Math.cos(ang) * 15, 0, Math.sin(ang) * 15]

          return (
            <group key={season}>
              {(!isLockedToSurface || activeSeason === season) && (
                <EarthModel
                  position={pos}
                  onClick={() => handleEarthClickLocal(pos, season)}
                  fadeReady={isLockedToSurface && activeSeason === season && isInteracting}
                  season={season}
                  isResetting={isResetting}
                  onRotationComplete={
                    season === pendingEarthClick?.season && !earthRotationComplete
                      ? handleEarthRotationComplete
                      : undefined
                  }
                  isSelected={season === pendingEarthClick?.season}
                  hideAxisAndLabel={isLockedToSurface && activeSeason === season}
                />
              )}

              <Suspense fallback={null}>
                <ConstellationModel
                  activeSeason={activeSeason}
                  position={pos}
                  visible={isLockedToSurface && activeSeason === season && isInteracting}
                />
              </Suspense>
            </group>
          )
        })}

        {pendingEarthClick && earthRotationComplete && !isInteracting && (
          <CameraAnimator target={cameraTarget} angleOffset={Math.PI / 15} onFinish={onMoveFinished} />
        )}

        {resetState && <ResetAnimator {...resetState} controlsRef={controlsRef} onFinish={onResetFinished} />}

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={0}
          enableRotate={true}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />
      </Scene>
    </div>
  )
}

function CameraAnimator({
  target,
  angleOffset = 0,
  onFinish,
}: {
  target: [number, number, number] | null
  angleOffset?: number
  onFinish?: () => void
}) {
  const { camera } = useThree()
  const startRef = useRef<THREE.Vector3 | null>(null)
  const endRef = useRef<THREE.Vector3 | null>(null)
  const progress = useRef(0)
  const finished = useRef(false)
  const originalFov = useRef<number>(0)

  useEffect(() => {
    if (!target) return

    finished.current = false
    progress.current = 0

    // PerspectiveCamera로 타입 단언하고 FOV 저장
    const perspectiveCamera = camera as THREE.PerspectiveCamera
    if (perspectiveCamera.fov !== undefined) {
      originalFov.current = perspectiveCamera.fov
    }

    const earthCenter = new THREE.Vector3(...target)

    // ConstellationModel의 실제 위치 (지구 중심에서 y축으로 -5만큼 떨어진 곳)
    const constellationCenter = earthCenter.clone().add(new THREE.Vector3(0, -5, 0))

    startRef.current = camera.position.clone().sub(constellationCenter)

    const toSun = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), earthCenter).normalize()
    let nightDir = toSun.clone().negate()
    nightDir.y = Math.abs(nightDir.y) || 0.1
    const rotAxis = new THREE.Vector3().crossVectors(nightDir, new THREE.Vector3(0, 1, 0)).normalize()
    nightDir.applyAxisAngle(rotAxis, angleOffset)

    // 별자리 중심에서 더 가까운 거리로 카메라 이동 (광각 효과를 위해)
    const offset = nightDir.multiplyScalar(5) // 8에서 5로 줄임
    const endVec = constellationCenter.clone().add(offset)
    endRef.current = endVec.sub(constellationCenter)
  }, [target, angleOffset, camera])

  useFrame((_, delta) => {
    if (!startRef.current || !endRef.current || !target) return

    progress.current = Math.min(progress.current + delta * 0.5, 1)
    const t = progress.current
    const eased = t * t * (3 - 2 * t)
    const curVec = startRef.current.clone().lerp(endRef.current, eased)

    // ConstellationModel의 실제 위치
    const earthCenter = new THREE.Vector3(...target)
    const constellationCenter = earthCenter.clone().add(new THREE.Vector3(0, 0, 0))
    const currentCameraPos = constellationCenter.clone().add(curVec)

    camera.position.copy(currentCameraPos)

    // PerspectiveCamera로 타입 단언하고 FOV를 점진적으로 증가시켜 광각 효과
    const perspectiveCamera = camera as THREE.PerspectiveCamera
    if (perspectiveCamera.fov !== undefined) {
      const targetFov = 60 // 원래 40에서 60으로 증가
      perspectiveCamera.fov = THREE.MathUtils.lerp(originalFov.current, targetFov, eased)
      perspectiveCamera.updateProjectionMatrix()
    }

    if (t === 1 && !finished.current) {
      finished.current = true

      // 카메라가 별자리 중심을 바라보도록 설정
      camera.lookAt(constellationCenter)

      onFinish?.()
    }

    // 카메라가 완료되기 전까지는 별자리 중심을 향해 이동하면서 바라보기
    if (t < 1) {
      camera.lookAt(constellationCenter)
    }
  })

  return null
}

function ResetAnimator({
  fromPos,
  fromTarget,
  toPos,
  toTarget,
  controlsRef,
  onFinish,
}: {
  fromPos: THREE.Vector3
  fromTarget: THREE.Vector3
  toPos: THREE.Vector3
  toTarget: THREE.Vector3
  controlsRef: React.RefObject<any>
  onFinish?: () => void
}) {
  const { camera } = useThree()
  const progress = useRef(0)
  const startFov = useRef(0)

  useEffect(() => {
    progress.current = 0
    // PerspectiveCamera로 타입 단언하고 FOV 저장
    const perspectiveCamera = camera as THREE.PerspectiveCamera
    if (perspectiveCamera.fov !== undefined) {
      startFov.current = perspectiveCamera.fov
    }
  }, [camera])

  useFrame((_, delta) => {
    progress.current = Math.min(progress.current + delta * 0.25, 1)
    const t = progress.current
    const eased = t * t * (3 - 2 * t)

    camera.position.lerpVectors(fromPos, toPos, eased)
    controlsRef.current.target.lerpVectors(fromTarget, toTarget, eased)
    
    // PerspectiveCamera로 타입 단언하고 FOV를 원래 값(40)으로 되돌리기
    const perspectiveCamera = camera as THREE.PerspectiveCamera
    if (perspectiveCamera.fov !== undefined) {
      perspectiveCamera.fov = THREE.MathUtils.lerp(startFov.current, 40, eased)
      perspectiveCamera.updateProjectionMatrix()
    }
    
    // OrbitControls 설정을 원래대로 되돌리기
    if (controlsRef.current) {
      controlsRef.current.zoomSpeed = THREE.MathUtils.lerp(2.0, 1.0, eased)
      controlsRef.current.panSpeed = THREE.MathUtils.lerp(1.5, 1.0, eased)
      controlsRef.current.minDistance = THREE.MathUtils.lerp(0.5, 0, eased)
      controlsRef.current.maxDistance = THREE.MathUtils.lerp(20, Infinity, eased)
    }
    
    controlsRef.current.update()

    if (t === 1) {
      onFinish?.()
    }
  })

  return null
}