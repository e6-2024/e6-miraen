// components/5-1-3/DiscRotationManager.tsx
import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DiscRotationManagerProps {
  discRef: React.MutableRefObject<THREE.Object3D | null>
  sphereRef: React.MutableRefObject<THREE.Object3D | null>
  discRotating: boolean
  setDiscRotating: (rotating: boolean) => void
  animationFinished: boolean
}

export function DiscRotationManager({
  discRef,
  sphereRef,
  discRotating,
  setDiscRotating,
  animationFinished
}: DiscRotationManagerProps) {
  const rotationRef = useRef(0)
  const initialRotationRef = useRef(0)
  const targetRotationRef = useRef(Math.PI)
  const waitIntervalRef = useRef<number | null>(null)

  const startDiscRotation = () => {
    if (!animationFinished) {
      if (waitIntervalRef.current !== null) return
      waitIntervalRef.current = window.setInterval(() => {
        if (animationFinished) {
          if (waitIntervalRef.current !== null) {
            window.clearInterval(waitIntervalRef.current)
            waitIntervalRef.current = null
          }
          startActualDiscRotation()
        }
      }, 100)
      return
    }
    startActualDiscRotation()
  }

  const startActualDiscRotation = () => {
    if (!discRef.current) return

    setDiscRotating(true)

    rotationRef.current = 0
    initialRotationRef.current = discRef.current.rotation.x
    targetRotationRef.current = initialRotationRef.current + Math.PI
  }

  // 외부에서 회전 시작을 위한 함수 노출
  useEffect(() => {
    ;(window as any).startDiscRotation = startDiscRotation
    return () => {
      delete (window as any).startDiscRotation
    }
  }, [animationFinished])

  // 인터벌 정리
  useEffect(() => {
    return () => {
      if (waitIntervalRef.current !== null) {
        window.clearInterval(waitIntervalRef.current)
        waitIntervalRef.current = null
      }
    }
  }, [])

  // 회전 애니메이션
  useFrame((state, delta) => {
    if (discRotating && discRef.current) {
      rotationRef.current += delta * 3
      const nextAngle = initialRotationRef.current + rotationRef.current

      discRef.current.rotation.x = Math.min(nextAngle, targetRotationRef.current)

      if (nextAngle >= targetRotationRef.current) {
        discRef.current.rotation.x = targetRotationRef.current
        setDiscRotating(false)
        if (sphereRef.current) sphereRef.current.visible = false
      }
    }
  })

  return null
}