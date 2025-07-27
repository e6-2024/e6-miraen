import React from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import { GroupProps } from '@react-three/fiber'

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

  const { rulerPosition, rotation } = React.useMemo(() => {
    const cylinderRadius = 3.8
    const cylinderBase = new THREE.Vector3(0, 0, 0)
    const shadowEndVec = new THREE.Vector3(...shadowEnd)
    
    const shadowDirection = shadowEndVec.clone().sub(cylinderBase).normalize()
    const cylinderEdge = cylinderBase.clone().add(shadowDirection.clone().multiplyScalar(cylinderRadius))
    
    const calculatedPosition: [number, number, number] = [cylinderEdge.x, 0.01, cylinderEdge.z]
    
    const rotationY = Math.atan2(shadowDirection.x, shadowDirection.z) - Math.PI / 2
    const calculatedRotation: [number, number, number] = [0, rotationY, 0]
    
    return {
      rulerPosition: calculatedPosition,
      rotation: calculatedRotation
    }
  }, [shadowEnd, poleTopPosition])

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
    <group {...props} position={rulerPosition} rotation={rotation} scale={[0.89, 0.1, 0.89]} dispose={null}>
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

useGLTF.preload('/models/6-2-1/ruler.glb')

export default Ruler