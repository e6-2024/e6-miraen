import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { thermalVertexShader2, thermalFragmentShader2 } from '@/components/5-2-2/models/shaders/thermalShader2'

interface StoveProps extends GroupProps {
  thermalMode?: boolean
  isHeating?: boolean
  heatingTime?: number
  heatSourcePosition?: [number, number, number]
  burnerOffset?: [number, number, number]
}

export default function Stove({ 
  thermalMode = false, 
  isHeating = false, 
  heatingTime = 0, 
  heatSourcePosition = [0, 0, 0], 
  burnerOffset = [0, 0, 0],
  ...props 
}: StoveProps) {
  const { scene } = useGLTF('models/5-2-2/Stove.glb')
  const [originalMaterials, setOriginalMaterials] = useState<Map<THREE.Mesh, THREE.Material>>(new Map())
  const [centerPoint, setCenterPoint] = useState(new THREE.Vector3(0, 0, 0))
  const thermalMaterialRef = useRef<THREE.ShaderMaterial>()

  useEffect(() => {
    const materials = new Map<THREE.Mesh, THREE.Material>()
    const box = new THREE.Box3()
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        if (!originalMaterials.has(child)) {
          materials.set(child, child.material)
        }
        
        box.expandByObject(child)
      }
    })
    
    if (materials.size > 0) {
      setOriginalMaterials(materials)
    }
    
    const center = box.getCenter(new THREE.Vector3())
    const adjustedCenter = center.clone().add(new THREE.Vector3(...burnerOffset))
    setCenterPoint(adjustedCenter)
  }, [scene])

  useEffect(() => {
    if (thermalMode) {
      const thermalMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader2,
        fragmentShader: thermalFragmentShader2,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0.8 },
          heatingTime: { value: heatingTime },
          baseColor: { value: new THREE.Color(0.3, 0.3, 0.5) },
          centerPoint: { value: centerPoint },
          isHeating: { value: isHeating },
          modelDepth: {value: 0.1},
          zShiftFactor:{value: 0.9}
        }
      })
      
      thermalMaterialRef.current = thermalMaterial
      
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = thermalMaterial
        }
      })
    } else {
      originalMaterials.forEach((material, mesh) => {
        mesh.material = material
      })
    }
  }, [thermalMode, scene, originalMaterials, centerPoint])

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

  return <primitive object={scene} {...props} />
}