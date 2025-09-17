import { OrbitControls } from '@react-three/drei';
import { ViewMode, VehicleId } from '@/types/6-1-2/types';
import { useCamera } from '@/hook/6-1-2/useCamera';
import * as THREE from 'three';

interface CameraControllerProps {
  viewMode: ViewMode;
  selectedVehicle: VehicleId;
  isAnimationPlaying: boolean;
  sceneRef: React.RefObject<THREE.Group>;
  showIntro: boolean;
  showResult: boolean;
}

export function CameraController({
  viewMode,
  selectedVehicle,
  isAnimationPlaying,
  sceneRef,
  showIntro,
  showResult,
}: CameraControllerProps) {
  const { orbitControlsRef, isControlsEnabled } = useCamera({
    viewMode,
    selectedVehicle,
    isAnimationPlaying,
    sceneRef,
    showIntro,
    showResult,
  });

  return (
    <OrbitControls
      ref={orbitControlsRef}
      enabled={isControlsEnabled()}
      enablePan={isControlsEnabled()}
      enableZoom={isControlsEnabled()}
      enableRotate={isControlsEnabled()}
      minDistance={0}
      maxDistance={7}
      minPolarAngle={0}
      maxPolarAngle={Math.PI/2}
    />
  );
}