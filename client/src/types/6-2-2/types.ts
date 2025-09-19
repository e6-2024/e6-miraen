export type ExperimentPhase = 
  | 'waiting' 
  | 'selectingCup' 
  | 'oxygenCanAppearing' 
  | 'oxygenSupply' 
  | 'oxygenSupplying'
  | 'oxygenCanDisappearing'
  | 'cameraTrackOut'
  | 'readyToCover'
  | 'covering'
  | 'burning' 
  | 'rightOut' 
  | 'finished'

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
  oxygenCanPosition: [number, number, number]
  rightCupPosition: [number, number, number]
  leftCupPosition: [number, number, number]
}
