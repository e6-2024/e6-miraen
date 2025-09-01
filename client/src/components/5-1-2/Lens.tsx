import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { LensType } from '@/types/5-1-2/types'

interface LensProps {
  position: THREE.Vector3
  type: LensType
  scale?: number
  scale2?: number
  positionOffset?: [number, number, number]
}

export function Lens({ position, type, scale = 1.0, scale2 = 1.0, positionOffset = [0, -0.93, 0] }: LensProps) {
  const modelPath = type === 'convex' ? '/models/5-1-2/Convex_lens.glb' : '/models/5-1-2/Concave_lens.glb'
  const { scene } = useGLTF(modelPath)
  const meshRef = useRef<THREE.Group>(null)

  const adjustedPosition = [
    position.x + positionOffset[0],
    position.y + positionOffset[1],
    position.z + positionOffset[2],
  ] as [number, number, number]

  useEffect(() => {
    if (!meshRef.current || !scene) return

    const clonedScene = scene.clone()

    console.log(scene.children)

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true

        if (child.material?.name === 'Convex Lens.001') {
          const glassMaterial = new THREE.MeshPhysicalMaterial({
            transparent: true,
            opacity: 0.6,
            transmission: 1,
            ior: 1.5,
            thickness: 1.0,
            roughness: 0.15,
            metalness: 0.1,
            clearcoat: 0.9,
            clearcoatRoughness: 0.1,
            color: new THREE.Color(0xC8F6FF),
            emissiveIntensity: 1,
          })
          child.material = glassMaterial
        } else if (child.material?.name === 'Lens.001') {
          const glassMaterial = new THREE.MeshPhysicalMaterial({
            transparent: true,
            opacity: 0.5,
            transmission: 1,
            ior: 1.5,
            thickness: 1.0,
            roughness: 0.15,
            metalness: 0.1,
            clearcoat: 0.9,
            clearcoatRoughness: 0.1,
            color: new THREE.Color(0xC8F6FF),
            emissiveIntensity: 1,
          })
          child.material = glassMaterial
        }
      }
    })

    meshRef.current.clear()
    meshRef.current.add(clonedScene)
  }, [scene, type])

  return (
    <group
      ref={meshRef}
      rotation={[0, (3 * Math.PI) / 2, 0]}
      position={adjustedPosition}
      scale={[scale2, scale, scale]}
    />
  )
}
