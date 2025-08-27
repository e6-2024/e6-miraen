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
  resetTrigger?: number
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
    baseOffset: { x: 0, y: 0, z: -0.55 },
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
  },
}

const ANIMATION_INDEX_MAP: Record<string, number[]> = {
  splash01_vinegar: [18, 19, 20, 21, 22],
  splash01_spray: [29, 30],
  splash01_toilet_cleaner: [11, 12, 13],
  splash01_bleach: [14, 15, 16, 17],
  splash02_vinegar: [3, 4, 5],
  splash02_spray: [0, 1, 2],
  splash02_toilet_cleaner: [6, 7],
  splash02_bleach: [8, 9, 10],
  splash03_vinegar: [24, 25, 26],
  splash03_spray: [42, 43, 44],
  splash03_toilet_cleaner: [21, 22, 23],
  splash03_bleach: [27, 28, 45, 46],
  splash04_vinegar: [33, 34, 35],
  splash04_spray: [31, 32],
  splash04_toilet_cleaner: [37, 38, 39],
  splash04_bleach: [36, 40, 41, 42, 43, 44, 45],
}

const SOLUTION_BOTTLE_MAPPING = {
  splash01: {
    vinegar: ['Vinegar.001', 'Bottle.003', 'blinn1.001', 'Material.048'],
    spray: ['Material.045', 'Material_41.004', 'Material.046', 'Material.047', 'Material_41.004'],
    toilet_cleaner: ['Material.042', 'Material.043', 'JOY_BELACH:cap_2.001', 'Material.044'],
    bleach: ['JOY_BELACH:cap_2.001', 'Material.044'],
  },
  splash02: {
    vinegar: ['Vinegar.003', 'Bottle.003', 'blinn1.003', 'Material.039'],
    spray: ['Material.033', 'Material_41.003'],
    toilet_cleaner: ['Material.040'],
    bleach: ['JOY_BELACH:cap_2'],
  },
  splash03: {
    vinegar: ['Vinegar.004', 'Bottle.003', 'blinn1.004', 'Material.056'],
    spray: ['Material.060', 'Material_41.007', 'Material.061', 'Material.062'],
    toilet_cleaner: ['Material.054', 'Material.055'],
    bleach: ['JOY_BELACH:cap_2.005'],
  },
  splash04: {
    vinegar: ['Vinegar.002', 'Bottle.003', 'blinn1.002'],
    spray: ['Material.049', 'Material_41.005', 'Material_41.005'],
    toilet_cleaner: ['Material.052', 'Material.051'],
    bleach: ['JOY_BELACH:cap_2.002', 'Material.050'],
  },
}

const SPRAY_PLANE_MATERIALS = {
  splash01: ['Decal', 'Decal.005', 'Decal.006', 'Decal.007', 'Decal2', 'Decal2.001', 'Decal2.002', 'Decal.003', 'Decal.001', 'Spread', 'Decal2.003', 'Decal2.004', 'Decal2.005'],
  splash02: ['Decal', 'Decal.005', 'Decal.006', 'Decal.007', 'Decal2', 'Decal2.001', 'Decal2.002', 'Decal.003', 'Decal.001', 'Spread', 'Decal2.003', 'Decal2.004', 'Decal2.005'],
  splash03: ['Decal', 'Decal.005', 'Decal.006', 'Decal.007', 'Decal2', 'Decal2.001', 'Decal2.002', 'Decal.003', 'Decal.001', 'Spread', 'Decal2.003', 'Decal2.004', 'Decal2.005'],
  splash04: ['Decal', 'Decal.005', 'Decal.006', 'Decal.007', 'Decal2', 'Decal2.001', 'Decal2.002', 'Decal.003', 'Decal.001', 'Spread', 'Decal2.003', 'Decal2.004', 'Decal2.005'],
}

const DIRT_MATERIAL_MAPPING = {
  splash01: { objectName: 'Plane__10_001', materialName: 'M_BloodMaterialExample4.001' },
  splash02: { objectName: 'Int_Apt_01_Wall_01__14_1003', materialName: 'WindowsGlass.001' },
  splash03: [
    { objectName: 'Int_Apt_01_Wall_01__14_1004', materialName: 'Material.018' },
    { objectName: 'Int_Apt_01_Wall_01__14_1004', materialName: 'Material.019' },
  ],
  splash04: { objectName: 'Int_Apt_01_Wall_01__14_1007', materialName: 'Material.008' },
}

type MaterialSnapshot = {
  transparent: boolean
  opacity: number
  visible: boolean
  color?: number
  map?: THREE.Texture | null
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
  screenSize = { width: window.innerWidth, height: window.innerHeight },
  resetTrigger = 0,
}: ModelProps) => {
  const gltf = useGLTF('/models/6-1-1/New_Clean_Room/New_Room.gltf')
  const { actions, names } = useAnimations(gltf.animations, gltf.scene)

  const modelRef = useRef<THREE.Group>(null)
  const sprayColor = new THREE.Color(sprayColorHex)
  const currentAnimationRef = useRef<THREE.AnimationAction | null>(null)
  const lastTriggerRef = useRef(false)
  const runningActionsRef = useRef<THREE.AnimationAction[]>([])
  const lastResetTriggerRef = useRef(resetTrigger)
  const initialMaterialStateRef = useRef<Map<string, MaterialSnapshot>>(new Map())

  const wipingToolsRef = useRef<{ [key: string]: THREE.Object3D | null }>({
    splash01: null,
    splash02: null,
    splash03: null,
    splash04: null,
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
            if ((material as any).transparent && (material as any).opacity < 0.3) {
              child.castShadow = false
            }
          })
        }
      }
    })
  }

  const resetSprayPlanes = useCallback(() => {
    if (!gltf.scene) return
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial
        if ((material as any).name) {
          Object.values(SPRAY_PLANE_MATERIALS)
            .flat()
            .forEach((planeMat) => {
              if ((material as any).name.toLowerCase().includes(planeMat.toLowerCase())) {
                material.transparent = true
                material.opacity = 0.0
                ;(material as any).visible = true
                child.visible = true
                child.castShadow = false
                material.needsUpdate = true
              }
            })
        }
      }
    })
  }, [gltf.scene])

  const resetSolutionBottles = useCallback(() => {
    if (!gltf.scene) return
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial
        if ((material as any).name) {
          Object.values(SOLUTION_BOTTLE_MAPPING).forEach((solutions) => {
            Object.values(solutions).forEach((materialNames) => {
              materialNames.forEach((materialNamePattern) => {
                if ((material as any).name === materialNamePattern) {
                  ;(material as any).visible = false
                  child.visible = false
                  material.needsUpdate = true
                }
              })
            })
          })
        }
      }
    })
  }, [gltf.scene])

  const restoreAllMaterialsToInitial = useCallback(() => {
    if (!gltf.scene) return
    const store = initialMaterialStateRef.current
    if (store.size === 0) return
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((mat) => {
          const ms = mat as THREE.MeshStandardMaterial
          const key = `${child.uuid}::${ms.uuid}`
          const snap = store.get(key)
          if (!snap) return
          child.visible = snap.visible
          ms.transparent = snap.transparent
          ms.opacity = snap.opacity
          if ((ms as any).color && typeof snap.color === 'number') {
            ;(ms as any).color.setHex(snap.color)
          }
          ;(ms as any).map = snap.map ?? null
          ms.needsUpdate = true
          child.castShadow = castShadow
          child.receiveShadow = receiveShadow
        })
      }
    })
  }, [gltf.scene, castShadow, receiveShadow])

  useEffect(() => {
    if (!gltf.scene) return
    const store = initialMaterialStateRef.current
    if (store.size > 0) return
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((mat) => {
          const ms = mat as THREE.MeshStandardMaterial
          const key = `${child.uuid}::${ms.uuid}`
          store.set(key, {
            transparent: !!ms.transparent,
            opacity: ms.opacity ?? 1,
            visible: child.visible && (ms as any).visible !== false,
            color: (ms as any).color ? (ms as any).color.getHex() : undefined,
            map: (ms as any).map ?? null,
          })
        })
      }
    })
  }, [gltf.scene])

  useEffect(() => {
    if (resetTrigger !== lastResetTriggerRef.current) {
      restoreAllMaterialsToInitial()
      runningActionsRef.current.forEach((action) => action.stop())
      runningActionsRef.current = []
      currentAnimationRef.current = null
      resetSprayPlanes()
      resetSolutionBottles()
      lastResetTriggerRef.current = resetTrigger
    }
  }, [resetTrigger, restoreAllMaterialsToInitial, resetSprayPlanes, resetSolutionBottles])

  const findWipingTools = useCallback(() => {
    if (!gltf.scene) return
    gltf.scene.traverse((child) => {
      Object.entries(WIPING_TOOL_CONFIG).forEach(([mission, config]) => {
        config.toolNames.forEach((toolName) => {
          if (child.name === toolName || child.name.includes(toolName)) {
            wipingToolsRef.current[mission] = child
            if (!config.basePosition) {
              config.basePosition = new THREE.Vector3(
                child.position.x + config.baseOffset.x,
                child.position.y + config.baseOffset.y,
                child.position.z + config.baseOffset.z,
              )
              child.position.copy(config.basePosition)
            }
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

  const playAnimationSequence = useCallback(
    (animationIndices: number[]) => {
      if (!actions || animationIndices.length === 0) return
      runningActionsRef.current.forEach((action) => action.stop())
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
    },
    [actions, names, onAnimationComplete],
  )

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
      runningActionsRef.current.forEach((action) => action.stop())
      runningActionsRef.current = []
      currentAnimationRef.current = null
    }
  }, [gamePhase])

  useEffect(() => {
    if (!modelRef.current || !gltf.scene) return
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial
        if ((material as any).name) {
          const matName = (material as any).name
          Object.entries(SOLUTION_BOTTLE_MAPPING).forEach(([mission, solutions]) => {
            Object.entries(solutions).forEach(([solution, materialNames]) => {
              materialNames.forEach((materialNamePattern) => {
                if (matName === materialNamePattern) {
                  const isCurrentMissionAndSolution = currentMission === mission && selectedSolution === solution
                  if (isCurrentMissionAndSolution) {
                    material.transparent = true
                    material.opacity = 1.0
                    ;(material as any).visible = true
                    child.visible = true
                  } else {
                    ;(material as any).visible = false
                    child.visible = false
                  }
                  material.needsUpdate = true
                }
              })
            })
          })
        }
      }
    })
  }, [selectedSolution, currentMission, gltf.scene])

  useEffect(() => {
    if (!modelRef.current || !gltf.scene || !currentMission) return
    const currentSprayPlanes = SPRAY_PLANE_MATERIALS[currentMission as keyof typeof SPRAY_PLANE_MATERIALS]
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial
        if (
          (material as any).name &&
          currentSprayPlanes.some((planeMat) => (material as any).name.toLowerCase().includes(planeMat.toLowerCase()))
        ) {
          material.transparent = true
          ;(material as any).visible = true
          if (gamePhase === 'wiping' && selectedSolution) {
            const progress = wipingProgress?.[currentMission as keyof typeof wipingProgress] || 0
            const fadeOpacity = Math.max(0, 1.0 - progress / 100)
            material.opacity = fadeOpacity
            ;(material as any).visible = fadeOpacity > 0.01
          }
          material.needsUpdate = true
          child.castShadow = false
        }
      }
    })
  }, [gamePhase, currentMission, sprayEffects, wipingProgress, sprayColorHex, gltf.scene])

  useEffect(() => {
    if (!modelRef.current || !gltf.scene || !currentMission || !splashOpacities) return
    const currentOpacity = splashOpacities[currentMission as keyof typeof splashOpacities]
    const opacity = typeof currentOpacity === 'number' ? currentOpacity : 1.0
    if (currentMission === 'splash03') {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach((material) => {
            if ((material as any).name === 'Material.018') {
              const wipingProgressValue = wipingProgress?.splash03 || 0
              ;(material as any).transparent = false
              if (wipingProgressValue > 60) {
                ;(material as any).map = null
                ;(material as any).color.setHex(0xffffff)
                ;(material as any).opacity = 1.0
              }
              ;(material as any).needsUpdate = true
            }
          })
        }
      })
      return
    }
    const dirtConfig = DIRT_MATERIAL_MAPPING[currentMission as keyof typeof DIRT_MATERIAL_MAPPING]
    if (!dirtConfig) return
    const dirtConfigs = Array.isArray(dirtConfig) ? dirtConfig : [dirtConfig]
    dirtConfigs.forEach(({ objectName, materialName }) => {
      gltf.scene.traverse((child) => {
        if (child.name === objectName && child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach((material: THREE.Material) => {
            if ((material as any).name === materialName) {
              const stdMaterial = material as THREE.MeshStandardMaterial
              stdMaterial.transparent = true
              stdMaterial.opacity = opacity
              stdMaterial.needsUpdate = true
              if (opacity <= 0.01) {
                child.castShadow = false
              } else {
                child.castShadow = castShadow
              }
            }
          })
        }
      })
    })
  }, [splashOpacities?.[currentMission], currentMission, castShadow])

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
      config.basePosition.z - mouseOffsetX,
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
