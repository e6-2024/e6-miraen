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
  showLiquidMessage: string
  showClickMessage: string
}

export const missions: Record<SplashType, MissionData> = {
  splash01: {
    id: 'splash01',
    name: '도마',
    correctSolution: 'vinegar',
    position: [-2.5, 1.52, 6.6],
    cameraPosition: [-1, 3.0, 7.1],
    selectMessage: '도마에서 나는 생선 비린내를 제거하기 위해 이용해야 할 용액을 고르세요.',
    completionMessage: '염기성 물질인 비린내는 산성 용액인 식초와 만나면 성질이 변하여 제거됩니다.',
    showLiquidMessage: '클릭하여 식초를 도마에 뿌려주세요.',
    showClickMessage: '마우스를 움직여서 도마를 닦아주세요!',
  },
  splash02: {
    id: 'splash02',
    name: '유리창',
    correctSolution: 'spray',
    position: [-6, 2, -1.2],
    cameraPosition: [0, -1, -1.2],
    selectMessage: '유리창의 얼룩을 제거하기 위해 이용해야 할 용액을 고르세요.',
    completionMessage: '산성 용액인 유리 세정제로 얼룩이 깨끗하게 제거되었습니다.',
    showLiquidMessage: '클릭하여 유리 세정제를 유리창에 뿌려주세요.',
    showClickMessage: '마우스를 움직여서 유리창을 닦아주세요!',
  },
  splash03: {
    id: 'splash03',
    name: '변기',
    correctSolution: 'toilet_cleaner',
    position: [10.22, 2, 0.33],
    cameraPosition: [10, 3.2, -0.33],
    selectMessage: '변기의 때를 제거하기 위해 이용해야 할 용액을 고르세요.',
    completionMessage: '염기성 용액인 변기용 세제로 오염이 깨끗하게 제거되었습니다.',
    showLiquidMessage: '클릭하여 변기용 세제를 변기의 때 부분에 뿌려주세요.',
    showClickMessage: '마우스를 움직여서 변기를 닦아주세요!',
  },
  splash04: {
    id: 'splash04',
    name: '욕실',
    correctSolution: 'bleach',
    position: [9.22, 0.5, -2.33],
    cameraPosition: [8.22, 2.5, -2.33],
    selectMessage: '욕실을 청소하기 위해 이용해야 할 용액을 고르세요.',
    completionMessage: '염기성 용액인 표백제로 곰팡이가 깨끗하게 제거되었습니다.',
    showLiquidMessage: '클릭하여 욕실 바닥에 표백제를 뿌려주세요.',
    showClickMessage: '마우스를 움직여서 욕실 바닥을 닦아주세요!',
  },
}

export const solutions = [
  { id: 'vinegar', name: '식초', color: '#fff', img: '/img/Frame 25.svg' },
  { id: 'spray', name: '유리 세정제', color: '#fff', img: '/img/Frame 27.svg' },
  { id: 'toilet_cleaner', name: '변기용 세제', color: '#fff', img: '/img/Frame 26.svg' },
  { id: 'bleach', name: '표백제', color: '#fff', img: '/img/Frame 24.svg' },
]

export const wipingEfficiency = {
  splash01: { base: 0.5, bonus: 0.2 },
  splash02: { base: 0.5, bonus: 0.2 },
  splash03: { base: 0.5, bonus: 0.2 },
  splash04: { base: 0.5, bonus: 0.2 },
}

export const initialCamera = {
  position: [-0.34, 15, -20] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
}
