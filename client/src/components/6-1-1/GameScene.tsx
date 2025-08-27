import React, { useCallback, useEffect, useRef, useState } from 'react'
import { OrbitControls, Environment, ContactShadows, PerformanceMonitor, useProgress } from '@react-three/drei'
import { Model } from './Model'
import { SpeechBubble } from './SpeechBubble'
import { CuttingBoardSmell } from './SmellPlane'
import { missions, solutionColors } from '../../types/6-1-1'
import { GameState } from './GameStateManager'
import * as THREE from 'three'

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

interface GameSceneProps {
  gameState: GameState
  controlsRef: React.RefObject<any>
  onLoadingComplete: () => void
  onPerfDecline: () => void
  onMissionClick: (
    missionId: string,
    position: [number, number, number],
    cameraPosition: [number, number, number],
  ) => void
  onSpray: () => void
  onAnimationComplete?: () => void
  splashOpacities: {
    splash01: number
    splash02: number
    splash03: number
    splash04: number
  }
  isAudioManagerStarted?: boolean
  // 마우스 위치 정보를 받기 위한 props
  mousePosition?: { x: number; y: number }
  screenSize?: { width: number; height: number }
  // 추가: 리셋 트리거
  resetTrigger?: number
}

export const GameScene: React.FC<GameSceneProps> = ({
  gameState,
  controlsRef,
  onLoadingComplete,
  onPerfDecline,
  onMissionClick,
  onSpray,
  onAnimationComplete,
  splashOpacities,
  isAudioManagerStarted,
  mousePosition = { x: 0, y: 0 },
  screenSize = { width: window.innerWidth, height: window.innerHeight },
  resetTrigger = 0 // 추가
}) => {
  const currentAudiosRef = useRef<HTMLAudioElement[]>([])

  useEffect(() => {
    if (isAudioManagerStarted) {
      currentAudiosRef.current.forEach((audio) => {
        audio.pause()
      })
    }
  }, [isAudioManagerStarted])

  const playSound = useCallback(
    (path: string, volume = 0.5) => {
      if (isAudioManagerStarted) {
        return
      }

      try {
        const audio = new Audio(path)
        audio.volume = volume

        currentAudiosRef.current.push(audio)

        audio.addEventListener('ended', () => {
          const index = currentAudiosRef.current.indexOf(audio)
          if (index > -1) {
            currentAudiosRef.current.splice(index, 1)
          }
        })

        audio.play().catch(() => {})
      } catch (error) {}
    },
    [isAudioManagerStarted],
  )

  useEffect(() => {
    return () => {
      currentAudiosRef.current.forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      currentAudiosRef.current = []
    }
  }, [])

  const activeColorHex = solutionColors[gameState.selectedSolution ?? null]

  return (
    <>
      <LoadingTracker onLoadingComplete={onLoadingComplete} />

      <PerformanceMonitor onDecline={onPerfDecline} />

      <ContactShadows position={[0, 0, 0]} opacity={0.9} scale={30} blur={2.5} far={10} color='black' frames={2} />

      <Model
        scale={1}
        position={[0, 1.04, 0]}
        splashOpacities={splashOpacities}
        sprayEffects={gameState.sprayEffects}
        wipingProgress={gameState.wipingProgress}
        selectedSolution={gameState.selectedSolution}
        currentMission={gameState.currentMission}
        gamePhase={gameState.gamePhase}
        triggerSpray={gameState.selectedSolution !== null && gameState.currentMission !== null}
        onAnimationComplete={onAnimationComplete}
        mousePosition={mousePosition}
        screenSize={screenSize}
        resetTrigger={resetTrigger} // 리셋 트리거 전달
        sprayColorHex={
          gameState.selectedSolution === 'vinegar'
            ? '#ffa200'
            : gameState.selectedSolution === 'spray'
            ? '#006eff'
            : gameState.selectedSolution === 'toilet_cleaner'
            ? '#f1c3ff'
            : gameState.selectedSolution === 'bleach'
            ? '#65bef9'
            : activeColorHex
        }
      />

      {gameState.isBathroomLightOn && (
        <rectAreaLight
          width={4}
          height={0.5}
          intensity={5}
          castShadow
          color='#f0f5ff'
          position={[9, 3, 1.5]}
          rotation={[0, 0, 0]}
        />
      )}

      {!gameState.showIntro && (
        <>
          <CuttingBoardSmell
            position={missions.splash01.position}
            opacity={1 - gameState.cleaningProgress.splash01 / 100}
            enabled={true}
          />
        </>
      )}

      {!gameState.showIntro && gameState.gamePhase === 'selection' && (
        <>
          <SpeechBubble
            position={missions.splash01.position}
            html='도마 청소하기'
            onBubbleClick={() => {
              onMissionClick('splash01', missions.splash01.position, missions.splash01.cameraPosition)
              playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
            }}
          />

          <SpeechBubble
            position={missions.splash02.position}
            html='유리창 청소하기'
            onBubbleClick={() => {
              onMissionClick('splash02', missions.splash02.position, missions.splash02.cameraPosition)
              playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
            }}
          />

          <SpeechBubble
            position={missions.splash03.position}
            html='변기 청소하기'
            onBubbleClick={() => {
              onMissionClick('splash03', missions.splash03.position, missions.splash03.cameraPosition)
              playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
            }}
          />

          <SpeechBubble
            position={missions.splash04.position}
            html='욕실 청소하기'
            onBubbleClick={() => {
              onMissionClick('splash04', missions.splash04.position, missions.splash04.cameraPosition)
              playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
            }}
          />
        </>
      )}

      <OrbitControls
        ref={controlsRef}
        minPolarAngle={gameState.gamePhase === 'selection' ? -Math.PI / 12 : 0}
        maxPolarAngle={gameState.gamePhase === 'selection' ? Math.PI / 12 : Math.PI}
        minAzimuthAngle={gameState.gamePhase === 'selection' ? Math.PI - Math.PI / 12 : -Infinity}
        maxAzimuthAngle={gameState.gamePhase === 'selection' ? Math.PI + Math.PI / 12 : Infinity}
        enablePan={true}
        enableZoom={gameState.gamePhase === 'selection'}
        enableRotate={gameState.gamePhase === 'selection'}
        minDistance={0}
        maxDistance={30}
      />

      <directionalLight
        position={[5, 10, -5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.00001}
        shadow-normalBias={0.2}
        shadow-radius={2}
      />

      <Environment
        files='/img/cover/hdri.JPG'
        background={true}
        ground={{ height: 5, radius: 80, scale: 100 }}
        backgroundBlurriness={0.8}
        backgroundIntensity={0.7}
        environmentIntensity={0.8}
      />
    </>
  )
}