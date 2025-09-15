// Dish.tsx
import * as THREE from 'three'
import React, { useRef, useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, GroupProps } from '@react-three/fiber'
import { GLTF } from 'three-stdlib'
import { thermalVertexShader, thermalFragmentShader } from '@/components/5-2-2/models/shaders/thermalShader'

type GLTFResult = GLTF & {
  nodes: { SM_WhitePorcelainDish194: THREE.Mesh }
  materials: { ['M_WhitePorcelainDish194.001']: THREE.MeshPhysicalMaterial }
}

interface DishProps extends GroupProps {
  thermalMode?: boolean
  isHeating?: boolean
  heatingTime?: number
  heatingProgress?: number
  heatSourcePosition?: [number, number, number]
}

export function Dish2({
  thermalMode = false,
  isHeating = false,
  heatingTime = 0,
  heatingProgress = 0,
  heatSourcePosition = [0, 0, 0],
  ...props
}: DishProps) {
  const { nodes, materials } = useGLTF('/models/5-2-2/Dish2.glb') as GLTFResult

  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const thermalMaterialRef = useRef<THREE.ShaderMaterial>()

  const [originalMaterial, setOriginalMaterial] = useState<THREE.MeshPhysicalMaterial>()
  const [centerPoint, setCenterPoint] = useState(() => new THREE.Vector3(0, 0, 0))
  const boundsRef = useRef<{ bottomY: number; topY: number } | null>(null)
  const [prevThermalMode, setPrevThermalMode] = useState(thermalMode)

  const computeBounds = () => {
    const target = groupRef.current ?? meshRef.current
    if (!target) return null
    const box = new THREE.Box3()
    target.updateWorldMatrix(true, true)
    box.setFromObject(target)
    return { bottomY: box.min.y, topY: box.max.y, center: box.getCenter(new THREE.Vector3()) }
  }

  useEffect(() => {
    if (meshRef.current) {
      const mat = materials['M_WhitePorcelainDish194.001']
      setOriginalMaterial(mat)
      const b = computeBounds()
      if (b) {
        boundsRef.current = { bottomY: b.bottomY, topY: b.topY }
        setCenterPoint(b.center)
      }
    }
  }, [materials])

  useEffect(() => {
    if (!meshRef.current) return
    if (thermalMode) {
      if (thermalMode !== prevThermalMode && thermalMaterialRef.current) {
        thermalMaterialRef.current.dispose()
        thermalMaterialRef.current = undefined
      }

      const b = computeBounds()
      if (b) {
        boundsRef.current = { bottomY: b.bottomY, topY: b.topY }
        setCenterPoint(b.center)
      }

      const bottomY = boundsRef.current?.bottomY ?? 0
      const topY = boundsRef.current?.topY ?? 1

      const shaderMat = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader,
        fragmentShader: thermalFragmentShader,
        uniforms: {
          time: { value: 0 },
          baseColor: { value: new THREE.Color(0.05, 0.25, 0.1) },
          centerPoint: { value: centerPoint.clone() },
          bottomY: { value: bottomY },
          topY: { value: topY },
          heatProgress: { value: 0.1 },
          thermalMix: { value: 0.9 },
          isHeatingF: { value: 0.0 },
          isHeating: { value: false },
          heatingTime: { value: 0 },
        },
      })

      thermalMaterialRef.current = shaderMat
      meshRef.current.material = shaderMat
    } else {
      if (thermalMode !== prevThermalMode && thermalMaterialRef.current) {
        thermalMaterialRef.current.dispose()
        thermalMaterialRef.current = undefined
      }
      if (originalMaterial && meshRef.current) {
        meshRef.current.material = originalMaterial
      }
    }
    setPrevThermalMode(thermalMode)
  }, [thermalMode])

  useEffect(() => {
    const mat = thermalMaterialRef.current
    if (!thermalMode || !mat) return
    const b = computeBounds()
    if (b) {
      boundsRef.current = { bottomY: b.bottomY, topY: b.topY }
      setCenterPoint(b.center)
      mat.uniforms.centerPoint.value.copy(b.center)
      mat.uniforms.bottomY.value = b.bottomY
      mat.uniforms.topY.value = b.topY
    }
    mat.uniforms.isHeatingF && (mat.uniforms.isHeatingF.value = 0.0)
    mat.uniforms.isHeating && (mat.uniforms.isHeating.value = false)
    mat.uniforms.heatProgress && (mat.uniforms.heatProgress.value = 0.0)
    mat.uniforms.heatingTime && (mat.uniforms.heatingTime.value = 0)
    mat.uniforms.thermalMix && (mat.uniforms.thermalMix.value = 1.0)
  }, [thermalMode])

  useFrame(({ clock }) => {
    const mat = thermalMaterialRef.current
    if (!thermalMode || !mat) return
    mat.uniforms.time.value = clock.getElapsedTime()
    const b = computeBounds()
    if (b) {
      boundsRef.current = { bottomY: b.bottomY, topY: b.topY }
      mat.uniforms.centerPoint.value.copy(b.center)
      mat.uniforms.bottomY.value = b.bottomY
      mat.uniforms.topY.value = b.topY
    }
  })

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        geometry={nodes.SM_WhitePorcelainDish194.geometry}
        material={materials['M_WhitePorcelainDish194.001']}
        position={[-1, -0.002, -0.004]}
        scale={0.038}
      />
    </group>
  )
}

useGLTF.preload('/models/5-2-2/Dish2.glb')
