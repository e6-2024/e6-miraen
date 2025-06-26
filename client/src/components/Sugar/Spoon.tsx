import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    spoon_005_mesh: THREE.Mesh
  }
  materials: {
    spoon_set_005: THREE.MeshPhysicalMaterial
  }
}

export const Spoon = (props: JSX.IntrinsicElements['group']) => {
  const { nodes, materials } = useGLTF('models/Sugar/spoon.glb') as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.spoon_005_mesh.geometry}
        material={materials.spoon_set_005}
        scale={0.01}
      />
    </group>
  )
}

useGLTF.preload('models/Sugar/spoon.glb')
