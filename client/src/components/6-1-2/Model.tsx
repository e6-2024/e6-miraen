import { useGLTF, useAnimations } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { Group, Mesh, AnimationAction } from 'three'
import * as THREE from 'three'

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
    if (!scene) return

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = castShadow
      child.receiveShadow = receiveShadow

      if (child.name.startsWith('Crabapple')) {
        const mats: THREE.Material[] = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((mat) => {
          const m = mat as THREE.MeshStandardMaterial
          m.transparent = true
          m.alphaTest = 0.5
          m.depthWrite = true 
          m.needsUpdate = true
          const depthMat = new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking,
            map: m.map,
            alphaTest: m.alphaTest,
          })
          child.customDepthMaterial = depthMat
        })
      }
    })
  }, [scene, castShadow, receiveShadow])

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

          if (animationTimeRef.current >= clipDuration) {
            animationTimeRef.current = clipDuration
            
            if (!hasCompletedOnce) {
              setHasCompletedOnce(true)
              action.time = clipDuration
              action.paused = true
              if (onAnimationComplete) {
                onAnimationComplete()
              }
            }
          } else {
            action.time = animationTimeRef.current
          }
        }
      })
    }
  })

  return (
    <group ref={group} {...props}>
      <primitive object={scene} />
    </group>
  )
}