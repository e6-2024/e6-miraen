import { ExperimentPhase } from '@/types/6-2-2/types'

export const EXPERIMENT_CONFIG = {
  burnDuration: 2000,
  fadeDuration: 2000,
  flamePositions: {
    left: [-0.57, -0.9, 0] as [number, number, number],
    right: [0.41, -0.9, 0] as [number, number, number]
  }
}

export const getAudioPath = (phase: ExperimentPhase): string => {
  const paths = {
    waiting: '',
    burning: '/sounds/6-2-2/narration/6-2-2-A.MP3',
    rightOut: '/sounds/6-2-2/narration/6-2-2-B.MP3',
    finished: '/sounds/6-2-2/narration/6-2-2-C.MP3'
  }
  return paths[phase] || ''
}