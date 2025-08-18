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
  sprayColorHex?: string
}

export const Toilet = ({
  splashOpacities,
  sprayEffects,
  wipingProgress,
  scale = 1,
  position = [0, 0, 0],
  castShadow = true,
  receiveShadow = true,
  sprayColorHex = '#ffffff',
}: ModelProps) => {
  const gltf = useGLTF('/models/6-1-1/Toilet/New_Toilet.glb')
  const modelRef = useRef<THREE.Group>(null)
  const sprayColor = new THREE.Color(sprayColorHex)
  // 텍스처들을 ref로 저장하여 재사용
  const textureRefs = useRef<{
    cleanBase?: THREE.Texture
    cleanRoughness?: THREE.Texture
    dirtyBase?: THREE.Texture
    dirtyRoughness?: THREE.Texture
    originalMaterials?: Map<THREE.Material, { map: THREE.Texture | null; roughnessMap: THREE.Texture | null }>
  }>({})

  const configureShadows = (object: THREE.Object3D) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow
        child.receiveShadow = receiveShadow
      }
    })
  }

  // 초기 텍스처와 재료 저장
  useEffect(() => {
    if (modelRef.current && !textureRefs.current.originalMaterials) {
      const textureLoader = new THREE.TextureLoader()
      textureRefs.current.originalMaterials = new Map()

      // 깨끗한 텍스처 로드
      textureRefs.current.cleanBase = textureLoader.load('/models/6-1-1/Toilet/Toilet_Clean_Base_color.png')
      textureRefs.current.cleanRoughness = textureLoader.load('/models/6-1-1/Toilet/Toilet_Clean_Roughness.png')

      // 원본 재료와 텍스처 저장
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial
          if (material.map?.name === 'Toilet_Dirty_Base_color') {
            textureRefs.current.originalMaterials!.set(material, {
              map: material.map.clone(),
              roughnessMap: material.roughnessMap?.clone() || null,
            })

            // 더러운 텍스처도 저장
            textureRefs.current.dirtyBase = material.map.clone()
            textureRefs.current.dirtyRoughness = material.roughnessMap?.clone() || null
          }
        }
      })
    }
  }, [gltf.scene])

  useEffect(() => {
    if (modelRef.current && splashOpacities) {
      const cleanProgress = 1 - splashOpacities.splash03 // 0 (더러움) ~ 1 (깨끗함)

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

            if (
              matName.includes('material.001') ||
              matName.includes('material.002') ||
              matName.includes('material.003') ||
              matName.includes('material.004') ||
              matName.includes('material.006') ||
              matName.includes('material.008')
            ) {
              material.transparent = true
              if ('color' in material && (material as any).color?.set) {
                (material as any).color.set(sprayColor)
              }

              if (sprayEffects?.splash03 && splashOpacities.splash03 > 0.1) {
                const wipingProgressValue = wipingProgress?.splash03 || 0
                const fadeOpacity = Math.max(0, 1.0 - wipingProgressValue / 100)
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

          // 텍스처 교체 로직 수정
          if (material.map?.name === 'Toilet_Dirty_Base_color' || material.map?.name === 'Toilet_Clean_Base_color') {
            const cleanProgress = 1 - splashOpacities.splash03 // 0 (더러움) ~ 1 (깨끗함)

            if (cleanProgress > 0.95) {
              // 거의 완전히 깨끗할 때 - 깨끗한 텍스처 사용
              if (textureRefs.current.cleanBase) {
                material.map = textureRefs.current.cleanBase
                material.roughnessMap = textureRefs.current.cleanRoughness || null
                material.map.name = 'Toilet_Clean_Base_color' // 이름 업데이트
              }
            } else {
              // 더러울 때 - 원본 더러운 텍스처로 복원
              const originalData = textureRefs.current.originalMaterials?.get(material)
              if (originalData) {
                material.map = originalData.map
                material.roughnessMap = originalData.roughnessMap
                if (material.map) {
                  material.map.name = 'Toilet_Dirty_Base_color' // 이름 복원
                }
              } else if (textureRefs.current.dirtyBase) {
                // fallback으로 저장된 더러운 텍스처 사용
                material.map = textureRefs.current.dirtyBase
                material.roughnessMap = textureRefs.current.dirtyRoughness || null
                material.map.name = 'Toilet_Dirty_Base_color'
              }
            }

            material.needsUpdate = true
          }
        }
      })
    }
  }, [splashOpacities, sprayEffects, wipingProgress, castShadow, receiveShadow, sprayColorHex])

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
      <primitive
        object={gltf.scene}
        scale={1.0}
        position={[0, -5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        receiveShadow
      />
    </group>
  )
}

useGLTF.preload('/models/6-1-1/Toilet/New_Toilet.glb')
