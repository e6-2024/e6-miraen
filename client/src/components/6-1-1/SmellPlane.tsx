import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export const CuttingBoardSmell: React.FC<{
  position: [number, number, number]
  opacity: number
  enabled?: boolean
}> = ({ position, opacity, enabled = true }) => {
  const groupRef = useRef<THREE.Group>(null)
  const texture = useTexture('/img/Smell.png')
  
  const planes = useMemo(() => {
    return Array.from({ length: 1 }, (_, i) => ({
      position: [
        position[0],
        position[1] + Math.random() * 0.2 +0.1,
        position[2]
      ] as [number, number, number],
      rotation: [0, Math.PI/2, 0] as [number, number, number],
      scale: 0.3 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2
    }))
  }, [position])

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
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
      plane.scale.setScalar(planeData.scale * 0.8 * breathe * opacity)
    })

    material.opacity = opacity * 0.8
    material.needsUpdate = true
  })

  if (!enabled || opacity <= 0) return null

  return (
    <group ref={groupRef}>
      {planes.map((plane, i) => (
        <mesh
          key={i}
          position={plane.position}
          rotation={plane.rotation}
          scale={plane.scale}
          material={material}
        >
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  )
}
