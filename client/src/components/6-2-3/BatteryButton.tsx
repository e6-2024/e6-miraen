import * as THREE from 'three'
import React from 'react'
import { Text } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import { GLTF } from 'three-stdlib'
import { useGLTF } from '@react-three/drei'

type AnyGLTF = GLTF & {
  nodes: Record<string, THREE.Mesh>
  materials: Record<string, THREE.Material>
}

interface BatteryButtonProps {
  position: [number, number, number]
  isUsed: boolean
  onClick: (e: ThreeEvent<PointerEvent>) => void
}

export function BatteryButton1({ position, isUsed, onClick }: BatteryButtonProps) {
  const { nodes, materials } = useGLTF('/models/6-2-3/Battery1new.glb') as AnyGLTF

  const handleClick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!isUsed) {
      onClick(e)
    }
  }

  return (
    <group position={position}>
      <group position={[2, -1.1, -2]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <group
          onClick={handleClick}
          onPointerOver={() => !isUsed && (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'default')}
          visible={!isUsed}
          position={[0, 0, 0]}>
          <mesh castShadow receiveShadow geometry={nodes.Mesh006.geometry} material={materials['phong1.007']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh006_1.geometry} material={materials['Material.028']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh006_2.geometry} material={materials['Material.029']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh006_3.geometry} material={materials['Material.030']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh006_4.geometry} material={materials['Material.031']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh006_5.geometry} material={materials['Plus_Minus.005']} />
        </group>
      </group>
    </group>
  )
}

export function BatteryButton2({ position, isUsed, onClick }: BatteryButtonProps) {
  const { nodes, materials } = useGLTF('/models/6-2-3/Battery2new.glb') as AnyGLTF

  const handleClick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!isUsed) {
      onClick(e)
    }
  }

  return (
    <group position={position}>
      <group position={[0, -1.1, -2]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <group
          onClick={handleClick}
          onPointerOver={() => !isUsed && (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'default')}
          visible={!isUsed}
          position={[0, 0, 0]}>
          <mesh castShadow receiveShadow geometry={nodes.Mesh010.geometry} material={materials['phong1.013']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh010_1.geometry} material={materials['Material.053']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh010_2.geometry} material={materials['Material.056']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh010_3.geometry} material={materials['Material.058']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh010_4.geometry} material={materials['Material.059']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh010_5.geometry} material={materials['Plus_Minus.010']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh010_6.geometry} material={materials['Plus_Minus.011']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh010_7.geometry} material={materials['phong1.014']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh010_8.geometry} material={materials['Material.060']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh010_9.geometry} material={materials['Material.067']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh010_10.geometry} material={materials['Material.068']} />
          <mesh castShadow receiveShadow geometry={nodes.Mesh010_11.geometry} material={materials['Material.069']} />
        </group>
      </group>
    </group>
  )
}
