import { useRef, useEffect, useState } from 'react'
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
  animationState: AnimationState
  resetTrigger: boolean
}

export const useCamera = ({
  viewMode,
  selectedVehicle,
  isAnimationPlaying,
  sceneRef,
  showIntro,
  showResult,
  animationState,
  resetTrigger,
}: UseCameraProps) => {
  const { camera } = useThree()
  const orbitControlsRef = useRef<any>()
  const frozenCameraState = useRef<CameraState | null>(null)
  const prevSelectedVehicle = useRef(selectedVehicle)
  const prevViewMode = useRef(viewMode)
  const prevShowResult = useRef(showResult)
  const [modelReady, setModelReady] = useState(true)
  const frameCountAfterTransition = useRef(0)

  useEffect(() => {
    if (prevShowResult.current === true && showResult === false) {
      setModelReady(false)
      frozenCameraState.current = null
      frameCountAfterTransition.current = 0

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
          const initialPos = new THREE.Vector3(0, 0, 0)
          const { position: initialCameraPosition, lookAtTarget: initialLookAtTarget } = calculateFirstPersonCamera(
            initialPos,
            selectedVehicle,
          )

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
      setModelReady(true)
    }
    prevShowResult.current = showResult
  }, [showResult, viewMode, selectedVehicle, camera])
  useEffect(() => {
    if (animationState.resetTrigger) {
      frozenCameraState.current = null

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
          const initialVehiclePos = new THREE.Vector3(0, 0, 0)
          const { position: initialCameraPosition, lookAtTarget: initialLookAtTarget } = calculateFirstPersonCamera(
            initialVehiclePos,
            selectedVehicle,
          )

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
    }
  }, [animationState.resetTrigger, viewMode, selectedVehicle, camera])

  // 선택된 vehicle이 변경될 때
  useEffect(() => {
    if (prevSelectedVehicle.current !== selectedVehicle) {
      frozenCameraState.current = null
      prevSelectedVehicle.current = selectedVehicle
    }
  }, [selectedVehicle])

  // viewMode가 변경될 때
  useEffect(() => {
    if (prevViewMode.current !== viewMode) {
      frozenCameraState.current = null
      prevViewMode.current = viewMode

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

          case 'firstPerson':
            const initialVehiclePos = new THREE.Vector3(0, 0, 0)
            const { position: initialCameraPosition, lookAtTarget: initialLookAtTarget } = calculateFirstPersonCamera(
              initialVehiclePos,
              selectedVehicle,
            )

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
      }
    }
  }, [viewMode, camera, showIntro, showResult, selectedVehicle])

  // Result 화면으로 전환 시
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

  useEffect(() => {
    if (resetTrigger) {
      frozenCameraState.current = null
      frameCountAfterTransition.current = 0
      setModelReady(true)
      camera.position.set(CAMERA_POSITIONS.start[0], CAMERA_POSITIONS.start[1], CAMERA_POSITIONS.start[2])
      camera.lookAt(0, 0, 0)

      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.set(0, 0, 0)
        orbitControlsRef.current.update()
      }
    }
  }, [resetTrigger, camera])

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

    // Result에서 돌아온 직후 몇 프레임은 스킵
    if (!modelReady && viewMode === 'firstPerson') {
      frameCountAfterTransition.current++
      if (frameCountAfterTransition.current < 10) {
        // 처음 10프레임 동안은 초기 위치 유지
        const initialPos = new THREE.Vector3(0, 0, 0)
        const { position: initialCameraPosition, lookAtTarget: initialLookAtTarget } = calculateFirstPersonCamera(
          initialPos,
          selectedVehicle,
        )

        camera.position.copy(initialCameraPosition)
        camera.lookAt(initialLookAtTarget)

        if (orbitControlsRef.current) {
          orbitControlsRef.current.target.copy(initialLookAtTarget)
        }
        return
      }
    }

    switch (viewMode) {
      case 'start':
        break

      case 'firstPerson':
        const vehiclePos = getVehiclePosition(sceneRef, selectedVehicle)

        // 위치가 (0,0,0)이면 스킵
        if (!modelReady || (vehiclePos.x === 0 && vehiclePos.y === 0 && vehiclePos.z === 0)) {
          // 초기 위치 유지
          if (!frozenCameraState.current) {
            const initialPos = new THREE.Vector3(0, 0, 0)
            const { position: initialCameraPosition, lookAtTarget: initialLookAtTarget } = calculateFirstPersonCamera(
              initialPos,
              selectedVehicle,
            )

            frozenCameraState.current = {
              position: initialCameraPosition.clone(),
              lookAtTarget: initialLookAtTarget.clone(),
            }
          }

          camera.position.copy(frozenCameraState.current.position)
          camera.lookAt(frozenCameraState.current.lookAtTarget)

          if (orbitControlsRef.current) {
            orbitControlsRef.current.target.copy(frozenCameraState.current.lookAtTarget)
          }
          return
        }

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
