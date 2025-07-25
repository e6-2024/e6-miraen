import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface IntroMouseCameraControllerProps {
  enabled: boolean
  tiltSensitivity?: number
  smoothing?: number
  maxTiltAngle?: number
}

function IntroMouseCameraController({ 
  enabled,
  tiltSensitivity = 2.0,
  smoothing = 0.05,
  maxTiltAngle = Math.PI / 6
}: IntroMouseCameraControllerProps) {
  const { camera } = useThree()
  const mouseRef = useRef({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })
  const basePositionRef = useRef(new THREE.Vector3())

  useEffect(() => {
    if (enabled) {
      basePositionRef.current.copy(camera.position)
    }
  }, [enabled, camera])

  useEffect(() => {
    if (!enabled) return

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [enabled])

  useFrame(() => {
    if (!enabled) return

    targetRef.current.x += (mouseRef.current.x - targetRef.current.x) * smoothing
    targetRef.current.y += (mouseRef.current.y - targetRef.current.y) * smoothing
    
    const lookAtX = Math.max(-maxTiltAngle, Math.min(maxTiltAngle, targetRef.current.x * tiltSensitivity))
    const lookAtY = Math.max(-maxTiltAngle, Math.min(maxTiltAngle, targetRef.current.y * tiltSensitivity))
    
    camera.lookAt(lookAtX, lookAtY, 0)
  })

  return null
}

export default IntroMouseCameraController