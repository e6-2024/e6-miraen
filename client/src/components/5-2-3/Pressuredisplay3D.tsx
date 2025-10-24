import React from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface PressureDisplay3DProps {
  position: [number, number, number]
  type: 'high' | 'low'
  label: string
  visible?: boolean
}

export const PressureDisplay3D: React.FC<PressureDisplay3DProps> = ({
  position,
  type,
  label,
  visible = true,
}) => {
  const isHigh = type === 'high'

  if (!visible) return null

  return (
    <group position={position}>
      {/* 배경 패널 */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[2.5, 2]} />
        <meshBasicMaterial color="#ffffff" opacity={0.95} transparent />
      </mesh>

      <Text
        position={[0, 0.4, 0]}
        fontSize={0.35}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Maplestory Bold.ttf"
      >
        {label}
      </Text>

      <Text
        position={[0, -0.2, 0]}
        fontSize={0.45}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Maplestory Bold.ttf"
      >
        {isHigh ? '고기압' : '저기압'}
      </Text>

    </group>
  )
}