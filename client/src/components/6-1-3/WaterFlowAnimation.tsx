import React, { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

interface WaterFlowProps {
  arrowSize?: number
  lineWidth?: number
  isPlaying?: boolean
  speed?: number
  pathPoints?: THREE.Vector3[]
  showPath?: boolean
  onComplete?: () => void
  loop?: boolean // 루프 여부
  trailCount?: number // 트레일 화살표 개수
  trailSpacing?: number // 트레일 간격
}

// 화살표 컴포넌트
function FlowArrow({
  position,
  direction,
  scale = 1,
  opacity = 1,
}: {
  position: THREE.Vector3
  direction: THREE.Vector3
  scale?: number
  opacity?: number
}) {
  const arrowRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (arrowRef.current) {
      // 화살표가 이동 방향을 향하도록 회전
      const lookAtTarget = position.clone().add(direction.normalize())
      arrowRef.current.lookAt(lookAtTarget)
      arrowRef.current.rotateX(Math.PI / 2) // 화살표 방향 보정
    }
  }, [position, direction])

  return (
    <group ref={arrowRef} position={position} scale={scale}>
      {/* 화살표 몸체 (원통) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
        <meshStandardMaterial
          color='#4fc3f7'
          emissive='#4fc3f7'
          emissiveIntensity={0.4}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* 화살표 머리 (원뿔) */}
      <mesh position={[0, 0.04, 0]}>
        <coneGeometry args={[0.025, 0.05, 8]} />
        <meshStandardMaterial
          color='#2196f3'
          emissive='#2196f3'
          emissiveIntensity={0.6}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* 발광 효과를 위한 추가 구체 */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color='#81d4fa' transparent opacity={opacity * 0.3} />
      </mesh>
    </group>
  )
}

export function WaterFlowAnimation({
  arrowSize = 2,
  lineWidth = 3,
  isPlaying = false,
  speed = 1,
  pathPoints,
  showPath = true,
  onComplete,
  loop = false,
  trailCount = 8, // 기본 8개로 증가
  trailSpacing = 0.08, // 트레일 간격
}: WaterFlowProps) {
  const [currentProgress, setCurrentProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const progressRef = useRef(0)
  const loopCountRef = useRef(0) // 루프 횟수 추적

  // 경로 곡선 생성 (부드러운 곡선을 위해 CatmullRomCurve3 사용)
  const curve = new THREE.CatmullRomCurve3(pathPoints, false)

  // 현재 위치와 방향 계산
  const getCurrentPositionAndDirection = (progress: number) => {
    const clampedProgress = Math.max(0, Math.min(1, progress))
    const position = curve.getPointAt(clampedProgress)
    const tangent = curve.getTangentAt(clampedProgress)
    return { position, direction: tangent }
  }

  // 애니메이션 시작/정지
  useEffect(() => {
    if (isPlaying) {
      setIsAnimating(true)
      if (!loop) {
        // 루프가 아닐 때만 progress 리셋
        progressRef.current = 0
        setCurrentProgress(0)
        loopCountRef.current = 0
      }
    } else {
      setIsAnimating(false)
      // 정지할 때는 progress 리셋
      progressRef.current = 0
      setCurrentProgress(0)
      loopCountRef.current = 0
    }
  }, [isPlaying, loop])

  // 애니메이션 프레임
  useFrame((_, delta) => {
    if (isAnimating) {
      progressRef.current += delta * speed * 0.25 // 속도 조절

      if (progressRef.current >= 1) {
        if (loop) {
          // 루프 모드: progress를 0으로 리셋하고 계속 진행
          progressRef.current = 0
          loopCountRef.current += 1
          console.log(`Water flow loop completed: ${loopCountRef.current}`)
        } else {
          // 일반 모드: 애니메이션 종료
          progressRef.current = 1
          setIsAnimating(false)
          onComplete?.()
        }
      }

      setCurrentProgress(progressRef.current)
    }
  })

  const { position, direction } = getCurrentPositionAndDirection(currentProgress)

  // 경로를 따라 균등하게 분포된 점들 생성
  const pathLinePoints = React.useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 50; i++) {
      const t = i / 50
      points.push(curve.getPointAt(t))
    }
    return points
  }, [curve])

  // 트레일 화살표들 생성
  const trailArrows = React.useMemo(() => {
    if (!isAnimating) return []

    const arrows = []
    for (let i = 1; i <= trailCount; i++) {
      const offset = i * trailSpacing
      const trailProgress = Math.max(0, currentProgress - offset)

      if (trailProgress > 0) {
        const { position: trailPos, direction: trailDir } = getCurrentPositionAndDirection(trailProgress)
        const opacity = Math.max(0.1, 1 - (i / trailCount) * 0.8) // 점진적으로 투명해짐
        const scale = Math.max(0.6, 1 - (i / trailCount) * 0.4) // 점진적으로 작아짐

        arrows.push(
          <FlowArrow key={i} position={trailPos} direction={trailDir} scale={arrowSize * scale} opacity={opacity} />,
        )
      }
    }
    return arrows
  }, [isAnimating, currentProgress, trailCount, trailSpacing, arrowSize, getCurrentPositionAndDirection])

  return (
    <group>
      {/* 경로 라인 표시 (옵션) */}
      {showPath && (
        <>
          {/* 메인 경로 라인 */}
          <Line points={pathLinePoints} color='#81c784' lineWidth={lineWidth} transparent opacity={0.4} />

          {/* 점선 경로 (물의 흐름 표시) */}
          <Line
            points={pathLinePoints}
            color='#4fc3f7'
            lineWidth={lineWidth * 0.5}
            transparent
            opacity={0.4}
            dashed
            dashSize={0.03}
            gapSize={0.02}
          />
        </>
      )}

      {/* 물의 흐름 애니메이션 */}
      {isAnimating && (
        <>
          {/* 메인 화살표 */}
          <FlowArrow position={position} direction={direction} scale={arrowSize} />

          {/* 트레일 화살표들 */}
          {trailArrows}
        </>
      )}

      {/* 경로 제어점 표시 (개발 모드에서만) */}
      {process.env.NODE_ENV === 'development' && showPath && (
        <>
          {pathPoints?.map((point, index) => (
            <mesh key={`control-point-${index}`} position={point}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial
                color={
                  index === 0
                    ? '#f44336' // 시작점 (빨강)
                    : index === pathPoints.length - 1
                    ? '#4caf50' // 끝점 (초록)
                    : '#ff9800' // 중간점 (주황)
                }
              />
            </mesh>
          ))}

          {/* 제어점 레이블 */}
          {pathPoints?.map((point, index) => (
            <group key={`label-${index}`} position={[point.x, point.y + 0.1, point.z]}>
              <meshBasicMaterial attach='material' color='black' />
            </group>
          ))}
        </>
      )}
    </group>
  )
}
