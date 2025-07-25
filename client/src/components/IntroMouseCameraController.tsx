import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface IntroMouseCameraControllerProps {
  enabled: boolean
  tiltSensitivity?: number
  smoothing?: number
  maxTiltAngle?: number
  rotationIntensity?: number
  depthEffect?: number
  positionSensitivity?: number
  autoMovement?: boolean
}

function IntroMouseCameraController({ 
  enabled,
  tiltSensitivity = 2.5,
  smoothing = 0.05,
  maxTiltAngle = Math.PI / 6,
  rotationIntensity = 0.8,
  depthEffect = 0.6,
  positionSensitivity = 0.08,
  autoMovement = false
}: IntroMouseCameraControllerProps) {
  const { camera } = useThree()
  const mouseRef = useRef({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })
  const basePositionRef = useRef(new THREE.Vector3())
  const currentPositionRef = useRef(new THREE.Vector3())
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (enabled) {
      // Scene에서 카메라 위치가 설정될 때까지 기다린 후 기준점 저장
      const timer = setTimeout(() => {
        basePositionRef.current.copy(camera.position)
        currentPositionRef.current.copy(camera.position)
      }, 100) // Scene 설정이 완료될 시간 확보
      
      return () => clearTimeout(timer)
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

  useFrame((state) => {
    if (!enabled) {
      isInitializedRef.current = false
      return
    }

    // Scene의 카메라 설정이 완료된 후에 기준점 설정
    if (!isInitializedRef.current) {
      basePositionRef.current.copy(camera.position)
      currentPositionRef.current.copy(camera.position)
      isInitializedRef.current = true
      return
    }

    const time = state.clock.elapsedTime

    // 부드러운 마우스 추적
    targetRef.current.x += (mouseRef.current.x - targetRef.current.x) * smoothing
    targetRef.current.y += (mouseRef.current.y - targetRef.current.y) * smoothing
    
    // 아주 살짝의 카메라 위치 이동 (패럴랙스 효과)
    const offsetX = targetRef.current.x * positionSensitivity
    const offsetY = targetRef.current.y * positionSensitivity
    const offsetZ = (Math.abs(targetRef.current.x) + Math.abs(targetRef.current.y)) * 0.03
    
    // 기준 위치에서 살짝만 이동
    const targetX = basePositionRef.current.x + offsetX
    const targetY = basePositionRef.current.y + offsetY  
    const targetZ = basePositionRef.current.z + offsetZ
    
    currentPositionRef.current.x += (targetX - currentPositionRef.current.x) * smoothing
    currentPositionRef.current.y += (targetY - currentPositionRef.current.y) * smoothing
    currentPositionRef.current.z += (targetZ - currentPositionRef.current.z) * smoothing
    
    camera.position.copy(currentPositionRef.current)
    
    // 원형 궤도 운동으로 더 입체적인 느낌
    const orbitX = Math.sin(targetRef.current.x * Math.PI * 0.3) * rotationIntensity
    const orbitY = Math.sin(targetRef.current.y * Math.PI * 0.3) * rotationIntensity
    
    // 기본 틸트에 궤도 운동 추가
    const lookAtX = Math.max(-maxTiltAngle, Math.min(maxTiltAngle, 
      (targetRef.current.x * tiltSensitivity) + orbitX
    ))
    const lookAtY = Math.max(-maxTiltAngle, Math.min(maxTiltAngle, 
      (targetRef.current.y * tiltSensitivity) + orbitY
    ))
    
    // 깊이감을 위한 Z축 변화 (더 강화)
    const lookAtZ = -Math.abs(targetRef.current.x * depthEffect) - Math.abs(targetRef.current.y * depthEffect)
    
    // 시간 기반 미묘한 움직임 (옵션)
    const timeOffsetX = autoMovement ? Math.sin(time * 0.7) * 0.05 : 0
    const timeOffsetY = autoMovement ? Math.cos(time * 0.5) * 0.03 : 0
    
    camera.lookAt(
      lookAtX + timeOffsetX, 
      lookAtY + timeOffsetY, 
      lookAtZ
    )
  })

  return null
}

export default IntroMouseCameraController