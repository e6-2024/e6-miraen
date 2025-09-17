import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ViewMode, VehicleId, CameraState, AnimationState } from '@/types/6-1-2/types'
import { CAMERA_POSITIONS, CAMERA_TARGETS, getVehiclePosition, calculateFirstPersonCamera } from '@/utils/6-1-2/utils'

interface UseCameraProps {
  viewMode: ViewMode
  selectedVehicle: VehicleId
  isAnimationPlaying: boolean
  sceneRef: React.RefObject<THREE.Group>
  showIntro: boolean
  showResult: boolean
  animationState: AnimationState // 리셋 트리거를 감지하기 위해 추가
}

export const useCamera = ({
  viewMode,
  selectedVehicle,
  isAnimationPlaying,
  sceneRef,
  showIntro,
  showResult,
  animationState,
}: UseCameraProps) => {
  const { camera } = useThree()
  const orbitControlsRef = useRef<any>()
  const frozenCameraState = useRef<CameraState | null>(null)
  const prevSelectedVehicle = useRef(selectedVehicle)
  const prevViewMode = useRef(viewMode)

  // 리셋 트리거 감지하여 카메라 위치 초기화
  useEffect(() => {
    if (animationState.resetTrigger) {
      console.log('Camera reset triggered for viewMode:', viewMode)
      
      // frozen state 초기화
      frozenCameraState.current = null

      // 각 viewMode에 따른 초기 카메라 위치로 리셋
      switch (viewMode) {
        case 'start':
          camera.position.set(...CAMERA_POSITIONS.start)
          camera.lookAt(...CAMERA_TARGETS.start)
          if (orbitControlsRef.current) {
            orbitControlsRef.current.target.set(...CAMERA_TARGETS.start)
            orbitControlsRef.current.update()
          }
          break
        case 'firstPerson':
          // firstPerson의 경우 초기 vehicle 위치로 설정
          // 애니메이션이 시작되지 않았을 때의 초기 위치 사용
          const initialVehiclePos = new THREE.Vector3(0, 0, 0) // 초기 위치
          const { position: initialCameraPosition, lookAtTarget: initialLookAtTarget } = 
            calculateFirstPersonCamera(initialVehiclePos, selectedVehicle)
          
          camera.position.copy(initialCameraPosition)
          camera.lookAt(initialLookAtTarget)
          if (orbitControlsRef.current) {
            orbitControlsRef.current.target.copy(initialLookAtTarget)
            orbitControlsRef.current.update()
          }
          break
        case 'approaching':
          camera.position.set(...CAMERA_POSITIONS.approaching)
          camera.lookAt(...CAMERA_TARGETS.approaching)
          if (orbitControlsRef.current) {
            orbitControlsRef.current.target.set(...CAMERA_TARGETS.approaching)
            orbitControlsRef.current.update()
          }
          break
      }
      
      console.log('Camera position after reset:', camera.position)
    }
  }, [animationState.resetTrigger, viewMode, selectedVehicle, camera])

  useEffect(() => {
    if (prevSelectedVehicle.current !== selectedVehicle) {
      frozenCameraState.current = null
      prevSelectedVehicle.current = selectedVehicle
    }
  }, [selectedVehicle])

  useEffect(() => {
    if (prevViewMode.current !== viewMode) {
      frozenCameraState.current = null
      prevViewMode.current = viewMode
      
      // 모드가 바뀔 때 즉시 해당 카메라 포지션으로 이동
      if (!showIntro && !showResult) {
        switch (viewMode) {
          case 'start':
            camera.position.set(...CAMERA_POSITIONS.start)
            camera.lookAt(...CAMERA_TARGETS.start)
            if (orbitControlsRef.current) {
              orbitControlsRef.current.target.set(...CAMERA_TARGETS.start)
              orbitControlsRef.current.update()
            }
            break
          case 'approaching':
            camera.position.set(...CAMERA_POSITIONS.approaching)
            camera.lookAt(...CAMERA_TARGETS.approaching)
            if (orbitControlsRef.current) {
              orbitControlsRef.current.target.set(...CAMERA_TARGETS.approaching)
              orbitControlsRef.current.update()
            }
            break
        }
      }
      console.log('Camera position after viewMode change:', camera.position)
    }
  }, [viewMode, camera, showIntro, showResult])

  useEffect(() => {
    if (showResult) {
      camera.position.set(...CAMERA_POSITIONS.result)
      camera.lookAt(...CAMERA_TARGETS.result)

      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.set(...CAMERA_TARGETS.result)
        orbitControlsRef.current.update()
      }
    }
  }, [showResult, camera])

  const isControlsEnabled = () => {
    if (showIntro) return false
    if (showResult) return true
    if (viewMode === 'free') return true
    if (viewMode === 'firstPerson' && !isAnimationPlaying) return true
    if (viewMode === 'approaching') return true
    if (viewMode === 'start') return true

    return false
  }

  useFrame(() => {
    if (showIntro || showResult) return

    switch (viewMode) {
      case 'start':
        break

      case 'firstPerson':
        const vehiclePos = getVehiclePosition(sceneRef, selectedVehicle)
        const { position: cameraPosition, lookAtTarget } = calculateFirstPersonCamera(vehiclePos, selectedVehicle)

        if (!isAnimationPlaying && frozenCameraState.current) {
          camera.position.copy(frozenCameraState.current.position)
          camera.lookAt(frozenCameraState.current.lookAtTarget)
          if (orbitControlsRef.current) {
            orbitControlsRef.current.target.copy(frozenCameraState.current.lookAtTarget)
          }
        } else {
          camera.position.copy(cameraPosition)
          camera.lookAt(lookAtTarget)

          if (orbitControlsRef.current) {
            orbitControlsRef.current.target.copy(lookAtTarget)
          }

          frozenCameraState.current = {
            position: cameraPosition.clone(),
            lookAtTarget: lookAtTarget.clone(),
          }
        }
        break

      case 'approaching':
        break

      case 'free':
        break
    }
  })

  return {
    orbitControlsRef,
    isControlsEnabled,
  }
}