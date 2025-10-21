import React, { useRef, useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'

interface GLBModel {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
}

interface TomatoWipingManagerProps {
  showTomatoWiping: boolean
  tomatoWipingAnimating: boolean
  setTomatoWipingAnimating: (animating: boolean) => void
  onWipingComplete?: () => void
}

export function TomatoWipingManager({
  showTomatoWiping,
  tomatoWipingAnimating,
  setTomatoWipingAnimating,
  onWipingComplete
}: TomatoWipingManagerProps) {
  const tomatoWipingModel = useGLTF('/models/5-1-3/Tomato_wiping.glb') as GLBModel
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const wipingRef = useRef<THREE.Object3D | null>(null)
  const strippedSceneRef = useRef<THREE.Object3D | null>(null)

  useEffect(() => {
    if (!tomatoWipingModel?.scene) return
    if (!strippedSceneRef.current) {
      const clone = SkeletonUtils.clone(tomatoWipingModel.scene)
      const target = clone.getObjectByName('pDisc1')
      target?.removeFromParent()
      strippedSceneRef.current = clone
    }
  }, [tomatoWipingModel])

  useEffect(() => {
    if (!tomatoWipingAnimating || !showTomatoWiping || !tomatoWipingModel.animations.length || !wipingRef.current) return

    mixerRef.current?.stopAllAction()
    mixerRef.current = new THREE.AnimationMixer(wipingRef.current)

    tomatoWipingModel.animations.forEach((clip) => {
      const action = mixerRef.current!.clipAction(clip, wipingRef.current!)
      action.reset()
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
    })

    const onFinished = () => {
      setTomatoWipingAnimating(false)
      onWipingComplete?.()
    }
    mixerRef.current.addEventListener('finished', onFinished)

    return () => {
      mixerRef.current?.removeEventListener('finished', onFinished)
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
    }
  }, [tomatoWipingAnimating, showTomatoWiping, tomatoWipingModel.animations, setTomatoWipingAnimating, onWipingComplete])

  useFrame((_, delta) => {
    if (mixerRef.current && tomatoWipingAnimating) {
      mixerRef.current.update(delta)
    }
  })

  if (!showTomatoWiping) return null

  return (
    <primitive
      ref={wipingRef}
      object={strippedSceneRef.current ?? tomatoWipingModel.scene}
      scale={0.5}
      position={[0, 0.25, 0]}
      visible={showTomatoWiping}
    />
  )
}

