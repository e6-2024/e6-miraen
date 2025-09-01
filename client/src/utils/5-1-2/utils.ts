import * as THREE from 'three';
import { OpticalMode, LensType } from '@/types/5-1-2/types';

export const CAMERA_CONFIGS = {
  direct: {
    position: [0, 0, 30] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    maxPolarAngle: Math.PI,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity
  },
  reflection: {
    position: [-27, 10, -0.9] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    maxPolarAngle: Math.PI,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity
  },
  refraction: {
    position: [0, 0, 30] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    maxPolarAngle: Math.PI / 2,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity
  }
} as const;

// 광학 계산 함수들
export const calculateReflection = (direction: THREE.Vector3, normal: THREE.Vector3): THREE.Vector3 => {
  return direction.clone().sub(normal.clone().multiplyScalar(2 * direction.dot(normal)));
};

export const calculateLensRefraction = (
  point: THREE.Vector3, 
  lensType: LensType, 
  surface: 'entrance' | 'exit'
): THREE.Vector3 => {
  const offsetY = point.y - 5.6;
  const offsetZ = point.z + (surface === 'exit' ? 0.6 : 0);
  const focalLength = surface === 'entrance' ? 12 : 6;
  const sign = lensType === 'convex' ? -1 : 1;
  
  return new THREE.Vector3(
    1,
    sign * offsetY / focalLength,
    sign * offsetZ / focalLength
  ).normalize();
};

export const getLaserPointerPosition = (mode: OpticalMode): [number, number, number] => {
  const positions = {
    direct: [-11.5,5.7, -1],
    reflection: [-9, 1.2, -4.2],
    refraction: [-11.5,5.7, -1]
  };
  return positions[mode] as [number, number, number];
};

export const getStandPosition = (mode: OpticalMode): [number, number, number] => {
  const positions = {
    direct: [-10,0, -0.5],
    reflection: [-9, 0, -4.2],
    refraction: [-10,0, -0.5]
  };
  return positions[mode] as [number, number, number];
};

export const getLaserPointerRotation = (mode: OpticalMode, angle: number): [number, number, number] => {
  const angleRad = (angle * Math.PI) / 180;
  
  switch (mode) {
    case 'direct':
      return [0, 3*Math.PI/2, 3*Math.PI/2];
    case 'reflection':
      return [0, 3*Math.PI/2 - angleRad, 3*Math.PI/2];
    case 'refraction':
      return [0, 3*Math.PI/2, 3*Math.PI/2];
    default:
      return [0, 0, 0];
  }
};

export const getRayOrigins = (mode: OpticalMode): THREE.Vector3[] => {
  const configs = {
    direct: { base: [-8, 5.68, -0.65], offsets: [0.75, 0, -0.75] },
    reflection: { base: [-9, 1.2, -4.2], offsets: [0.6, 0, -0.6] },
    refraction: { base: [-8, 5.68, -0.6], offsets: [0.75, 0, -0.75] }
  };
  
  const config = configs[mode];
  return config.offsets.map(offset => 
    new THREE.Vector3(config.base[0], config.base[1] + offset, config.base[2])
  );
};

export const getNarrationText = (mode: OpticalMode, lensType: LensType): string => {
  const texts = {
    direct: '빛은 곧게 나아갑니다.',
    reflection: '빛은 곧게 나아가다가 거울에 부딪치면 방향이 바뀌어 나아갑니다.',
    refraction: lensType === 'convex'
      ? '빛은 볼록 렌즈를 통과할 때 렌즈의 가운데 쪽으로 굴절하여 나아갑니다.'
      : '빛은 오목 렌즈를 통과할 때 렌즈의 바깥쪽으로 굴절하여 나아갑니다.'
  };
  return texts[mode];
};

export const getAudioPath = (mode: OpticalMode, lensType?: LensType): string => {
  const paths = {
    direct: '/sounds/5-1-2/5-1-2-B.MP3',
    reflection: '/sounds/5-1-2/5-1-2-C.MP3',
    'refraction-convex': '/sounds/5-1-2/5-1-2-D.MP3',
    'refraction-concave': '/sounds/5-1-2/5-1-2-E.MP3'
  };
  
  const key = mode === 'refraction' ? `${mode}-${lensType}` : mode;
  return paths[key as keyof typeof paths] || '';
};