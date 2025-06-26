// components/Model.tsx - 강제 애니메이션 버전
import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Model(props: GroupProps) {
  const { scene } = useGLTF('models/5-2-3/Weather.glb')
  const animationEnabledRef = useRef(false)
  
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        if (child.material) {
          child.material.shadowSide = THREE.FrontSide
        }
      }
    })
    
    // 약간의 지연 후 애니메이션 활성화 (모델이 완전히 로드된 후)
    setTimeout(() => {
      animationEnabledRef.current = true
      console.log('Wind animation enabled')
    }, 100)
  }, [scene])
  
  useFrame((state) => {
    if (!animationEnabledRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // scene.children[0]에 직접 접근
    const windObject = scene.children[1]
    
    if (windObject) {
      windObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          
          materials.forEach((material) => {
            // 모든 텍스처 타입에 대해 시도
            const textures = [
              material.map,           // 기본 텍스처
              material.normalMap,     // 노멀맵
              material.roughnessMap,  // 러프니스맵
              material.metalnessMap,  // 메탈니스맵
              material.emissiveMap,   // 이미시브맵
              material.aoMap          // AO맵
            ].filter(Boolean) // null/undefined 제거
            
            textures.forEach((texture) => {
              if (texture) {
                // 래핑 모드 강제 설정
                texture.wrapS = THREE.RepeatWrapping
                texture.wrapT = THREE.RepeatWrapping
                
                // 빠른 바람 효과
                const speed = 0.2
                texture.offset.y = (time * speed) % 1
              
                
                texture.needsUpdate = true
              }
            })
          })
        }
      })
    }
    
    // 디버깅: 5초마다 현재 오프셋 값 출력
    if (Math.floor(time) % 5 === 0 && Math.floor(time * 10) % 10 === 0) {
      console.log('Current animation time:', time, 'Offset should be:', (time * 1.5) % 1)
    }
  })
  
  return <primitive object={scene} {...props} />
}