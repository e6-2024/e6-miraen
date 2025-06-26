import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { thermalVertexShader, thermalFragmentShader } from '@/components/5-2-2/shaders/thermalShader'

interface StoveProps extends GroupProps {
  thermalMode?: boolean;
}

export default function Stove({ thermalMode = false, ...props }: StoveProps) {
  const { scene } = useGLTF('models/5-2-2/Stove.glb')
  const [originalMaterials, setOriginalMaterials] = useState<Map<THREE.Mesh, THREE.Material>>(new Map())
  const thermalMaterialRef = useRef<THREE.ShaderMaterial>()
  
  useEffect(() => {
    const materials = new Map<THREE.Mesh, THREE.Material>()
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Store original materials
        if (!originalMaterials.has(child)) {
          materials.set(child, child.material)
        }
      }
    })
    
    if (materials.size > 0) {
      setOriginalMaterials(materials)
    }
  }, [scene])

  useEffect(() => {
    if (thermalMode) {
      // Create thermal material for stove (moderate temperature)
      const thermalMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader,
        fragmentShader: thermalFragmentShader,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0.4 }, // Stove base temperature (lower than food)
          baseColor: { value: new THREE.Color(0.3, 0.3, 0.5) }
        }
      })
      
      thermalMaterialRef.current = thermalMaterial
      
      // Apply thermal material to all meshes
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = thermalMaterial
        }
      })
    } else {
      // Restore original materials
      originalMaterials.forEach((material, mesh) => {
        mesh.material = material
      })
    }
  }, [thermalMode, scene, originalMaterials])

  useFrame(({ clock }) => {
    if (thermalMode && thermalMaterialRef.current) {
      thermalMaterialRef.current.uniforms.time.value = clock.getElapsedTime()
    }
  })
  
  return <primitive object={scene} {...props} />
}