import * as THREE from 'three'
import React from 'react'
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

/** Battery 1 버튼: (old Mesh006*) → new Mesh031* */
export function BatteryButton1({ position, isUsed, onClick }: BatteryButtonProps) {
  const { nodes, materials } = useGLTF('/models/6-2-3/Battery1new.glb') as AnyGLTF

  const handleClick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!isUsed) onClick(e)
  }

  return (
    <group position={position}>
      <group position={[2, -1.1, -2]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <group
          onClick={handleClick}
          onPointerOver={() => !isUsed && (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'default')}
          visible={!isUsed}
          position={[0, 0, 0]}
        >
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh031.geometry} material={materials['phong1.048']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh031_1.geometry} material={materials['Material.147']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh031_2.geometry} material={materials['Material.148']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh031_3.geometry} material={materials['Material.149']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh031_4.geometry} material={materials['Material.150']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh031_5.geometry} material={materials['Plus_Minus.021']} />
        </group>
      </group>
    </group>
  )
}

/** Battery 2 버튼: (old Mesh010*) → new Mesh032* */
export function BatteryButton2({ position, isUsed, onClick }: BatteryButtonProps) {
  const { nodes, materials } = useGLTF('/models/6-2-3/Battery2new.glb') as AnyGLTF

  const handleClick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!isUsed) onClick(e)
  }

  return (
    <group position={position}>
      <group position={[0, -1.1, -2]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <group
          onClick={handleClick}
          onPointerOver={() => !isUsed && (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'default')}
          visible={!isUsed}
          position={[0, 0, 0]}
        >
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh032.geometry} material={materials['phong1.050']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh032_1.geometry} material={materials['Material.153']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh032_2.geometry} material={materials['Material.154']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh032_3.geometry} material={materials['Material.155']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh032_4.geometry} material={materials['Material.156']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh032_5.geometry} material={materials['Plus_Minus.022']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh032_6.geometry} material={materials['Plus_Minus.023']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh032_7.geometry} material={materials['phong1.051']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh032_8.geometry} material={materials['Material.157']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh032_9.geometry} material={materials['Material.158']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh032_10.geometry} material={materials['Material.159']} />
          <mesh castShadow receiveShadow geometry={(nodes as any).Mesh032_11.geometry} material={materials['Material.160']} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload('/models/6-2-3/Battery1new.glb')
useGLTF.preload('/models/6-2-3/Battery2new.glb')
