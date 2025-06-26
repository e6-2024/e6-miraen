import * as THREE from 'three';
import { ReactThreeFiber } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      bufferAttribute: ReactThreeFiber.BufferAttributeProps;
      lineSegments: ReactThreeFiber.Object3DNode<THREE.LineSegments, typeof THREE.LineSegments>;
      lineDashedMaterial: ReactThreeFiber.MaterialNode<THREE.LineDashedMaterial, typeof THREE.LineDashedMaterial>;
      pointsMaterial: ReactThreeFiber.MaterialNode<THREE.PointsMaterial, typeof THREE.PointsMaterial>;
    }
  }
}

// Common props types
export interface BaseProps {
  visible?: boolean;
}

export interface PositionProps extends BaseProps {
  position?: [number, number, number];
}

// Camera Controller types
export interface CameraPose {
  position: THREE.Vector3;
  lookDirection: THREE.Vector3;
  initialPitch: number;
  initialYaw: number;
}

export interface CameraControllerProps {
  isCameraMoving: boolean;
  targetSpherePosition: [number, number, number] | null;
  setIsCameraMoving: (isMoving: boolean) => void;
  setCameraAnimationComplete: (isComplete: boolean) => void;
  setIsLargeSphereVisible: (isVisible: boolean) => void;
  setIsHumanModelVisible: (isVisible: boolean) => void;
  cameraAnimationComplete: boolean;
  isCameraReset: boolean;
}

// Earth component types
export interface EarthProps extends PositionProps {
  isOrbiting?: boolean;
  speed?: number;
  modelPath: string;
  shouldRotate?: boolean;
}

// Sun component types
export interface SunProps extends BaseProps {
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

// Stars component types
export interface StarsProps {
  count?: number;
  size?: number;
}

// Dashed Sphere types
export interface DashedSphereProps extends PositionProps {
  size?: number;
  color?: string;
  dashSize?: number;
  gapSize?: number;
  onClick?: () => void;
}

// Human Model types
export interface HumanModelProps extends PositionProps {
  scale?: number;
  rotation?: [number, number, number];
}

// Large Sphere types
export interface LargeSphereProps extends PositionProps {}

// Rotation Axis types
export interface RotationAxisProps extends PositionProps {
  length?: number;
  tilt?: number;
}

// Page props
export interface PageProps {
  title?: string;
}

// Position utilities
export interface PositionOffset {
  [key: string]: [number, number, number];
}

// Earth visibility state
export interface EarthVisibilityState {
  [key: string]: boolean;
}