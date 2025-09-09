import * as THREE from 'three';
import { TimeData, SunPosition, CameraConfig } from '@/types/6-2-1/types';

export const CAMERA_CONFIG: CameraConfig = {
  position: [2.88, 3.82, 11.4],
  target: [0, 0, 0],
  minDistance: 0.2,
  maxDistance: 16,
  minPolarAngle: Math.PI / 2.5,
  maxPolarAngle: Math.PI / 2.55,
} as const;

export const calculateSunPosition = (azimuth: number, altitude: number, distance: number = 15): SunPosition => {
  const azimuthRad = azimuth * (Math.PI / 180);
  const altitudeRad = altitude * (Math.PI / 180);

  const sunX = distance * Math.cos(altitudeRad) * Math.sin(azimuthRad);
  const sunY = distance * Math.sin(altitudeRad);
  const sunZ = distance * Math.cos(altitudeRad) * Math.cos(azimuthRad);

  return { sunX, sunY, sunZ, azimuthRad, altitudeRad };
};

export const getAudioPath = (action: string): string => {
  const paths = {
    'goal': '/sounds/6-2-1/narration/6-2-1-Goal.MP3',
    'intro': '/sounds/6-2-1/narration/6-2-1-D.MP3',
    'observation-table': '/sounds/6-2-1/narration/6-2-1-E.MP3',
    'progress-bar': '/sounds/6-2-1/narration/6-2-1-F.MP3',
    'time-interval': '/sounds/6-2-1/narration/6-2-1-G.MP3',
    'summary': '/sounds/6-2-1/narration/6-2-1-H.MP3',
    'graph-altitude': '/sounds/6-2-1/narration/6-2-1-B.MP3',
    'graph-shadow': '/sounds/6-2-1/narration/6-2-1-A.MP3',
    'graph-temperature': '/sounds/6-2-1/narration/6-2-1-C.MP3',
  };

  return paths[action as keyof typeof paths] || '';
};

export const formatTimeData = (data: TimeData[]): TimeData[] => {
  return data.map(item => ({
    ...item,
    time: item.time,
    azimuth: Math.round(item.azimuth),
    altitude: Math.round(item.altitude),
    shadowLength: Math.round(item.shadowLength * 10) / 10,
    temperature: Math.round(item.temperature * 10) / 10,
  }));
};

export const getTimeIntervalData = (allData: TimeData[]): TimeData[] => {
  const intervalTimes = ['09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30'];
  return allData.filter(item => intervalTimes.includes(item.time));
};

export const calculateShadowEnd = (
  poleTopPosition: [number, number, number],
  sunPosition: SunPosition
): [number, number, number] => {
  const poleTop = new THREE.Vector3(...poleTopPosition);
  const sunDir = new THREE.Vector3(sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ).normalize();
  
  const groundLevel = 0;
  const t = (poleTop.y - groundLevel) / sunDir.y;
  const shadowEndPoint = new THREE.Vector3(
    poleTop.x - sunDir.x * t,
    groundLevel,
    poleTop.z - sunDir.z * t
  );
  
  return [shadowEndPoint.x, shadowEndPoint.y, shadowEndPoint.z];
};

export const getTemperatureColor = (temperature: number, maxTemp: number = 28): string => {
  const ratio = Math.min(temperature / maxTemp, 1);
  if (ratio < 0.3) return 'from-blue-400 to-blue-600';
  if (ratio < 0.6) return 'from-green-400 to-green-600';
  if (ratio < 0.8) return 'from-yellow-400 to-yellow-600';
  return 'from-red-400 to-red-600';
};