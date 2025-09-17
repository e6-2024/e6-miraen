import { useGLTF, useAnimations } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { Group, Mesh, AnimationAction } from 'three'

interface ModelProps extends GroupProps {
  animationSpeed?: number
  castShadow?: boolean
  receiveShadow?: boolean
  onAnimationComplete?: () => void
  resetTrigger?: boolean
}

export default function Model({
  animationSpeed = 1,
  castShadow = true,
  receiveShadow = true,
  onAnimationComplete,
  resetTrigger = false,
  ...props
}: ModelProps) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF('models/6-1-2/Objects_Movement3.gltf')
  const { actions } = useAnimations(animations, group)
  const animationTimeRef = useRef(0)
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (resetTrigger) {
      setHasCompletedOnce(false)
      setIsInitialized(false)
      animationTimeRef.current = 0

      if (actions) {
        Object.values(actions).forEach((action) => {
          if (action) {
            action.reset()
            action.time = 0
            action.paused = true
            action.timeScale = 1
          }
        })
      }
    }
  }, [resetTrigger, actions])

  useEffect(() => {
    if (actions && !isInitialized) {
      Object.values(actions).forEach((action) => {
        if (action) {
          action.reset()
          action.time = 0
          action.setLoop(2201, 1)
          action.clampWhenFinished = true
          action.paused = true
          action.play()
          action.paused = true
        }
      })
      setIsInitialized(true)
    }
  }, [actions, isInitialized])

  useEffect(() => {
    if (actions && isInitialized) {
      Object.values(actions).forEach((action) => {
        if (action) {
          if (animationSpeed === 0) {
            action.paused = true
          } else if (animationSpeed > 0 && !hasCompletedOnce) {
            action.paused = false
            action.timeScale = animationSpeed
            action.play()
          }
        }
      })
    }
  }, [actions, animationSpeed, isInitialized, hasCompletedOnce])

  useFrame((state, delta) => {
    if (animationSpeed > 0 && actions && isInitialized && !hasCompletedOnce) {
      animationTimeRef.current += delta * animationSpeed

      Object.values(actions).forEach((action) => {
        if (action && action.getClip()) {
          const clipDuration = action.getClip().duration

          if (animationTimeRef.current >= clipDuration && !hasCompletedOnce) {
            setHasCompletedOnce(true)
            action.time = clipDuration
            action.paused = true
            if (onAnimationComplete) {
              onAnimationComplete()
            }
          }
        }
      })
    }
  })

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = castShadow
          child.receiveShadow = receiveShadow


          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshLambertMaterial) {
                  mat.side = 1 
                  mat.needsUpdate = true
                }
              })
            } else {
              if (
                child.material.isMeshStandardMaterial ||
                child.material.isMeshPhongMaterial ||
                child.material.isMeshLambertMaterial
              ) {
                child.material.side = 2 
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
