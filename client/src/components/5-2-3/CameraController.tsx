// client/src/components/5-2-3/CameraController.tsx
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface CameraControllerProps {
  targetPosition: [number, number, number]
  targetLookAt: [number, number, number]
  onComplete?: () => void
  enabled?: boolean
}

export const CameraController: React.FC<CameraControllerProps> = ({
  targetPosition,
  targetLookAt,
  onComplete,
  enabled = true,
}) => {
  const { camera } = useThree()
  const controlsRef = useRef<any>()
  const animationRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)

  useEffect(() => {
    if (isAnimatingRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    const waitForControls = () => {
      return new Promise<void>((resolve) => {
        const checkControls = () => {
          if (controlsRef.current && controlsRef.current.target) {
            resolve()
          } else {
            setTimeout(checkControls, 50)
          }
        }
        checkControls()
      })
    }

    const startAnimation = async () => {
      try {
        await waitForControls()

        if (!controlsRef.current || !controlsRef.current.target) {
          return
        }

        isAnimatingRef.current = true

        const startPosition = camera.position.clone()
        const startLookAt = controlsRef.current.target.clone()

        const duration = 2000
        const startTime = Date.now()

        const animate = () => {
          if (!controlsRef.current || !controlsRef.current.target) {
            isAnimatingRef.current = false
            return
          }

          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)

          const easeInOutCubic = (t: number) => {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
          }

          const easedProgress = easeInOutCubic(progress)

          camera.position.lerpVectors(startPosition, new THREE.Vector3(...targetPosition), easedProgress)

          const newTarget = startLookAt.clone().lerp(new THREE.Vector3(...targetLookAt), easedProgress)

          controlsRef.current.target.copy(newTarget)
          controlsRef.current.update()

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate)
          } else {
            isAnimatingRef.current = false
            animationRef.current = null
            onComplete?.()
          }
        }

        animationRef.current = requestAnimationFrame(animate)
      } catch (error) {
        console.error('Error during camera animation:', error)
        isAnimatingRef.current = false
      }
    }

    startAnimation()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      isAnimatingRef.current = false
    }
  }, [camera, targetPosition, targetLookAt, onComplete])

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      minDistance={0}
      maxDistance={20}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
      minAzimuthAngle={-Math.PI / 6}
      maxAzimuthAngle={Math.PI / 6}
    />
  )
}
