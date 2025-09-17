import * as THREE from 'three';

export type ViewMode = 'start' | 'firstPerson' | 'approaching' | 'free';

export type VehicleId = 'train' | 'car' | 'horse' | 'bicycle' | 'runner';

export interface Vehicle {
  id: VehicleId;
  name: string;
  speed: number;
  meshName: string;
  audioPath: string;
}

export interface CameraState {
  position: THREE.Vector3;
  lookAtTarget: THREE.Vector3;
}

export interface VehicleCameraConfig {
  offset: { x: number; y: number; z: number };
  lookAheadDistance: number;
}

export interface AnimationState {
  isPlaying: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  resetTrigger: boolean;
}

export interface AudioState {
  currentAudio: HTMLAudioElement | null;
  narrationAudio: HTMLAudioElement | null;
}