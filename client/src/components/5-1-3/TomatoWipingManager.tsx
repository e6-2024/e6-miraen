import React, { useRef, useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface TomatoWipingManagerProps {
  showWiping: boolean
  onWipingComplete: () => void
}

interface WipingModel {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
}

export function TomatoWipingManager({ showWiping, onWipingComplete }: TomatoWipingManagerProps) {
  const wipingModel = useGLTF('/models/5-1-3/Tomato_wiping.glb') as WipingModel
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const wipingRef = useRef<THREE.Object3D | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!showWiping) {
      setIsVisible(false)
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
        mixerRef.current = null
      }
      return
    }

    setIsVisible(true)

    // 애니메이션 설정
    if (wipingModel.animations.length > 0 && wipingRef.current) {
      mixerRef.current?.stopAllAction()
      mixerRef.current = new THREE.AnimationMixer(wipingRef.current)

      wipingModel.animations.forEach((clip) => {
        const action = mixerRef.current!.clipAction(clip)
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.play()
      })

      const onFinished = () => {
        setTimeout(() => {
          setIsVisible(false)
          onWipingComplete()
        }, 500) // 0.5초 후 사라지고 완료 콜백
      }

      mixerRef.current.addEventListener('finished', onFinished)

      return () => {
        mixerRef.current?.removeEventListener('finished', onFinished)
        mixerRef.current?.stopAllAction()
        mixerRef.current = null
      }
    }
  }, [showWiping, wipingModel.animations, onWipingComplete])

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })

  if (!isVisible) return null

  return (
    <primitive 
      ref={wipingRef}
      object={wipingModel.scene} 
      scale={0.5} 
      position={[0, -0.5, 1]} 
    />
  )
}

useGLTF.preload('/models/5-1-3/Tomato_wiping.glb')