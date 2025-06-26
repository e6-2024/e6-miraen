import { useGLTF, useAnimations } from '@react-three/drei'
import { GroupProps } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Group, Mesh } from 'three'

interface ModelProps extends GroupProps {
  animationSpeed?: number
  castShadow?: boolean
  receiveShadow?: boolean
}

export default function Model({ 
  animationSpeed = 1, 
  castShadow = true, 
  receiveShadow = true, 
  ...props 
}: ModelProps) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF('models/6-1-2/Objects_Movement3.gltf')
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach((action) => {
        if (action) {
          if (animationSpeed === 0) {
            action.time = 0 
            action.paused = true 
            action.play() 
          } else {
            action.paused = false
            action.timeScale = animationSpeed  
            action.play()
          }
        }
      })
    }
  }, [actions, animationSpeed])

  useEffect(() => {
    // 모든 메쉬에 그림자 설정 적용
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = castShadow
          child.receiveShadow = receiveShadow
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshLambertMaterial) {
                  mat.needsUpdate = true
                }
              })
            } else {
              if (child.material.isMeshStandardMaterial || child.material.isMeshPhongMaterial || child.material.isMeshLambertMaterial) {
                child.material.needsUpdate = true
              }
            }
          }
        }
      })
    }
  }, [scene, castShadow, receiveShadow])

  return (
    <group ref={group} {...props}>
      <primitive object={scene} />
    </group>
  )
}