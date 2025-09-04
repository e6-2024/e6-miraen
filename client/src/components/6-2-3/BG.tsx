import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    desk_0: THREE.Mesh
    desk_0001: THREE.Mesh
    pSphere1: THREE.Mesh
  }
  materials: {
    wood: THREE.MeshStandardMaterial
    'wood.001': THREE.MeshStandardMaterial
    surfaceShader1: THREE.MeshStandardMaterial
    'surfaceShader1.001': THREE.MeshStandardMaterial
  }
}

interface BGProps {
  mode?: 'light' | 'buzzer' | 'fan' | null
}

export default function BG({ mode, ...props }: BGProps & JSX.IntrinsicElements['group']) {
  const modelPath = mode === 'light' ? '/models/6-2-3/BG/BG_dark.gltf' : '/models/6-2-3/BG/BG.gltf'
  const { nodes, materials } = useGLTF(modelPath) as GLTFResult
  
  const isDarkMode = mode === 'light'
  const deskNode = nodes.desk_0001
  const sphereNode = nodes.pSphere1
  const woodMaterial = materials['wood.001']
  const surfaceMaterial = materials['surfaceShader1.001']
  
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow={false}
        receiveShadow={true}
        geometry={deskNode.geometry}
        material={woodMaterial}
        position={isDarkMode ? [0, -0.49, -0.062] : [0, -0.49, -0.062]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={11.465}
      />
      <mesh
        castShadow={false}
        receiveShadow={false}
        geometry={sphereNode.geometry}
        material={surfaceMaterial}
        rotation={[Math.PI / 2, 0, 0]}
        scale={410.082}
      />
    </group>
  )
}

useGLTF.preload('/models/6-2-3/BG/BG.gltf')
useGLTF.preload('/models/6-2-3/BG/BG_dark.gltf')