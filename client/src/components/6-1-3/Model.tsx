import * as THREE from 'three'
import React, { useMemo } from 'react'
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
    Mesh001_2: THREE.Mesh
    Mesh004: THREE.Mesh
    Mesh004_1: THREE.Mesh
  }
  materials: {
    ['BroomSnakeweed_Cluster_Low_Mat.002']: THREE.MeshStandardMaterial
    ['RoughGrass_Low_Mat.002']: THREE.MeshStandardMaterial
    ['Material.001']: THREE.MeshStandardMaterial
    ['Material.006']: THREE.MeshStandardMaterial
    ['A10_Mat.002']: THREE.MeshStandardMaterial
    ['Material.008']: THREE.MeshStandardMaterial
    ['lambert2SG.001']: THREE.MeshStandardMaterial
    ['lambert2SG.002']: THREE.MeshStandardMaterial
    ['lambert2SG.003']: THREE.MeshStandardMaterial
    lambert2SG: THREE.MeshStandardMaterial
    material: THREE.MeshStandardMaterial
    Cross_Sectioon: THREE.MeshStandardMaterial
    ['Water_Pipe.001']: THREE.MeshStandardMaterial
    ['Water_Pipe.002']: THREE.MeshStandardMaterial
    ['Water_Pipe.003']: THREE.MeshStandardMaterial
    ['Material.017']: THREE.MeshStandardMaterial
    ['lambert2SG.016']: THREE.MeshStandardMaterial
  }
}

type ModelProps = JSX.IntrinsicElements['group'] & {
  pipeScrollSpeed?: number
  pipeDirection?: 1 | -1
  showWaterPipes?: boolean
}

export function Model({
  pipeScrollSpeed = 0.8,
  pipeDirection = 1,
  showWaterPipes = false,
  ...props
}: ModelProps) {
  // ✅ 업데이트된 경로 반영
  const { nodes, materials } = useGLTF('/models/6-1-3/Final_Tree.gltf') as GLTFResult

  // 스크롤 텍스처용 파이프 재질 복제
  const waterPipeMat1 = useMemo(() => {
    const cloned = materials['Water_Pipe.001'].clone()
    if (cloned.map) {
      cloned.map.wrapS = THREE.RepeatWrapping
      cloned.map.wrapT = THREE.RepeatWrapping
      cloned.map.needsUpdate = true
    }
    return cloned
  }, [materials])

  const waterPipeMat2 = useMemo(() => {
    const cloned = materials['Water_Pipe.002'].clone()
    if (cloned.map) {
      cloned.map.wrapS = THREE.RepeatWrapping
      cloned.map.wrapT = THREE.RepeatWrapping
      cloned.map.needsUpdate = true
    }
    return cloned
  }, [materials])

  const waterPipeMat3 = useMemo(() => {
    const cloned = materials['Water_Pipe.003'].clone()
    if (cloned.map) {
      cloned.map.wrapS = THREE.RepeatWrapping
      cloned.map.wrapT = THREE.RepeatWrapping
      cloned.map.needsUpdate = true
    }
    return cloned
  }, [materials])

  // 파이프 텍스처 스크롤
  useFrame((_, delta) => {
    if (!showWaterPipes) return
    ;[waterPipeMat1, waterPipeMat2, waterPipeMat3].forEach((mat) => {
      const map = mat.map
      if (map) map.offset.y = (map.offset.y + pipeDirection * pipeScrollSpeed * delta) % 1
    })
  })

  return (
    <group {...props} dispose={null}>
      {/* 풀 (포지션 업데이트) */}
      <group position={[0.146, -1.156, -0.143]} scale={0.01}>
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

      {/* 바닥/지면 (동일) */}
      <group position={[0.191, -1.043, -0.333]} rotation={[0, -1.529, 0]} scale={29.453}>
        <mesh castShadow receiveShadow geometry={nodes.Plane002.geometry} material={materials['Material.001']} />
        <mesh castShadow receiveShadow geometry={nodes.Plane002_1.geometry} material={materials['Material.006']} />
      </group>

      {/* 나무 (포지션/내부 오프셋 업데이트) */}
      <group position={[0.429, 2.98, -0.431]} scale={0.01}>
        <group position={[0, -34.143, 0]}>
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003.geometry} material={materials['A10_Mat.002']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_1.geometry} material={materials.Cross_Sectioon} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_2.geometry} material={materials['Material.008']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_3.geometry} material={materials['lambert2SG.001']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_4.geometry} material={materials['lambert2SG.002']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_5.geometry} material={materials['lambert2SG.003']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_6.geometry} material={materials.lambert2SG} />
        </group>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.w.geometry}
          material={materials['A10_Mat.002']}
          position={[0, -34.143, 0]}
        />
      </group>

      {/* 작은 오브젝트 (포지션 업데이트) */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials.lambert2SG}
        position={[-1.333, 5.391, -3.13]}
        rotation={[-0.981, 0.797, 0.168]}
        scale={0.013}
      />

      {/* 토양 (포지션 업데이트) */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SOIL_Mat_0001.geometry}
        material={materials.material}
        position={[0.28, -0.494, -0.212]}
        scale={0.01}
      />

      {/* 물 파이프 (스크롤 텍스처 옵션 유지, 포지션/스케일 업데이트) */}
      {showWaterPipes ? (
        <group position={[0.28, 0, -0.212]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <mesh castShadow receiveShadow geometry={nodes.Mesh001.geometry} material={waterPipeMat1} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh001_1.geometry} material={waterPipeMat2} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh001_2.geometry} material={waterPipeMat3} />
        </group>
      ) : (
        <group position={[0.28, 0, -0.212]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <mesh castShadow receiveShadow geometry={nodes.Mesh001.geometry} material={materials['Water_Pipe.001']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh001_1.geometry} material={materials['Water_Pipe.002']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh001_2.geometry} material={materials['Water_Pipe.003']} />
        </group>
      )}

      {/* 기타 구조물 (포지션 업데이트) */}
      <group position={[-1.483, 5.48, -3.099]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <mesh castShadow receiveShadow geometry={nodes.Mesh004.geometry} material={materials['Material.017']} />
        <mesh castShadow receiveShadow geometry={nodes.Mesh004_1.geometry} material={materials['lambert2SG.016']} />
      </group>
    </group>
  )
}

useGLTF.preload('/models/6-1-3/Final_Tree.gltf')
