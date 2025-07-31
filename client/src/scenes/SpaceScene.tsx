import { useState, useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Sun, Stars, EarthModel } from '@/components/6-1-4/SpaceObjects'
import { ConstellationModel } from '@/components/6-1-4/ConstellationModel'
import Scene from '@/components/canvas/Scene'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import UI from '@/components/6-1-4/UI'

type Season = 'spring' | 'summer' | 'fall' | 'winter'
const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']

interface SpaceSceneProps {
  onEarthClick: (pos: [number, number, number], season: Season) => void
  cameraTarget: [number, number, number] | null
  activeSeason: Season | null
  isLockedToSurface: boolean
  onReset: () => void
}

const INITIAL_CAMERA_POSITION = new THREE.Vector3(0, 40, 100)
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
  const [resetState, setResetState] = useState(null)
  const [isResetting, setIsResetting] = useState(false)
  const [pendingEarthClick, setPendingEarthClick] = useState<{
    position: [number, number, number]
    season: Season
  } | null>(null)
  const [earthRotationComplete, setEarthRotationComplete] = useState(false)

  const handleEarthClickLocal = (pos, season) => {
    setPendingEarthClick({ position: pos, season })
    setEarthRotationComplete(false)
  }

  const handleEarthRotationComplete = () => {
    if (earthRotationComplete) return
    setEarthRotationComplete(true)
    if (pendingEarthClick) onEarthClick(pendingEarthClick.position, pendingEarthClick.season)
  }

  const handleResetClick = () => {
    if (!controlsRef.current) return
    setIsResetting(true)
    const fromPos = controlsRef.current.object.position.clone()
    const fromTarget = controlsRef.current.target.clone()
    setTimeout(() => {
      setResetState({
        fromPos,
        fromTarget,
        toPos: INITIAL_CAMERA_POSITION.clone(),
        toTarget: INITIAL_CAMERA_TARGET.clone(),
      })
    }, 50)
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
    if (controlsRef.current && cameraTarget) {
      const earthCenter = new THREE.Vector3(...cameraTarget)
      const constellationCenter = earthCenter.clone().add(new THREE.Vector3(0, -5, 0))
      controlsRef.current.target.copy(constellationCenter)
      controlsRef.current.update()
    }
  }

  const playBG2Sound = (audioPath: string = '/sounds/6-1-4/6-1-4-2_zoom-up-2-slower-delay-107050.mp3') => {
    setTimeout(() => {
      try {
        const audio = new Audio(audioPath)
        audio.volume = 0.5
        audio.loop = false

        audio.play().catch((error) => {
          console.log('효과음 재생 실패:', error.name)
        })
      } catch (error) {
        console.log('효과음 생성 실패:', error)
      }
    }, 2000)
  }

  return (
    <div className='absolute inset-0'>
      <Scene camera={{ position: [0, 40, 100], fov: 40 }} shadows>
        <ambientLight intensity={0.5} />
        <pointLight intensity={3000} castShadow />

        {!isLockedToSurface && (
          <>
            <Sun />
            <Stars />
          </>
        )}

        {SEASONS.map((season, i) => {
          const ang = (i * Math.PI) / 2
          const pos: [number, number, number] = [Math.cos(ang) * 30, 0, Math.sin(ang) * 30]
          return (
            <group key={season}>
              {(!isLockedToSurface || activeSeason === season) && (
                <EarthModel
                  position={pos}
                  onClick={
                    !isLockedToSurface
                      ? () => {
                          handleEarthClickLocal(pos, season)
                          playBG2Sound()
                        }
                      : undefined
                  }
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
                  season={activeSeason}
                  visible={!!pendingEarthClick && activeSeason === season}
                  isResetting={isResetting}
                  fadeInDelay={2}
                  fadeSpeed={1}
                />
              </Suspense>
            </group>
          )
        })}

        {pendingEarthClick && earthRotationComplete && !isInteracting && (
          <CameraAnimator
            target={cameraTarget}
            angleOffset={(-3 * Math.PI) / 7 - Math.PI / 35}
            lookAtOffsetY={13}
            onFinish={onMoveFinished}
          />
        )}
        {resetState && <ResetAnimator {...resetState} controlsRef={controlsRef} onFinish={onResetFinished} />}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom
          enableRotate
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          minDistance={0}
          maxDistance={isLockedToSurface ? 20 : 120}
        />
      </Scene>
      <UI isLockedToSurface={isLockedToSurface} activeSeason={activeSeason} onReset={handleResetClick} />
    </div>
  )
}

function CameraAnimator({
  target,
  angleOffset = 0,
  lookAtOffsetY = 0,
  onFinish,
}: {
  target: [number, number, number] | null
  angleOffset?: number
  lookAtOffsetY?: number
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

    // FOV 저장
    const persp = camera as THREE.PerspectiveCamera
    if (persp.fov !== undefined) originalFov.current = persp.fov

    const earthCenter = new THREE.Vector3(...target)
    const constellationCenter = earthCenter.clone().add(new THREE.Vector3(0, 5, 0))

    // 시작 벡터
    startRef.current = camera.position.clone().sub(constellationCenter)

    // angleOffset 로테이션
    const toSun = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), earthCenter).normalize()
    let nightDir = toSun.clone().negate()
    nightDir.y = Math.abs(nightDir.y) || 0.1
    const rotAxis = new THREE.Vector3().crossVectors(nightDir, new THREE.Vector3(0, 1, 0)).normalize()
    nightDir.applyAxisAngle(rotAxis, angleOffset)

    // 거리 조정
    const offset = nightDir.multiplyScalar(6)
    const endVec = constellationCenter.clone().add(offset)
    endRef.current = endVec.sub(constellationCenter)
  }, [target, angleOffset, camera])

  useFrame((_, delta) => {
    if (!startRef.current || !endRef.current || !target) return

    // 진행률 업데이트
    progress.current = Math.min(progress.current + delta * 0.5, 1)
    const t = progress.current
    const eased = t * t * (3 - 2 * t)

    const earthCenter = new THREE.Vector3(...target)
    const constellationCenter = earthCenter.clone() // y-offset은 lookAt 시에만 사용

    // 위치 보간
    const curVec = startRef.current.clone().lerp(endRef.current, eased)
    const newPos = constellationCenter.clone().add(curVec)
    camera.position.copy(newPos)

    // FOV 보간 (광각 효과)
    const persp = camera as THREE.PerspectiveCamera
    if (persp.fov !== undefined) {
      persp.fov = THREE.MathUtils.lerp(originalFov.current, 70, eased)
      persp.updateProjectionMatrix()
    }

    // lookAt 시 Y 오프셋 추가
    const lookTarget = constellationCenter.clone().add(new THREE.Vector3(0, lookAtOffsetY, 0))
    camera.lookAt(lookTarget)

    // 완료 체크
    if (t === 1 && !finished.current) {
      finished.current = true
      onFinish?.()
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
      controlsRef.current.maxDistance = THREE.MathUtils.lerp(20, 120, eased)
    }

    controlsRef.current.update()

    if (t === 1) {
      onFinish?.()
    }
  })

  return null
}
