import * as THREE from 'three'
import React, { useRef, useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { GLTF } from 'three-stdlib'
import { thermalVertexShader, thermalFragmentShader } from '@/components/5-2-2/shaders/thermalShader'

type GLTFResult = GLTF & {
  nodes: {
    SM_WhitePorcelainDish194: THREE.Mesh
  }
  materials: {
    ['M_WhitePorcelainDish194.001']: THREE.MeshPhysicalMaterial
  }
}

interface DishProps {
  thermalMode?: boolean;
  isHeating?: boolean;
  heatingTime?: number;
  heatSourcePosition?: [number, number, number];
}

export function Dish({ 
  thermalMode = false, 
  isHeating = false, 
  heatingTime = 0, 
  heatSourcePosition = [0, 0, 0], 
  ...props 
}: DishProps & JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF('/models/5-2-2/Dish.glb') as GLTFResult
  const [originalMaterial, setOriginalMaterial] = useState<THREE.MeshPhysicalMaterial>()
  const [centerPoint, setCenterPoint] = useState(new THREE.Vector3(0, 0, 0))
  const thermalMaterialRef = useRef<THREE.ShaderMaterial>()
  const meshRef = useRef<THREE.Mesh>(null)
  
  useEffect(() => {
    if (meshRef.current) {
      setOriginalMaterial(materials['M_WhitePorcelainDish194.001'])
      
      const box = new THREE.Box3()
      box.expandByObject(meshRef.current)
      const center = box.getCenter(new THREE.Vector3())
      setCenterPoint(center)
    }
  }, [materials])

  useEffect(() => {
    if (thermalMode && meshRef.current) {
      const thermalMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader,
        fragmentShader: thermalFragmentShader,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0 },
          heatingTime: { value: 0 },
          baseColor: { value: new THREE.Color(0.9, 0.9, 0.9) },
          centerPoint: { value: centerPoint },
          isHeating: { value: false }
        }
      })
      
      thermalMaterialRef.current = thermalMaterial
      meshRef.current.material = thermalMaterial
    } else if (meshRef.current && originalMaterial) {
      meshRef.current.material = originalMaterial
    }
  }, [thermalMode, originalMaterial, centerPoint])

  useEffect(() => {
    if (thermalMode && thermalMaterialRef.current) {
      thermalMaterialRef.current.uniforms.heatingTime.value = heatingTime
      thermalMaterialRef.current.uniforms.isHeating.value = isHeating
      thermalMaterialRef.current.uniforms.centerPoint.value = centerPoint
    }
  }, [heatingTime, isHeating, thermalMode, centerPoint])

  useFrame(({ clock }) => {
    if (thermalMode && thermalMaterialRef.current) {
      thermalMaterialRef.current.uniforms.time.value = clock.getElapsedTime()
    }
  })

  return (
    <group {...props} dispose={null}>
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

useGLTF.preload('/models/5-2-2/Dish.glb')