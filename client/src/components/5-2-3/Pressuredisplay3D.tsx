import React from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface PressureDisplay3DProps {
  position: [number, number, number]
  type: 'high' | 'low'
  label: string
  visible?: boolean
  timeOfDay?: 'day' | 'night'
}

export const PressureDisplay3D: React.FC<PressureDisplay3DProps> = ({
  position,
  type,
  label,
  visible = true,
  timeOfDay = 'day',
}) => {
  const isHigh = type === 'high'

  if (!visible) return null

  const textColor = timeOfDay === 'day' ? '#333333' : '#f5f5f5'

  return (
    <group position={position}>
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.5}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Maplestory Bold.ttf"
      >
        {label}
      </Text>

      <Text
        position={[0, -0.2, 0]}
        fontSize={0.6}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Maplestory Bold.ttf"
      >
        {isHigh ? '고기압' : '저기압'}
      </Text>
    </group>
  )
}
