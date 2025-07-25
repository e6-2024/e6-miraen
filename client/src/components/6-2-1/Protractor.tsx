import React from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import { GroupProps } from '@react-three/fiber'

// 각도기 GLB 타입 정의
type ProtractorGLTFResult = GLTF & {
  nodes: {
    pCylinder1: THREE.Mesh
  }
  materials: {
    ['blinn1.001']: THREE.MeshPhysicalMaterial
  }
}

interface ProtractorProps extends GroupProps {
  sunPosition: {
    sunX: number
    sunY: number
    sunZ: number
    azimuthRad: number
    altitudeRad: number
  }
  shadowEnd: readonly [number, number, number]
  poleTopPosition: readonly [number, number, number]
  angleGroundLevel?: number
}

export function Protractor({ 
  sunPosition, 
  shadowEnd, 
  poleTopPosition, 
  angleGroundLevel = -0.4,
  ...props 
}: ProtractorProps) {
  const { nodes, materials } = useGLTF('/models/6-2-1/Protractor.glb') as ProtractorGLTFResult
  
  // 메모이제이션을 위한 계산
  const { position, rotation } = React.useMemo(() => {
    // 각도기 위치 계산
    const poleTop = new THREE.Vector3(...poleTopPosition)
    const shadowEndVec = new THREE.Vector3(...shadowEnd)
    
    // 그림자 끝점에서 막대 꼭대기로 향하는 직선에서 angleGroundLevel 높이의 지점 계산
    const direction = poleTop.clone().sub(shadowEndVec).normalize()
    
    // division by zero 방지
    if (Math.abs(direction.y) < 0.001) {
      console.warn('Direction vector is nearly horizontal, using shadow end position')
      return {
        position: [shadowEndVec.x, angleGroundLevel, shadowEndVec.z] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number]
      }
    }
    
    const t = (angleGroundLevel - shadowEndVec.y) / direction.y
    const basePosition = shadowEndVec.clone().add(direction.multiplyScalar(t))
    
    // 각도기 위치
    const calculatedPosition: [number, number, number] = [basePosition.x, angleGroundLevel, basePosition.z]
    
    // 각도기 회전 계산 (태양 방향을 향하도록)
    const sunDir = new THREE.Vector3(sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ).normalize()
    const horizontalDir = new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize()
    
    // 각도기가 태양을 향하도록 Y축 회전 계산
    const angle = Math.atan2(horizontalDir.x, horizontalDir.z)
    const calculatedRotation: [number, number, number] = [0, angle, 0]
    
    return {
      position: calculatedPosition,
      rotation: calculatedRotation
    }
  }, [sunPosition, shadowEnd, poleTopPosition, angleGroundLevel])
  
  // DoubleSide 설정을 useEffect로 처리
  React.useEffect(() => {
    if (materials['blinn1.001']) {
      materials['blinn1.001'].side = THREE.DoubleSide
      materials['blinn1.001'].needsUpdate = true
      materials['blinn1.001'].transparent = true
      materials['blinn1.001'].opacity = 0.9
    }
  }, [materials])

  return (
    <group 
      {...props} 
      position={position} 
      rotation={rotation}
      scale={[1, 7, 7]} 
      dispose={null}
    >
      <mesh
        receiveShadow
        geometry={nodes.pCylinder1.geometry}
        material={materials['blinn1.001']}
        rotation={[0, Math.PI / 2, Math.PI / 2]}
        scale={[0.054, 0.054, 0.0001]}
        position={[0,0,0.0036]}
      />
    </group>
  )
}

// 프리로드
useGLTF.preload('/models/6-2-1/Protractor.glb')

export default Protractor