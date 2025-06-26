// components/Model.tsx (정확한 텍스처 매핑 버전)
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
}

export const Model = ({ splashOpacities, scale = 1, position = [0, 0, 0] }: ModelProps) => {
  const gltf = useGLTF('/models/6-1-1/New_Clean_Room/New_Room.gltf')
  const modelRef = useRef<THREE.Group>(null)
  
  useEffect(() => {
    if (modelRef.current && splashOpacities) {
      
      let updated = {
        splash01: false,
        splash02: false,
        splash03: false
      }
      
      // 모든 메쉬와 머티리얼을 순회
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          
          materials.forEach((material) => {
            // 머티리얼 이름으로 정확히 매핑
            if (material.name) {
              const matName = material.name.toLowerCase()
              
              // T_BigSplash08Opacity-1이 포함된 머티리얼 (유리) - 올바른 매핑!
              if (matName.includes('bloodmaterialexample4') || 
                  (material.map && material.map.name && material.map.name.includes('T_BigSplash08'))) {
                
                // 기본 opacity 설정
                material.transparent = true
                material.opacity = splashOpacities.splash01
                material.needsUpdate = true
                
                // 유리 텍스처는 alphaMap도 확인 (특별 처리)
                if (material.alphaMap) {
                  material.alphaMap.needsUpdate = true
                }
                
                // 더 강력한 숨김 처리
                if (splashOpacities.splash01 <= 0.1) {
                  material.visible = false
                  // 추가적인 렌더링 옵션들
                  material.depthWrite = false
                  material.depthTest = false
                } else {
                  material.visible = true
                  material.depthWrite = true
                  material.depthTest = true
                }
                
                // 블렌딩 모드도 조정
                material.blending = THREE.NormalBlending
                
                updated.splash01 = true
              }
              
              // T_BigSplash02Opacity가 포함된 머티리얼 (변기)
              else if (matName.includes('bloodmaterialexample.001') || matName.includes('bloodmaterialexample') && !matName.includes('example2') && !matName.includes('example3') && !matName.includes('example4') ||
                       (material.map && material.map.name && material.map.name.includes('T_BigSplash02'))) {
                material.transparent = true
                material.opacity = splashOpacities.splash02
                material.needsUpdate = true
                updated.splash02 = true
              }
              
              // T_BigSplash03Opacity가 포함된 머티리얼 (욕실)
              else if (matName.includes('bloodmaterialexample3') || 
                       (material.map && material.map.name && material.map.name.includes('T_BigSplash03'))) {
                material.transparent = true
                material.opacity = splashOpacities.splash03
                material.needsUpdate = true
                updated.splash03 = true
              }
            }
            
            // 추가로 텍스처 맵들도 직접 확인
            const mapTypes = ['map', 'alphaMap', 'normalMap'] as const
            mapTypes.forEach(mapType => {
              const textureMap = material[mapType] as THREE.Texture | undefined
              if (textureMap && textureMap.name) {
                const texName = textureMap.name.toLowerCase()
                
                if (texName.includes('t_bigsplash08')) {
                  material.transparent = true
                  material.opacity = splashOpacities.splash01
                  material.needsUpdate = true
                  updated.splash01 = true
                }
                else if (texName.includes('t_bigsplash02')) {
                  material.transparent = true
                  material.opacity = splashOpacities.splash02
                  material.needsUpdate = true
                  updated.splash02 = true
                }
                else if (texName.includes('t_bigsplash03')) {
                  material.transparent = true
                  material.opacity = splashOpacities.splash03
                  material.needsUpdate = true
                  updated.splash03 = true
                }
              }
            })
          })
        }
      })
    }
  }, [splashOpacities])
  
  // 간단한 디버깅 (한 번만)
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          
          materials.forEach((material) => {
            const matName = (material.name || '').toLowerCase()
            
          })
        }
      })
      
    }
  }, [])
  
  return (
    <group ref={modelRef} scale={scale} position={position} dispose={null}>
      <primitive object={gltf.scene} scale={1.0} position={[0,-5,0]} rotation={[0, 0, 0]} />
    </group>
  )
}

useGLTF.preload('/models/6-1-1/New_Clean_Room/New_Room.gltf')