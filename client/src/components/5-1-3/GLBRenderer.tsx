import React, { useRef, useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GLBRendererProps {
  src: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  visible?: boolean
  castShadow?: boolean
  receiveShadow?: boolean
  playAnimation?: boolean
  animationIndex?: number
  animationLoop?: THREE.AnimationActionLoopStyles
  animationSpeed?: number
  onAnimationFinish?: () => void
  enablePhysics?: boolean
  userData?: any
  children?: React.ReactNode
}

export function GLBRenderer({
  src,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  visible = true,
  castShadow = true,
  receiveShadow = true,
  playAnimation = false,
  animationIndex = 0,
  animationLoop = THREE.LoopOnce,
  animationSpeed = 1,
  onAnimationFinish,
  enablePhysics = false,
  userData,
  children
}: GLBRendererProps) {
  const { scene, animations } = useGLTF(src)
  const meshRef = useRef<THREE.Group>(null!)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const actionRef = useRef<THREE.AnimationAction | null>(null)

  const sceneClone = useMemo(() => scene.clone(), [scene])

  const normalizedScale = useMemo(() => {
    if (typeof scale === 'number') {
      return [scale, scale, scale] as [number, number, number]
    }
    return scale
  }, [scale])

  useEffect(() => {
    if (!sceneClone) return

    sceneClone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = castShadow
        mesh.receiveShadow = receiveShadow
      }
    })

    if (userData) {
      sceneClone.userData = { ...sceneClone.userData, ...userData }
    }
  }, [sceneClone, castShadow, receiveShadow, userData])

  useEffect(() => {
    if (!playAnimation || !animations.length || !sceneClone) return

    mixerRef.current?.stopAllAction()
    mixerRef.current = new THREE.AnimationMixer(sceneClone)

    const clip = animations[Math.min(animationIndex, animations.length - 1)]
    if (clip) {
      actionRef.current = mixerRef.current.clipAction(clip)
      actionRef.current.setLoop(animationLoop, animationLoop === THREE.LoopOnce ? 1 : Infinity)
      actionRef.current.clampWhenFinished = animationLoop === THREE.LoopOnce
      actionRef.current.timeScale = animationSpeed
      actionRef.current.play()

      if (onAnimationFinish && animationLoop === THREE.LoopOnce) {
        const onFinished = () => {
          onAnimationFinish()
        }
        mixerRef.current.addEventListener('finished', onFinished)
        
        return () => {
          mixerRef.current?.removeEventListener('finished', onFinished)
        }
      }
    }

    return () => {
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
      actionRef.current = null
    }
  }, [playAnimation, animations, animationIndex, animationLoop, animationSpeed, onAnimationFinish, sceneClone])

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })

  if (!sceneClone) {
    return (
      <group ref={meshRef} position={position} rotation={rotation} scale={normalizedScale} visible={visible}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="gray" transparent opacity={0.3} />
        </mesh>
      </group>
    )
  }

  return (
    <group ref={meshRef} position={position} rotation={rotation} scale={normalizedScale} visible={visible}>
      <primitive object={sceneClone} />
      {children}
    </group>
  )
}

export function useGLBRenderer(src: string) {
  const { scene, animations } = useGLTF(src)
  
  const getObjectByName = (name: string) => {
    return scene.getObjectByName(name)
  }

  const getAllMeshes = () => {
    const meshes: THREE.Mesh[] = []
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes.push(child as THREE.Mesh)
      }
    })
    return meshes
  }

  const getAnimationNames = () => {
    return animations.map(clip => clip.name)
  }

  return {
    scene,
    animations,
    getObjectByName,
    getAllMeshes,
    getAnimationNames
  }
}