import * as THREE from 'three'
import React, { useRef, useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { GLTF } from 'three-stdlib'
import { thermalVertexShader, thermalFragmentShader } from '@/components/5-2-2/models/shaders/thermalShader'

type GLTFResult = GLTF & {
  nodes: {
    Desk: THREE.Mesh
    Sphere: THREE.Mesh
  }
  materials: {
    ['Desk']: THREE.MeshStandardMaterial
    ['Sphere']: THREE.MeshStandardMaterial
  }
}

interface BGProps {
  thermalMode?: boolean
  isHeating?: boolean
  heatingTime?: number
  heatSourcePosition?: [number, number, number]
}

export function BG({
  thermalMode = false,
  isHeating = false,
  heatingTime = 0,
  heatSourcePosition = [0, 0, 0],
  ...props
}: BGProps & JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF('/models/5-2-2/BG.glb') as GLTFResult
  const [originalMaterials, setOriginalMaterials] = useState<Map<THREE.Mesh, THREE.Material>>(new Map())
  const [centerPoint, setCenterPoint] = useState(new THREE.Vector3(0, 0, 0))
  const thermalMaterialRef = useRef<THREE.ShaderMaterial>()
  const deskRef = useRef<THREE.Mesh>(null)
  const sphereRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    const materials = new Map<THREE.Mesh, THREE.Material>()
    const box = new THREE.Box3()

    if (deskRef.current) {
      const material = deskRef.current.material
      if (!Array.isArray(material)) {
        materials.set(deskRef.current, material)
      }
      box.expandByObject(deskRef.current)
    }

    if (sphereRef.current) {
      const material = sphereRef.current.material
      if (!Array.isArray(material)) {
        materials.set(sphereRef.current, material)
      }
      box.expandByObject(sphereRef.current)
    }

    if (materials.size > 0) {
      setOriginalMaterials(materials)
    }

    const center = box.getCenter(new THREE.Vector3())
    setCenterPoint(center)
  }, [])

  useEffect(() => {
    if (thermalMode) {
      const thermalMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader,
        fragmentShader: thermalFragmentShader,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0.1 }, // 매우 낮은 온도 (차가운 파란색)
          heatingTime: { value: 0 }, // 가열 시간 항상 0
          baseColor: { value: new THREE.Color(0.5, 0.5, 0.5) },
          centerPoint: { value: centerPoint },
          isHeating: { value: false }, // 항상 가열 상태 아님
        },
      })

      thermalMaterialRef.current = thermalMaterial

      if (deskRef.current) {
        deskRef.current.material = thermalMaterial
      }
      if (sphereRef.current) {
        sphereRef.current.material = thermalMaterial
      }
    } else {
      originalMaterials.forEach((material, mesh) => {
        mesh.material = material
      })
    }
  }, [thermalMode, originalMaterials, centerPoint])

  useEffect(() => {
    if (thermalMode && thermalMaterialRef.current) {
      // BG는 항상 차갑게 유지
      thermalMaterialRef.current.uniforms.heatingTime.value = 0
      thermalMaterialRef.current.uniforms.isHeating.value = false
      thermalMaterialRef.current.uniforms.temperature.value = 0.05
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
        ref={deskRef}
        castShadow={true}
        receiveShadow={true}
        geometry={nodes.Desk.geometry}
        material={materials['Desk']}
        position={[0, -2.094, 0]}
        rotation={[0, -1.571, 0]}
      />
      <mesh
        ref={sphereRef}
        castShadow={true}
        receiveShadow={true}
        geometry={nodes.Sphere.geometry}
        material={materials['Sphere']}
        scale={33.763}
      />
    </group>
  )
}

useGLTF.preload('/models/5-2-2/BG.glb')
