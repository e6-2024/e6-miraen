import * as THREE from 'three'

export type ViewType = 'default' | 'root' | 'stem' | 'leaf' | 'water'
export type InfoPanelType = 'root' | 'stem' | 'leaf'

export const CAMERA_CONFIGS = {
  default: {
    position: [16, 3, 20] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    maxPolarAngle: Math.PI / 2,
    minPolarAngle: 0,
    minAzimuthAngle: 0,
    maxAzimuthAngle: Math.PI / 2,
    minDistance: 10,
    maxDistance: 40,
  },
  leaf: {
    position: [4, 10, 6] as [number, number, number],
    target: [2.15, 8.1, 1.36] as [number, number, number],
    maxPolarAngle: Math.PI / 2,
    minPolarAngle: 0,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
    minDistance: 0,
    maxDistance: 40,
  },
  root: {
    position: [8, -4, 12] as [number, number, number],
    target: [3.48, -2.42, 1.82] as [number, number, number],
    maxPolarAngle: Math.PI / 2 + Math.PI / 3,
    minPolarAngle: Math.PI / 3,
    minAzimuthAngle: 0,
    maxAzimuthAngle: Math.PI / 2,
    minDistance: 0,
    maxDistance: 40,
  },
  stem: {
    position: [5, 4, 8] as [number, number, number],
    target: [0, 3, 0] as [number, number, number],
    maxPolarAngle: Math.PI / 2,
    minPolarAngle: 0,
    minAzimuthAngle: 0,
    maxAzimuthAngle: Math.PI / 2,
    minDistance: 2,
    maxDistance: 40,
  },
  water: {
    position: [16, 3, 20] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    maxPolarAngle: Math.PI / 2,
    minPolarAngle: 0,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
    minDistance: 10,
    maxDistance: 40,
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
  new THREE.Vector3(-0.19, 8.28, -0.179),
  new THREE.Vector3(-0.17, 8.917, -0.325),
  new THREE.Vector3(-0.283, 9.417, -0.125),
]

export const getNarrationTexts = () => ({
  root: '뿌리는 식물에 필요한 물을 흡수합니다.',
  stem: '뿌리에서 흡수한 물은 줄기를 통해 잎으로 이동합니다.',
  leaf: '잎에 도달한 물이 수증기가 되어 기공을 통해 잎 밖으로 빠져나갑니다.',
  water: '뿌리에서 흡수된 물은 어떻게 되는지 살펴봅시다.',
})

export const getNarrationFiles = () => ({
  root: '/sounds/6-1-3/narration/6-1-3-B.MP3',
  stem: '/sounds/6-1-3/narration/6-1-3-C.MP3',
  leaf: '/sounds/6-1-3/narration/6-1-3-A.MP3',
  water: '/sounds/6-1-3/narration/6-1-3-D.MP3',
})

export const getAudioPath = (type: 'root' | 'stem' | 'leaf' | 'water'): string => {
  const paths = getNarrationFiles()
  return paths[type] || ''
}
