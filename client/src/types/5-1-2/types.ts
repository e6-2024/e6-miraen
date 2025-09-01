import * as THREE from 'three';

export type OpticalMode = 'direct' | 'reflection' | 'refraction';
export type LensType = 'convex' | 'concave';
export type RayStates = [boolean, boolean, boolean];

export interface OpticalSurface {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  type: 'mirror' | 'lens';
  refractiveIndex?: number;
  lensType?: LensType;
  surface?: 'entrance' | 'exit';
}

export interface LaserPointerProps {
  position: [number, number, number];
  rotation: [number, number, number];
  visible: boolean;
  onPointerDown?: (e: any) => void;
  onPointerMove?: (e: any) => void;
  onPointerUp?: (e: any) => void;
  onToggle?: (buttonIndex: number) => void;
  rayStates?: RayStates;
  pivotOffset?: [number, number, number];
  mode?: OpticalMode;
}