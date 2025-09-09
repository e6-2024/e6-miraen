import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    desk_0001_1: THREE.Mesh
    desk_0001_2: THREE.Mesh
  }
  materials: {
    ['wood.001']: THREE.MeshStandardMaterial
    Desk: THREE.MeshStandardMaterial
  }
}

export function BG(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF('/models/6-2-3/BG/BG.gltf') as GLTFResult
  return (
    <group {...props} dispose={null}>
      <group name="Scene">
        <group
          name="desk_0001"
          position={[0, -0.5, -0.062]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={11.465}>
          <mesh
            name="desk_0001_1"
            castShadow
            receiveShadow
            geometry={nodes.desk_0001_1.geometry}
            material={materials['wood.001']}
          />
          <mesh
            name="desk_0001_2"
            castShadow
            receiveShadow
            geometry={nodes.desk_0001_2.geometry}
            material={materials.Desk}
          />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload('/6-2-3/BG.gltf')
