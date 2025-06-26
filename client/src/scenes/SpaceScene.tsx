// components/SpaceScene.tsx
import { useState, useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, SpotLight } from '@react-three/drei'
import * as THREE from 'three'
import { Sun, Stars, EarthModel } from '@/components/SpaceObjects'
import { ConstellationLayer } from '@/components/ConstellationLayer'

type Season = 'spring' | 'summer' | 'fall' | 'winter'
const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']

interface SpaceSceneProps {
  onEarthClick: (pos: [number, number, number], season: Season) => void
  cameraTarget: [number, number, number] | null
  activeSeason: Season | null
  isLockedToSurface: boolean
  onReset: () => void
}

export default function SpaceScene({
  onEarthClick,
  cameraTarget,
  activeSeason,
  isLockedToSurface,
  onReset,
}: SpaceSceneProps) {
  const controlsRef = useRef<any>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const prevCameraState = useRef<{
    position: THREE.Vector3
    target: THREE.Vector3
  } | null>(null)
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
  
  // 회전 상태 추가 (별자리와 파노라마 공통)
  const [viewRotation, setViewRotation] = useState({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const lastMousePosRef = useRef({ x: 0, y: 0 })

  const handleEarthClickLocal = (pos: [number, number, number], season: string) => {
    if (controlsRef.current && !prevCameraState.current) {
      const ctrl = controlsRef.current
      prevCameraState.current = {
        position: ctrl.object.position.clone(),
        target: ctrl.target.clone(),
      }
    }
    // Type cast season to Season since we know it's one of the valid values
    setPendingEarthClick({ position: pos, season: season as Season });
    setEarthRotationComplete(false);
  }
  
  const handleEarthRotationComplete = () => {
    setEarthRotationComplete(true);
    
    if (pendingEarthClick) {
      onEarthClick(pendingEarthClick.position, pendingEarthClick.season);
    }
  }

  const handleResetClick = () => {
    if (controlsRef.current && prevCameraState.current) {
      setIsResetting(true)
      
      const ctrl = controlsRef.current
      const fromPos = ctrl.object.position.clone()
      const fromTarget = ctrl.target.clone()
      const { position: toPos, target: toTarget } = prevCameraState.current
      
      setTimeout(() => {
        setResetState({ fromPos, fromTarget, toPos, toTarget })
      }, 50);
    }
  }

  useEffect(() => {
    if (cameraTarget && controlsRef.current) {
      controlsRef.current.target.set(...cameraTarget)
      controlsRef.current.update()
    }
    setIsInteracting(false)
  }, [cameraTarget])

  const onResetFinished = () => {
    prevCameraState.current = null
    setResetState(null)
    setIsResetting(false)
    setPendingEarthClick(null)
    setEarthRotationComplete(false)
    onReset()
  }

  const onMoveFinished = () => {
    setIsInteracting(true)
  }

  useEffect(() => {
    if (!isInteracting || !isLockedToSurface) return;
    
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      const dx = (e.clientX - lastMousePosRef.current.x) * 0.005;
      const dy = (e.clientY - lastMousePosRef.current.y) * 0.005;
      
      setViewRotation(prev => ({
        x: prev.x + dy,
        y: prev.y + dx
      }));
      
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };
    
    // 터치 이벤트 핸들러 (모바일 지원)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      
      const dx = (e.touches[0].clientX - lastMousePosRef.current.x) * 0.005;
      const dy = (e.touches[0].clientY - lastMousePosRef.current.y) * 0.005;
      
      setViewRotation(prev => ({
        x: prev.x + dy,
        y: prev.y + dx
      }));
      
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    
    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };
    
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
    
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      // 이벤트 리스너 제거
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      
      // OrbitControls 재활성화
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    };
  }, [isInteracting, isLockedToSurface]);

  // 리셋 시 회전도 초기화
  useEffect(() => {
    if (isResetting) {
      setViewRotation({ x: 0, y: 0 });
    }
  }, [isResetting]);

  return (
    <div className="absolute inset-0">
      {isLockedToSurface && (
        <button
          className="top-4 left-4 px-4 py-2 text-white rounded"
          onClick={handleResetClick}
        >
          돌아가기
        </button>
      )}
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }} shadows>
      {/* <fog attach="fog" args={['#220044', 0, 450]} />         */}
      <ambientLight intensity={0.5} />
        <pointLight color='white' intensity={50} />
        <Suspense fallback={null}>
          <Sun />
          <Stars />
          {SEASONS.map((season, i) => {
            const ang = (i * Math.PI) / 2
            const pos: [number, number, number] = [
              Math.cos(ang) * 2,
              0,
              Math.sin(ang) * 2,
            ]
            if (isLockedToSurface && activeSeason !== season) return null
            return (
              <EarthModel
                key={season}
                position={pos}
                onClick={() => {
                  handleEarthClickLocal(pos, season);
                }}
                fadeReady={isLockedToSurface && activeSeason === season}
                season={season}
                isResetting={isResetting}
                onRotationComplete={season === pendingEarthClick?.season ? handleEarthRotationComplete : undefined}
                isSelected={season === pendingEarthClick?.season}
                rotationX={viewRotation.x}
                rotationY={viewRotation.y}
              />
            )
          })}
          {pendingEarthClick && earthRotationComplete && (
            <CameraAnimator
              target={cameraTarget}
              angleOffset={Math.PI/15}
              onFinish={onMoveFinished}
            />
          )}
          {resetState && (
            <ResetAnimator
              {...resetState}
              controlsRef={controlsRef}
              onFinish={onResetFinished}
            />
          )}
          <ConstellationLayer
            activeSeason={activeSeason}
            enableInteraction={isInteracting}
            fadeOut={!!resetState || isResetting}
            rotationX={viewRotation.x}
            rotationY={viewRotation.y}
            rotationZ={viewRotation.x}
          />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom
          enableRotate={!isInteracting || !isLockedToSurface}
        />
      </Canvas>
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

  useEffect(() => {
    if (!target) return
    finished.current = false
    progress.current = 0
    const tgt = new THREE.Vector3(...target)
    startRef.current = camera.position.clone().sub(tgt)

    const toSun = new THREE.Vector3()
      .subVectors(new THREE.Vector3(0, 0, 0), tgt)
      .normalize()
    let nightDir = toSun.clone().negate()
    nightDir.y = Math.abs(nightDir.y) || 0.1
    const rotAxis = new THREE.Vector3()
      .crossVectors(nightDir, new THREE.Vector3(0, 1, 0))
      .normalize()
    nightDir.applyAxisAngle(rotAxis, angleOffset)

    const offset = nightDir.multiplyScalar(0.15)
    const endVec = tgt.clone().add(offset).setY(tgt.y + 0.4)
    endRef.current = endVec.sub(tgt)
  }, [target, angleOffset, camera])

  useFrame((_, delta) => {
    if (!startRef.current || !endRef.current || !target) return
    progress.current = Math.min(progress.current + delta * 0.5, 1)
    const t = progress.current
    const eased = t * t * (3 - 2 * t)
    const curVec = startRef.current.clone().lerp(endRef.current, eased)
    camera.position.copy(new THREE.Vector3(...target).add(curVec))

    if (t === 1 && !finished.current) {
      finished.current = true
      onFinish?.()
    }

    const toSun = new THREE.Vector3()
      .subVectors(new THREE.Vector3(0, 0, 0), new THREE.Vector3(...target))
      .normalize()
    let nightDir = toSun.clone().negate()
    nightDir.y = Math.abs(nightDir.y) || 0.1
    const rotAxis = new THREE.Vector3()
      .crossVectors(nightDir, new THREE.Vector3(0, 1, 0))
      .normalize()
    nightDir.applyAxisAngle(rotAxis, angleOffset)
    camera.lookAt(new THREE.Vector3(...target).add(nightDir))
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

  useEffect(() => {
    progress.current = 0
  }, [])

  useFrame((_, delta) => {
    progress.current = Math.min(progress.current + delta * 0.25, 1)
    const t = progress.current
    const eased = t * t * (3 - 2 * t)

    camera.position.lerpVectors(fromPos, toPos, eased)
    controlsRef.current.target.lerpVectors(fromTarget, toTarget, eased)
    controlsRef.current.update()

    if (t === 1) {
      onFinish?.()
    }
  })

  return null
}