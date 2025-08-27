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
  selectedSolution?: string | null
  currentMission?: string | null
  gamePhase?: string
  triggerSpray?: boolean
  onAnimationComplete?: () => void
  mousePosition?: { x: number; y: number }
  screenSize?: { width: number; height: number }
}

const WIPING_TOOL_CONFIG = {
  splash01: {
    toolNames: ['Tower_Cutting_board'],
    basePosition: null as THREE.Vector3 | null,
    moveRange: { x: 0.3, y: 0 },
    baseOffset: { x: 0, y: 0, z: -0.1 },
  },
  splash02: {
    toolNames: ['Tower_Window'],
    basePosition: null as THREE.Vector3 | null,
    moveRange: { x: 1, y: 1 },
    baseOffset: { x: 0, y: 0, z: -0.5 },
  },
  splash03: {
    toolNames: ['Toilet_Brush'],
    basePosition: null as THREE.Vector3 | null,
    moveRange: { x: 0.4, y: 0.4 },
    baseOffset: { x: 0.5, y: 0, z: 0 },
  },
  splash04: {
    toolNames: ['Bathroom_Scrub'],
    basePosition: null as THREE.Vector3 | null,
    moveRange: { x: 0.5, y: 0 },
    baseOffset: { x: 0, y: 0, z: 0 },
  }
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
  splash03_bleach: [27,28,45,46],
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
  mousePosition = { x: 0, y: 0 },
  screenSize = { width: window.innerWidth, height: window.innerHeight }
}: ModelProps) => {
  const gltf = useGLTF('/models/6-1-1/New_Clean_Room/New_Room.gltf')
  const { actions, names } = useAnimations(gltf.animations, gltf.scene)
  
  const modelRef = useRef<THREE.Group>(null)
  const sprayColor = new THREE.Color(sprayColorHex)
  const currentAnimationRef = useRef<THREE.AnimationAction | null>(null)
  const lastTriggerRef = useRef(false)
  const runningActionsRef = useRef<THREE.AnimationAction[]>([])
  
  const wipingToolsRef = useRef<{
    [key: string]: THREE.Object3D | null
  }>({
    splash01: null,
    splash02: null,
    splash03: null,
    splash04: null
  })

  const animationKey = useMemo(() => {
    if (!currentMission || !selectedSolution) return null
    return `${currentMission}_${selectedSolution}`
  }, [currentMission, selectedSolution])

  const normalizedMousePos = useMemo(() => {
    const x = (mousePosition.x / screenSize.width) * 2 - 1 
    const y = -(mousePosition.y / screenSize.height) * 2 + 1
    return { x, y }
  }, [mousePosition, screenSize])

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

  const findWipingTools = useCallback(() => {
    if (!gltf.scene) return

    gltf.scene.traverse((child) => {
      Object.entries(WIPING_TOOL_CONFIG).forEach(([mission, config]) => {
        config.toolNames.forEach((toolName) => {
          if (child.name === toolName || child.name.includes(toolName)) {
            wipingToolsRef.current[mission] = child
            
            if (!config.basePosition) {
              // 원래 위치에 baseOffset을 더한 값을 basePosition으로 설정
              config.basePosition = new THREE.Vector3(
                child.position.x + config.baseOffset.x,
                child.position.y + config.baseOffset.y,
                child.position.z + config.baseOffset.z
              )
              
              // 도구를 즉시 새로운 basePosition으로 이동
              child.position.copy(config.basePosition)
            }
            
            console.log(`Found wiping tool for ${mission}: ${child.name}`, 
                       `Original: (${child.position.x}, ${child.position.y}, ${child.position.z})`,
                       `With offset: (${config.basePosition.x}, ${config.basePosition.y}, ${config.basePosition.z})`)
          }
        })
      })
    })
  }, [gltf.scene])

  useEffect(() => {
    if (gltf.scene) {
      findWipingTools()
      configureShadows(gltf.scene)
    }
  }, [gltf.scene, findWipingTools])

  const playAnimationSequence = useCallback((animationIndices: number[]) => {
    if (!actions || animationIndices.length === 0) return

    runningActionsRef.current.forEach(action => action.stop())
    runningActionsRef.current = []

    const runningActions: THREE.AnimationAction[] = []
    let completedCount = 0

    animationIndices.forEach((currentIndex) => {
      const animationName = names[currentIndex]
      
      if (animationName && actions[animationName]) {
        const action = actions[animationName]
        action.reset()
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.play()
        
        runningActions.push(action)

        const onFinished = () => {
          action.getMixer().removeEventListener('finished', onFinished)
          completedCount += 1
          
          if (completedCount >= animationIndices.length) {
            runningActionsRef.current = []
            onAnimationComplete?.()
          }
        }
        action.getMixer().addEventListener('finished', onFinished)
      }
    })

    runningActionsRef.current = runningActions
    currentAnimationRef.current = runningActions[0] 
  }, [actions, names, onAnimationComplete])

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

  useFrame((state, delta) => {
    if (!currentMission || gamePhase !== 'wiping') return

    const wipingTool = wipingToolsRef.current[currentMission]
    const config = WIPING_TOOL_CONFIG[currentMission]
    
    if (!wipingTool || !config || !config.basePosition) return
    
    const mouseOffsetX = normalizedMousePos.x * config.moveRange.x
    const mouseOffsetY = normalizedMousePos.y * config.moveRange.y
    
    const targetPosition = new THREE.Vector3(
      config.basePosition.x,
      config.basePosition.y + mouseOffsetY,
      config.basePosition.z - mouseOffsetX
    )
    
    wipingTool.position.lerp(targetPosition, delta * 8)
    
  })

  return (
    <group ref={modelRef} scale={scale} position={position} dispose={null}>
      <primitive object={gltf.scene} scale={1.0} position={[0, -5, 0]} rotation={[0, 0, 0]} castShadow receiveShadow />
    </group>
  )
}

useGLTF.preload('/models/6-1-1/New_Clean_Room/New_Room.gltf')