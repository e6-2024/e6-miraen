import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    GRASS_BroomSnakeweed_Cluster_Low_Mat_0: THREE.Mesh
    GRASS_RoughGrass_Low_Mat_0: THREE.Mesh
    Plane002: THREE.Mesh
    Plane002_1: THREE.Mesh
    SOIL_Mat_0001: THREE.Mesh
    // updated tree parts
    TREE_A10_Mat_0003: THREE.Mesh
    TREE_A10_Mat_0003_1: THREE.Mesh
    TREE_A10_Mat_0003_2: THREE.Mesh
    TREE_A10_Mat_0001_1: THREE.Mesh
    TREE_A10_Mat_0001_2: THREE.Mesh
    // new water pipe
    polySurface2001: THREE.Mesh
  }
  materials: {
    ['BroomSnakeweed_Cluster_Low_Mat.002']: THREE.Material
    ['RoughGrass_Low_Mat.002']: THREE.Material
    ['Material.001']: THREE.Material
    ['Material.006']: THREE.Material
    ['A10_Mat.002']: THREE.Material
    ['Material.007']: THREE.Material
    ['Material.008']: THREE.Material
    material: THREE.Material
    Material: THREE.Material
    ['Water_Pipe.001']: THREE.Material
  }
}

export function Model(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF('/models/6-1-3/Tree.gltf') as GLTFResult

  return (
    <group {...props} dispose={null}>
      {/* 잔디 */}
      <group position={[-0.134, -1.156, 0.069]} scale={0.01}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.GRASS_BroomSnakeweed_Cluster_Low_Mat_0.geometry}
          material={materials['BroomSnakeweed_Cluster_Low_Mat.002']}
          position={[0, -8.281, 0]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.GRASS_RoughGrass_Low_Mat_0.geometry}
          material={materials['RoughGrass_Low_Mat.002']}
          position={[-20.52, 0, 14.967]}
        />
      </group>

      {/* 바닥/플레인 */}
      <group position={[0.191, -0.636, -0.333]} rotation={[0, -1.529, 0]} scale={8.736}>
        <mesh castShadow receiveShadow geometry={nodes.Plane002.geometry} material={materials['Material.001']} />
        <mesh castShadow receiveShadow geometry={nodes.Plane002_1.geometry} material={materials['Material.006']} />
      </group>

      {/* 나무 (업데이트된 노드들) */}
      <group position={[0.149, 2.98, -0.219]} scale={0.01}>
        {/* 세트 1: 0003 */}
        <group position={[0, -34.143, 0]}>
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003.geometry} material={materials['A10_Mat.002']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_1.geometry} material={materials['Material.007']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_2.geometry} material={materials['Material.008']} />
        </group>
        {/* 세트 2: 0001_1 / 0001_2 */}
        <group position={[0, -34.143, 0]}>
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0001_1.geometry} material={materials['A10_Mat.002']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0001_2.geometry} material={materials.Material} />
        </group>
      </group>

      {/* 흙 */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SOIL_Mat_0001.geometry}
        material={materials.material}
        position={[0, -0.494, 0]}
        scale={0.01}
      />

      {/* 물 파이프 */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.polySurface2001.geometry}
        material={materials['Water_Pipe.001']}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
    </group>
  )
}

useGLTF.preload('/models/6-1-3/Tree.gltf')
