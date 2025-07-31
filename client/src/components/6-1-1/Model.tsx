import * as THREE from 'three'
import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'

interface ModelProps {
  scale?: number
  position?: [number, number, number]
  splashOpacities?: {
    splash01: number // 도마
    splash02: number // 유리창  
    splash03: number // 변기
    splash04: number // 욕실
  }
  castShadow?: boolean
  receiveShadow?: boolean
  doubleSide?: boolean
}

export const Model = ({ 
  splashOpacities, 
  scale = 1, 
  position = [0, 0, 0],
  castShadow = true,
  receiveShadow = true,
  doubleSide = true
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
            if (doubleSide) {
              material.side = THREE.DoubleSide
            }
            
            if (material.name) {
              const matName = material.name.toLowerCase()
              
              // splash02 - 유리창 얼룩 (WindowsGlass.001)
              if (matName.includes('windowsglass.001')) {
                material.transparent = true
                material.opacity = splashOpacities.splash02
                material.needsUpdate = true
                
                if (splashOpacities.splash02 <= 0.1) {
                  material.visible = false
                  child.castShadow = false
                  child.receiveShadow = false
                } else {
                  material.visible = true
                  child.castShadow = castShadow
                  child.receiveShadow = receiveShadow
                }
              }
              
              // splash04 - 욕실 바닥 얼룩 (Material.008)
              else if (matName.includes('material.008')) {
                material.transparent = true
                material.opacity = splashOpacities.splash04
                material.needsUpdate = true
                
                if (splashOpacities.splash04 <= 0.1) {
                  material.visible = false
                  child.castShadow = false
                } else {
                  material.visible = true
                  child.castShadow = castShadow
                }
              }
            }
            
            const mapTypes = ['map', 'alphaMap', 'normalMap'] as const
            mapTypes.forEach(mapType => {
              const textureMap = material[mapType] as THREE.Texture | undefined
              if (textureMap?.name) {
                const texName = textureMap.name.toLowerCase()
                
                // 텍스처 이름으로 추가 확인 (필요시)
                if (texName.includes('windowsglass') && texName.includes('001')) {
                  material.transparent = true
                  material.opacity = splashOpacities.splash02
                  material.needsUpdate = true
                }
                else if (texName.includes('material') && texName.includes('008')) {
                  material.transparent = true
                  material.opacity = splashOpacities.splash04
                  material.needsUpdate = true
                }
              }
            })
          })
        }
      })
    }
  }, [splashOpacities, castShadow, receiveShadow, doubleSide])

  useEffect(() => {
    if (modelRef.current && gltf.scene) {
      if (gltf.scene.children.length > 0) {
        gltf.scene.remove(gltf.scene.children[1]);
      }
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