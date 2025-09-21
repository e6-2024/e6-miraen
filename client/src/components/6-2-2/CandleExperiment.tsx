import { useEffect, useRef, useState, useCallback } from 'react'
import { useGLTF, useCursor, Environment, OrbitControls } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CandleLight } from './CandleLight'
import { Flame } from './Flame'
import { ExperimentPhase } from '@/types/6-2-2/types'
import { EXPERIMENT_CONFIG } from '@/utils/6-2-2/utils'

interface CandleExperimentProps {
  experimentStarted: boolean
  experimentFinished: boolean
  onExperimentFinished: () => void
  onPhaseChange: (phase: ExperimentPhase) => void
}

interface GLBModel {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
}

export function CandleExperiment({
  experimentStarted,
  experimentFinished,
  onExperimentFinished,
  onPhaseChange,
}: CandleExperimentProps) {
  // Load all GLB files
  const model0 = useGLTF('/models/6-2-2/0.glb') as GLBModel
  const model1 = useGLTF('/models/6-2-2/1.glb') as GLBModel
  const model2 = useGLTF('/models/6-2-2/2.glb') as GLBModel
  const model3 = useGLTF('/models/6-2-2/3.glb') as GLBModel

  const { camera, gl } = useThree()

  const rightCupRef = useRef<THREE.Object3D>(null)
  const leftCupRef = useRef<THREE.Object3D>(null)
  const oxygenButtonRef = useRef<THREE.Object3D>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  const [showFlame, setShowFlame] = useState(false)
  const [leftFlameOpacity, setLeftFlameOpacity] = useState(1)
  const [leftFlameScale, setLeftFlameScale] = useState(1)

  const [rightFlameOpacity, setRightFlameOpacity] = useState(1)
  const [rightFlameScale, setRightFlameScale] = useState(1)
  const [hovered, setHovered] = useState(false)
  const [experimentPhase, setExperimentPhase] = useState<ExperimentPhase>('selectingCup')
  const [currentModel, setCurrentModel] = useState<GLBModel>(model0)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useCursor(hovered)

  // Setup animation mixer for current model
  useEffect(() => {
    if (currentModel.animations && currentModel.animations.length > 0) {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
      mixerRef.current = new THREE.AnimationMixer(currentModel.scene)

      // Play all animations in the current model
      currentModel.animations.forEach((clip) => {
        const action = mixerRef.current!.clipAction(clip)
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.play()
      })
    }
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
    }
  }, [currentModel])

  // Animation loop
  useEffect(() => {
    const clock = new THREE.Clock()
    const animate = () => {
      if (mixerRef.current) mixerRef.current.update(clock.getDelta())
      requestAnimationFrame(animate)
    }
    animate()
    console.log(experimentPhase)
  }, [])

  // Reset experiment
  useEffect(() => {
    if (!experimentStarted) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
      setShowFlame(false)
      setLeftFlameOpacity(1)
      setLeftFlameScale(1)

      setRightFlameOpacity(1)
      setRightFlameScale(1)
      setExperimentPhase('selectingCup')
      setHovered(false)
      setCurrentModel(model0)
      camera.position.set(...EXPERIMENT_CONFIG.cameraPositions.initial)
    }
  }, [experimentStarted, camera, model0])

  // Start experiment
  useEffect(() => {
    if (experimentStarted && experimentPhase === 'selectingCup') {
      // Already in selectingCup phase, just ensure we're using the right model
      setCurrentModel(model0)
      onPhaseChange('selectingCup')
    }
  }, [experimentStarted, experimentPhase, onPhaseChange, model0])

  // Find interactive objects in current model
  useEffect(() => {
    currentModel.scene.traverse((child) => {
      if (child.name === 'Acryl_Cup1') {
        rightCupRef.current = child
        // Clone materials for right cup
        child.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh
            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map((m: any) => {
                const c = m.clone()
                if (!c.userData.__orig) {
                  c.userData.__orig = {
                    transparent: c.transparent,
                    opacity: c.opacity ?? 1,
                    depthWrite: c.depthWrite,
                    depthTest: c.depthTest,
                    side: c.side,
                  }
                }
                return c
              })
            } else if (mesh.material) {
              const c: any = (mesh.material as THREE.Material).clone()
              if (!c.userData.__orig) {
                c.userData.__orig = {
                  transparent: c.transparent,
                  opacity: c.opacity ?? 1,
                  depthWrite: c.depthWrite,
                  depthTest: c.depthTest,
                  side: c.side,
                }
              }
              mesh.material = c
            }
          }
        })
      } else if (child.name === 'Acryl_Cup') {
        leftCupRef.current = child
        // Clone materials for left cup
        child.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh
            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map((m: any) => {
                const c = m.clone()
                if (!c.userData.__orig) {
                  c.userData.__orig = {
                    transparent: c.transparent,
                    opacity: c.opacity ?? 1,
                    depthWrite: c.depthWrite,
                    depthTest: c.depthTest,
                    side: c.side,
                  }
                }
                return c
              })
            } else if (mesh.material) {
              const c: any = (mesh.material as THREE.Material).clone()
              if (!c.userData.__orig) {
                c.userData.__orig = {
                  transparent: c.transparent,
                  opacity: c.opacity ?? 1,
                  depthWrite: c.depthWrite,
                  depthTest: c.depthTest,
                  side: c.side,
                }
              }
              mesh.material = c
            }
          }
        })
      } else if (
        child.name === 'Oxygen_spray_button' ||
        child.name.includes('button') ||
        child.name.includes('Button')
      ) {
        oxygenButtonRef.current = child
      }

      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    currentModel.scene.position.set(0, -1, 0)
  }, [currentModel])

  const handleLeftCupClick = () => {
    if (experimentPhase !== 'selectingCup') return
    setExperimentPhase('oxygenCanAppearing')
    setCurrentModel(model1)
    onPhaseChange('oxygenCanAppearing')

    timeoutRef.current = setTimeout(() => {
      setExperimentPhase('oxygenSupply')
      onPhaseChange('oxygenSupply')
    }, 2000)
  }

  const handleOxygenButtonClick = () => {
    if (experimentPhase !== 'oxygenSupply') return
    setExperimentPhase('oxygenSupplying')
    setCurrentModel(model2)
    onPhaseChange('oxygenSupplying')

    timeoutRef.current = setTimeout(() => {
      setExperimentPhase('oxygenCanDisappearing')
      onPhaseChange('oxygenCanDisappearing')

      timeoutRef.current = setTimeout(() => {
        setExperimentPhase('cameraTrackOut')
        onPhaseChange('cameraTrackOut')

        const startPos = camera.position.clone()
        const targetPos = new THREE.Vector3(...EXPERIMENT_CONFIG.cameraPositions.trackOut)
        let progress = 0

        const trackOut = () => {
          progress += 0.02
          if (progress <= 1) {
            camera.position.lerpVectors(startPos, targetPos, progress)
            requestAnimationFrame(trackOut)
          } else {
            setExperimentPhase('readyToCover')
            onPhaseChange('readyToCover')
          }
        }
        trackOut()
      }, 1000)
    }, 3000)
  }

  const handleCoverCandles = () => {
    if (experimentPhase !== 'readyToCover') return
    setExperimentPhase('covering')
    setCurrentModel(model3)
    onPhaseChange('covering')

    timeoutRef.current = setTimeout(() => {
      setExperimentPhase('burning')
      setShowFlame(true)
      onPhaseChange('burning')

      timeoutRef.current = setTimeout(() => {
        setExperimentPhase('leftOut')
        onPhaseChange('leftOut')

        let startTime = Date.now()
        const fadeDuration = 1000

        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / fadeDuration, 1)
          const remaining = 1 - progress
          setLeftFlameOpacity(remaining)
          setLeftFlameScale(remaining)

          if (progress === 1) {
            if (intervalRef.current) clearInterval(intervalRef.current)

            timeoutRef.current = setTimeout(() => {
              setExperimentPhase('rightOut')
              onPhaseChange('rightOut')

              let rightStartTime = Date.now()
              const rightFadeDuration = 1000

              intervalRef.current = setInterval(() => {
                const rightElapsed = Date.now() - rightStartTime
                const rightProgress = Math.min(rightElapsed / rightFadeDuration, 1)
                const rightRemaining = 1 - rightProgress
                setRightFlameOpacity(rightRemaining)
                setRightFlameScale(rightRemaining)

                if (rightProgress === 1) {
                  if (intervalRef.current) clearInterval(intervalRef.current)
                  setExperimentPhase('finished')
                  onPhaseChange('finished')
                  onExperimentFinished()
                }
              }, 16)
            }, 15000)
          }
        }, 16)
      }, 15000)
    }, 1000)
  }

  const handleCoverFromParent = useCallback(() => {
    if (experimentPhase === 'readyToCover') {
      handleCoverCandles()
    }
  }, [experimentPhase])

  useEffect(() => {
    ;(window as any).handleCoverCandles = handleCoverFromParent
    return () => {
      delete (window as any).handleCoverCandles
    }
  }, [handleCoverFromParent])

  // Mouse interaction handlers
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const bounds = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
      const y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
      const pointer = new THREE.Vector2(x, y)
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)

      if (experimentPhase === 'selectingCup' && leftCupRef.current) {
        const hitLeftCup = raycaster.intersectObject(leftCupRef.current, true).length > 0
        if (hitLeftCup) {
          handleLeftCupClick()
          return
        }
      }

      if (experimentPhase === 'oxygenSupply' && oxygenButtonRef.current) {
        const hitOxygenButton = raycaster.intersectObject(oxygenButtonRef.current, true).length > 0
        if (hitOxygenButton) {
          handleOxygenButtonClick()
          return
        }
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      const bounds = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
      const y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
      const pointer = new THREE.Vector2(x, y)
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)

      let shouldHover = false
      if (experimentPhase === 'selectingCup' && leftCupRef.current) {
        shouldHover = raycaster.intersectObject(leftCupRef.current, true).length > 0
      } else if (experimentPhase === 'oxygenSupply' && oxygenButtonRef.current) {
        shouldHover = raycaster.intersectObject(oxygenButtonRef.current, true).length > 0
      }

      setHovered(shouldHover)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [camera, gl, currentModel, experimentPhase])

  // Hover effect animation
  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    const applyBlink = (mesh: THREE.Mesh, v: number) => {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m: any) => {
        if (!m) return
        const o = m.userData?.__orig
        if (!o) return
        m.opacity = THREE.MathUtils.clamp((o.opacity ?? 1) * v, 0, 1)
        m.needsUpdate = true
      })
    }

    const restore = (mesh: THREE.Mesh) => {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m: any) => {
        const o = m?.userData?.__orig
        if (!o) return
        m.transparent = o.transparent
        m.opacity = o.opacity
        m.depthWrite = o.depthWrite
        m.depthTest = o.depthTest
        m.side = o.side
        m.needsUpdate = true
      })
    }

    if (experimentPhase === 'selectingCup' && hovered && leftCupRef.current) {
      const blink = 0.8 + Math.sin(t * 6) * 0.2
      leftCupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) applyBlink(child as THREE.Mesh, blink)
      })
    } else if (leftCupRef.current) {
      leftCupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) restore(child as THREE.Mesh)
      })
    }
  })

  return (
    <group>
      <primitive object={currentModel.scene} scale={5.0} position={[0, 0, 0]} />

      <Environment preset='city' />

      {showFlame && (
        <>
          <Flame
            position={EXPERIMENT_CONFIG.flamePositions.right}
            opacity={rightFlameOpacity}
            scale={rightFlameScale}
          />
          <CandleLight position={EXPERIMENT_CONFIG.flamePositions.right} opacity={rightFlameOpacity} />
          <Flame position={EXPERIMENT_CONFIG.flamePositions.left} opacity={leftFlameOpacity} scale={leftFlameScale} />
          <CandleLight position={EXPERIMENT_CONFIG.flamePositions.left} opacity={leftFlameOpacity} />
        </>
      )}

      <OrbitControls
        enabled={experimentPhase !== 'selectingCup'}
        maxDistance={40}
        minDistance={3}
        minAzimuthAngle={-Math.PI / 6}
        maxAzimuthAngle={Math.PI / 6}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />
    </group>
  )
}
