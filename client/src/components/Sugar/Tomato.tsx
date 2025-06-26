import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    Cherry_tomato2: THREE.Mesh
  }
  materials: {
    DefaultMaterial: THREE.MeshPhysicalMaterial
  }
}

export const Tomato = (props: JSX.IntrinsicElements['group']) => {
  const { nodes, materials } = useGLTF('models/Sugar/tomato1.glb') as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh
  
        receiveShadow
        geometry={nodes.Cherry_tomato2.geometry}
        material={materials.DefaultMaterial}
        scale={0.01}
      />
    </group>
  )
}

useGLTF.preload('models/Sugar/tomato1.glb')
