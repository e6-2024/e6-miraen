export type CleaningToolType = 'vinegar' | 'spray' | 'bleach' | 'toilet_cleaner' | null
export type SplashType = 'splash01' | 'splash02' | 'splash03' | 'splash04'
export type GamePhase = 'selection' | 'solution_choice' | 'spraying' | 'wiping' | 'completed'

export interface MissionData {
  id: SplashType
  name: string
  correctSolution: CleaningToolType
  position: [number, number, number]
  cameraPosition: [number, number, number]
  selectMessage: string
  completionMessage: string
  emoji: string
}

// 게임 상수들
export const missions: Record<SplashType, MissionData> = {
  splash01: {
    id: 'splash01',
    name: '유리창',
    correctSolution: 'spray',
    position: [-6, 1, -1.2],
    cameraPosition: [-4, 2, 2],
    selectMessage: '유리창의 얼룩을 제거하기 위해 이용해야 할 용액을 고르세요.',
    completionMessage: '산성 용액인 유리 세정제로 얼룩이 깨끗하게 제거되었습니다.',
    emoji: '🪟',
  },
  splash02: {
    id: 'splash02',
    name: '변기',
    correctSolution: 'toilet_cleaner',
    position: [10.22, 0, 0.33],
    cameraPosition: [10, 2.2, -0.33],
    selectMessage: '변기의 오염을 제거하기 위해 이용해야 할 용액을 고르세요.',
    completionMessage: '염기성 용액인 변기용 세제로 오염이 깨끗하게 제거되었습니다.',
    emoji: '🚽',
  },
  splash03: {
    id: 'splash03',
    name: '욕실',
    correctSolution: 'bleach',
    position: [9.22, -0.5, -2.33],
    cameraPosition: [8.22, 2.5, -2.33],
    selectMessage: '욕실의 곰팡이를 제거하기 위해 이용해야 할 용액을 고르세요.',
    completionMessage: '염기성 용액인 표백제로 곰팡이가 깨끗하게 제거되었습니다.',
    emoji: '🛁',
  },
  splash04: {
    id: 'splash04',
    name: '도마',
    correctSolution: 'vinegar',
    position: [-2.7, 0.5, 6.1],
    cameraPosition: [-0, 2.0, 7.1],
    selectMessage: '도마의 생선 비린내를 제거하기 위해 이용해야 할 용액을 고르세요.',
    completionMessage: '염기성 물질인 비린내는 산성 용액인 식초와 만나면 성질이 변하여 제거됩니다.',
    emoji: '🐟',
  },
}

export const solutions = [
  { id: 'vinegar', name: '식초', color: '#ff6b6b' },
  { id: 'spray', name: '유리 세정제', color: '#2985ee' },
  { id: 'toilet_cleaner', name: '변기용 세제', color: '#25e5c2' },
  { id: 'bleach', name: '표백제', color: '#129d3a' },
]

export const wipingEfficiency = {
  splash01: { base: 1.0, bonus: 0.2 },
  splash02: { base: 1.0, bonus: 0.2 },
  splash03: { base: 1.0, bonus: 0.2 },
  splash04: { base: 1.0, bonus: 0.2 },
}

export const initialCamera = {
  position: [-0.34, 12, -10] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
}