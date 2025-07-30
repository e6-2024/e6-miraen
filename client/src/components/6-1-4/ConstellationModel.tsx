// components/ConstellationModel.tsx
import { useGLTF } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

interface ConstellationModelProps {
  activeSeason: string | null
  position: [number, number, number]
  visible: boolean
}

export function ConstellationModel({ activeSeason, position, visible }: ConstellationModelProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const { scene } = useGLTF('/models/6-1-4/Star.gltf')
  
  const clonedScene = useMemo(() => {
    return scene.clone()
  }, [scene])

  return (
    <group ref={groupRef} position={position} visible={visible}>
      <group scale={0.5} position={[0,-12.5, 0]} rotation={[0, 0, 0]}>
        <primitive object={clonedScene} />
      </group>
    </group>
  )
}