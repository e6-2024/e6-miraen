import { SugarExperimentConfig, TomatoDropConfig } from '@/types/5-1-3/types'

export const EXPERIMENT_CONFIGS = {
  left: {
    spoonsCount: 1,
    beakerId: 'LEFT',
    beaker: {
      scale: 0.8,
      position: [-1.3, -0.6, 0] as [number, number, number],
    },
    tomato: {
      startPosition: [-1.5, 0.85, -0.05] as [number, number, number],
      beakerPosition: [-1.3, -0.44, 0] as [number, number, number],
      beakerRadius: 0.32,
      waterLevel: 0.4,
      maxRiseHeight: 0.04,
      riseSpeed: 0.1,
      riseSpringStiffness: 10,
      riseSpringDamping: 15,
    },
    spoon: {
      position: [-1.9, 1.0, -0.08] as [number, number, number],
      baseRotation: [Math.PI / 2, -Math.PI / 12, -Math.PI / 2] as [number, number, number],
    },
    tomatoStatic: {
      position: [-0.45, -0.7, 0.25] as [number, number, number],
      rotation: [1.744, -0.13, -0.618] as [number, number, number],
    },
  },
  right: {
    spoonsCount: 5,
    beakerId: 'RIGHT',
    beaker: {
      scale: 0.8,
      position: [1.3, -0.6, 0] as [number, number, number],
    },
    tomato: {
      startPosition: [1.1, 0.85, 0.0] as [number, number, number],
      beakerPosition: [1.3, -0.4, 0] as [number, number, number],
      beakerRadius: 0.32,
      waterLevel: 0.56,
      maxRiseHeight: -0.15,
      riseSpeed: 0.1,
      riseSpringStiffness: 10,
      riseSpringDamping: 15,
    },
    spoon: {
      position: [1.9, 1.0, -0.01] as [number, number, number],
      baseRotation: [Math.PI / 2, Math.PI / 12, Math.PI / 2] as [number, number, number],
    },
    tomatoStatic: {
      position: [-0.7, -0.7, -0.01] as [number, number, number],
      rotation: [1.744, 0.13, 0.8] as [number, number, number],
    },
  },
} as const

export const BASE_MODEL_CONFIG = {
  scale: 6,
  position: [-0.5, -0.6, 0] as [number, number, number],
}

export const CAMERA_CONFIG = {
  position: [0, 5, 20] as [number, number, number],
  fov: 20,
}

export const ORBIT_CONTROLS_CONFIG = {
//   minAzimuthAngle: -Math.PI / 4,
//   maxAzimuthAngle: Math.PI / 4,
//   minPolarAngle: Math.PI / 3 + Math.PI / 10,
  maxPolarAngle: Math.PI / 2,
  minDistance: 1,
  maxDistance: 20,
}

export const calculateSugarConcentration = (dissolvedSpoons: number): number => {
  return dissolvedSpoons * 4.2
}

export const calculateDensity = (concentration: number): number => {
  return 1.0 + concentration * 0.004
}

export const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
  try {
    const audio = new Audio(audioPath)
    audio.volume = 0.7
    audio.play().catch((error) => {
      console.log('효과음 재생 실패:', error.name)
    })
  } catch (error) {
    console.log('효과음 생성 실패:', error)
  }
}

export const getSpoonRotation = (baseRotation: [number, number, number], animationRotation: number): [number, number, number] => {
  return [baseRotation[0] + animationRotation, baseRotation[1], baseRotation[2]]
}