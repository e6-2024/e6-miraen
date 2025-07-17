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

export const Toilet = ({
  splashOpacities,
  scale = 1,
  position = [0, 0, 0],
  castShadow = true,
  receiveShadow = true,
}: ModelProps) => {
  const gltf = useGLTF('/models/6-1-1/Toilet/Toilet.glb')
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
      const textureLoader = new THREE.TextureLoader()
      
      // Clean 텍스처들 로드
      const cleanBaseTexture = textureLoader.load('/models/6-1-1/Toilet/Toilet_Clean_Base_color.png')
      const cleanRoughnessTexture = textureLoader.load('/models/6-1-1/Toilet/Toilet_Clean_Roughness.png')
      
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
                  // splash02가 줄어들수록 깨끗해짐 (1 -> 0으로 갈 때 깨끗해짐)
                  const cleanProgress = 1 - splashOpacities.splash02
                  
                  if (cleanProgress > 0) {
                    // 청소 진행도에 따라 점진적으로 Clean 텍스처 적용
                    material.map = cleanBaseTexture
                    material.roughnessMap = cleanRoughnessTexture
                    material.transparent = true
                    // cleanProgress가 0에서 1로 증가하면서 Clean 텍스처가 점점 불투명해짐
                    material.opacity = Math.min(cleanProgress, 1.0)
                    material.needsUpdate = true
                  } else {
                    // 청소 안 함 - 기존 더러운 텍스처 유지
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
                    const cleanProgress = 1 - splashOpacities.splash02
                    
                    if (cleanProgress >= 0.95) {
                      material.map = cleanBaseTexture
                      material.roughnessMap = cleanRoughnessTexture
                      material.transparent = false
                      material.opacity = 1.0
                      material.needsUpdate = true
                    } else {
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
    }
  }, [gltf.scene, castShadow, receiveShadow])

  return (
    <group ref={modelRef} scale={scale} position={position} dispose={null}>
      <primitive object={gltf.scene} scale={1.0} position={[0, -5, 0]} rotation={[0, 0, 0]} />
    </group>
  )
}

useGLTF.preload('/models/6-1-1/Toilet/Toilet.glb')