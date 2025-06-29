import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    GRASS_BroomSnakeweed_Cluster_Low_Mat_0: THREE.Mesh
    GRASS_RoughGrass_Low_Mat_0: THREE.Mesh
    SOIL_Mat_0: THREE.Mesh
    TREE_A10_Mat_0: THREE.Mesh
    TREE_A10_Mat_0001: THREE.Mesh
    TREE_A10_Mat_0002: THREE.Mesh
    Plane: THREE.Mesh
    pSphere1: THREE.Mesh
  }
  materials: {
    BroomSnakeweed_Cluster_Low_Mat: THREE.MeshStandardMaterial
    RoughGrass_Low_Mat: THREE.MeshStandardMaterial
    material: THREE.MeshStandardMaterial
    A10_Mat: THREE.MeshStandardMaterial
    ['Material.002']: THREE.MeshPhysicalMaterial
    surfaceShader1: THREE.MeshStandardMaterial
  }
}

export function Model(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF('/models/6-1-3/Tree.gltf') as GLTFResult
  return (
    <group {...props} dispose={null}>
      <group position={[-0.134, -1.156, 0.069]} scale={0.01}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.GRASS_BroomSnakeweed_Cluster_Low_Mat_0.geometry}
          material={materials.BroomSnakeweed_Cluster_Low_Mat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.GRASS_RoughGrass_Low_Mat_0.geometry}
          material={materials.RoughGrass_Low_Mat}
        />
      </group>
      <group position={[0.149, 2.98, -0.219]} scale={0.01}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.TREE_A10_Mat_0.geometry}
          material={materials.A10_Mat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.TREE_A10_Mat_0001.geometry}
          material={materials.A10_Mat}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.TREE_A10_Mat_0002.geometry}
          material={materials.A10_Mat}
        />
      </group>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane.geometry}
        material={materials['Material.002']}
        position={[0, -0.636, 0]}
        scale={8.736}
      />

      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SOIL_Mat_0.geometry}
        material={materials.material}
        position={[0, -0.084, 0]}
        scale={0.01}
      />
    </group>
  )
}

useGLTF.preload('/models/6-1-3/Tree.gltf')