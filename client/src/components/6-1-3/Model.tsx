import * as THREE from 'three'
import React, { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    // 바닥/식생
    GRASS_BroomSnakeweed_Cluster_Low_Mat_0: THREE.Mesh
    GRASS_RoughGrass_Low_Mat_0: THREE.Mesh
    GRASS_RoughGrass_Low_Mat_0001: THREE.Mesh
    Plane002: THREE.Mesh
    Plane002_1: THREE.Mesh
    SOIL_Mat_0001: THREE.Mesh

    // 파이프/흐름/기타
    Arrow: THREE.Mesh
    Moisture_flow: THREE.Mesh
    Sphere: THREE.Mesh
    Frame_7: THREE.Mesh

    // 나무 메인
    TREE_A10_Mat_0004: THREE.Mesh
    TREE_A10_Mat_0004_1: THREE.Mesh
    TREE_A10_Mat_0004_2: THREE.Mesh
    TREE_A10_Mat_0004_3: THREE.Mesh
    TREE_A10_Mat_0004_4: THREE.Mesh
    TREE_A10_Mat_0004_5: THREE.Mesh
    TREE_A10_Mat_0004_6: THREE.Mesh
    w: THREE.Mesh

    // 소품들
    Object_4001: THREE.Mesh
    Mesh003: THREE.Mesh
    Mesh003_1: THREE.Mesh
    Mesh0: THREE.Mesh
  }
  materials: Record<string, THREE.MeshStandardMaterial> & {
    // 바닥/식생
    ['BroomSnakeweed_Cluster_Low_Mat.002']: THREE.MeshStandardMaterial
    ['RoughGrass_Low_Mat.002']: THREE.MeshStandardMaterial
    ['RoughGrass_Low_Mat.001']: THREE.MeshStandardMaterial
    ['Material.001']: THREE.MeshStandardMaterial
    ['Material.006']: THREE.MeshStandardMaterial
    material: THREE.MeshStandardMaterial

    // 파이프/흐름/기타
    ['Water_Pipe.004']: THREE.MeshStandardMaterial
    Moisture: THREE.MeshStandardMaterial
    ['Material.002']: THREE.MeshStandardMaterial
    ['Frame 7']: THREE.MeshStandardMaterial

    // 나무 메인
    ['A10_Mat.001']: THREE.MeshStandardMaterial
    ['Cross_Sectioon.001']: THREE.MeshStandardMaterial
    ['Material.003']: THREE.MeshStandardMaterial
    ['lambert2SG.004']: THREE.MeshStandardMaterial
    ['lambert2SG.005']: THREE.MeshStandardMaterial
    ['lambert2SG.006']: THREE.MeshStandardMaterial
    ['lambert2SG.007']: THREE.MeshStandardMaterial

    // 소품들
    ['Material.005']: THREE.MeshStandardMaterial
    ['lambert2SG.008']: THREE.MeshStandardMaterial
    ['Material_0.002']: THREE.MeshStandardMaterial
  }
}

type ModelProps = JSX.IntrinsicElements['group'] & {
  pipeScrollSpeed?: number
  pipeDirection?: 1 | -1
  showWaterPipes?: boolean       // Arrow 표시+스크롤
  showStempipes?: boolean        // Moisture_flow 표시+스크롤
  showLeafArrow?: boolean        // Frame_7 표시
  Showleavearrow?: boolean       // (오타 호환)
  enableLeafClick?: boolean      // Mesh0 클릭 가능 여부
  onLeafClick?: () => void       // Mesh0 클릭 콜백
}

export function Model({
  pipeScrollSpeed = 0.8,
  pipeDirection = 1,
  showWaterPipes = false,
  showStempipes = false,
  showLeafArrow = false,
  Showleavearrow = false,
  enableLeafClick = false,
  onLeafClick,
  ...props
}: ModelProps) {
  const { nodes, materials } = useGLTF('/models/6-1-3/tree.gltf') as GLTFResult
  const leafArrowFlag = showLeafArrow || Showleavearrow

  // 스크롤용 머티리얼 복제
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
  
  // 잎 화살표 펄스용 머티리얼 복제
  const leafArrowMat = useMemo(() => {
    const m = materials['Frame 7'].clone()
    m.transparent = true
    return m
  }, [materials])
  
  // Mesh0 (Material_0.002) 펄스용 머티리얼 복제
  const leafMat = useMemo(() => {
    const m = materials['Material_0.002'].clone()
    m.transparent = true
    return m
  }, [materials])

  // 보이는 것만 텍스처 스크롤 + 잎 화살표 펄스 + Mesh0 펄스
  useFrame((state, delta) => {
    // 파이프 스크롤
    const mats: THREE.MeshStandardMaterial[] = []
    if (showWaterPipes) mats.push(pipeMat)
    if (showStempipes) mats.push(moistureMat)
    mats.forEach((m) => {
      const map = m.map
      if (map) map.offset.y = (map.offset.y + pipeDirection * pipeScrollSpeed * delta) % 1
    })
    
    // 잎 화살표 펄스 효과
    if (leafArrowFlag && leafArrowMat) {
      const time = state.clock.elapsedTime
      // 0.6 ~ 1.0 사이를 부드럽게 펄스
      leafArrowMat.opacity = 0.6 + Math.sin(time * 2.5) * 0.2
    }
    
    // Mesh0 (잎 기공) 펄스 효과
    if (enableLeafClick && leafMat) {
      const time = state.clock.elapsedTime
      // 0.5 ~ 1.0 사이를 빠르게 펄스 (클릭 유도)
      leafMat.opacity = 0.5 + Math.sin(time * 4) * 0.25
      // emissive도 함께 펄스
      const emissiveIntensity = 0.3 + Math.sin(time * 4) * 0.3
      leafMat.emissive = new THREE.Color(0xffff00) // 노란색 빛
      leafMat.emissiveIntensity = emissiveIntensity
    } else if (leafMat) {
      // 펄스 비활성화 시 원래대로
      leafMat.opacity = 1.0
      leafMat.emissiveIntensity = 0
    }
  })

  // 단면 재질(오타/버전 차이 대비)
  const crossSectionMat =
    (materials as any)['Cross_Sectioon.001'] ??
    (materials as any)['Cross_Section.001'] ??
    materials['A10_Mat.001']

  return (
    <group {...props} dispose={null}>
      {/* 풀 (클러스터 + 러프) */}
      <group position={[0.146, -1.156, -0.143]} scale={0.01}>
        <mesh
          castShadow receiveShadow
          geometry={nodes.GRASS_BroomSnakeweed_Cluster_Low_Mat_0.geometry}
          material={materials['BroomSnakeweed_Cluster_Low_Mat.002']}
          position={[0, -8.281, 0]}
        />
        <mesh
          castShadow receiveShadow
          geometry={nodes.GRASS_RoughGrass_Low_Mat_0.geometry}
          material={materials['RoughGrass_Low_Mat.002']}
          position={[-20.52, 0, 14.967]}
        />
      </group>

      {/* 바닥 */}
      <group position={[0.191, -1.043, -0.333]} rotation={[0, -1.529, 0]} scale={29.453}>
        <mesh castShadow receiveShadow geometry={nodes.Plane002.geometry} material={materials['Material.001']} />
        <mesh castShadow receiveShadow geometry={nodes.Plane002_1.geometry} material={materials['Material.006']} />
      </group>

      {/* 토양 */}
      <mesh
        castShadow receiveShadow
        geometry={nodes.SOIL_Mat_0001.geometry}
        material={materials.material}
        position={[0.28, -0.494, -0.212]}
        scale={0.01}
      />

      {/* 물 파이프(Arrow): water 토글 */}
      <mesh
        castShadow receiveShadow
        geometry={nodes.Arrow.geometry}
        material={showWaterPipes ? pipeMat : materials['Water_Pipe.004']}
        position={[0.28, 0, -0.212]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
        visible={showWaterPipes}
      />

      {/* 줄기 파이프: stem 토글 */}
      <mesh
        castShadow receiveShadow
        geometry={nodes.Moisture_flow.geometry}
        material={showStempipes ? moistureMat : materials.Moisture}
        position={[0.284, 0, -0.224]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
        visible={showStempipes}
      />

      {/* 구체 */}
      <mesh castShadow receiveShadow geometry={nodes.Sphere.geometry} material={materials['Material.002']} scale={0.071} />

      {/* 잎 화살표 프레임: leaf 토글 + 펄스 효과 */}
      <mesh
        castShadow receiveShadow
        geometry={nodes.Frame_7.geometry}
        material={leafArrowFlag ? leafArrowMat : materials['Frame 7']}
        position={[-1.731, 5.561, -3.708]}
        rotation={[1.534, -0.013, -1.785]}
        scale={0.193}
        visible={leafArrowFlag}
      />

      {/* 나무 */}
      <group position={[0.429, 2.98, -0.431]} scale={0.01}>
        <group position={[0, -34.143, 0]}>
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0004.geometry} material={materials['A10_Mat.001']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0004_1.geometry} material={crossSectionMat} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0004_2.geometry} material={materials['Material.003']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0004_3.geometry} material={materials['lambert2SG.004']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0004_4.geometry} material={materials['lambert2SG.005']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0004_5.geometry} material={materials['lambert2SG.006']} />
          <mesh castShadow receiveShadow geometry={nodes.TREE_A10_Mat_0004_6.geometry} material={materials['lambert2SG.007']} />
        </group>
        <mesh castShadow receiveShadow geometry={nodes.w.geometry} material={materials['A10_Mat.001']} position={[0, -34.143, 0]} />
      </group>

      {/* 작은 오브젝트들 */}
      <mesh
        castShadow receiveShadow
        geometry={nodes.Object_4001.geometry}
        material={materials['lambert2SG.007']}
        position={[-1.333, 5.391, -3.13]}
        rotation={[-0.981, 0.797, 0.168]}
        scale={0.013}
      />

      {/* 기타 구조물 */}
      <group position={[-1.483, 5.48, -3.099]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <mesh castShadow receiveShadow geometry={nodes.Mesh003.geometry} material={materials['Material.005']} />
        <mesh castShadow receiveShadow geometry={nodes.Mesh003_1.geometry} material={materials['lambert2SG.008']} />
      </group>

      {/* 새로 보이는 Mesh0 - 클릭 가능한 잎 기공 */}
      <mesh
        castShadow receiveShadow
        geometry={nodes.Mesh0.geometry}
        material={enableLeafClick ? leafMat : materials['Material_0.002']}
        position={[-1.667, 5.601, -3.679]}
        rotation={[-1.294, -0.475, -3.117]}
        scale={[0.244, 0.253, 0.106]}
        onClick={(e) => {
          if (enableLeafClick && onLeafClick) {
            e.stopPropagation()
            onLeafClick()
          }
        }}
        onPointerOver={(e) => {
          if (enableLeafClick) {
            document.body.style.cursor = 'pointer'
          }
        }}
        onPointerOut={(e) => {
          if (enableLeafClick) {
            document.body.style.cursor = 'auto'
          }
        }}
      />

      {/* 추가 러프 그라스 (0001) */}
      <group position={[0.146, -1.156, -0.143]} scale={0.01}>
        <mesh
          castShadow receiveShadow
          geometry={nodes.GRASS_RoughGrass_Low_Mat_0001.geometry}
          material={materials['RoughGrass_Low_Mat.001']}
          position={[-20.52, 0, 14.967]}
        />
      </group>
    </group>
  )
}

useGLTF.preload('/models/6-1-3/tree.gltf')