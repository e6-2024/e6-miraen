import * as THREE from 'three'

export type ViewType = 'default' | 'root' | 'stem' | 'leaf' | 'water'
export type InfoPanelType = 'root' | 'stem' | 'leaf'

export const CAMERA_CONFIGS = {
  default: {
    position: [10, 3, 20] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    maxPolarAngle: Math.PI / 2,
    minPolarAngle: Math.PI / 2,
    minAzimuthAngle: Math.PI / 7,
    maxAzimuthAngle: Math.PI / 3,
    minDistance: 2,
    maxDistance: 24,
  },
  leaf: {
    position: [3.9, 3.4, -0.7] as [number, number, number],
    target: [3.8, 3.8, -2.8] as [number, number, number],
    maxPolarAngle: Math.PI / 2 + Math.PI / 10,
    minPolarAngle: Math.PI / 2,
    minAzimuthAngle: -Math.PI / 30,
    maxAzimuthAngle: 0,
    minDistance: 1,
    maxDistance: 3,
  },
  root: {
    position: [2, -5.3, 4] as [number, number, number],
    target: [-4, -6, 5] as [number, number, number],
    maxPolarAngle: Math.PI / 2 + Math.PI / 10,
    minPolarAngle: Math.PI / 2 - Math.PI / 10,
    minAzimuthAngle: Math.PI / 10,
    maxAzimuthAngle: Math.PI / 2 - Math.PI / 10,
    minDistance: 4,
    maxDistance: 10,
  },
  stem: {
    position: [5, 4, 8] as [number, number, number],
    target: [0, 3, 0] as [number, number, number],
    maxPolarAngle: Math.PI / 2 + Math.PI / 10,
    minPolarAngle: Math.PI / 2,
    minAzimuthAngle: Math.PI / 10,
    maxAzimuthAngle: Math.PI / 2 - Math.PI / 10,
    minDistance: 2,
    maxDistance: 24,
  },
  water: {
    position: [16, 3, 20] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    maxPolarAngle: Math.PI / 2 + Math.PI / 10,
    minPolarAngle: Math.PI / 2 - Math.PI / 20,
    minAzimuthAngle: Math.PI / 10,
    maxAzimuthAngle: Math.PI / 2 - Math.PI / 10,
    minDistance: 2,
    maxDistance: 24,
  },
} as const

export const getBasePathPoints = (): THREE.Vector3[] => [
  new THREE.Vector3(-1.407, -2.368, -2.428),
  new THREE.Vector3(-0.369, -0.214, -0.498),
  new THREE.Vector3(-0.252, 1.52, -0.191),
  new THREE.Vector3(-0.303, 2.91, -0.136),
  new THREE.Vector3(-0.302, 4.396, -0.173),
  new THREE.Vector3(-0.295, 6.28, -0.306),
  new THREE.Vector3(-0.244, 7.28, -0.337),
  new THREE.Vector3(-0.29, 8.28, -0.179),
  new THREE.Vector3(-0.27, 8.917, -0.325),
  new THREE.Vector3(-0.283, 9.417, -0.125),
]

export const getNarrationTexts = () => ({
  root: '뿌리는 식물에 필요한 물을 흡수합니다.',
  stem: '뿌리에서 흡수한 물은 줄기를 통해 잎으로 이동합니다.',
  leaf: '잎에 도달한 물이 수증기가 되어 기공을 통해 잎 밖으로 빠져나갑니다.',
  water: '뿌리에서 흡수된 물은 줄기를 통해 잎에 도달합니다. 잎에 도달한 물은 기공을 통해 잎 밖으로 빠져나갑니다.',
})

export const getNarrationFiles = () => ({
  root: '/sounds/6-1-3/narration/6-1-3-B.MP3',
  stem: '/sounds/6-1-3/narration/6-1-3-C.MP3',
  leaf: '/sounds/6-1-3/narration/6-1-3-A.MP3',
  water: '/sounds/6-1-3/narration/6-1-3-D-1.MP3',
})

export const getAudioPath = (type: 'root' | 'stem' | 'leaf' | 'water'): string => {
  const paths = getNarrationFiles()
  return paths[type] || ''
}
