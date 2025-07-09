import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

interface ModelProps {
  path: string
  scale?: number
  position?: [number, number, number]
  sceneIndex?: number
  onLoaded?: () => void
}

export default function Model({ path, scale = 4, position = [0, 0, 0], sceneIndex, onLoaded }: ModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(path) as any
  const mixer = useRef<THREE.AnimationMixer | null>(null)
  const actionsRef = useRef<THREE.AnimationAction[]>([])

  useEffect(() => {
    if (!scene || !animations.length || !groupRef.current) return

    mixer.current = new THREE.AnimationMixer(groupRef.current)

    const action = mixer.current.clipAction(animations[0])
    if (sceneIndex === 0) {
      action.play()
    } else {
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
      action.paused = true 
    }

    actionsRef.current = [action]

    if (onLoaded) {
      onLoaded()
    }

    return () => {
      actionsRef.current.forEach(action => action.stop())
      mixer.current?.stopAllAction()
      mixer.current = null
    }
  }, [scene, animations, sceneIndex])

  useFrame((_, delta) => {
    if (sceneIndex === 0 && mixer.current) {
      mixer.current.update(delta*1.5)
    }
  })

  useEffect(() => {
    if (!scene) return
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        if (sceneIndex === 0) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.side = THREE.DoubleSide)
          } else {
            mesh.material.side = THREE.DoubleSide
          }
        } else {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.side = THREE.DoubleSide)
          } else {
            mesh.material.side = THREE.DoubleSide 
          }
        }
      }
    })
  }, [sceneIndex, scene])

  return (
    <group ref={groupRef} scale={scale} position={position}>
      <primitive object={scene} />
    </group>
  )
}
