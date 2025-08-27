import { useRef } from 'react'
import * as THREE from 'three'
import { SplashType, missions, initialCamera } from '../../types/6-1-1'
import { GameState, GameActions } from './GameStateManager'

export const useCameraController = (gameState: GameState, gameActions: GameActions) => {
  const controlsRef = useRef<any>()

  const moveToTarget = (
    targetPosition: [number, number, number],
    cameraPosition: [number, number, number],
    missionId: SplashType,
  ) => {
    if (controlsRef.current && !gameState.isAnimating) {
      gameActions.setIsAnimating(true)
      gameActions.setIsZoomed(true)
      gameActions.setCurrentMission(missionId)
      if (gameState.completedMissions[missionId]) {
        gameActions.setGamePhase('completed')
      } else {
        gameActions.setGamePhase('solution_choice')
      }

      const startTarget = controlsRef.current.target.clone()
      const startPosition = controlsRef.current.object.position.clone()
      const endTarget = new THREE.Vector3(...targetPosition)
      const endPosition = new THREE.Vector3(...cameraPosition)

      let progress = 0
      const duration = 1000
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        progress = Math.min(elapsed / duration, 1)
        const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

        controlsRef.current.target.lerpVectors(startTarget, endTarget, easeProgress)
        controlsRef.current.object.position.lerpVectors(startPosition, endPosition, easeProgress)
        controlsRef.current.update()

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          gameActions.setIsAnimating(false)

          if (gameState.completedMissions[missionId]) {
            const completedMessages = {
              splash01:
                '도마 청소가 완료되었습니다.',
              splash02:
                '유리창 청소가 완료되었습니다.',
              splash03:
                '변기 청소가 완료되었습니다.',
              splash04:
                '욕실 청소가 완료되었습니다.',
            }
            gameActions.setShowMessage(completedMessages[missionId])
          } else {
            gameActions.setShowMessage(missions[missionId].selectMessage)
            gameActions.setClickMessage(missions[missionId].showClickMessage)
          }

          if (missionId === 'splash03' || missionId === 'splash04') {
            gameActions.setIsBathroomLightOn(true)
          }
        }
      }

      animate()
    }
  }

  const resetCamera = () => {
    if (controlsRef.current && !gameState.isAnimating) {
      gameActions.setIsAnimating(true)

      if (gameState.currentMission) {
        // 완료된 미션이 아닐 때만 wipingProgress와 sprayEffects 리셋
        if (!gameState.completedMissions[gameState.currentMission]) {
          gameActions.setWipingProgress((prev) => ({
            ...prev,
            [gameState.currentMission!]: 0,
          }))

          gameActions.setSprayEffects((prev) => ({
            ...prev,
            [gameState.currentMission!]: false,
          }))
        }
      }

      gameActions.setMouseVelocity(0)
      gameActions.setIsBathroomLightOn(false)
      gameActions.setWrongMessageShown(false)

      const startTarget = controlsRef.current.target.clone()
      const startPosition = controlsRef.current.object.position.clone()
      const endTarget = new THREE.Vector3(...initialCamera.target)
      const endPosition = new THREE.Vector3(...initialCamera.position)

      let progress = 0
      const duration = 1000
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        progress = Math.min(elapsed / duration, 1)
        const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

        controlsRef.current.target.lerpVectors(startTarget, endTarget, easeProgress)
        controlsRef.current.object.position.lerpVectors(startPosition, endPosition, easeProgress)
        controlsRef.current.update()

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          gameActions.setIsAnimating(false)
          gameActions.setIsZoomed(false)
          gameActions.setCurrentMission(null)
          gameActions.setGamePhase('selection')
          gameActions.setSelectedSolution(null)
          gameActions.setSprayCount(0)
          gameActions.setShowMessage('')
        }
      }

      animate()
    }
  }

  return {
    controlsRef,
    moveToTarget,
    resetCamera,
  }
}
