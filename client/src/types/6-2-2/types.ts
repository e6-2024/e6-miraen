export type ExperimentPhase = 'waiting' | 'burning' | 'rightOut' | 'finished'

export interface CandleState {
  leftFlameOpacity: number
  rightFlameOpacity: number
  rightFlameScale: number
  showFlame: boolean
}

export interface ExperimentConfig {
  burnDuration: number
  fadeDuration: number
  flamePositions: {
    left: [number, number, number]
    right: [number, number, number]
  }
}