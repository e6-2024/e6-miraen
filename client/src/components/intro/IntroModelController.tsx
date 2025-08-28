import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface IntroModelControllerProps {
  enabled: boolean
  rotationSensitivity?: number
  smoothing?: number
  maxRotationAngle?: number
  boyGroupRef: React.RefObject<THREE.Group>
  muscleGroupRef: React.RefObject<THREE.Group>
  boneGroupRef: React.RefObject<THREE.Group>
  autoRotation?: boolean
  autoRotationSpeed?: number
}

function IntroModelController({ 
  enabled,
  rotationSensitivity = 0.3,
  smoothing = 0.05,
  maxRotationAngle = Math.PI / 4,
  boyGroupRef,
  muscleGroupRef,
  boneGroupRef,
  autoRotation = true,
  autoRotationSpeed = 0.3
}: IntroModelControllerProps) {
  const mouseRef = useRef({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })
  const baseRotationsRef = useRef({
    boy: { x: 0, y: Math.PI / 4, z: 0 },
    muscle: { x: 0, y: -Math.PI / 4, z: 0 },
    bone: { x: 0, y: 0, z: 0 }
  })

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
    if (!enabled) return

    const time = state.clock.elapsedTime

    // 부드러운 마우스 추적
    targetRef.current.x += (mouseRef.current.x - targetRef.current.x) * smoothing
    targetRef.current.y += (mouseRef.current.y - targetRef.current.y) * smoothing
    
    // 마우스 기반 회전 값 계산
    const mouseRotationX = Math.max(-maxRotationAngle, Math.min(maxRotationAngle, 
      targetRef.current.y * rotationSensitivity))
    const mouseRotationY = Math.max(-maxRotationAngle, Math.min(maxRotationAngle, 
      targetRef.current.x * rotationSensitivity))

    // 자동 회전 값 계산 (옵션)
    const autoRotX = autoRotation ? Math.sin(time * autoRotationSpeed * 0.7) * 0.1 : 0
    const autoRotY = autoRotation ? Math.sin(time * autoRotationSpeed) * 0.2 : 0

    // 각 모델 그룹에 서로 다른 회전 적용
    if (boyGroupRef.current) {
      boyGroupRef.current.rotation.x = baseRotationsRef.current.boy.x + mouseRotationX + autoRotX
      boyGroupRef.current.rotation.y = baseRotationsRef.current.boy.y + mouseRotationY + autoRotY
    }
    
    if (muscleGroupRef.current) {
      // 근육 모델은 반대 방향으로 회전하여 더 역동적인 느낌
      muscleGroupRef.current.rotation.x = baseRotationsRef.current.muscle.x - mouseRotationX * 0.8 + Math.cos(time * autoRotationSpeed * 0.5) * 0.08
      muscleGroupRef.current.rotation.y = baseRotationsRef.current.muscle.y - mouseRotationY * 0.8 + Math.cos(time * autoRotationSpeed * 0.8) * 0.15
    }
    
    if (boneGroupRef.current) {
      // 뼈 모델은 살짝 다른 패턴으로 회전
      boneGroupRef.current.rotation.x = baseRotationsRef.current.bone.x + mouseRotationX * 0.6 + Math.sin(time * autoRotationSpeed * 0.6) * 0.06
      boneGroupRef.current.rotation.y = baseRotationsRef.current.bone.y + mouseRotationY * 1.2 + Math.sin(time * autoRotationSpeed * 1.2) * 0.25
    }
  })

  return null
}

export default IntroModelController