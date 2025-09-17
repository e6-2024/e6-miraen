import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ViewMode, VehicleId, CameraState } from '@/types/6-1-2/types';
import { CAMERA_POSITIONS, CAMERA_TARGETS, getVehiclePosition, calculateFirstPersonCamera } from '@/utils/6-1-2/utils';

interface UseCameraProps {
  viewMode: ViewMode;
  selectedVehicle: VehicleId;
  isAnimationPlaying: boolean;
  sceneRef: React.RefObject<THREE.Group>;
  showIntro: boolean;
  showResult: boolean;
}

export const useCamera = ({
  viewMode,
  selectedVehicle,
  isAnimationPlaying,
  sceneRef,
  showIntro,
  showResult
}: UseCameraProps) => {
  const { camera } = useThree();
  const orbitControlsRef = useRef<any>();
  const frozenCameraState = useRef<CameraState | null>(null);
  const prevSelectedVehicle = useRef(selectedVehicle);
  const prevViewMode = useRef(viewMode);

  useEffect(() => {
    if (prevSelectedVehicle.current !== selectedVehicle) {
      frozenCameraState.current = null;
      prevSelectedVehicle.current = selectedVehicle;
    }
  }, [selectedVehicle]);

  useEffect(() => {
    if (prevViewMode.current !== viewMode) {
      frozenCameraState.current = null;
      prevViewMode.current = viewMode;
    }
  }, [viewMode]);

  useEffect(() => {
    if (showResult) {
      camera.position.set(...CAMERA_POSITIONS.result);
      camera.lookAt(...CAMERA_TARGETS.result);

      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.set(...CAMERA_TARGETS.result);
        orbitControlsRef.current.update();
      }
    }
  }, [showResult, camera]);

  useFrame(() => {
    if (showIntro || showResult) return;

    switch (viewMode) {
      case 'start':
        camera.position.set(...CAMERA_POSITIONS.start);
        camera.lookAt(...CAMERA_TARGETS.start);

        if (orbitControlsRef.current) {
          orbitControlsRef.current.target.set(...CAMERA_TARGETS.start);
        }
        break;

      case 'firstPerson':
        const vehiclePos = getVehiclePosition(sceneRef, selectedVehicle);
        const { position: cameraPosition, lookAtTarget } = calculateFirstPersonCamera(vehiclePos, selectedVehicle);

        if (!isAnimationPlaying && frozenCameraState.current) {
          camera.position.copy(frozenCameraState.current.position);
          camera.lookAt(frozenCameraState.current.lookAtTarget);
          if (orbitControlsRef.current) {
            orbitControlsRef.current.target.copy(frozenCameraState.current.lookAtTarget);
          }
        } else {
          camera.position.copy(cameraPosition);
          camera.lookAt(lookAtTarget);

          if (orbitControlsRef.current) {
            orbitControlsRef.current.target.copy(lookAtTarget);
          }

          frozenCameraState.current = {
            position: cameraPosition.clone(),
            lookAtTarget: lookAtTarget.clone(),
          };
        }
        break;

      case 'approaching':
        camera.position.set(...CAMERA_POSITIONS.approaching);
        camera.lookAt(...CAMERA_TARGETS.approaching);

        if (orbitControlsRef.current) {
          orbitControlsRef.current.target.set(...CAMERA_TARGETS.approaching);
        }
        break;

      case 'free':
        break;
    }
  });

  const isControlsEnabled = () => {
    return (
      (viewMode === 'free' && !showIntro) ||
      (!isAnimationPlaying && viewMode !== 'firstPerson') ||
      showResult
    );
  };

  return {
    orbitControlsRef,
    isControlsEnabled,
  };
};