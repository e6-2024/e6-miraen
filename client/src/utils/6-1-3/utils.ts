import * as THREE from 'three'

export type ViewType = 'default' | 'root' | 'stem' | 'leaf' | 'water'
export type InfoPanelType = 'root' | 'stem' | 'leaf'

export const CAMERA_CONFIGS = {
  default: {
    position: [16, 3, 20] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    maxPolarAngle: Math.PI / 2,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
  },
  leaf: {
    position: [4, 10, 6] as [number, number, number],
    target: [2.15, 8.1, 1.36] as [number, number, number],
    maxPolarAngle: Math.PI / 2,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
  },
  root: {
    position: [8, -4, 12] as [number, number, number],
    target: [3.48, -2.42, 1.82] as [number, number, number],
    maxPolarAngle: Math.PI / 2,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
  },
  stem: {
    position: [5, 4, 8] as [number, number, number],
    target: [0, 3, 0] as [number, number, number],
    maxPolarAngle: Math.PI / 2,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
  },
  water: {
    position: [16, 3, 20] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    maxPolarAngle: Math.PI / 2,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
  },
} as const

export const getBasePathPoints = (): THREE.Vector3[] => [
  new THREE.Vector3(3.48, -2.42, 1.82),
  new THREE.Vector3(1.62, -1.42, 0.92),
  new THREE.Vector3(1.62, -1, 0.2),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(-0.3, 1.52, -0.1),
  new THREE.Vector3(-0.3, 3.61, -0.13),
  new THREE.Vector3(-0.3, 4.61, -0.17),
  new THREE.Vector3(-0.3, 6.28, -0.21),
  new THREE.Vector3(-0.3, 7.28, -0.24),
  new THREE.Vector3(-0.3, 8.28, -0.23),
  new THREE.Vector3(-0.3, 9.28, 0),
  new THREE.Vector3(2.15, 10.1, 1.36),
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