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
  castShadow?: boolean
  receiveShadow?: boolean
}

export const Toilet = ({
  splashOpacities,
  scale = 1,
  position = [0, 0, 0],
  castShadow = true,
  receiveShadow = true,
}: ModelProps) => {
  const gltf = useGLTF('/models/6-1-1/Toilet/Toilet.glb')
  const modelRef = useRef<THREE.Group>(null)
  
  // 원본 텍스처들을 저장할 ref
  const originalTexturesRef = useRef<Map<string, {
    map?: THREE.Texture
    roughnessMap?: THREE.Texture
    opacity: number
    transparent: boolean
  }>>(new Map())

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

  // 원본 텍스처 저장
  const saveOriginalTextures = () => {
    if (!modelRef.current) return

    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]

        materials.forEach((material, index) => {
          const materialKey = `${child.uuid}_${index}`
          
          if (!originalTexturesRef.current.has(materialKey)) {
            originalTexturesRef.current.set(materialKey, {
              map: material.map?.clone(),
              roughnessMap: material.roughnessMap?.clone(),
              opacity: material.opacity,
              transparent: material.transparent
            })
          }
        })
      }
    })
  }

  // 텍스처 초기화
  const restoreOriginalTextures = () => {
    if (!modelRef.current) return

    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]

        materials.forEach((material, index) => {
          const materialKey = `${child.uuid}_${index}`
          const originalTexture = originalTexturesRef.current.get(materialKey)
          
          if (originalTexture && material instanceof THREE.MeshStandardMaterial) {
            material.map = originalTexture.map || null
            material.roughnessMap = originalTexture.roughnessMap || null
            material.opacity = originalTexture.opacity
            material.transparent = originalTexture.transparent
            material.needsUpdate = true
          }
        })
      }
    })
  }

  useEffect(() => {
    if (modelRef.current && splashOpacities) {
      const textureLoader = new THREE.TextureLoader()
      
      // Clean 텍스처들 로드
      const cleanBaseTexture = textureLoader.load('/models/6-1-1/Toilet/Toilet_Clean_Base_color.png')
      const cleanRoughnessTexture = textureLoader.load('/models/6-1-1/Toilet/Toilet_Clean_Roughness.png')
      
      // splash02가 100%로 초기화되었는지 확인 (다시하기 상태)
      const isReset = splashOpacities.splash02 >= 0.99
      
      if (isReset) {
        // 다시하기: 원본 더러운 텍스처로 복원
        restoreOriginalTextures()
      }
      
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]

          materials.forEach((material) => {
            if (material.name) {
              const matName = material.name.toLowerCase()
              
              // splash02 - 변기 splash 메테리얼 처리
              if (
                matName.includes('bloodmaterialexample.001') ||
                (matName.includes('bloodmaterialexample') &&
                  !matName.includes('example2') &&
                  !matName.includes('example3') &&
                  !matName.includes('example4')) ||
                material.map?.name?.includes('T_BigSplash02')
              ) {
                material.transparent = true
                material.opacity = splashOpacities.splash02
                material.needsUpdate = true

                if (splashOpacities.splash02 <= 0.1) {
                  child.castShadow = false
                } else {
                  child.castShadow = castShadow
                }
              }
              
              // splash02 - 변기 본체 청소 진행도에 따른 텍스처 변경
              if (
                matName.includes('toilet') || 
                matName.includes('ceramic') ||
                matName.includes('porcelain') ||
                matName.includes('base') ||
                matName.includes('body')
              ) {
                if (material instanceof THREE.MeshStandardMaterial) {
                  if (isReset) {
                    // 다시하기: 이미 restoreOriginalTextures에서 처리됨
                    return
                  }
                  
                  // splash02가 줄어들수록 깨끗해짐 (1 -> 0으로 갈 때 깨끗해짐)
                  const cleanProgress = 1 - splashOpacities.splash02
                  
                  if (cleanProgress > 0.05) {
                    // 청소 진행도에 따라 점진적으로 Clean 텍스처 적용
                    material.map = cleanBaseTexture
                    material.roughnessMap = cleanRoughnessTexture
                    material.transparent = false
                    material.opacity = 1.0
                    material.needsUpdate = true
                  }
                }
              }
            }

            // 텍스처 이름으로도 확인
            const mapTypes = ['map', 'alphaMap', 'normalMap'] as const
            mapTypes.forEach((mapType) => {
              const textureMap = material[mapType] as THREE.Texture | undefined
              if (textureMap?.name) {
                const texName = textureMap.name.toLowerCase()

                if (texName.includes('t_bigsplash02')) {
                  material.transparent = true
                  material.opacity = splashOpacities.splash02
                  material.needsUpdate = true
                }
                
                // 기존 더러운 텍스처들에 청소 진행도 적용
                if (
                  texName.includes('toilet_dirty') ||
                  texName.includes('toilet_base') ||
                  texName.includes('dirty') ||
                  texName.includes('stain')
                ) {
                  if (material instanceof THREE.MeshStandardMaterial) {
                    if (isReset) {
                      // 다시하기: 이미 restoreOriginalTextures에서 처리됨
                      return
                    }
                    
                    const cleanProgress = 1 - splashOpacities.splash02
                    
                    if (cleanProgress >= 0.95) {
                      material.map = cleanBaseTexture
                      material.roughnessMap = cleanRoughnessTexture
                      material.transparent = false
                      material.opacity = 1.0
                      material.needsUpdate = true
                    }
                  }
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
        gltf.scene.remove(gltf.scene.children[1])
      }
      
      configureShadows(gltf.scene)
      
      // 원본 텍스처 저장
      setTimeout(() => {
        saveOriginalTextures()
      }, 100) // 텍스처 로딩 완료를 위한 약간의 지연
    }
  }, [gltf.scene, castShadow, receiveShadow])

  return (
    <group ref={modelRef} scale={scale} position={position} dispose={null}>
      <primitive object={gltf.scene} scale={1.0} position={[0, -5, 0]} rotation={[0, 0, 0]} />
    </group>
  )
}

useGLTF.preload('/models/6-1-1/Toilet/Toilet.glb')