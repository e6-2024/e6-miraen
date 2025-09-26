import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DiscRotationManagerProps {
  discRef: React.MutableRefObject<THREE.Object3D | null>
  sphereRef: React.MutableRefObject<THREE.Object3D | null>
  discRotating: boolean
  setDiscRotating: (rotating: boolean) => void
  animationFinished: boolean
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
  animationFinished,
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

  const startDiscRotation = () => {
    if (!animationFinished) {
      if (waitIntervalRef.current !== null) return
      if (animationFinished) {
        if (waitIntervalRef.current !== null) {
          window.clearInterval(waitIntervalRef.current)
          waitIntervalRef.current = null
        }
        startActualDiscRotation()
      }
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
    opacityRef.current = 1

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
    }
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
      delete (window as any).resetSphereOpacity
    }
  }, [animationFinished])

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

        // if (sphereRef.current) {
        //   sphereRef.current.visible = false
        // }

        if (onRotationComplete) {
          onRotationComplete()
        }
      }
    }

    const shouldHideDisc = (selectedBeaker === 'left' && leftSpoonCount >= 1) || (selectedBeaker === 'right' && rightSpoonCount >= 5)

    if (shouldHideDisc && discRef.current && discRef.current.visible) {
      discRef.current.visible = false
    }
  })

  return null
}
