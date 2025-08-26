import React, { useCallback, useEffect, useRef } from 'react'
import { OrbitControls, Environment, ContactShadows, PerformanceMonitor, useProgress } from '@react-three/drei'
import { Model } from './Model'
import { SpeechBubble } from './SpeechBubble'
import {
  VinegarTool,
  SprayTool,
  BleachTool,
  ToiletCleanerTool,
  GlassRagTool,
  ToiletBrushTool,
  BathroomScrubTool,
} from './CleaningTool'
import {
  CollisionSprayTool,
  CollisionVinegarTool,
  CollisionBleachTool,
  CollisionToiletCleanerTool,
  CollisionGlassRagTool,
  CollisionToiletBrushTool,
  CollisionBathroomScrubTool,
} from './CollisionAwareCleaningTool'
import { CollisionPlane } from './CollisionPlane'
import { CuttingBoardSmell } from './SmellPlane'
import { Toilet } from './Toilet'
import { CuttingBoard } from './CuttingBoardTool'
import { missions, solutionColors } from '../../types/6-1-1'
import { GameState } from './GameStateManager'
import * as THREE from 'three'
import CameraLogger from '@/hook/CameraLogger'
import AudioManager from './AudioManager'

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
  splashOpacities: {
    splash01: number
    splash02: number
    splash03: number
    splash04: number
  }
  isAudioManagerStarted?: boolean
}

export const GameScene: React.FC<GameSceneProps> = ({
  gameState,
  controlsRef,
  onLoadingComplete,
  onPerfDecline,
  onMissionClick,
  onSpray,
  splashOpacities,
  isAudioManagerStarted,
}) => {
  // 현재 재생중인 오디오들을 추적
  const currentAudiosRef = useRef<HTMLAudioElement[]>([])

  // isAudioManagerStarted 상태 변경시 모든 사운드 정지/재개
  useEffect(() => {
    if (isAudioManagerStarted) {
      // 모든 현재 재생중인 사운드 정지
      currentAudiosRef.current.forEach((audio) => {
        audio.pause()
      })
    }
  }, [isAudioManagerStarted])

  const playSound = useCallback(
    (path: string, volume = 0.5) => {
      // isAudioManagerStarted가 true면 사운드 재생하지 않음
      if (isAudioManagerStarted) {
        return
      }

      try {
        const audio = new Audio(path)
        audio.volume = volume

        // 현재 재생중인 오디오 목록에 추가
        currentAudiosRef.current.push(audio)

        // 재생 완료되면 목록에서 제거
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

  // 컴포넌트 언마운트시 모든 오디오 정리
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
        sprayColorHex={
          //창문에서만 사용되는 색상
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

      {/* <group renderOrder={-1}>
        <Toilet
          scale={1}
          position={[10.5, 5, 0.5]}
          splashOpacities={splashOpacities}
          sprayEffects={gameState.sprayEffects}
          wipingProgress={gameState.wipingProgress}
          sprayColorHex={activeColorHex}
        />
      </group> */}

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

      {/* Collision Planes for each mission */}
      {!gameState.showIntro && (
        <>
          <CollisionPlane
            position={missions.splash01.position}
            rotation={[-Math.PI / 2, 0, 0]}
            size={[4.0, 4.0]}
            missionId='splash01'
            visible={false}
          />

          <CollisionPlane
            position={[
              missions.splash01.position[0] - 0.5,
              missions.splash01.position[1] + 0.2,
              missions.splash01.position[2],
            ]}
            rotation={[Math.PI / 2, Math.PI / 2, 0]}
            size={[4.0, 4.0]}
            missionId='splash01'
            visible={false}
          />

          <CollisionPlane
            position={missions.splash02.position}
            rotation={[0, Math.PI / 2, 0]}
            size={[2.0, 2.5]}
            missionId='splash02'
            visible={false}
          />
          <CollisionPlane
            position={[
              missions.splash03.position[0],
              missions.splash03.position[1] - 0.5,
              missions.splash03.position[2],
            ]}
            rotation={[Math.PI / 2, 0, 0]}
            size={[2.0, 2.0]}
            missionId='splash03'
            visible={false}
          />
          <CollisionPlane
            position={[
              missions.splash04.position[0],
              missions.splash04.position[1] - 0.6,
              missions.splash04.position[2],
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
            size={[4.0, 4.0]}
            missionId='splash04'
            visible={false}
          />
        </>
      )}

      {gameState.gamePhase === 'spraying' && gameState.selectedSolution && (
        <>
          {gameState.selectedSolution === 'vinegar' && <CollisionVinegarTool visible={true} onSpray={onSpray} />}
          {gameState.selectedSolution === 'spray' && <CollisionSprayTool visible={true} onSpray={onSpray} />}
          {gameState.selectedSolution === 'toilet_cleaner' && (
            <CollisionToiletCleanerTool visible={true} onSpray={onSpray} />
          )}
          {gameState.selectedSolution === 'bleach' && <CollisionBleachTool visible={true} onSpray={onSpray} />}
        </>
      )}

      {/* 닦기 도구들 (충돌 감지 포함) */}
      {gameState.gamePhase === 'wiping' && gameState.currentMission && (
        <>
          {gameState.currentMission === 'splash02' && <CollisionGlassRagTool visible={true} />}
          {gameState.currentMission === 'splash03' && <CollisionToiletBrushTool visible={true} />}
          {gameState.currentMission === 'splash04' && <CollisionBathroomScrubTool visible={true} />}
        </>
      )}

      {/* 도마와 냄새 */}
      {!gameState.showIntro && (
        <>
          <CuttingBoardSmell
            position={missions.splash01.position}
            opacity={1 - gameState.cleaningProgress.splash01 / 100}
            enabled={true}
          />
          {/* <CuttingBoard
            position={missions.splash01.position}
            wipingProgress={gameState.wipingProgress.splash01}
            isInteractive={gameState.currentMission === 'splash01' && gameState.gamePhase === 'wiping'}
            sprayEffect={gameState.sprayEffects.splash01}
            isCompleted={gameState.completedMissions.splash01}
            sprayColorHex={activeColorHex}
          /> */}
        </>
      )}

      {/* 미션 선택 버블들 */}
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
