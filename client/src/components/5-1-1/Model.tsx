import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

interface ModelProps {
  path: string
  scale?: number
  position?: [number, number, number]
  sceneIndex: number
  shouldAnimate: boolean
  animationSpeed?: number
  customAnimation?: 'fadeAndMove' | null
  onAnimationComplete?: () => void
  animationKey?: number
}

export default function Model({ 
  path, 
  scale = 4, 
  position = [0, 0, 0], 
  sceneIndex,
  shouldAnimate,
  animationSpeed = 1.0,
  customAnimation = null,
  onAnimationComplete,
  animationKey = 0
}: ModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(path) as any
  const mixer = useRef<THREE.AnimationMixer | null>(null)
  const actionsRef = useRef<THREE.AnimationAction[]>([])
  const isPlayingRef = useRef(false)
  const isInitializedRef = useRef(false)
  const prevAnimationKeyRef = useRef(animationKey)
  const startFadeAndMoveAnimation = useCallback(() => {
    if (!scene || !scene.children[3]) return
    isPlayingRef.current = true

    const targetObject = scene.children[3]
    const duration = 5000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress

      const opacity = 1 - eased

      targetObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(material => {
              material.opacity = opacity
            })
          } else {
            mesh.material.opacity = opacity
          }
        }
      })

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        isPlayingRef.current = false
        onAnimationComplete?.()
      }
    }

    animate()
  }, [scene, onAnimationComplete])

  const startGLTFAnimation = useCallback(() => {
    if (!mixer.current || !actionsRef.current.length) return
    isPlayingRef.current = true
    
    actionsRef.current.forEach((action) => {
      action.reset()
      action.time = 0
      action.timeScale = animationSpeed
      action.play()
    })
  }, [animationSpeed])

  useEffect(() => {    
    isPlayingRef.current = false
    isInitializedRef.current = false
    
    if (actionsRef.current.length > 0) {
      actionsRef.current.forEach(action => {
        action.stop()
        action.reset()
        action.time = 0
      })
      actionsRef.current = []
    }
    
    if (mixer.current) {
      mixer.current.stopAllAction()
      mixer.current = null
    }

    if (sceneIndex === 3 && scene && scene.children[3]) {
      const targetObject = scene.children[3]
      targetObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(material => {
              material.transparent = true
              material.opacity = 1
            })
          } else {
            mesh.material.transparent = true
            mesh.material.opacity = 1
          }
        }
      })
    }
  }, [sceneIndex, scene])

  useEffect(() => {
    if (sceneIndex === 3 || !scene || !animations?.length || !groupRef.current) {
      if (sceneIndex === 3) isInitializedRef.current = true
      return
    }

    if (isInitializedRef.current) return

    mixer.current = new THREE.AnimationMixer(groupRef.current)
    
    const actions = animations.map((animation: THREE.AnimationClip) => {
      const action = mixer.current!.clipAction(animation)
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.reset()
      action.time = 0
      return action
    })
    
    actionsRef.current = actions
    isInitializedRef.current = true
      }, [scene, animations, sceneIndex])

  useEffect(() => {
    const keyChanged = prevAnimationKeyRef.current !== animationKey

    if (isPlayingRef.current) {
      isPlayingRef.current = false
      
      if (actionsRef.current.length > 0) {
        actionsRef.current.forEach(action => {
          action.stop()
          action.reset()
          action.time = 0
        })
      }
    }
    if (customAnimation === 'fadeAndMove') {
      startFadeAndMoveAnimation()
    } else if (isInitializedRef.current) {
      startGLTFAnimation()
    } else {
      const waitForInit = () => {
        if (isInitializedRef.current) {
          startGLTFAnimation()
        } else {
          setTimeout(waitForInit, 50)
        }
      }
      waitForInit()
    }
  }, [shouldAnimate, animationKey])

  useFrame((_, delta) => {
    if (sceneIndex === 3 || customAnimation === 'fadeAndMove') return
    if (!mixer.current || !isPlayingRef.current) return

    mixer.current.update(delta)
    
    if (actionsRef.current.length > 0) {
      const allFinished = actionsRef.current.every(action => 
        action.time >= action.getClip().duration
      )
      
      if (allFinished) {
        isPlayingRef.current = false
        onAnimationComplete?.()
      }
    }
  })

  useEffect(() => {
    if (!scene) return
    
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.side = THREE.DoubleSide)
        } else {
          mesh.material.side = THREE.DoubleSide
        }
      }
    })
  }, [scene])

  return (
    <group ref={groupRef} scale={scale} position={position}>
      <primitive object={scene} />
    </group>
  )
}