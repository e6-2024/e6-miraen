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
    splash04: number
  }
  sprayEffects?: {
    splash01: boolean
    splash02: boolean
    splash03: boolean
    splash04: boolean
  }
  wipingProgress?: {
    splash01: number
    splash02: number
    splash03: number
    splash04: number
  }
  castShadow?: boolean
  receiveShadow?: boolean
  doubleSide?: boolean
}

export const Model = ({ 
  splashOpacities, 
  sprayEffects,
  wipingProgress,
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
              
              else if (matName.includes('material.009') || 
                       matName.includes('material.010') || 
                       matName.includes('material.011') || 
                       matName.includes('material.012') || 
                       matName.includes('material.013') || 
                       matName.includes('material.014') || 
                       matName.includes('material.015') || 
                       matName.includes('material.016')) {
                material.transparent = true
                
                if (sprayEffects?.splash02 && splashOpacities.splash02 > 0.1) {
                  const wipingProgressValue = wipingProgress?.splash02 || 0
                  const fadeOpacity = Math.max(0, 1.0 - (wipingProgressValue / 100))
                  material.opacity = fadeOpacity
                  material.visible = fadeOpacity > 0.01
                } else {
                  material.opacity = 0.0
                  material.visible = false
                }
                
                material.needsUpdate = true
                child.castShadow = false
              }
              
              else if (matName.includes('material.006') || matName === 'material') {
                material.transparent = true
                
                if (sprayEffects?.splash04 && splashOpacities.splash04 > 0.1) {
                  const wipingProgressValue = wipingProgress?.splash04 || 0
                  const fadeOpacity = Math.max(0, 1.0 - (wipingProgressValue / 100))
                  material.opacity = fadeOpacity
                  material.visible = fadeOpacity > 0.01
                } else {
                  material.opacity = 0.0
                  material.visible = false
                }
                
                material.needsUpdate = true
                child.castShadow = false
              }
              
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
                
                if (texName.includes('windowsglass') && texName.includes('001')) {
                  material.transparent = true
                  material.opacity = splashOpacities.splash02
                  material.needsUpdate = true
                }
                else if (texName.includes('material') && 
                        (texName.includes('009') || 
                         texName.includes('010') || 
                         texName.includes('011') || 
                         texName.includes('012') || 
                         texName.includes('013') || 
                         texName.includes('014') || 
                         texName.includes('015') || 
                         texName.includes('016'))) {
                  material.transparent = true
                  if (sprayEffects?.splash02 && splashOpacities.splash02 > 0.1) {
                    const wipingProgressValue = wipingProgress?.splash02 || 0
                    const fadeOpacity = Math.max(0, 1.0 - (wipingProgressValue / 100))
                    material.opacity = fadeOpacity
                    material.visible = fadeOpacity > 0.01
                  } else {
                    material.opacity = 0.0
                    material.visible = false
                  }
                  material.needsUpdate = true
                }
                else if (texName.includes('material') && 
                        (texName.includes('006') || texName === 'material')) {
                  material.transparent = true
                  if (sprayEffects?.splash04 && splashOpacities.splash04 > 0.1) {
                    const wipingProgressValue = wipingProgress?.splash04 || 0
                    const fadeOpacity = Math.max(0, 1.0 - (wipingProgressValue / 100))
                    material.opacity = fadeOpacity
                    material.visible = fadeOpacity > 0.01
                  } else {
                    material.opacity = 0.0
                    material.visible = false
                  }
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
  }, [splashOpacities, sprayEffects, wipingProgress, castShadow, receiveShadow, doubleSide])

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