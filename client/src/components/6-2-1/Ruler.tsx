import React from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import { GroupProps } from '@react-three/fiber'

// 자 GLB 타입 정의 (실제 구조에 맞게 수정)
type RulerGLTFResult = GLTF & {
  nodes: {
    Ruler_1: THREE.Mesh
    Ruler_2: THREE.Mesh
  }
  materials: {
    Ruler: THREE.MeshStandardMaterial
    ['Material.001']: THREE.MeshStandardMaterial
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
  const poleRadius = 1.04 // 막대의 반지름 (실제 값에 맞게 조정 필요)

  const shadowDirection = shadowEndVec.clone().sub(poleBase).normalize()

  // 막대 가장자리 지점 (막대 중심에서 그림자 방향으로 반지름만큼 이동)
  const poleEdge = poleBase.clone().add(shadowDirection.clone().multiplyScalar(poleRadius))

  // 자의 길이를 계산하여 중점에 배치
  const shadowLength = poleEdge.distanceTo(shadowEndVec)

  // 자의 중심을 막대 가장자리와 그림자 끝점 사이에 배치
  const rulerPosition: [number, number, number] = [poleEdge.x, -0.4, poleEdge.z]

  // 자의 회전 (그림자 방향과 평행하게 + 90도 회전)
  const rotationY = Math.atan2(shadowDirection.x, shadowDirection.z) - Math.PI / 2
  const rotation: [number, number, number] = [0, rotationY, 0]

  // BasicMaterial 생성 (텍스처 유지)
  const rulerBasicMaterial = React.useMemo(() => {
    const basicMat = new THREE.MeshLambertMaterial()
    if (materials.Ruler.map) {
      basicMat.map = materials.Ruler.map
    }
    if (materials.Ruler.color) {
      basicMat.color = materials.Ruler.color
    }
    return basicMat
  }, [materials.Ruler])

  React.useEffect(() => {
    materials['Material.001'].side = THREE.DoubleSide
  }, [materials])

  return (
    <group {...props} position={rulerPosition} rotation={rotation} scale={[0.25, 0.1, 0.25]} dispose={null}>
      <group scale={[1,1,-1]}>
       <mesh
          castShadow
          receiveShadow
          geometry={nodes.Ruler_1.geometry}
          material={rulerBasicMaterial}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Ruler_2.geometry}
          material={materials['Material.001']}
        />
      </group>
    </group>
  )
}

// 프리로드
useGLTF.preload('/models/6-2-1/ruler.glb')

export default Ruler