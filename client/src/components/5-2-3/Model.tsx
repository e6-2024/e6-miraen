import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface ModelProps extends GroupProps {
  windEnabled?: boolean
  windDirection?: 'sea-to-land' | 'land-to-sea'
  windSpeed?: number
  isDay?: boolean
  animationEnabled?: boolean
}

export default function Model({
  windEnabled = false,
  windDirection = 'sea-to-land',
  windSpeed = 0.2,
  isDay = true,
  animationEnabled = false,
  ...props
}: ModelProps) {
  const [currentModel, setCurrentModel] = useState<'day' | 'night'>(isDay ? 'day' : 'night')
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const animationEnabledRef = useRef(true)
  const sceneRef = useRef<THREE.Group | null>(null)

  const dayModel = useGLTF('models/5-2-3/Day/Weather.gltf')
  const nightModel = useGLTF('models/5-2-3/Night/Weather_Night.gltf')

  const activeModel = currentModel === 'day' ? dayModel : nightModel

  const groupRef = useRef<THREE.Group>(null)
  const mixer = useRef<THREE.AnimationMixer | null>(null)
  const actionsRef = useRef<THREE.AnimationAction[]>([])
  const isAnimationPlayingRef = useRef(false)
  const lastModelRef = useRef<string>('')

  useEffect(() => {
    if (animationEnabled && !isAnimationPlayingRef.current) {
      setAnimationTrigger((prev) => prev + 1)
    } else if (!animationEnabled && isAnimationPlayingRef.current) {
      if (actionsRef.current.length > 0) {
        actionsRef.current.forEach((action) => {
          action.stop()
          action.reset()
        })
      }
      if (mixer.current) {
        mixer.current.stopAllAction()
      }
      isAnimationPlayingRef.current = false
    }
  }, [animationEnabled])

  useEffect(() => {
    const newModel = isDay ? 'day' : 'night'
    if (newModel !== currentModel) {
      if (actionsRef.current.length > 0) {
        actionsRef.current.forEach((action) => {
          action.stop()
          action.reset()
        })
      }
      if (mixer.current) {
        mixer.current.stopAllAction()
      }

      isAnimationPlayingRef.current = false
      setAnimationTrigger(0)

      setCurrentModel(newModel)

      animationEnabledRef.current = false
      setTimeout(() => {
        animationEnabledRef.current = true
      }, 100)
    }
  }, [isDay, currentModel])

  useEffect(() => {
    if (!activeModel.scene || !activeModel.animations?.length || !groupRef.current) return

    if (mixer.current) {
      mixer.current.stopAllAction()
    }

    mixer.current = new THREE.AnimationMixer(groupRef.current)

    const actions = activeModel.animations.map((animation, index) => {
      const action = mixer.current!.clipAction(animation)
      
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.clampWhenFinished = false
      action.reset()
      
      return action
    })

    actionsRef.current = actions
    lastModelRef.current = currentModel

    return () => {
      if (actionsRef.current.length > 0) {
        actionsRef.current.forEach((action) => action.stop())
      }
      if (mixer.current) {
        mixer.current.stopAllAction()
      }
    }
  }, [activeModel.scene, activeModel.animations, currentModel])

  useEffect(() => {
    if (!mixer.current || !actionsRef.current.length) {
      return
    }

    if (animationTrigger > 0 && animationEnabled) {
      actionsRef.current.forEach((action, index) => {
        action.reset()
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.clampWhenFinished = false
        action.paused = false
        action.play()
      })
      
      isAnimationPlayingRef.current = true
    }
  }, [animationTrigger, currentModel, activeModel.animations, animationEnabled])

  useEffect(() => {
    if (activeModel.scene) {
      activeModel.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true

          if (
            child.name.toLowerCase().includes('ground') ||
            child.name.toLowerCase().includes('floor') ||
            child.name.toLowerCase().includes('plane')
          ) {
            child.receiveShadow = true
            child.castShadow = false
          }

          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => {
                material.side = THREE.DoubleSide
                material.shadowSide = THREE.FrontSide
              })
            } else {
              child.material.side = THREE.DoubleSide
              child.material.shadowSide = THREE.FrontSide
            }
          }
        }
      })

      let windObject
      
      if (currentModel === 'day') {
        windObject = activeModel.scene.children[1]?.children[0]
      } else {
        windObject = activeModel.scene.children[0]
      }

      if (windObject) {
        windObject.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = false
            child.receiveShadow = true
          }
        })
      }
    }
  }, [activeModel.scene, currentModel])

  useFrame((state, delta) => {
    if (mixer.current && isAnimationPlayingRef.current && animationEnabled) {
      mixer.current.update(delta)
    }

    if (!animationEnabledRef.current || !activeModel.scene || !animationEnabled) return

    const time = state.clock.getElapsedTime()

    let windObject
    let directionMultiplier
    
    if (currentModel === 'day') {
      windObject = activeModel.scene.children[1]?.children[0]
      directionMultiplier = windDirection === 'sea-to-land' ? 1 : -1
    } else {
      windObject = activeModel.scene.children[0]
      directionMultiplier = windDirection === 'sea-to-land' ? -1 : 1
    }

    if (windObject) {
      windObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]

          materials.forEach((material) => {
            const textures = [
              material.map,
              material.normalMap,
              material.roughnessMap,
              material.metalnessMap,
              material.emissiveMap,
              material.aoMap,
            ].filter(Boolean)

            textures.forEach((texture) => {
              if (texture) {
                texture.wrapS = THREE.RepeatWrapping
                texture.wrapT = THREE.RepeatWrapping

                const finalSpeed = windSpeed * directionMultiplier

                texture.offset.y = (time * finalSpeed) % 1
                texture.needsUpdate = true
              }
            })
          })
        }
      })
    }
  })

  return (
    <group ref={sceneRef} {...props}>
      <group ref={groupRef} scale={1.0} position={[0, 0, 0]}>
        <primitive object={activeModel.scene} />
      </group>
    </group>
  )
}

useGLTF.preload('models/5-2-3/Day/Weather.gltf')
useGLTF.preload('models/5-2-3/Night/Weather_Night.gltf')