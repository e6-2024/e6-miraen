import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GLBModel {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
}

interface GlassStickManagerProps {
  showGlassStick: boolean
  glassStickAnimating: boolean
  setGlassStickAnimating: (animating: boolean) => void
  leftComplete: boolean
  rightComplete: boolean
}

export function GlassStickManager({
  showGlassStick,
  glassStickAnimating,
  setGlassStickAnimating,
  leftComplete,
  rightComplete
}: GlassStickManagerProps) {
  const glassStickModel = useGLTF('/models/5-1-3/sugar.glb') as GLBModel
  const leftMixerRef = useRef<THREE.AnimationMixer | null>(null)
  const rightMixerRef = useRef<THREE.AnimationMixer | null>(null)
  const leftStickRef = useRef<THREE.Object3D | null>(null)
  const rightStickRef = useRef<THREE.Object3D | null>(null)

  useEffect(() => {
    if (!showGlassStick || !glassStickAnimating) return

    if (leftComplete && glassStickModel.animations.length > 0) {
      leftMixerRef.current?.stopAllAction()
      leftMixerRef.current = new THREE.AnimationMixer(leftStickRef.current!)
      
      glassStickModel.animations.forEach((clip) => {
        const action = leftMixerRef.current!.clipAction(clip)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
      })
    }

    if (rightComplete && glassStickModel.animations.length > 0) {
      rightMixerRef.current?.stopAllAction()
      rightMixerRef.current = new THREE.AnimationMixer(rightStickRef.current!)
      
      glassStickModel.animations.forEach((clip) => {
        const action = rightMixerRef.current!.clipAction(clip)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
      })
    }

    return () => {
      leftMixerRef.current?.stopAllAction()
      rightMixerRef.current?.stopAllAction()
      leftMixerRef.current = null
      rightMixerRef.current = null
    }
  }, [showGlassStick, glassStickAnimating, leftComplete, rightComplete, glassStickModel])

  useFrame((state, delta) => {
    leftMixerRef.current?.update(delta)
    rightMixerRef.current?.update(delta)
  })

  if (!showGlassStick) return null

  return (
    <>
      {leftComplete && (
        <primitive 
          ref={leftStickRef}
          object={glassStickModel.scene.clone()} 
          scale={0.5} 
          position={[-2.15, -1.0, -0.2]} 
        />
      )}
      {rightComplete && (
        <primitive 
          ref={rightStickRef}
          object={glassStickModel.scene.clone()} 
          scale={0.5} 
          position={[2.34, -1.0, -0.2]} 
        />
      )}
    </>
  )
}

useGLTF.preload('/models/5-1-3/sugar.glb')