import { ExperimentPhase } from '@/types/6-2-2/types'

export const EXPERIMENT_CONFIG = {
  burnDuration: 2000,
  fadeDuration: 2000,
  flamePositions: {
    left: [-2.147, 0.5, -0.512] as [number, number, number],
    right: [-0.771, 0.5, -0.512] as [number, number, number]
  },
  cameraPositions: {
    initial: [-0.53, 1.02, 19.4] as [number, number, number],
    trackOut: [-1.95, 2, 25.04] as [number, number, number]
  }
}

export const GLB_OBJECT_NAMES = {
  rightCup: 'Acryl_Cup',
  leftCup: 'Acryl_Cup1',
  oxygenSpray: 'Oxygen_spray',
  oxygenButton: 'Oxygen_spray',
  candleStand1: 'st_set_Hatthylla_ljus_penna_bok_matta_vaskapolySurface170',
  candleStand2: 'polySurface170'
}

export const ANIMATION_INDEX = {
  leftCupCover: 1,
  rightCupCover: 2,
  oxygenSupply: 2,
  tubeInsertion: 4,
  canAppearance: 5
}

export const getAudioPath = (phase: ExperimentPhase): string => {
  const paths = {
    waiting: '',
    selectingCup: '/sounds/6-2-2/narration/6-2-2-A.MP3',
    oxygenCanAppearing: '',
    oxygenSupply: '/sounds/6-2-2/oxygen-supply-instruction.mp3',
    oxygenSupplying: '/sounds/6-2-2/oxygen-sound.mp3',
    oxygenCanDisappearing: '',
    cameraTrackOut: '',
    readyToCover: '/sounds/6-2-2/cover-instruction.mp3',
    covering: '',
    burning: '/sounds/6-2-2/narration/6-2-2-burning.mp3',
    rightOut: '/sounds/6-2-2/narration/6-2-2-B.MP3',
    finished: '/sounds/6-2-2/narration/6-2-2-C.MP3'
  }
  return paths[phase] || ''
}