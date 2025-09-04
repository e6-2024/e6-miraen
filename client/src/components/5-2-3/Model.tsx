import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState, useCallback } from 'react'
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
  const windObjRef = useRef<THREE.Object3D | null>(null)

  const getWindObjectFromIndices = useCallback(() => {
    const scene = activeModel.scene
    if (!scene) return null
    return currentModel === 'day'
      ? (scene.children?.[1]?.children?.[0] as THREE.Object3D | undefined) ?? null
      : (scene.children?.[0] as THREE.Object3D | undefined) ?? null
  }, [activeModel.scene, currentModel])

  const cacheWindObject = useCallback(() => {
    const obj = getWindObjectFromIndices()
    windObjRef.current = obj ?? null
    if (windObjRef.current) {
      windObjRef.current.visible = false
      windObjRef.current.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.frustumCulled = false
          o.castShadow = false
          o.receiveShadow = false
        }
      })
    }
  }, [getWindObjectFromIndices])

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
    if (!activeModel.scene || !groupRef.current) return
    if (mixer.current) {
      mixer.current.stopAllAction()
    }
    mixer.current = new THREE.AnimationMixer(groupRef.current)
    const actions = (activeModel.animations ?? []).map((clip) => {
      const action = mixer.current!.clipAction(clip)
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.clampWhenFinished = false
      action.reset()
      return action
    })
    actionsRef.current = actions
    cacheWindObject()
    return () => {
      if (actionsRef.current.length > 0) {
        actionsRef.current.forEach((action) => action.stop())
      }
      if (mixer.current) {
        mixer.current.stopAllAction()
      }
    }
  }, [activeModel.scene, activeModel.animations, cacheWindObject])

  useEffect(() => {
    if (!mixer.current || !actionsRef.current.length) return
    if (animationTrigger > 0 && animationEnabled) {
      actionsRef.current.forEach((action) => {
        action.reset()
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.clampWhenFinished = false
        action.paused = false
        action.play()
      })
      isAnimationPlayingRef.current = true
    }
  }, [animationTrigger, animationEnabled])

  useEffect(() => {
    if (!activeModel.scene) return
    activeModel.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        const n = child.name.toLowerCase()
        if (n.includes('ground') || n.includes('floor') || n.includes('plane')) {
          child.receiveShadow = false
          child.castShadow = false
        }
        const mat = child.material
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            m.side = THREE.DoubleSide
            ;(m as any).shadowSide = THREE.FrontSide
          })
        } else if (mat) {
          mat.side = THREE.DoubleSide
          ;(mat as any).shadowSide = THREE.FrontSide
        }
      }
    })
  }, [activeModel.scene, currentModel])

  useEffect(() => {
  if (!windObjRef.current) cacheWindObject()
  if (windObjRef.current) {
    windObjRef.current.visible = !!windEnabled
    windObjRef.current.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = false
        o.receiveShadow = false
        const m = o.material
        const mats = Array.isArray(m) ? m : [m]
        mats.forEach((mat) => {
          if (!mat) return
          if ('transparent' in mat) (mat as any).transparent = true
          if ('opacity' in mat) (mat as any).opacity = Math.max((mat as any).opacity ?? 1, 1)
          if ('depthWrite' in mat) (mat as any).depthWrite = true
        })
      }
    })
  }
}, [windEnabled, cacheWindObject])


  useFrame((state, delta) => {
    if (mixer.current && isAnimationPlayingRef.current && animationEnabled) {
      mixer.current.update(delta)
    }
    if (!animationEnabledRef.current || !activeModel.scene) return
    if (!animationEnabled || !windEnabled) return
    const time = state.clock.getElapsedTime()
    const windObj = windObjRef.current ?? getWindObjectFromIndices()
    if (!windObj) return
    const directionMultiplier =
      currentModel === 'day'
        ? windDirection === 'sea-to-land'
          ? 1
          : -1
        : windDirection === 'sea-to-land'
        ? -1
        : 1
    windObj.traverse((child) => {
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
          ].filter(Boolean) as THREE.Texture[]
          textures.forEach((texture) => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            const finalSpeed = windSpeed * directionMultiplier
            texture.offset.y = (time * finalSpeed) % 1
          })
        })
      }
    })
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
