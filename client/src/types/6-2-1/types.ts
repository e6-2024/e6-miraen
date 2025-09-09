import * as THREE from 'three';

export interface TimeData {
  time: string;
  azimuth: number;
  altitude: number;
  shadowDirection: number;
  shadowLength: number;
  temperature: number;
}

export interface SunPosition {
  sunX: number;
  sunY: number;
  sunZ: number;
  azimuthRad: number;
  altitudeRad: number;
}

export interface CameraConfig {
  position: [number, number, number];
  target: [number, number, number];
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
}

export interface ObservationState {
  currentTimeIndex: number;
  isPlaying: boolean;
  progress: number;
  showObservationLines: boolean;
  showThermometer: boolean;
  selectedTimeData: TimeData | null;
  isTimeIntervalMode: boolean;
}