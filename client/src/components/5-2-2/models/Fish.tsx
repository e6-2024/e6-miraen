import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { thermalVertexShader, thermalFragmentShader } from '@/components/5-2-2/shaders/thermalShader'

interface FishProps extends GroupProps {
  thermalMode?: boolean;
}

export default function Fish({ thermalMode = false, ...props }: FishProps) {
  const { scene } = useGLTF('models/5-2-2/Fish.glb')
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
          temperature: { value: 0.6 }, // Fish cooking temperature
          baseColor: { value: new THREE.Color(0.8, 0.4, 0.2) }
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
