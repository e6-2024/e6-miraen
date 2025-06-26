import { useRef, useEffect, useCallback, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { CameraControllerProps, CameraPose } from '../types/types'
export default function CameraController({
  isCameraMoving,
  targetSpherePosition,
  setIsCameraMoving,
  setCameraAnimationComplete,
  setIsLargeSphereVisible,
  setIsHumanModelVisible,
  cameraAnimationComplete,
  isCameraReset,
}: CameraControllerProps) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  // 드래그 상태 추적
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)

  // 카메라 회전 상태
  const pitchRef = useRef(0)
  const yawRef = useRef(0)

  // 기타 상태 추적
  const initialLookSetRef = useRef(false)
  const hasResetRef = useRef(false)
  const cameraTargetRef = useRef(new THREE.Vector3())
  const isAnimatingRef = useRef(false)

  // 마지막 시점에서 카메라가 바라보던 target 위치 저장
  const lastLookAtTargetRef = useRef<THREE.Vector3 | null>(null)

  // 각 위치별 정확한 카메라 설정 정의 (위치와 보는 방향 모두 포함)
  const cameraPoses = useMemo<Record<string, CameraPose>>(
    () => ({
      '5,0,0': {
        position: new THREE.Vector3(5, 0.6, 0),
        lookDirection: new THREE.Vector3(0, 0, -0.3),
        initialPitch: Math.PI / 20,
        initialYaw: 0,
      },
      '-5,0,0': {
        position: new THREE.Vector3(-5, 0.6, 0),
        lookDirection: new THREE.Vector3(0, 0, -0.3),
        initialPitch: Math.PI / 20,
        initialYaw: 0,
      },
      '0,0,5': {
        position: new THREE.Vector3(0, 0.6, 5),
        lookDirection: new THREE.Vector3(0, 0, -0.3),
        initialPitch: Math.PI / 20,
        initialYaw: 0,
      },
      '0,0,-5': {
        position: new THREE.Vector3(0, 0.6, -5),
        lookDirection: new THREE.Vector3(0, 0, -0.3),
        initialPitch: Math.PI / 20,
        initialYaw: 0,
      },
    }),
    [],
  )

  // 카메라를 완전히 리셋하는 함수
  const resetCamera = useCallback(() => {
    // 카메라 초기 위치로 강제 설정
    camera.position.set(0, 5, 8)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()

    // OrbitControls 리셋
    if (controlsRef.current) {
      controlsRef.current.reset()
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }

    // 상태 초기화
    pitchRef.current = -Math.PI / 15
    yawRef.current = 0
    initialLookSetRef.current = false
    isAnimatingRef.current = false
    hasResetRef.current = true
    lastLookAtTargetRef.current = null
  }, [camera])

  // isCameraReset이 변경될 때마다 리셋 처리
  useEffect(() => {
    if (isCameraReset) {
      resetCamera()
    }
  }, [isCameraReset, resetCamera])

  // 카메라 방향 업데이트 함수
  const updateCameraDirection = useCallback(
    (saveLastLookAt: boolean = true) => {
      if (!camera || !targetSpherePosition) return

      // 목표 지점별 저장된 설정 가져오기
      const key = targetSpherePosition.join(',')
      const targetPose = cameraPoses[key]

      if (!targetPose) return

      // 기본 방향 벡터
      const direction = new THREE.Vector3().copy(targetPose.lookDirection)

      // 드래그로 인한 회전 적용
      direction.y = Math.sin(pitchRef.current)

      const xzLength = Math.cos(pitchRef.current)
      direction.x = xzLength * Math.sin(yawRef.current)
      direction.z = xzLength * Math.cos(yawRef.current)

      // lookAt 포인트 계산
      const lookAtPoint = new THREE.Vector3().copy(camera.position).add(direction)

      // 마지막 lookAt 위치 저장 (나중에 복원하기 위해)
      if (saveLastLookAt) {
        lastLookAtTargetRef.current = lookAtPoint.clone()
      }

      // 카메라 방향 설정
      camera.lookAt(lookAtPoint)

      return lookAtPoint
    },
    [camera, targetSpherePosition, cameraPoses],
  )

  // 타겟 설정이 변경될 때 처리
  useEffect(() => {
    if (targetSpherePosition && isCameraMoving) {
      const key = targetSpherePosition.join(',')
      const targetPose = cameraPoses[key]

      if (targetPose) {
        // 카메라 타겟 위치 설정
        cameraTargetRef.current.copy(targetPose.position)
        isAnimatingRef.current = true

        // 초기 회전값 설정
        pitchRef.current = targetPose.initialPitch
        yawRef.current = targetPose.initialYaw

        // 마지막 lookAt 위치 초기화
        lastLookAtTargetRef.current = null
      }
    }
  }, [targetSpherePosition, isCameraMoving, cameraPoses])

  // 마우스 이벤트 처리 - 완전히 새로운 접근법
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!cameraAnimationComplete || isCameraMoving) return

      isDraggingRef.current = true
      startXRef.current = e.clientX
      startYRef.current = e.clientY
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !cameraAnimationComplete || !targetSpherePosition) return

      const sensitivity = 0.003

      const deltaX = (e.clientX - startXRef.current) * sensitivity
      const deltaY = (e.clientY - startYRef.current) * sensitivity

      if (Math.abs(deltaX) < 0.0005 && Math.abs(deltaY) < 0.0005) return

      // 회전값 업데이트
      yawRef.current -= deltaX
      pitchRef.current -= deltaY

      // 회전 범위 제한
      yawRef.current = Math.max(Math.min(yawRef.current, Math.PI / 4 - 0.1), -Math.PI / 4 + 0.1)
      pitchRef.current = Math.max(Math.min(pitchRef.current, Math.PI / 4 - 0.1), -Math.PI / 4 + 0.1)

      // 카메라 방향 업데이트
      updateCameraDirection(true)

      startXRef.current = e.clientX
      startYRef.current = e.clientY
    }

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        // 마우스를 떼었을 때 마지막 방향 저장
        if (camera && lastLookAtTargetRef.current) {
          // 이 시점에서 카메라의 방향을 명시적으로 저장
        }
      }
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [camera, cameraAnimationComplete, isCameraMoving, targetSpherePosition, updateCameraDirection])

  // 메인 애니메이션 프레임 처리
  useFrame(() => {
    // 카메라 이동 애니메이션
    if (isCameraMoving && targetSpherePosition && isAnimatingRef.current) {
      const speed = 0.02

      // 위치 보간
      camera.position.lerp(cameraTargetRef.current, speed)

      // 목표 위치에 도달했는지 확인
      if (camera.position.distanceTo(cameraTargetRef.current) < 0.05) {
        // 애니메이션 완료 처리
        setIsCameraMoving(false)
        setCameraAnimationComplete(true)
        setIsLargeSphereVisible(true)
        setIsHumanModelVisible(true)

        if (controlsRef.current) {
          controlsRef.current.enabled = false
        }

        // 카메라 방향 초기화 및 설정
        const key = targetSpherePosition.join(',')
        const targetPose = cameraPoses[key]

        if (targetPose) {
          // 항상 동일한 초기값으로 설정
          pitchRef.current = targetPose.initialPitch
          yawRef.current = targetPose.initialYaw
        }

        // 초기 방향 설정 및 저장
        updateCameraDirection(true)
        initialLookSetRef.current = true
        isAnimatingRef.current = false
      }
      return
    }

    // 카메라 방향 유지 로직 - 중요한 변경 사항
    if (cameraAnimationComplete && targetSpherePosition) {
      if (!initialLookSetRef.current) {
        // 최초 1회 실행: 초기 방향 설정
        updateCameraDirection(true)
        initialLookSetRef.current = true
      } else if (!isDraggingRef.current && lastLookAtTargetRef.current) {
      }
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableRotate={!cameraAnimationComplete && !isCameraReset}
      minDistance={1}
      maxDistance={20}
      enabled={!cameraAnimationComplete && !isCameraMoving && !isCameraReset}
    />
  )
}
