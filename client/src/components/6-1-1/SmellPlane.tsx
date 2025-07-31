import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

interface SmellPlaneProps {
  position: [number, number, number]
  opacity: number
  scale?: number
  textureUrl?: string
  count?: number
}

export const SmellPlane: React.FC<SmellPlaneProps> = ({
  position,
  opacity,
  scale = 1,
  textureUrl = '/img/Smell.png',
  count = 3
}) => {
  const groupRef = useRef<THREE.Group>(null)
  
  const texture = useTexture(textureUrl)
  
  const planes = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          position[0] + (Math.random() - 0.5) * 0.5,
          position[1] + i * 0.2 + Math.random() * 0.1,
          position[2] + (Math.random() - 0.5) * 0.5
        ] as [number, number, number],
        rotation: [0,  Math.PI/2, 0] as [number, number, number],
        scale: 0.3 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2
      })
    }
    return temp
  }, [position, count])

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    })
  }, [texture, opacity])

  useFrame((state) => {
    if (!groupRef.current || opacity <= 0) return

    groupRef.current.children.forEach((plane, i) => {
      const planeData = planes[i]
      const time = state.clock.elapsedTime
      
      plane.position.y = planeData.position[1] + Math.sin(time * 0.5 + planeData.phase) * 0.05
      
      plane.position.x = planeData.position[0] + Math.sin(time * 0.3 + planeData.phase) * 0.02
      
      plane.rotation.y = planeData.rotation[1] + Math.sin(time * 0.2 + planeData.phase) * 0.1
      
      const breathe = 1 + Math.sin(time * 0.4 + planeData.phase) * 0.1
      plane.scale.setScalar(planeData.scale * scale * breathe * opacity)
    })

    if (material) {
      material.opacity = opacity * 0.8
      material.needsUpdate = true
    }
  })

  if (opacity <= 0) {
    return null
  }

  return (
    <group ref={groupRef}>
      {planes.map((plane, i) => (
        <mesh
          key={i}
          position={plane.position}
          rotation={plane.rotation}
          scale={plane.scale * scale}
          material={material}
        >
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  )
}

export const CuttingBoardSmell: React.FC<{
  position: [number, number, number]
  opacity: number
  enabled?: boolean
}> = ({ position, opacity, enabled = true }) => {
  if (!enabled || opacity <= 0) {
    return null
  }

  return (
    <SmellPlane
      position={position}
      opacity={opacity}
      scale={0.8}
      textureUrl="/img/Smell.png"
      count={4}
    />
  )
}