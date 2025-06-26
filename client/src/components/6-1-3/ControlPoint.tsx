import React, { useRef, useState } from 'react'
import * as THREE from 'three'
import { TransformControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

// TransformControls로 조절 가능한 점 컴포넌트
export function ControlPoint({
  position,
  index,
  totalPoints,
  onPositionChange,
  visible = true,
  onDragStart,
  onDragEnd,
  onSelect,
  orbitControlsRef,
}: {
  position: THREE.Vector3
  index: number
  totalPoints: number
  onPositionChange: (index: number, newPosition: THREE.Vector3) => void
  visible: boolean
  onDragStart?: (index: number) => void
  onDragEnd?: () => void
  onSelect?: (index: number, position: THREE.Vector3) => void
  orbitControlsRef: React.RefObject<any>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isSelected, setIsSelected] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = (e: any) => {
    console.log('Transform mouse down for point', index)
    setIsSelected(true)
    setIsDragging(true)
    onDragStart?.(index)

    // OrbitControls 즉시 비활성화
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false
      console.log('OrbitControls disabled for point', index)
    }

    if (meshRef.current) {
      onSelect?.(index, meshRef.current.position.clone())
    }
  }

  const handleMouseUp = (e: any) => {
    console.log('Transform mouse up for point', index)
    setIsSelected(false)
    setIsDragging(false)
    onDragEnd?.()

    // OrbitControls 다시 활성화 (약간의 지연을 두어 안정성 확보)
    setTimeout(() => {
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = true
        console.log('OrbitControls re-enabled after point', index)
      }
    }, 100)

    if (meshRef.current) {
      onPositionChange(index, meshRef.current.position.clone())
    }
  }

  const handleObjectChange = (e: any) => {
    if (meshRef.current) {
      const newPos = meshRef.current.position.clone()
      onPositionChange(index, newPos)
      onSelect?.(index, newPos)
    }
  }

  const handleClick = (e: any) => {
    e.stopPropagation()
    if (meshRef.current) {
      onSelect?.(index, meshRef.current.position.clone())
    }
  }

  if (!visible) return null

  return (
    <group>
      <mesh ref={meshRef} position={position} onClick={handleClick}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial
          color={
            index === 0
              ? '#f44336' // 시작점 (빨강)
              : index === totalPoints - 1
              ? '#4caf50' // 끝점 (초록)
              : isSelected
              ? '#ffeb3b' // 선택된 점 (노랑)
              : '#ff9800' // 중간점 (주황)
          }
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* TransformControls */}
      <TransformControls
        object={meshRef}
        mode='translate'
        showX={true}
        showY={true}
        showZ={true}
        size={1.0}
        space='world'
        onObjectChange={handleObjectChange}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
    </group>
  )
}
