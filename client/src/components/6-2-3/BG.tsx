import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    desk_0: THREE.Mesh
    pSphere1: THREE.Mesh
  }
  materials: {
    wood: THREE.MeshStandardMaterial
    surfaceShader1: THREE.MeshStandardMaterial
  }
}

export default function BG(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF('/models/6-2-3/BG/BG.gltf') as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow = {false}
        receiveShadow = {true}
        geometry={nodes.desk_0.geometry}
        material={materials.wood}
        position={[0, -0.49, -0.062]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={11.465}
      />
      <mesh
        castShadow = {false}
        receiveShadow={false}
        geometry={nodes.pSphere1.geometry}
        material={materials.surfaceShader1}
        rotation={[Math.PI / 2, 0, 0]}
        scale={410.082}
      />
    </group>
  )
}

useGLTF.preload('/models/6-2-3/BG/BG.gltf')