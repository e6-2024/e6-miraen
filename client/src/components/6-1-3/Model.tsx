import * as THREE from 'three'
import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    GRASS_BroomSnakeweed_Cluster_Low_Mat_0: THREE.Mesh
    GRASS_RoughGrass_Low_Mat_0: THREE.Mesh
    Plane002: THREE.Mesh
    Plane002_1: THREE.Mesh
    TREE_A10_Mat_0003: THREE.Mesh
    TREE_A10_Mat_0003_1: THREE.Mesh
    TREE_A10_Mat_0003_2: THREE.Mesh
    TREE_A10_Mat_0003_3: THREE.Mesh
    TREE_A10_Mat_0003_4: THREE.Mesh
    TREE_A10_Mat_0003_5: THREE.Mesh
    TREE_A10_Mat_0003_6: THREE.Mesh
    w: THREE.Mesh
    Object_4: THREE.Mesh
    SOIL_Mat_0001: THREE.Mesh
    Mesh001: THREE.Mesh
    Mesh001_1: THREE.Mesh
    Mesh004: THREE.Mesh
    Mesh004_1: THREE.Mesh
  }
  materials: {
    ['BroomSnakeweed_Cluster_Low_Mat.002']: THREE.Material
    ['RoughGrass_Low_Mat.002']: THREE.Material
    ['Material.001']: THREE.Material
    ['Material.006']: THREE.Material
    ['A10_Mat.002']: THREE.Material
    ['Material.007']: THREE.Material
    ['Material.008']: THREE.Material
    ['lambert2SG.001']: THREE.Material
    ['lambert2SG.002']: THREE.Material
    ['lambert2SG.003']: THREE.Material
    lambert2SG: THREE.Material
    material: THREE.Material
    ['Water_Pipe.001']: THREE.Material
    ['Water_Pipe.002']: THREE.Material
    ['Material.017']: THREE.Material
    ['lambert2SG.016']: THREE.Material
  }
}

type ModelProps = JSX.IntrinsicElements['group'] & {
  pipeScrollSpeed?: number
  pipeDirection?: 1 | -1
  showWaterPipes?: boolean
}

export function Model({ pipeScrollSpeed = 0.8, pipeDirection = 1, showWaterPipes = false, ...props }: ModelProps) {
  const { nodes, materials } = useGLTF('/models/6-1-3/Final_Tree.gltf') as GLTFResult

  const waterPipeMat1 = useMemo(() => {
    const src = materials['Water_Pipe.001'] as THREE.MeshStandardMaterial
    const cloned = src.clone()
    if (cloned.map) {
      cloned.map.wrapS = THREE.RepeatWrapping
      cloned.map.wrapT = THREE.RepeatWrapping
      cloned.map.needsUpdate = true
    }
    return cloned
  }, [materials])

  const waterPipeMat2 = useMemo(() => {
    const src = materials['Water_Pipe.002'] as THREE.MeshStandardMaterial
    const cloned = src.clone()
    if (cloned.map) {
      cloned.map.wrapS = THREE.RepeatWrapping
      cloned.map.wrapT = THREE.RepeatWrapping
      cloned.map.needsUpdate = true
    }
    return cloned
  }, [materials])

  const pipeRef1 = useRef<THREE.Mesh>(null!)
  const pipeRef2 = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (showWaterPipes) {
      ;[waterPipeMat1, waterPipeMat2].forEach((mat) => {
        const map = (mat as THREE.MeshStandardMaterial).map
        if (map) {
          map.offset.y = (map.offset.y + pipeDirection * pipeScrollSpeed * delta) % 1
        }
      })
    }
  })

  return (
    <group {...props} dispose={null}>
      <group position={[-0.134, -1.156, 0.069]} scale={0.01}>
        <mesh geometry={nodes.GRASS_BroomSnakeweed_Cluster_Low_Mat_0.geometry} material={materials['BroomSnakeweed_Cluster_Low_Mat.002']} position={[0, -8.281, 0]} />
        <mesh geometry={nodes.GRASS_RoughGrass_Low_Mat_0.geometry} material={materials['RoughGrass_Low_Mat.002']} position={[-20.52, 0, 14.967]} />
      </group>

      <group position={[0.191, -0.636, -0.333]} rotation={[0, -1.529, 0]} scale={8.736}>
        <mesh geometry={nodes.Plane002.geometry} material={materials['Material.001']} />
        <mesh geometry={nodes.Plane002_1.geometry} material={materials['Material.006']} />
      </group>

      <group position={[0.149, 2.98, -0.219]} scale={0.01}>
        <group position={[0, -34.143, 0]}>
          <mesh geometry={nodes.TREE_A10_Mat_0003.geometry} material={materials['A10_Mat.002']} />
          <mesh geometry={nodes.TREE_A10_Mat_0003_1.geometry} material={materials['Material.007']} />
          <mesh geometry={nodes.TREE_A10_Mat_0003_2.geometry} material={materials['Material.008']} />
          <mesh geometry={nodes.TREE_A10_Mat_0003_3.geometry} material={materials['lambert2SG.001']} />
          <mesh geometry={nodes.TREE_A10_Mat_0003_4.geometry} material={materials['lambert2SG.002']} />
          <mesh geometry={nodes.TREE_A10_Mat_0003_5.geometry} material={materials['lambert2SG.003']} />
          <mesh geometry={nodes.TREE_A10_Mat_0003_6.geometry} material={materials.lambert2SG} />
        </group>
        <mesh geometry={nodes.w.geometry} material={materials['A10_Mat.002']} position={[0, -34.143, 0]} />
      </group>

      <mesh geometry={nodes.Object_4.geometry} material={materials.lambert2SG} position={[-1.613, 5.391, -2.918]} rotation={[-0.981, 0.797, 0.168]} scale={0.005} />

      <mesh geometry={nodes.SOIL_Mat_0001.geometry} material={materials.material} position={[0, -0.494, 0]} scale={0.01} />

      {showWaterPipes && (
        <group rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <mesh ref={pipeRef1} geometry={nodes.Mesh001.geometry} material={waterPipeMat1} />
          <mesh ref={pipeRef2} geometry={nodes.Mesh001_1.geometry} material={waterPipeMat2} />
        </group>
      )}

      <group rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <mesh geometry={nodes.Mesh004.geometry} material={materials['Material.017']} />
        <mesh geometry={nodes.Mesh004_1.geometry} material={materials['lambert2SG.016']} />
      </group>
    </group>
  )
}

useGLTF.preload('/models/6-1-3/Final_Tree.gltf')