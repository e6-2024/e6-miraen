import React, { useRef, useState, useEffect } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Thermometer3DProps {
  position: [number, number, number]
  temperature: number
  label: string
  color?: string
  visible?: boolean
}

export const Thermometer3D: React.FC<Thermometer3DProps> = ({
  position,
  temperature,
  label,
  color = '#ef4444',
  visible = true,
}) => {
  const animatedTempRef = useRef(temperature)
  const mercuryGroupRef = useRef<THREE.Group>(null)

  const [displayTemp, setDisplayTemp] = useState(temperature)
  const lastUpdateRef = useRef(0)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!isInitializedRef.current) {
      animatedTempRef.current = temperature
      setDisplayTemp(temperature)
      isInitializedRef.current = true
    }
  }, [temperature])

  const maxTemp = 40
  const minTemp = 5

  useFrame((state) => {
    if (!visible) return

    animatedTempRef.current = THREE.MathUtils.lerp(
      animatedTempRef.current,
      temperature,
      0.04
    )

    const tempRatio = (animatedTempRef.current - minTemp) / (maxTemp - minTemp)
    const compressedRatio = tempRatio * 0.4 + 0.3
    const targetScaleY = Math.max(compressedRatio, 0.04)

    if (mercuryGroupRef.current) {
      mercuryGroupRef.current.scale.y = targetScaleY
      mercuryGroupRef.current.position.y = -0.5 + (targetScaleY * 0.25) / 2
    }

    const now = state.clock.elapsedTime
    if (now - lastUpdateRef.current > 0.1) {
      const roundedTemp = Math.round(animatedTempRef.current)
      if (roundedTemp !== displayTemp) setDisplayTemp(roundedTemp)
      lastUpdateRef.current = now
    }
  })

  return (
    <group position={position} visible={visible}>
      <mesh position={[0, 1.4, -0.05]}>
        <planeGeometry args={[2.2, 4.5]} />
        <meshBasicMaterial color="#ffffff" opacity={0.95} transparent />
      </mesh>

      <Text
        position={[0, 3.0, 0]}
        fontSize={0.4}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Maplestory Bold.ttf"
      >
        {label}
      </Text>

      <Text
        position={[0, 2.4, 0]}
        fontSize={0.45}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Maplestory Bold.ttf"
      >
        {displayTemp}°C
      </Text>

      <group ref={mercuryGroupRef} position={[0, 0, 0]}>
        <mesh position={[0, 1.7, 0.02]}>
          <cylinderGeometry args={[0.16, 0.16, 2.5, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      </group>

      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      <mesh position={[0, 1.4, -0.06]}>
        <planeGeometry args={[2.3, 4.6]} />
        <meshBasicMaterial color="#999999" opacity={0.8} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
