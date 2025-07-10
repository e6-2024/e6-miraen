import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function CameraEntryAnimation({ 
  showIntro, 
  sceneIndex = 0,
  duration = 2.0
}: {
  showIntro: boolean
  sceneIndex?: number
  duration?: number
}) {
  const { camera } = useThree()
  const animationProgress = useRef(0)
  const isAnimating = useRef(false)
  const startPosition = useRef<THREE.Vector3>(new THREE.Vector3())
  const targetPosition = useRef<THREE.Vector3>(new THREE.Vector3())
  const hasStarted = useRef(false)

  const cameraPositions = [
    new THREE.Vector3(-29.01, 3.108, -5.557),
    new THREE.Vector3(14, 19, 14),
    new THREE.Vector3(23.613311588485445, 13.162826461554463, 22.863629867778908),
    new THREE.Vector3(14, 12.25, 15.685)
  ]

  useEffect(() => {
    // Intro가 사라지면 진입 애니메이션 시작
    if (!showIntro && !hasStarted.current) {
      hasStarted.current = true
      
      // 현재 카메라 위치(Intro 위치)를 시작점으로 설정
      startPosition.current.copy(camera.position)
      
      // 목표 위치를 해당 씬의 카메라 위치로 설정
      targetPosition.current.copy(cameraPositions[sceneIndex])
      
      animationProgress.current = 0
      isAnimating.current = true
      
      console.log('카메라 진입 애니메이션 시작')
      console.log('시작 위치 (Intro):', startPosition.current)
      console.log('목표 위치 (Scene):', targetPosition.current)
    }
  }, [showIntro, camera, sceneIndex])

  useFrame((state, delta) => {
    if (!isAnimating.current) return

    animationProgress.current += delta / duration

    if (animationProgress.current >= 1) {
      // 애니메이션 완료 - 정확히 목표 위치로 설정
      camera.position.copy(targetPosition.current)
      camera.lookAt(0, 0, 0)
      isAnimating.current = false
      console.log('카메라 진입 애니메이션 완료')
      return
    }

    // 부드러운 easing (easeOutCubic) - 처음엔 빠르게, 나중엔 천천히
    const t = animationProgress.current
    const eased = 1 - Math.pow(1 - t, 3)

    // 위치 보간
    const currentPosition = startPosition.current.clone().lerp(targetPosition.current, eased)

    camera.position.copy(currentPosition)
    camera.lookAt(0, 0, 0)
  })

  // showIntro가 다시 true가 되면 리셋
  useEffect(() => {
    if (showIntro) {
      hasStarted.current = false
      isAnimating.current = false
      animationProgress.current = 0
    }
  }, [showIntro])

  return null
}