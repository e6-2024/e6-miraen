import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DiscRotationManagerProps {
  discRef: React.MutableRefObject<THREE.Object3D | null>
  sphereRef: React.MutableRefObject<THREE.Object3D | null>
  discRotating: boolean
  setDiscRotating: (rotating: boolean) => void
  animationFinishedRef: React.MutableRefObject<boolean>
  onRotationComplete?: () => void
  leftSpoonCount: number
  rightSpoonCount: number
  selectedBeaker: 'left' | 'right' | null
}

export function DiscRotationManager({
  discRef,
  sphereRef,
  discRotating,
  setDiscRotating,
  animationFinishedRef,
  onRotationComplete,
  leftSpoonCount,
  rightSpoonCount,
  selectedBeaker,
}: DiscRotationManagerProps) {
  const rotationRef = useRef(0)
  const initialRotationRef = useRef(0)
  const targetRotationRef = useRef(Math.PI)
  const waitIntervalRef = useRef<number | null>(null)
  const opacityRef = useRef(1)
  const hideTimeoutRef = useRef<number | null>(null)

  // 리셋 감지: 양쪽 spoon count가 모두 0이면 rotation 초기화
  useEffect(() => {
    if (leftSpoonCount === 0 && rightSpoonCount === 0 && discRef.current) {
      discRef.current.rotation.x = 0
      rotationRef.current = 0
      initialRotationRef.current = 0
      targetRotationRef.current = Math.PI
      opacityRef.current = 1
    }
  }, [leftSpoonCount, rightSpoonCount, discRef])

  const startDiscRotation = () => {
    startActualDiscRotation()
  }

  const startActualDiscRotation = () => {
    if (!discRef.current) {
      console.log('discRef.current가 없음!')
      return
    }

    console.log('실제 disc rotation 시작!, 현재 rotation.x:', discRef.current.rotation.x)
    setDiscRotating(true)
    rotationRef.current = 0
    initialRotationRef.current = discRef.current.rotation.x
    targetRotationRef.current = initialRotationRef.current + Math.PI
    opacityRef.current = 1
  }

  useEffect(() => {
    ;(window as any).startDiscRotation = startDiscRotation
    ;(window as any).resetSphereOpacity = () => {
      if (sphereRef.current) {
        sphereRef.current.visible = true
        sphereRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            if (mesh.material) {
              const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
              if (material && 'opacity' in material) {
                ;(material as any).transparent = true
                ;(material as any).opacity = 1
              }
            }
          }
        })
        opacityRef.current = 1
      }
    }
    return () => {
      delete (window as any).startDiscRotation
    }
  }, [animationFinishedRef, sphereRef])

  useEffect(() => {
    return () => {
      if (waitIntervalRef.current !== null) {
        window.clearInterval(waitIntervalRef.current)
        waitIntervalRef.current = null
      }
    }
  }, [])

  useFrame((state, delta) => {
    if (discRotating && discRef.current) {
      rotationRef.current += delta * 3
      const nextAngle = initialRotationRef.current + rotationRef.current

      discRef.current.rotation.x = Math.min(nextAngle, targetRotationRef.current)

      const rotationProgress = rotationRef.current / Math.PI
      if (rotationProgress > 0.5) {
        opacityRef.current = Math.max(0, 1 - (rotationProgress - 0.5) * 2)
        if (sphereRef.current && sphereRef.current.traverse) {
          sphereRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              if (mesh.material) {
                const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
                if (material && 'opacity' in material) {
                  ;(material as any).transparent = true
                  ;(material as any).opacity = opacityRef.current
                }
              }
            }
          })
        }
      }

      if (nextAngle >= targetRotationRef.current) {
        discRef.current.rotation.x = targetRotationRef.current
        setDiscRotating(false)

        if (onRotationComplete) {
          onRotationComplete()
        }
      }
    }

    // 수정된 visibility 로직
    if (discRef.current) {
      // 현재 선택된 비커에 따라 숨김 여부 결정
      const leftShouldHide = selectedBeaker === 'left' && leftSpoonCount >= 1
      const rightShouldHide = selectedBeaker === 'right' && rightSpoonCount >= 5
      
      if (leftShouldHide || rightShouldHide) {
        discRef.current.visible = false
      } else if (selectedBeaker !== null) {
        // 비커가 선택되어 있으면 disc 보이기
        discRef.current.visible = true
      } else if (leftSpoonCount === 0 && rightSpoonCount === 0) {
        // 완전 리셋 상태
        discRef.current.visible = true
      }
    }
  })

  return null
}