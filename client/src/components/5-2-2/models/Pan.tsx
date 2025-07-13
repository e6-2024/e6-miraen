import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { thermalVertexShader, thermalFragmentShader } from '@/components/5-2-2/shaders/thermalShader3'

interface PanProps extends GroupProps {
  thermalMode?: boolean;
  isHeating?: boolean;
  heatingTime?: number;
  heatSourcePosition?: [number, number, number];
}

export function Pan({ 
  thermalMode = false, 
  isHeating = false, 
  heatingTime = 0, 
  heatSourcePosition = [0, 0, 0], 
  ...props 
}: PanProps) {
  const { scene } = useGLTF('models/5-2-2/pan.glb')
  const [originalMaterials, setOriginalMaterials] = useState<Map<THREE.Mesh, THREE.Material>>(new Map())
  const [centerPoint, setCenterPoint] = useState(new THREE.Vector3(0, 0, 0))
  const heatingMaterialRef = useRef<THREE.ShaderMaterial>()
  const coldMaterialRef = useRef<THREE.ShaderMaterial>()
  
  useEffect(() => {
    const materials = new Map<THREE.Mesh, THREE.Material>()
    const box = new THREE.Box3()
    let firstMesh: THREE.Mesh | null = null
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        if (!originalMaterials.has(child)) {
          materials.set(child, child.material)
        }
        
        if (!firstMesh && child.geometry && child.name.includes('Fry_pan')) {
          firstMesh = child
          box.expandByObject(child)
        }
      }
    })
    
    if (materials.size > 0) {
      setOriginalMaterials(materials)
    }
    
    if (firstMesh) {
      const center = box.getCenter(new THREE.Vector3())
      setCenterPoint(center)
    }
  }, [scene])

  useEffect(() => {
    if (thermalMode) {
      const heatingMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader,
        fragmentShader: thermalFragmentShader,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0.5 },
          heatingTime: { value: heatingTime },
          baseColor: { value: new THREE.Color(0.8, 0.4, 0.2) },
          centerPoint: { value: centerPoint },
          isHeating: { value: isHeating }
        }
      })
      
      const coldMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader,
        fragmentShader: thermalFragmentShader,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0.05 },
          heatingTime: { value: 0 },
          baseColor: { value: new THREE.Color(0.5, 0.5, 0.5) },
          centerPoint: { value: centerPoint },
          isHeating: { value: false }
        }
      })
      
      heatingMaterialRef.current = heatingMaterial
      coldMaterialRef.current = coldMaterial
      
      let isFirstMesh = true
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name.includes('Fry_pan')) {
          if (isFirstMesh) {
            child.material = heatingMaterial
            isFirstMesh = false
          } else {
            child.material = coldMaterial
          }
        }
      })
    } else {
      originalMaterials.forEach((material, mesh) => {
        mesh.material = material
      })
    }
  }, [thermalMode, scene, originalMaterials, centerPoint])

  useEffect(() => {
    if (thermalMode && heatingMaterialRef.current) {
      heatingMaterialRef.current.uniforms.heatingTime.value = heatingTime
      heatingMaterialRef.current.uniforms.isHeating.value = isHeating
      heatingMaterialRef.current.uniforms.centerPoint.value = centerPoint
    }
    
    if (thermalMode && coldMaterialRef.current) {
      coldMaterialRef.current.uniforms.heatingTime.value = 0
      coldMaterialRef.current.uniforms.isHeating.value = false
      coldMaterialRef.current.uniforms.temperature.value = 0.05
    }
  }, [heatingTime, isHeating, thermalMode, centerPoint])

  useFrame(({ clock }) => {
    if (thermalMode) {
      if (heatingMaterialRef.current) {
        heatingMaterialRef.current.uniforms.time.value = clock.getElapsedTime()
      }
      if (coldMaterialRef.current) {
        coldMaterialRef.current.uniforms.time.value = clock.getElapsedTime()
      }
    }
  })
  
  return <primitive object={scene} {...props} />
}

export default Pan