import { ExperimentPhase } from '@/types/6-2-2/types'

export const EXPERIMENT_CONFIG = {
  burnDuration: 15000,
  fadeDuration: 2000,
  flamePositions: {
    left: [-10.8, -0.45, 6.3] as [number, number, number],
    right: [-3.9, -0.45, 6.3] as [number, number, number]
  },
  cameraPositions: {
    initial: [-0.53, 1.02, 19.4] as [number, number, number],
    trackOut: [-5.4, -0.04, 27.11] as [number, number, number]
  }
}

export const getAudioPath = (phase: ExperimentPhase): string => {
  const paths = {
    selectingCup: '/sounds/6-2-2/narration/6-2-2-A-1.MP3',
    oxygenCanAppearing: '',
    oxygenSupply: '/sounds/6-2-2/narration/6-2-2-B.MP3',
    oxygenSupplying: '',
    oxygenCanDisappearing: '',
    cameraTrackOut: '',
    readyToCover: '',
    covering: '',
    burning: '',
    rightOut: '',
    finished: '/sounds/6-2-2/narration/6-2-2-C.MP3'
  }
  return paths[phase] || ''
}