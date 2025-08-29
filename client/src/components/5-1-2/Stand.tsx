import { useGLTF } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { OpticalMode, RayStates } from '@/types/5-1-2/types'

interface StandProps extends GroupProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export default function Model({ position, rotation }: StandProps) {
  const { scene } = useGLTF('models/5-1-2/Stand.glb')

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((material) => {
          if (
            material instanceof THREE.MeshStandardMaterial ||
            material instanceof THREE.MeshPhysicalMaterial ||
            material instanceof THREE.MeshLambertMaterial
          ) {
            material.shadowSide = THREE.DoubleSide
          }
        })
      }
    })
  }, [scene])

  return <primitive object={scene} position={position} rotation={rotation} scale={[1, 1, 1]} />
}
