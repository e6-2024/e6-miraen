import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { thermalVertexShader, thermalFragmentShader } from '@/components/5-2-2/shaders/thermalShader'

interface MeatProps extends Omit<GroupProps, 'position'> {
  thermalMode?: boolean;
  isHeating?: boolean;
  heatingTime?: number;
  heatingProgress?: number;
  heatSourcePosition?: [number, number, number];
  position?: [number, number, number];
}

export function Meat({ 
  thermalMode = false, 
  isHeating = false, 
  heatingTime = 0, 
  heatingProgress = 0,
  heatSourcePosition = [0, 0, 0], 
  position = [0, 0, 0],
  ...props 
}: MeatProps) {
  const { scene } = useGLTF('models/5-2-2/Meat.glb')
  const [originalMaterials, setOriginalMaterials] = useState<Map<THREE.Mesh, THREE.Material>>(new Map())
  const [cookedTexture, setCookedTexture] = useState<THREE.Texture | null>(null)
  const thermalMaterialRef = useRef<THREE.ShaderMaterial>()
  const groupRef = useRef<THREE.Group>(null)
  const [prevThermalMode, setPrevThermalMode] = useState(thermalMode)
  
  useEffect(() => {
    const materials = new Map<THREE.Mesh, THREE.Material>()
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        if (!originalMaterials.has(child)) {
          materials.set(child, child.material.clone())
        }
      }
    })
    
    if (materials.size > 0) {
      setOriginalMaterials(materials)
    }

    const loader = new THREE.TextureLoader()
    
    loader.load(
      '/textures/5-2-2/CookedSteak1.001_AlbedoTransparency.png',
      (texture) => {
        texture.flipY = false
        setCookedTexture(texture)
      },
      undefined,
      (error) => {
        console.warn('Cooked texture loading failed:', error)
      }
    )
  }, [scene])

  const getCurrentCenterPoint = () => {
    if (!groupRef.current) return new THREE.Vector3(...position)
    
    const box = new THREE.Box3()
    groupRef.current.updateWorldMatrix(true, true)
    box.setFromObject(groupRef.current)
    
    return box.getCenter(new THREE.Vector3())
  }

  useEffect(() => {
    if (thermalMode) {
      if (thermalMode !== prevThermalMode) {
        if (thermalMaterialRef.current) {
          thermalMaterialRef.current.dispose()
          thermalMaterialRef.current = undefined
        }
      }
      
      const currentCenter = getCurrentCenterPoint()
      
      const thermalMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader,
        fragmentShader: thermalFragmentShader,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0.15 },
          heatingTime: { value: heatingTime },
          baseColor: { value: new THREE.Color(0.9, 0.3, 0.1) },
          centerPoint: { value: currentCenter },
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
      if (thermalMode !== prevThermalMode && thermalMaterialRef.current) {
        thermalMaterialRef.current.dispose()
        thermalMaterialRef.current = undefined
      }
      
      if (cookedTexture) {
        const blendFactor = heatingProgress > 0 ? Math.min(heatingProgress / 100, 1.0) : 0.2
        
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const originalMaterial = originalMaterials.get(child) as THREE.MeshStandardMaterial
            
            if (originalMaterial && blendFactor > 0) {
              const material = originalMaterial.clone()
              
              if (material.name === 'Steak1.002') {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                if (ctx && originalMaterial.map && cookedTexture) {
                  canvas.width = 512
                  canvas.height = 512
                  
                  const originalImg = originalMaterial.map.image
                  if (originalImg) {
                    ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height)
                    
                    ctx.globalAlpha = blendFactor
                    ctx.globalCompositeOperation = 'source-over'
                    const cookedImg = cookedTexture.image
                    if (cookedImg) {
                      ctx.drawImage(cookedImg, 0, 0, canvas.width, canvas.height)
                    }
                    
                    const blendedTexture = new THREE.CanvasTexture(canvas)
                    blendedTexture.flipY = false
                    material.map = blendedTexture
                    material.needsUpdate = true
                  }
                }
                child.material = material
              } else {
                child.material = originalMaterial
              }
            } else {
              child.material = originalMaterial
            }
          }
        })
      } else {
        originalMaterials.forEach((material, mesh) => {
          mesh.material = material
        })
      }
    }
    
    setPrevThermalMode(thermalMode)
  }, [thermalMode, scene, originalMaterials, position, isHeating, heatingProgress, cookedTexture])

  useEffect(() => {
    if (thermalMode && thermalMaterialRef.current) {
      const currentCenter = getCurrentCenterPoint()
      
      thermalMaterialRef.current.uniforms.heatingTime.value = heatingTime
      thermalMaterialRef.current.uniforms.isHeating.value = isHeating
      thermalMaterialRef.current.uniforms.centerPoint.value = currentCenter
    }
  }, [heatingTime, isHeating, thermalMode, position])

  useFrame(({ clock }) => {
    if (thermalMode && thermalMaterialRef.current) {
      thermalMaterialRef.current.uniforms.time.value = clock.getElapsedTime()
      
      const currentCenter = getCurrentCenterPoint()
      thermalMaterialRef.current.uniforms.centerPoint.value = currentCenter
    }
  })

  useEffect(() => {
    return () => {
      if (thermalMaterialRef.current) {
        thermalMaterialRef.current.dispose()
      }
    }
  }, [])
  
  return (
    <group ref={groupRef} position={position} {...props}>
      <primitive object={scene} />
    </group>
  )
}

export default Meat