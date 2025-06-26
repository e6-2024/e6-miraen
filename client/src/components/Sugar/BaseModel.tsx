import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    Dish: THREE.Mesh
    Sugarbowl: THREE.Mesh
    Cherry_tomato: THREE.Mesh
    Plane : THREE.Mesh
    pSphere1 : THREE.Mesh
    
  }
  materials: {
    DIsh: THREE.MeshPhysicalMaterial
    ['Sugarbowl:initialShadingGroup1']: THREE.MeshPhysicalMaterial
    DefaultMaterial: THREE.MeshPhysicalMaterial
    surfaceShader1: THREE.MeshBasicMaterial
    ['Material.002']: THREE.MeshStandardMaterial

  }
}

export const BaseModel = (props: JSX.IntrinsicElements['group']) => {
  const { nodes, materials } = useGLTF('models/Sugar/sugar.glb') as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Dish.geometry}
        material={materials.DIsh}
        position={[0.011, 0.006, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.004}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sugarbowl.geometry}
        material={materials['Sugarbowl:initialShadingGroup1']}
        position={[0.13, 0, 0.014]}
        scale={0.065}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cherry_tomato.geometry}
        material={materials.DefaultMaterial}
        position={[-0.02, -0.021, -0.016]}
        rotation={[2.079, 0, 0]}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cherry_tomato.geometry}
        material={materials.DefaultMaterial}
        position={[-0.02, -0.021, -0.016]}
        rotation={[2.079, 0, 0]}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane.geometry}
        material={materials['Material.002']}
        position={[0.364, 0.001, 0.779]}
        scale={[34.306, 11.528, 8.482]}
      />
    </group>
  )
}

useGLTF.preload('models/Sugar/base.glb')
