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
    Mesh0: THREE.Mesh
    SOIL_Mat_0001: THREE.Mesh
    Arrow: THREE.Mesh
    Mesh004: THREE.Mesh
    Mesh004_1: THREE.Mesh
    Moisture_flow: THREE.Mesh
    Sphere: THREE.Mesh
    Frame_7: THREE.Mesh
  }
  materials: Record<string, THREE.MeshStandardMaterial> & {
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
    ['Material_0.001']: THREE.MeshStandardMaterial
    ['Material.017']: THREE.MeshStandardMaterial
    ['lambert2SG.016']: THREE.MeshStandardMaterial
    ['Water_Pipe.004']: THREE.MeshStandardMaterial
    Moisture: THREE.MeshStandardMaterial
    ['Material.002']: THREE.MeshStandardMaterial
    ['Frame 7']: THREE.MeshStandardMaterial
  }
}

type ModelProps = JSX.IntrinsicElements['group'] & {
  pipeScrollSpeed?: number
  pipeDirection?: 1 | -1
  showWaterPipes?: boolean        // Arrow 표시+스크롤
  showStempipes?: boolean         // Moisture_flow 표시+스크롤
  showLeafArrow?: boolean         // Frame_7(leaf arrow) 표시
  Showleavearrow?: boolean        // (별칭) 오타 호환
}

export function Model({
  pipeScrollSpeed = 0.8,
  pipeDirection = 1,
  showWaterPipes = false,
  showStempipes = false,
  showLeafArrow = false,
  Showleavearrow = false,
  ...props
}: ModelProps) {
  const { nodes, materials } = useGLTF('/models/6-1-3/tree.gltf') as GLTFResult
  const leafArrowFlag = showLeafArrow || Showleavearrow

  const pipeMat = useMemo(() => {
    const m = materials['Water_Pipe.004'].clone()
    if (m.map) { m.map.wrapS = THREE.RepeatWrapping; m.map.wrapT = THREE.RepeatWrapping; m.map.needsUpdate = true }
    return m
  }, [materials])

  const moistureMat = useMemo(() => {
    const m = materials.Moisture.clone()
    if (m.map) { m.map.wrapS = THREE.RepeatWrapping; m.map.wrapT = THREE.RepeatWrapping; m.map.needsUpdate = true }
    return m
  }, [materials])

  useFrame((_, delta) => {
    const mats: THREE.MeshStandardMaterial[] = []
    if (showWaterPipes) mats.push(pipeMat)
    if (showStempipes) mats.push(moistureMat)
    mats.forEach((m) => {
      const map = m.map
      if (map) map.offset.y = (map.offset.y + pipeDirection * pipeScrollSpeed * delta) % 1
    })
  })

  const crossSectionMat =
    (materials as Record<string, THREE.MeshStandardMaterial>)['Cross_Sectioon'] ??
    (materials as Record<string, THREE.MeshStandardMaterial>)['Cross_Section'] ??
    materials['A10_Mat.002']

  return (
    <group {...props} dispose={null}>
      {/* 풀 */}
      <group position={[0.146, -1.156, -0.143]} scale={0.01}>
        <mesh castShadow receiveShadow geometry={nodes.GRASS_BroomSnakeweed_Cluster_Low_Mat_0.geometry} material={materials['BroomSnakeweed_Cluster_Low_Mat.002']} position={[0, -8.281, 0]} />
        <mesh castShadow receiveShadow geometry={nodes.GRASS_RoughGrass_Low_Mat_0.geometry} material={materials['RoughGrass_Low_Mat.002']} position={[-20.52, 0, 14.967]} />
      </group>

      {/* 바닥 */}
      <group position={[0.191, -1.043, -0.333]} rotation={[0, -1.529, 0]} scale={29.453}>
        <mesh castShadow receiveShadow geometry={nodes.Plane002.geometry} material={materials['Material.001']} />
        <mesh castShadow receiveShadow geometry={nodes.Plane002_1.geometry} material={materials['Material.006']} />
      </group>

      {/* 나무 */}
      <group position={[0.429, 2.98, -0.431]} scale={0.01}>
        <group position={[0, -34.143, 0]}>
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003.geometry} material={materials['A10_Mat.002']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_1.geometry} material={crossSectionMat} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_2.geometry} material={materials['Material.008']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_3.geometry} material={materials['lambert2SG.001']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_4.geometry} material={materials['lambert2SG.002']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_5.geometry} material={materials['lambert2SG.003']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0003_6.geometry} material={materials.lambert2SG} />
        </group>
        <mesh castShadow receiveShadow geometry={nodes.w.geometry} material={materials['A10_Mat.002']} position={[0, -34.143, 0]} />
      </group>

      {/* 작은 오브젝트들 */}
      <mesh castShadow receiveShadow geometry={nodes.Object_4.geometry} material={materials.lambert2SG} position={[-1.333, 5.391, -3.13]} rotation={[-0.981, 0.797, 0.168]} scale={0.013} />
      <mesh castShadow receiveShadow geometry={nodes.Mesh0.geometry} material={materials['Material_0.001']} position={[-1.667, 5.601, -3.679]} rotation={[-1.294, -0.475, -3.117]} scale={[0.244, 0.253, 0.106]} />

      {/* 토양 */}
      <mesh castShadow receiveShadow geometry={nodes.SOIL_Mat_0001.geometry} material={materials.material} position={[0.28, -0.494, -0.212]} scale={0.01} />

      {/* 파이프(Arrow): water 토글 */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Arrow.geometry}
        material={showWaterPipes ? pipeMat : materials['Water_Pipe.004']}
        position={[0.28, 0, -0.212]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
        visible={showWaterPipes}
      />

      {/* 기타 구조물 */}
      <group position={[-1.483, 5.48, -3.099]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <mesh castShadow receiveShadow geometry={nodes.Mesh004.geometry} material={materials['Material.017']} />
        <mesh castShadow receiveShadow geometry={nodes.Mesh004_1.geometry} material={materials['lambert2SG.016']} />
      </group>

      {/* 줄기 파이프: stem 토글 */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Moisture_flow.geometry}
        material={showStempipes ? moistureMat : materials.Moisture}
        position={[0.284, 0, -0.224]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
        visible={showStempipes}
      />

      {/* 기타 요소 */}
      <mesh castShadow receiveShadow geometry={nodes.Sphere.geometry} material={materials['Material.002']} scale={0.071} />

      {/* Leaf Arrow(프레임): 기본 숨김, showLeafArrow 토글로 표시 */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Frame_7.geometry}
        material={materials['Frame 7']}
        position={[-1.731, 5.561, -3.708]}
        rotation={[1.534, -0.013, -1.785]}
        scale={0.193}
        visible={leafArrowFlag}
      />
    </group>
  )
}

useGLTF.preload('/models/6-1-3/tree.gltf')
