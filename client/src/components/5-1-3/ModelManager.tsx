// components/5-1-3/ModelManager.tsx
import React, { useEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GLBModel {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
}

interface ModelManagerProps {
  experimentStarted: boolean
  currentModel: GLBModel | null
  currentSpoonModel: GLBModel | null
  onAnimationFinished: () => void
  onSpoonAnimationFinished: () => void
}

export function ModelManager({
  experimentStarted,
  currentModel,
  currentSpoonModel,
  onAnimationFinished,
  onSpoonAnimationFinished
}: ModelManagerProps) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const spoonMixerRef = useRef<THREE.AnimationMixer | null>(null)
  const animationFinishedRef = useRef(false)

  // 메인 모델 애니메이션 설정
  useEffect(() => {
    if (!currentModel) return

    if (!currentModel.animations || currentModel.animations.length === 0) {
      animationFinishedRef.current = true
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
        mixerRef.current = null
      }
      onAnimationFinished()
      return
    }

    mixerRef.current?.stopAllAction()
    mixerRef.current = new THREE.AnimationMixer(currentModel.scene)
    animationFinishedRef.current = false

    currentModel.animations.forEach((clip) => {
      const action = mixerRef.current!.clipAction(clip)
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
    })

    const onFinished = () => {
      animationFinishedRef.current = true
      onAnimationFinished()
    }
    mixerRef.current.addEventListener('finished', onFinished)

    return () => {
      mixerRef.current?.removeEventListener('finished', onFinished)
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
    }
  }, [currentModel, onAnimationFinished])

  // 스푼 모델 애니메이션 설정
  useEffect(() => {
    if (!currentSpoonModel?.animations?.length) return

    spoonMixerRef.current?.stopAllAction()
    spoonMixerRef.current = new THREE.AnimationMixer(currentSpoonModel.scene)

    currentSpoonModel.animations.forEach((clip) => {
      const action = spoonMixerRef.current!.clipAction(clip)
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
    })

    const onSpoonFinished = () => {
      onSpoonAnimationFinished()
    }
    spoonMixerRef.current.addEventListener('finished', onSpoonFinished)

    return () => {
      spoonMixerRef.current?.removeEventListener('finished', onSpoonFinished)
      spoonMixerRef.current?.stopAllAction()
      spoonMixerRef.current = null
    }
  }, [currentSpoonModel, onSpoonAnimationFinished])

  // 프레임 업데이트
  useFrame((state, delta) => {
    mixerRef.current?.update(delta)
    spoonMixerRef.current?.update(delta)
  })

  return (
    <>
      {experimentStarted && currentModel && !currentSpoonModel && (
        <primitive object={currentModel.scene} scale={0.5} position={[-0.7, -1, 0]} />
      )}
      {currentSpoonModel && (
        <primitive object={currentSpoonModel.scene} scale={0.5} position={[-0.7, -1, 0]} />
      )}
    </>
  )
}