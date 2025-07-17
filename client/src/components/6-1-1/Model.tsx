// components/Model.tsx (정확한 텍스처 매핑 + 그림자 설정 버전)
import * as THREE from 'three'
import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'

interface ModelProps {
  scale?: number
  position?: [number, number, number]
  splashOpacities?: {
    splash01: number
    splash02: number  
    splash03: number
  }
  // 그림자 설정 옵션들
  castShadow?: boolean
  receiveShadow?: boolean
}

export const Model = ({ 
  splashOpacities, 
  scale = 1, 
  position = [0, 0, 0],
  castShadow = true,
  receiveShadow = true
}: ModelProps) => {
  const gltf = useGLTF('/models/6-1-1/New_Clean_Room/New_Room.gltf')
  const modelRef = useRef<THREE.Group>(null)
  
  const configureShadows = (object: THREE.Object3D) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow
        child.receiveShadow = receiveShadow
        
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach((material) => {
            if (material.transparent && material.opacity < 0.5) {
              child.castShadow = false
            }
          })
        }
      }
    })
  }
  
  useEffect(() => {
    if (modelRef.current && splashOpacities) {
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          
          materials.forEach((material) => {
            if (material.name) {
              const matName = material.name.toLowerCase()
              
              // splash01 - 유리
              if (matName.includes('Window_WindowsGlass') || 
                  (material.map?.name?.includes('Window_WindowsGlass'))) {
                material.transparent = true
                material.opacity = splashOpacities.splash01
                material.needsUpdate = true
                
                if (splashOpacities.splash01 <= 0.1) {
                  material.visible = false
                  child.castShadow = false
                  child.receiveShadow = false
                } else {
                  material.visible = true
                  child.castShadow = castShadow
                  child.receiveShadow = receiveShadow
                }
              }
              
              // splash03 - 욕실
              else if (matName.includes('bathroom_dirt') || 
                       (material.map?.name?.includes('bathroom_dirt'))) {
                material.transparent = true
                material.opacity = splashOpacities.splash03
                material.needsUpdate = true
                
                if (splashOpacities.splash03 <= 0.1) {
                  child.castShadow = false
                }
              }
            }
            
            const mapTypes = ['map', 'alphaMap', 'normalMap'] as const
            mapTypes.forEach(mapType => {
              const textureMap = material[mapType] as THREE.Texture | undefined
              if (textureMap?.name) {
                const texName = textureMap.name.toLowerCase()
                
                if (texName.includes('t_bigsplash08')) {
                  material.transparent = true
                  material.opacity = splashOpacities.splash01
                  material.needsUpdate = true
                }
                else if (texName.includes('t_bigsplash03')) {
                  material.transparent = true
                  material.opacity = splashOpacities.splash03
                  material.needsUpdate = true
                }
              }
            })
          })
        }
      })
    }
  }, [splashOpacities, castShadow, receiveShadow])

  useEffect(() => {
    if (modelRef.current && gltf.scene) {
      if (gltf.scene.children.length > 0) {
        gltf.scene.remove(gltf.scene.children[1]);
      }
      // 그림자 설정 적용
      configureShadows(gltf.scene)
    }
  }, [gltf.scene, castShadow, receiveShadow])
  
  return (
    <group ref={modelRef} scale={scale} position={position} dispose={null}>
      <primitive object={gltf.scene} scale={1.0} position={[0,-5,0]} rotation={[0, 0, 0]} />
    </group>
  )
}

useGLTF.preload('/models/6-1-1/New_Clean_Room/New_Room.gltf')