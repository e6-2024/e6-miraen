import React from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import { GroupProps } from '@react-three/fiber'

// 자 GLB 타입 정의 (실제 구조에 맞게 수정)
type RulerGLTFResult = GLTF & {
  nodes: {
    Layer_2: THREE.Mesh
    Cube: THREE.Mesh
  }
  materials: {
    Layer_2: THREE.MeshStandardMaterial
    ['Material.002']: THREE.MeshStandardMaterial
  }
}

interface RulerProps extends GroupProps {
  shadowEnd: readonly [number, number, number]
  poleTopPosition: readonly [number, number, number]
}

export function Ruler({ shadowEnd, poleTopPosition, ...props }: RulerProps) {
  const { nodes, materials } = useGLTF('/models/6-2-1/ruler.glb') as RulerGLTFResult
  
  // 자 위치 및 회전 계산
  const poleTop = new THREE.Vector3(...poleTopPosition)
  const shadowEndVec = new THREE.Vector3(...shadowEnd)
  
  // 자의 위치 계산 (막대 가장자리에서 시작)
  const poleBase = new THREE.Vector3(poleTop.x, -1, poleTop.z) // 막대 바닥 기준점
  const poleRadius = 0.33 // 막대의 반지름 (실제 값에 맞게 조정 필요)
  
  const shadowDirection = shadowEndVec.clone().sub(poleBase).normalize()
  
  // 막대 가장자리 지점 (막대 중심에서 그림자 방향으로 반지름만큼 이동)
  const poleEdge = poleBase.clone().add(shadowDirection.clone().multiplyScalar(poleRadius))
  
  // 자의 길이를 계산하여 중점에 배치
  const shadowLength = poleEdge.distanceTo(shadowEndVec)
  
  // 자의 중심을 막대 가장자리와 그림자 끝점 사이에 배치
  const rulerPosition: [number, number, number] = [
    poleEdge.x ,
    -0.275,
    poleEdge.z 
  ]
  
  // 자의 회전 (그림자 방향과 평행하게 + 90도 회전)
  const rotationY = Math.atan2(shadowDirection.x, shadowDirection.z) + Math.PI / 2
  const rotation: [number, number, number] = [0, rotationY, 0]

  return (
    <group {...props} position={rulerPosition} rotation={rotation} scale={[0.2, 0.2, 0.2]} dispose={null}>
      {/* Layer_2 메시 */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Layer_2.geometry}
        material={materials.Layer_2}
        position={[0, 0.102, 0]}
        scale={0.35}
      />
      {/* Cube 메시 */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube.geometry}
        material={materials['Material.002']}
        position={[0, 0.093, 0]}
        scale={[1.471, 0.007, 0.173]}
      />
    </group>
  )
}

// 프리로드
useGLTF.preload('/models/6-2-1/ruler.glb')

export default Ruler