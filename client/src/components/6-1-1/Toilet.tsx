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
}

export const Toilet = ({
  splashOpacities,
  sprayEffects,
  wipingProgress,
  scale = 1,
  position = [0, 0, 0],
  castShadow = true,
  receiveShadow = true,
}: ModelProps) => {
  const gltf = useGLTF('/models/6-1-1/Toilet/New_Toilet.glb')
  const modelRef = useRef<THREE.Group>(null)

  const configureShadows = (object: THREE.Object3D) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow
        child.receiveShadow = receiveShadow
      }
    })
  }

  useEffect(() => {
    if (modelRef.current && splashOpacities) {
      const textureLoader = new THREE.TextureLoader()
      
      const cleanBaseTexture = textureLoader.load('/models/6-1-1/Toilet/Toilet_Clean_Base_color.png')
      const cleanRoughnessTexture = textureLoader.load('/models/6-1-1/Toilet/Toilet_Clean_Roughness.png')
      
      const isReset = splashOpacities.splash03 >= 0.99
      
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial
          
          if (material.map?.name === 'T_BigSplash02') {
            material.transparent = true
            material.opacity = splashOpacities.splash03
            material.needsUpdate = true
            
            if (splashOpacities.splash03 <= 0.1) {
              child.castShadow = false
            } else {
              child.castShadow = castShadow
            }
          }
          
          if (material.name) {
            const matName = material.name.toLowerCase()
            
            if (
              matName.includes('bloodmaterialexample.001') ||
              (matName.includes('bloodmaterialexample') &&
                !matName.includes('example2') &&
                !matName.includes('example3') &&
                !matName.includes('example4'))
            ) {
              material.transparent = true
              material.opacity = splashOpacities.splash03
              material.needsUpdate = true
              
              if (splashOpacities.splash03 <= 0.1) {
                child.castShadow = false
              } else {
                child.castShadow = castShadow
              }
            }
            
            if (matName.includes('material.001') || 
                matName.includes('material.002') || 
                matName.includes('material.003') || 
                matName.includes('material.004') || 
                matName.includes('material.006') || 
                matName.includes('material.008')) {
              material.transparent = true
              
              if (sprayEffects?.splash03 && splashOpacities.splash03 > 0.1) {
                const wipingProgressValue = wipingProgress?.splash03 || 0
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
          }
          
          if (material.map?.name === 'Toilet_Dirty_Base_color') {
            if (isReset) {
              material.needsUpdate = true
            } else {
              const cleanProgress = 1 - splashOpacities.splash03
              
              if (cleanProgress > 0.05) {
                material.map = cleanBaseTexture
                material.roughnessMap = cleanRoughnessTexture
                material.needsUpdate = true
              }
            }
          }
        }
      })
    }
  }, [splashOpacities, sprayEffects, wipingProgress, castShadow, receiveShadow])

  useEffect(() => {
    if (modelRef.current && gltf.scene) {
      if (gltf.scene.children.length > 0) {
        gltf.scene.remove(gltf.scene.children[1])
      }
      
      configureShadows(gltf.scene)
    }
  }, [gltf.scene, castShadow, receiveShadow])

  return (
    <group ref={modelRef} scale={scale} position={position} dispose={null}>
      <primitive object={gltf.scene} scale={1.0} position={[0, -5, 0]} rotation={[0, Math.PI/2, 0]} />
    </group>
  )
}

useGLTF.preload('/models/6-1-1/Toilet/New_Toilet.glb')