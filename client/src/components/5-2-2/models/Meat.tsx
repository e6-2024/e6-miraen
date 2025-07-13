import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { thermalVertexShader, thermalFragmentShader } from '@/components/5-2-2/shaders/thermalShader'

interface MeatProps extends GroupProps {
  thermalMode?: boolean;
  isHeating?: boolean;
  heatingTime?: number;
  heatSourcePosition?: [number, number, number];
}

export function Meat({ 
  thermalMode = false, 
  isHeating = false, 
  heatingTime = 0, 
  heatSourcePosition = [0, 0, 0], 
  ...props 
}: MeatProps) {
  const { scene } = useGLTF('models/5-2-2/Meat.glb')
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
    setCenterPoint(center)
  }, [scene])

  useEffect(() => {
    if (thermalMode) {
      const thermalMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader,
        fragmentShader: thermalFragmentShader,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0.15 },
          heatingTime: { value: heatingTime },
          baseColor: { value: new THREE.Color(0.9, 0.3, 0.1) },
          centerPoint: { value: centerPoint },
          isHeating: { value: isHeating }
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

export default Meat