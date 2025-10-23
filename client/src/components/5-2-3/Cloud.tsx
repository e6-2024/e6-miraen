import { Cloud } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

interface PressureCloudsProps {
  type: 'high' | 'low'
  position: [number, number, number]
  visible: boolean
  timeOfDay: 'day' | 'night'
}

export const PressureClouds: React.FC<PressureCloudsProps> = ({
  type,
  position,
  visible,
  timeOfDay
}) => {
  const groupRef = useRef<THREE.Group>(null)
  
  const isLowPressure = type === 'low'
  const cloudCount = isLowPressure ? 10 : 5
  const opacity = isLowPressure ? 0.5 : 0.3
  const color = timeOfDay === 'day' ? '#fff' : '#fff'

  const cloudData = useMemo(() => {
    return Array.from({ length: cloudCount }).map((_, i) => ({
      seed: Math.floor(Math.random() * 100000),
      position: [
        (Math.random() - 0.5) * 5,
        i * 0.1 + (Math.random() - 0.5) * 2.0,
        -(Math.random() - 0.5) * 25
      ] as [number, number, number]
    }))
  }, [cloudCount])

  if (!visible) return null

  return (
    <group ref={groupRef} position={position}>
      {cloudData.map((data, i) => (
        <Cloud
          key={i}
          seed={data.seed} 
          opacity={opacity}
          speed={0.1}
          volume={0.9}
          scale={isLowPressure ? 1.75 : 1.25}
          segments={isLowPressure ? 10 : 5}
          color={color}
          bounds={[3, 2, 3]} 
          position={data.position}
        />
      ))}
    </group>
  )
}