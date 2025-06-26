// components/CandleLight.tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CandleLightProps {
  position?: [number, number, number]
  opacity?: number
}

export default function CandleLight({ position = [0, 0, 0], opacity = 1 }: CandleLightProps) {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (lightRef.current) {
      const baseIntensity = 2 + Math.sin(t * Math.PI * 2) * Math.cos(t * Math.PI * 1.5) * 0.25
      lightRef.current.intensity = baseIntensity * opacity // opacity 적용
      lightRef.current.position.x = position[0] + Math.sin(t * Math.PI) * 0.05
      lightRef.current.position.z = position[2] + Math.cos(t * Math.PI * 0.75) * 0.05
    }
  })

  return (
    <pointLight
      ref={lightRef}
      color={0xffaa33}
      distance={0.4}
      decay={1}
      intensity={0.1}
      position={position}
      castShadow
    />
  )
}
