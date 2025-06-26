import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { thermalVertexShader, thermalFragmentShader } from '@/components/5-2-2/shaders/thermalShader'

interface MeatProps extends GroupProps {
  thermalMode?: boolean;
}

export default function Meat({ thermalMode = false, ...props }: MeatProps) {
  const { scene } = useGLTF('models/5-2-2/Meat.glb')
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
      // Create thermal material
      const thermalMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader,
        fragmentShader: thermalFragmentShader,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0.7 }, // Meat cooking temperature (higher than fish)
          baseColor: { value: new THREE.Color(0.9, 0.3, 0.1) }
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
