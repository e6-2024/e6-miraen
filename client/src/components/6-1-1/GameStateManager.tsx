import { useState, useRef } from 'react'
import { CleaningToolType, SplashType, GamePhase } from '../../types/6-1-1/types'

export interface GameState {
  // UI 상태
  isAnimating: boolean
  isZoomed: boolean
  showIntro: boolean
  showMessage: string
  showClickMessage: string
  wrongMessageShown: boolean
  isBathroomLightOn: boolean
  showActivityGuide: boolean

  // 게임 진행 상태
  currentMission: SplashType | null
  gamePhase: GamePhase
  selectedSolution: CleaningToolType
  sprayCount: number

  // 진행도 상태
  sprayEffects: Record<SplashType, boolean>
  cleaningProgress: Record<SplashType, number>
  completedMissions: Record<SplashType, boolean>
  wipingProgress: Record<SplashType, number>

  // 마우스 상태
  mouseVelocity: number
  lastMousePosition: { x: number; y: number }
}

export interface GameActions {
  setIsAnimating: (value: boolean) => void
  setIsZoomed: (value: boolean) => void
  setShowIntro: (value: boolean) => void
  setShowMessage: (value: string) => void
  setClickMessage: (value: string) => void
  setWrongMessageShown: (value: boolean) => void
  setIsBathroomLightOn: (value: boolean) => void
  setShowActivityGuide: (value: boolean) => void
  setCurrentMission: (value: SplashType | null) => void
  setGamePhase: (value: GamePhase) => void
  setSelectedSolution: (value: CleaningToolType) => void
  setSprayCount: (value: number) => void
  setSprayEffects: React.Dispatch<React.SetStateAction<Record<SplashType, boolean>>>
  setCleaningProgress: React.Dispatch<React.SetStateAction<Record<SplashType, number>>>
  setCompletedMissions: React.Dispatch<React.SetStateAction<Record<SplashType, boolean>>>
  setWipingProgress: React.Dispatch<React.SetStateAction<Record<SplashType, number>>>
  setMouseVelocity: (value: number) => void
  setLastMousePosition: (value: { x: number; y: number }) => void
}

export const useGameState = (): [GameState, GameActions] => {
  // UI 상태
  const [isAnimating, setIsAnimating] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showMessage, setShowMessage] = useState<string>('')
  const [showClickMessage, setClickMessage] = useState<string>('')
  const [wrongMessageShown, setWrongMessageShown] = useState(false)
  const [isBathroomLightOn, setIsBathroomLightOn] = useState(false)
  const [showActivityGuide, setShowActivityGuide] = useState(false)

  // 게임 진행 상태
  const [currentMission, setCurrentMission] = useState<SplashType | null>(null)
  const [gamePhase, setGamePhase] = useState<GamePhase>('selection')
  const [selectedSolution, setSelectedSolution] = useState<CleaningToolType>(null)
  const [sprayCount, setSprayCount] = useState(0)

  // 진행도 상태
  const [sprayEffects, setSprayEffects] = useState<Record<SplashType, boolean>>({
    splash01: false,
    splash02: false,
    splash03: false,
    splash04: false,
  })

  const [cleaningProgress, setCleaningProgress] = useState<Record<SplashType, number>>({
    splash01: 0,
    splash02: 0,
    splash03: 0,
    splash04: 0,
  })

  const [completedMissions, setCompletedMissions] = useState<Record<SplashType, boolean>>({
    splash01: false,
    splash02: false,
    splash03: false,
    splash04: false,
  })

  const [wipingProgress, setWipingProgress] = useState<Record<SplashType, number>>({
    splash01: 0,
    splash02: 0,
    splash03: 0,
    splash04: 0,
  })

  // 마우스 상태
  const [mouseVelocity, setMouseVelocity] = useState(0)
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 })

  const gameState: GameState = {
    isAnimating,
    isZoomed,
    showIntro,
    showMessage,
    showClickMessage,
    wrongMessageShown,
    isBathroomLightOn,
    showActivityGuide,
    currentMission,
    gamePhase,
    selectedSolution,
    sprayCount,
    sprayEffects,
    cleaningProgress,
    completedMissions,
    wipingProgress,
    mouseVelocity,
    lastMousePosition,
  }


  const gameActions: GameActions = {
    setIsAnimating,
    setIsZoomed,
    setShowIntro,
    setShowMessage,
    setClickMessage,
    setWrongMessageShown,
    setIsBathroomLightOn,
    setShowActivityGuide,
    setCurrentMission,
    setGamePhase,
    setSelectedSolution,
    setSprayCount,
    setSprayEffects,
    setCleaningProgress,
    setCompletedMissions,
    setWipingProgress,
    setMouseVelocity,
    setLastMousePosition,
  }

  return [gameState, gameActions]
}
