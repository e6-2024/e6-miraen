import { SplashType, CleaningToolType, missions, wipingEfficiency } from '../../types/6-1-1'
import { GameState, GameActions } from './GameStateManager'
import { useAudioManager } from './useAudioManager'

const sprayAudioBySolution: Partial<Record<CleaningToolType, string>> = {
  vinegar: '/sounds/6-1-1/6-1-1-7_slime-splatter-4-220263.mp3',
  spray: '/sounds/6-1-1/6-1-1-2_spray.MP3',
  bleach: '/sounds/6-1-1/6-1-1-7_slime-splatter-4-220263.mp3',
  toilet_cleaner: '/sounds/6-1-1/6-1-1-7_slime-splatter-4-220263.mp3',
}

export const useGameHandlers = (gameState: GameState, gameActions: GameActions) => {
  const audio = useAudioManager()

  const handleSolutionSelect = (solutionId: CleaningToolType) => {
    if (!gameState.currentMission) return

    audio.stopAllAudio()

    gameActions.setSelectedSolution(solutionId)
    gameActions.setShowMessage('')
    gameActions.setWrongMessageShown(false)
    gameActions.setWipingProgress((prev) => ({ ...prev, [gameState.currentMission!]: 0 }))

    gameActions.setSprayEffects((prev) => ({
      ...prev,
      [gameState.currentMission!]: false,
    }))
    gameActions.setGamePhase('spraying')
    gameActions.setSprayCount(1) 
  }

  const handleSpray = () => {
    if (gameState.gamePhase !== 'spraying' || !gameState.currentMission) return
    if (!gameState.selectedSolution) return

    const path = sprayAudioBySolution[gameState.selectedSolution] ?? '/sounds/6-1-1/6-1-1-2_spray.MP3'
    audio.playSound(path, 0.5)

    const newSprayCount = gameState.sprayCount + 1
    gameActions.setSprayCount(newSprayCount)
  }

  const handleAnimationComplete = () => {
    if (gameState.gamePhase === 'spraying' && gameState.currentMission) {
      gameActions.setSprayEffects((prev) => ({
        ...prev,
        [gameState.currentMission!]: true,
      }))
      gameActions.setGamePhase('wiping')
    }
  }

  const handleWiping = (mouseEvent?: MouseEvent) => {
    if (gameState.gamePhase !== 'wiping' || !gameState.currentMission) return

    if (mouseEvent) {
      const currentMousePos = { x: mouseEvent.clientX, y: mouseEvent.clientY }

      if (gameState.lastMousePosition.x === 0 && gameState.lastMousePosition.y === 0) {
        gameActions.setLastMousePosition(currentMousePos)
        return
      }

      const deltaX = currentMousePos.x - gameState.lastMousePosition.x
      const deltaY = currentMousePos.y - gameState.lastMousePosition.y
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      gameActions.setMouseVelocity(velocity)
      gameActions.setLastMousePosition(currentMousePos)

      if (velocity > 8) {
        audio.playWipingSound(gameState.currentMission, velocity)
      } else {
        audio.fadeWipingSound()
      }

      if (velocity < 8) return
    }

    const mission = missions[gameState.currentMission]

    if (gameState.selectedSolution === mission.correctSolution) {
      const efficiency = wipingEfficiency[gameState.currentMission]
      const baseProgress = efficiency.base
      const velocityBonus = Math.min(gameState.mouseVelocity * efficiency.bonus, efficiency.bonus * 3)
      const totalEfficiency = baseProgress + velocityBonus

      gameActions.setWipingProgress((prev) => {
        const newProgress = Math.min(100, prev[gameState.currentMission!] + totalEfficiency)

        if (newProgress >= 100 && prev[gameState.currentMission!] < 100) {
          audio.stopAllAudio()
          audio.playSound('/sounds/6-1-1/6-1-1-3_correct-356013.mp3', 0.5)

          gameActions.setSprayEffects((prevEffects) => ({
            ...prevEffects,
            [gameState.currentMission!]: false,
          }))

          gameActions.setCompletedMissions((prevCompleted) => {
            const newCompleted = { ...prevCompleted, [gameState.currentMission!]: true }

            if (Object.values(newCompleted).every((completed) => completed)) {
              setTimeout(() => {
                audio.playSound('/sounds/6-1-1/6-1-1-6_goodresult-82807.mp3', 0.2)
              }, 1000)
            }

            return newCompleted
          })

          const completionNarrations = {
            splash01: '/sounds/6-1-1/narration/6-1-1-B.MP3',
            splash02: '/sounds/6-1-1/narration/6-1-1-D.MP3',
            splash03: '/sounds/6-1-1/narration/6-1-1-F.MP3',
            splash04: '/sounds/6-1-1/narration/6-1-1-H.MP3',
          }

          const messages = {
            splash01: '염기성 물질인 비린내는 산성 용액인 식초와 만나면 성질이 변하여 제거됩니다.',
            splash02: '단백질 등으로 이루어진 얼룩은 염기성 물질인 유리 세정제와 만나면 성질이 변하여 제거됩니다.',
            splash03: '산성 용액인 변기용 세제로 변기를 청소하면 변기의 때가 성질이 변하여 제거됩니다.',
            splash04: '염기성 용액인 표백제로 욕실 바닥을 청소하면 욕실 바닥의 때가 성질이 변하여 제거됩니다.',
          }

          gameActions.setShowMessage(messages[gameState.currentMission!])
          gameActions.setGamePhase('completed')

          setTimeout(() => {
            audio.playNarration(completionNarrations[gameState.currentMission!])
          }, 1000)
        }

        return { ...prev, [gameState.currentMission!]: newProgress }
      })

      const increaseAmount = totalEfficiency * (1 + gameState.wipingProgress[gameState.currentMission] / 100)
      gameActions.setCleaningProgress((prev) => ({
        ...prev,
        [gameState.currentMission!]: Math.min(100, prev[gameState.currentMission!] + increaseAmount),
      }))
    } else {
      if (!gameState.wrongMessageShown) {
        gameActions.setWrongMessageShown(true)

        setTimeout(() => {
          gameActions.setShowMessage('용액을 다시 고르세요.')
          audio.playNarration('/sounds/6-1-1/narration/6-1-1-I.MP3')

          setTimeout(() => {
            audio.stopWipingAudio()

            gameActions.setGamePhase('solution_choice')
            gameActions.setSelectedSolution(null)
            gameActions.setSprayCount(0)
            gameActions.setShowMessage(missions[gameState.currentMission!].selectMessage)
            gameActions.setWrongMessageShown(false)
            gameActions.setWipingProgress((prev) => ({ ...prev, [gameState.currentMission!]: 0 }))

            gameActions.setSprayEffects((prev) => ({
              ...prev,
              [gameState.currentMission!]: false,
            }))
          }, 3000)
        }, 2000)
      }
    }
  }

  const restartCurrentMission = () => {
    if (!gameState.currentMission || gameState.isAnimating) return

    audio.stopAllAudio()

    gameActions.setCleaningProgress((prev) => ({ ...prev, [gameState.currentMission!]: 0 }))
    gameActions.setWipingProgress((prev) => ({ ...prev, [gameState.currentMission!]: 0 }))
    gameActions.setCompletedMissions((prev) => ({ ...prev, [gameState.currentMission!]: false }))
    gameActions.setSprayEffects((prev) => ({ ...prev, [gameState.currentMission!]: false }))

    gameActions.setSelectedSolution(null)
    gameActions.setSprayCount(1)
    gameActions.setMouseVelocity(0)
    gameActions.setWrongMessageShown(false)
    gameActions.setGamePhase('solution_choice')
    gameActions.setShowMessage('')

    setTimeout(() => {
      const narrationFiles = {
        splash01: '/sounds/6-1-1/narration/6-1-1-A.MP3',
        splash02: '/sounds/6-1-1/narration/6-1-1-C.MP3',
        splash03: '/sounds/6-1-1/narration/6-1-1-E.MP3',
        splash04: '/sounds/6-1-1/narration/6-1-1-G.MP3',
      }

      gameActions.setShowMessage(missions[gameState.currentMission!].selectMessage)
      audio.playNarration(narrationFiles[gameState.currentMission!])
    }, 300)
  }

  const resetMission = (missionId: SplashType) => {
    gameActions.setCleaningProgress((prev) => ({ ...prev, [missionId]: 0 }))
    gameActions.setWipingProgress((prev) => ({ ...prev, [missionId]: 0 }))
    gameActions.setCompletedMissions((prev) => ({ ...prev, [missionId]: false }))
    gameActions.setSprayEffects((prev) => ({ ...prev, [missionId]: false }))
  }

  return {
    handleSolutionSelect,
    handleSpray,
    handleAnimationComplete,
    handleWiping,
    restartCurrentMission,
    resetMission,
  }
}