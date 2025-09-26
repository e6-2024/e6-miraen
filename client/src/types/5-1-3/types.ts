export interface SugarExperimentConfig {
  spoonsCount: number
  beakerId: string
}

export interface TomatoDropConfig {
  startPosition: [number, number, number]
  beakerPosition: [number, number, number]
  beakerRadius: number
  waterLevel: number
  maxRiseHeight: number
  riseSpeed: number
  riseSpringStiffness: number
  riseSpringDamping: number
}

export interface BeakerState {
  currentSpoon: number
  totalDissolved: number
  isDropping: boolean
  isCompleted: boolean
  isExperimentRunning: boolean
}

export interface TomatoState {
  isDropped: boolean
  isFloating: boolean
}

export interface SpoonAnimationState {
  rotation: number
  isAnimating: boolean
}

export type ExperimentPhase = 'setup' | 'sugar' | 'tomato' | 'complete'

export interface ExperimentCallbacks {
  onSpoonDissolved: () => void
  onTomatoInWater: () => void
  onExperimentComplete: () => void
}