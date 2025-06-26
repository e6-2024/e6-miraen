// components/Model.tsx
import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import { useEffect } from 'react'

type GLTFResult = GLTF & {
  nodes: {
    Plane: THREE.Mesh
  }
  materials: {
    ['Material.002']: THREE.MeshStandardMaterial
  }
}


export function Model(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF('/models/Anatomy/plane.glb') as GLTFResult
  const meshRef = useRef<THREE.Mesh>(null)
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.castShadow = true
      meshRef.current.receiveShadow = true
    }
  }, [])

  return (
    <group {...props} dispose={null}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        geometry={nodes.Plane.geometry}
        material={materials['Material.002']}
        position={[0, -0.6, 0.779]}
        scale={[34.306, 11.528, 8.482]}
      />
    </group>
  )
}

useGLTF.preload('/models/Anatomy/plane.glb')