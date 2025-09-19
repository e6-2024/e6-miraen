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
    SOIL_Mat_0001: THREE.Mesh
    TREE_A10_Mat_0003: THREE.Mesh
    TREE_A10_Mat_0003_1: THREE.Mesh
    TREE_A10_Mat_0003_2: THREE.Mesh
    TREE_A10_Mat_0001_1: THREE.Mesh
    TREE_A10_Mat_0001_2: THREE.Mesh
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

type ModelProps = JSX.IntrinsicElements['group'] & {
  pipeScrollSpeed?: number   // 기본 0.25 (texels/sec 느낌)
  pipeDirection?: 1 | -1     // 1 = +Y로 위로, -1 = 아래로
}

export function Model({ pipeScrollSpeed = 0.8, pipeDirection = 1, ...props }: ModelProps) {
  const { nodes, materials } = useGLTF('/models/6-1-3/Tree.gltf') as GLTFResult

  // 파이프 머티리얼을 clone해서 다른 메시에 영향 안 가게
  const waterPipeMat = useMemo(() => {
    const src = materials['Water_Pipe.001'] as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | THREE.MeshLambertMaterial | THREE.MeshPhongMaterial | THREE.MeshBasicMaterial
    const cloned = src.clone()
    // 텍스처 스크롤을 위해 랩 반복 설정
    const map = (cloned as any).map as THREE.Texture | undefined
    if (map) {
      map.wrapS = THREE.RepeatWrapping
      map.wrapT = THREE.RepeatWrapping
      // 필요하면 반복 배수도 조절 가능 (패턴 크기)
      // map.repeat.set(1, 1)
      map.needsUpdate = true
    }
    return cloned
  }, [materials])

  // 파이프 메시에 접근해서 프레임마다 offset 갱신
  const pipeRef = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    const mat = waterPipeMat as THREE.MeshStandardMaterial
    const map = mat.map
    if (!map) return
    // y 방향 스크롤 (direction으로 반전 가능)
    map.offset.y = (map.offset.y + pipeDirection * pipeScrollSpeed * delta) % 1
    // 일부 드라이버에서 즉시 반영 위해 필요할 때만
    // map.needsUpdate = true
  })

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

      {/* 나무 */}
      <group position={[0.149, 2.98, -0.219]} scale={0.01}>
        <group position={[0, -34.143, 0]}>
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003.geometry} material={materials['A10_Mat.002']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_1.geometry} material={materials['Material.007']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_2.geometry} material={materials['Material.008']} />
        </group>
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

      {/* 물 파이프 (텍스처 y-스크롤) */}
      <mesh
        ref={pipeRef}
        castShadow
        receiveShadow
        geometry={nodes.polySurface2001.geometry}
        material={waterPipeMat}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
    </group>
  )
}

useGLTF.preload('/models/6-1-3/Tree.gltf')
