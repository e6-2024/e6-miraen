import * as THREE from 'three'
import React, { useRef, useEffect, useMemo, useCallback } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

interface ModelProps {
  scale?: number
  position?: [number, number, number]
  splashOpacities?: {
    splash01: number
    splash02: number
    splash03: number
    splash04: number
  }
  sprayEffects?: {
    splash01: boolean
    splash02: boolean
    splash03: boolean
    splash04: boolean
  }
  wipingProgress?: {
    splash01: number
    splash02: number
    splash03: number
    splash04: number
  }
  castShadow?: boolean
  receiveShadow?: boolean
  doubleSide?: boolean
  sprayColorHex?: string
  // 새로운 애니메이션 관련 props
  selectedSolution?: string | null
  currentMission?: string | null
  gamePhase?: string
  triggerSpray?: boolean
  onAnimationComplete?: () => void
}

const ANIMATION_INDEX_MAP: Record<string, number[]> = {
  // splash01 (도마)
  splash01_vinegar: [18,19,20,21,22],
  splash01_spray: [29,30],
  splash01_toilet_cleaner: [11,12,13],
  splash01_bleach: [14,15,16,17],
  // splash02 (유리창)
  splash02_vinegar: [3,4,5],
  splash02_spray: [0,1,2],
  splash02_toilet_cleaner: [6,7],
  splash02_bleach: [8,9,10],
  // splash03 (변기)
  splash03_vinegar: [24,25,26],
  splash03_spray: [42,43,44],
  splash03_toilet_cleaner: [21,22,23],
  splash03_bleach: [27,28,45,46,47],
  // splash04 (욕실)
  splash04_vinegar: [33,34,35],
  splash04_spray: [31,32],
  splash04_toilet_cleaner: [37,38,39],
  splash04_bleach: [36,40,41,42,43,44,45],
}

export const Model = ({
  splashOpacities,
  sprayEffects,
  wipingProgress,
  scale = 1,
  position = [0, 0, 0],
  castShadow = true,
  receiveShadow = true,
  doubleSide = true,
  sprayColorHex = '#ffffff',
  selectedSolution,
  currentMission,
  gamePhase,
  triggerSpray = false,
  onAnimationComplete,
}: ModelProps) => {
  const gltf = useGLTF('/models/6-1-1/New_Clean_Room/New_Room.gltf')
  const { actions, names } = useAnimations(gltf.animations, gltf.scene)
  
  const modelRef = useRef<THREE.Group>(null)
  const sprayColor = new THREE.Color(sprayColorHex)
  const currentAnimationRef = useRef<THREE.AnimationAction | null>(null)
  const lastTriggerRef = useRef(false)
  const runningActionsRef = useRef<THREE.AnimationAction[]>([])

  const animationKey = useMemo(() => {
    if (!currentMission || !selectedSolution) return null
    return `${currentMission}_${selectedSolution}`
  }, [currentMission, selectedSolution])

  const configureShadows = (object: THREE.Object3D) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow
        child.receiveShadow = receiveShadow

        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach((material) => {
            if (material.transparent && material.opacity < 0.3) {
              child.castShadow = false
            }
          })
        }
      }
    })
  }

  // 애니메이션 재생 함수 (동시 재생)
  const playAnimationSequence = useCallback((animationIndices: number[]) => {
    if (!actions || animationIndices.length === 0) return

    // 기존 애니메이션들 정지
    runningActionsRef.current.forEach(action => action.stop())
    runningActionsRef.current = []

    const runningActions: THREE.AnimationAction[] = []
    let completedCount = 0

    // 모든 애니메이션을 동시에 시작
    animationIndices.forEach((currentIndex) => {
      const animationName = names[currentIndex]
      
      if (animationName && actions[animationName]) {
        const action = actions[animationName]
        action.reset()
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.play()
        
        runningActions.push(action)

        // 각 애니메이션의 완료 이벤트
        const onFinished = () => {
          action.getMixer().removeEventListener('finished', onFinished)
          completedCount += 1
          
          // 모든 애니메이션이 완료되면 콜백 호출
          if (completedCount >= animationIndices.length) {
            runningActionsRef.current = []
            onAnimationComplete?.()
          }
        }
        action.getMixer().addEventListener('finished', onFinished)
      }
    })

    // 현재 실행 중인 액션들을 저장
    runningActionsRef.current = runningActions
    currentAnimationRef.current = runningActions[0] // 첫 번째 액션을 대표로 저장
  }, [actions, names, onAnimationComplete])

  // 스프레이 트리거 감지 및 애니메이션 재생
  useEffect(() => {
    if (triggerSpray && !lastTriggerRef.current && animationKey && actions) {
      const animationIndices = ANIMATION_INDEX_MAP[animationKey]
      
      if (animationIndices && animationIndices.length > 0) {
        playAnimationSequence(animationIndices)
      }
    }
    lastTriggerRef.current = triggerSpray
  }, [triggerSpray, animationKey, actions, playAnimationSequence])

  useEffect(() => {
    if (gamePhase !== 'spraying') {
      runningActionsRef.current.forEach(action => action.stop())
      runningActionsRef.current = []
      currentAnimationRef.current = null
    }
  }, [gamePhase])

  useEffect(() => {
    if (modelRef.current && gltf.scene) {
      configureShadows(gltf.scene)
    }
  }, [gltf.scene, castShadow, receiveShadow])

  return (
    <group ref={modelRef} scale={scale} position={position} dispose={null}>
      <primitive object={gltf.scene} scale={1.0} position={[0, -5, 0]} rotation={[0, 0, 0]} castShadow receiveShadow />
    </group>
  )
}

useGLTF.preload('/models/6-1-1/New_Clean_Room/New_Room.gltf')