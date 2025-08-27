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
  // splash01 (도마)
  splash01_vinegar: [18, 19, 20, 21, 22],
  splash01_spray: [29, 30],
  splash01_toilet_cleaner: [11, 12, 13],
  splash01_bleach: [14, 15, 16, 17],
  // splash02 (유리창)
  splash02_vinegar: [3, 4, 5],
  splash02_spray: [0, 1, 2],
  splash02_toilet_cleaner: [6, 7],
  splash02_bleach: [8, 9, 10],
  // splash03 (변기)
  splash03_vinegar: [24, 25, 26],
  splash03_spray: [42, 43, 44],
  splash03_toilet_cleaner: [21, 22, 23],
  splash03_bleach: [27, 28, 45, 46],
  // splash04 (욕실)
  splash04_vinegar: [33, 34, 35],
  splash04_spray: [31, 32],
  splash04_toilet_cleaner: [37, 38, 39],
  splash04_bleach: [36, 40, 41, 42, 43, 44, 45],
}

const SOLUTION_BOTTLE_MAPPING = {
  splash01: {
    // 도마
    vinegar: [
      'Vinegar.001', // Mesh005 - 식초병 본체
      'Bottle.003', // Mesh005_1 - 병 재질
      'blinn1.001', // Mesh005_2, polySurface2005 - 뚜껑 등
      'Material.048', // Sphere003 - 관련 구체
    ],
    spray: [
      'Material.045', // SprayCleaner_Material_#41_0007 - 스프레이 본체
      'Material_41.004', // SprayCleaner_Material_#41_0007_1 - 스프레이 재질
      'Material.046', // Plane020 - 스프레이 라벨?
      'Material.047', // Plane020_1 - 스프레이 라벨?
      'Material_41.004', // SprayCleaner_Material_#41_0001 - 추가 스프레이 재질
    ],
    toilet_cleaner: [
      'Material.042', // Toilet_Bleach_Cutting_board - 변기세제 본체
      'Material.043', // Sphere001 - 관련 구체
      'JOY_BELACH:cap_2.001', // Bleach_body_Cutting_board, Bleach_opener_Cutting_board - 뚜껑
      'Material.044', // Sphere002 - 관련 구체
    ],
    bleach: [
      'JOY_BELACH:cap_2.001', // Bleach_body_Cutting_board, Bleach_opener_Cutting_board
      'Material.044', // Sphere002
    ],
  },
  splash02: {
    // 유리창
    vinegar: [
      'Vinegar.003', // Mesh008 - 식초병
      'Bottle.003', // Mesh008_1
      'blinn1.003',
      'Material.039', // Sphere
    ],
    spray: [
      'Material.033', // SprayCleaner_Material_#41_0004
      'Material_41.003', // SprayCleaner_Material_#41_0003
    ],
    toilet_cleaner: [
      'Material.040', // Toilet_Bleach_window
    ],
    bleach: [
      'JOY_BELACH:cap_2', // Bleach_body_window, Bleach_opener_window
    ],
  },
  splash03: {
    // 변기
    vinegar: [
      'Vinegar.004', // Mesh015
      'Bottle.003', // Mesh015_1
      'blinn1.004', // Mesh015_2, polySurface2010
      'Material.056', // Sphere007
    ],
    spray: [
      'Material.060', // SprayCleaner_Material_#41_0012
      'Material_41.007', // SprayCleaner_Material_#41_0012_1
      'Material.061', // Plane032
      'Material.062', // Plane032_1
    ],
    toilet_cleaner: [
      'Material.054', // Toilet_Bleach_Toilet
      'Material.055', // Sphere006
    ],
    bleach: [
      'JOY_BELACH:cap_2.005', // Bleach_body_toilet, Bleach_opener_toilet
    ],
  },
  splash04: {
    // 욕실 바닥
    vinegar: [
      'Vinegar.002', // Mesh011
      'Bottle.003', // Mesh011_1
      'blinn1.002', // Mesh011_2, polySurface2006
    ],
    spray: [
      'Material.049', // SprayCleaner_Material_#41_0008
      'Material_41.005', // SprayCleaner_Material_#41_0008_1
      'Material_41.005', // SprayCleaner_Material_#41_0006
    ],
    toilet_cleaner: [
      'Material.052', // Toilet_Bleach_BathroomFloor
      'Material.051', // Sphere005
    ],
    bleach: [
      'JOY_BELACH:cap_2.002', // polySurface2008, polySurface3002
      'Material.050', // Sphere004
    ],
  },
}

const SPRAY_PLANE_MATERIALS = {
  splash01: [],
  splash02: [],
  splash03: [],
  splash04: [],
}

// 더러운 부분 매핑 (정답 선택 시에만 사라져야 할 실제 더러운 부분)
const DIRT_MATERIAL_MAPPING = {
  splash01: {
    objectName: 'Plane__10_001', // 도마의 더러운 부분
    materialName: 'M_BloodMaterialExample4.001',
  },
  splash02: {
    objectName: 'Int_Apt_01_Wall_01__14_1003', // 유리창의 더러운 부분
    materialName: 'WindowsGlass.001',
  },
  splash03: [
    {
      objectName: 'Int_Apt_01_Wall_01__14_1004', // 변기의 더러운 부분들
      materialName: 'Material.018',
    },
    {
      objectName: 'Int_Apt_01_Wall_01__14_1004',
      materialName: 'Material.019',
    },
  ],
  splash04: {
    objectName: 'Int_Apt_01_Wall_01__14_1007', // 욕실의 더러운 부분
    materialName: 'Material.008',
  },
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

  // 용액 병 가시성 제어 로직
  useEffect(() => {
    if (!modelRef.current || !gltf.scene) return

    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial

        if (material.name) {
          const matName = material.name

          // 용액 병 가시성 제어
          Object.entries(SOLUTION_BOTTLE_MAPPING).forEach(([mission, solutions]) => {
            Object.entries(solutions).forEach(([solution, materialNames]) => {
              materialNames.forEach((materialNamePattern) => {
                if (matName === materialNamePattern) {
                  // 현재 미션이고 선택된 용액인 경우에만 보이게
                  const isCurrentMissionAndSolution = currentMission === mission && selectedSolution === solution

                  if (isCurrentMissionAndSolution) {
                    // 선택된 용액 병만 보이게
                    material.transparent = true
                    material.opacity = 1.0
                    material.visible = true
                    child.visible = true
                  } else {
                    // 선택되지 않은 용액 병들은 숨기기
                    material.visible = false
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

  // 용액 스프레이 효과 제어 (wiping 시 사라지는 용액 plane들)
  useEffect(() => {
    if (!modelRef.current || !gltf.scene || !currentMission) return

    const currentSprayPlanes = SPRAY_PLANE_MATERIALS[currentMission as keyof typeof SPRAY_PLANE_MATERIALS]

    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial

        if (
          material.name &&
          currentSprayPlanes.some((planeMat) => material.name.toLowerCase().includes(planeMat.toLowerCase()))
        ) {
          material.transparent = true
          // wiping 단계에서 용액 효과는 진행도에 따라 사라짐
          if (
            gamePhase === 'wiping' &&
            wipingProgress &&
            wipingProgress[currentMission as keyof typeof wipingProgress]
          ) {
            const progress = wipingProgress[currentMission as keyof typeof wipingProgress]
            const fadeOpacity = Math.max(0, 1.0 - progress / 100)
            material.opacity = fadeOpacity
            material.visible = fadeOpacity > 0.01
          } else if (sprayEffects && sprayEffects[currentMission as keyof typeof sprayEffects]) {
            // spraying 단계에서는 스프레이 효과가 보임
            material.opacity = 1.0
            material.visible = true
          } else {
            material.opacity = 0.0
            material.visible = false
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

    console.log(`Mission: ${currentMission}, Opacity: ${opacity}`)

    // splash03 특별 처리 - 더러운 재질만 제거하고 변기 모델은 유지
    if (currentMission === 'splash03') {
      let foundCount = 0

      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]

          materials.forEach((material, index) => {
            // 더러운 얼룩 재질만 타겟팅
            if (material.name === 'Material.018') {
              const wipingProgressValue = wipingProgress?.splash03 || 0
              material.transparent = false

              if (wipingProgressValue > 60) {
                material.map = null
                material.color.setHex(0xffffff)
                material.opacity = 1.0
              }
              material.needsUpdate = true
            }
          })
        }
      })

      console.log(`Splash03: ${foundCount}개의 더러운 재질을 업데이트`)
      return
    }

    // 다른 미션들은 기존 방식 사용
    const dirtConfig = DIRT_MATERIAL_MAPPING[currentMission as keyof typeof DIRT_MATERIAL_MAPPING]
    if (!dirtConfig) return

    const dirtConfigs = Array.isArray(dirtConfig) ? dirtConfig : [dirtConfig]

    dirtConfigs.forEach(({ objectName, materialName }) => {
      gltf.scene.traverse((child) => {
        if (child.name === objectName && child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]

          materials.forEach((material: THREE.Material) => {
            if (material.name === materialName) {
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
