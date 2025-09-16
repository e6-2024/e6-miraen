import React, { useState, useCallback, useRef } from 'react'
import * as THREE from 'three'
import { Line, TransformControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

interface WaterPathEditorProps {
  pathPoints: THREE.Vector3[]
  onPathChange: (newPoints: THREE.Vector3[]) => void
  visible: boolean
  orbitControlsRef: React.RefObject<any>
}

// 간단한 드래그 가능한 포인트 컴포넌트
function DraggablePoint({
  position,
  index,
  totalPoints,
  onPositionChange,
  orbitControlsRef,
}: {
  position: THREE.Vector3
  index: number
  totalPoints: number
  onPositionChange: (index: number, newPosition: THREE.Vector3) => void
  orbitControlsRef: React.RefObject<any>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const transformRef = useRef<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const getPointColor = () => {
    if (index === 0) return '#f44336' // 시작점 (빨강)
    if (index === totalPoints - 1) return '#4caf50' // 끝점 (초록)
    return isHovered || isDragging ? '#ffeb3b' : '#ff9800' // 중간점 (주황/노랑)
  }

  const handlePointerOver = () => setIsHovered(true)
  const handlePointerOut = () => setIsHovered(false)

  const handleTransformStart = () => {
    setIsDragging(true)
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false
    }
  }

  const handleTransformEnd = () => {
    setIsDragging(false)
    setTimeout(() => {
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = true
      }
    }, 100)
  }

  const handleTransform = () => {
    if (meshRef.current) {
      onPositionChange(index, meshRef.current.position.clone())
    }
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={getPointColor()}
          transparent
          opacity={0.8}
          emissive={getPointColor()}
          emissiveIntensity={isDragging ? 0.3 : 0.1}
        />
      </mesh>

      {/* TransformControls - 표준 축 방향으로 설정 */}
      <TransformControls
        ref={transformRef}
        object={meshRef}
        mode="translate"
        showX={true}
        showY={true}
        showZ={true}
        size={1.2}
        space="world"
        onObjectChange={handleTransform}
        onMouseDown={handleTransformStart}
        onMouseUp={handleTransformEnd}
      />

      {/* Point label */}
      {(isHovered || isDragging) && (
        <group position={[position.x, position.y + 0.3, position.z]}>
          <mesh>
            <ringGeometry args={[0.12, 0.18, 16]} />
            <meshBasicMaterial color="#ffff00" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  )
}

export function WaterPathEditor({ 
  pathPoints, 
  onPathChange, 
  visible,
  orbitControlsRef 
}: WaterPathEditorProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handlePositionChange = useCallback((index: number, newPosition: THREE.Vector3) => {
    const newPoints = [...pathPoints]
    newPoints[index] = newPosition.clone()
    onPathChange(newPoints)
  }, [pathPoints, onPathChange])

  // 경로를 따라 균등하게 분포된 점들 생성 (시각적 가이드용)
  const pathLinePoints = React.useMemo(() => {
    if (pathPoints.length < 2) return []
    
    const points: THREE.Vector3[] = []
    const curve = new THREE.CatmullRomCurve3(pathPoints, false)
    
    for (let i = 0; i <= 50; i++) {
      const t = i / 50
      points.push(curve.getPointAt(t))
    }
    return points
  }, [pathPoints])

  if (!visible) return null

  return (
    <group>
      {/* Path visualization */}
      {pathLinePoints.length > 0 && (
        <>
          {/* Main path line */}
          <Line 
            points={pathLinePoints} 
            color={isDragging ? '#ff6b6b' : '#81c784'} 
            lineWidth={3} 
            transparent 
            opacity={0.6} 
          />
          
          {/* Control lines (direct connections between points) */}
          <Line 
            points={pathPoints} 
            color='#ffd93d' 
            lineWidth={1} 
            transparent 
            opacity={0.4} 
            dashed
            dashSize={0.1}
            gapSize={0.05}
          />
        </>
      )}

      {/* Control points */}
      {pathPoints.map((point, index) => (
        <DraggablePoint
          key={index}
          position={point}
          index={index}
          totalPoints={pathPoints.length}
          onPositionChange={handlePositionChange}
          orbitControlsRef={orbitControlsRef}
        />
      ))}
    </group>
  )
}