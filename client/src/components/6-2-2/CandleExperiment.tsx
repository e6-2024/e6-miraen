import { useEffect, useRef, useState, useCallback } from 'react'
import { useGLTF, useCursor, Environment, OrbitControls } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CandleLight } from './CandleLight'
import { Flame } from './Flame'
import { ExperimentPhase } from '@/types/6-2-2/types'
import { EXPERIMENT_CONFIG } from '@/utils/6-2-2/utils'
import CameraLogger from '@/hook/CameraLogger'
import { SpeechBubble } from '@/components/6-2-2/SpeechBubble'
import { SpeechBubble2 } from '@/components/6-2-2/SpeechBubble2'

interface CandleExperimentProps {
  experimentStarted: boolean
  experimentFinished: boolean
  onExperimentFinished: () => void
  onPhaseChange: (phase: ExperimentPhase) => void
  showIntro: boolean
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
  showIntro,
}: CandleExperimentProps) {
  const model0 = useGLTF('/models/6-2-2/0.glb') as GLBModel
  const model1 = useGLTF('/models/6-2-2/1.glb') as GLBModel
  const model2 = useGLTF('/models/6-2-2/2.glb') as GLBModel
  const model3 = useGLTF('/models/6-2-2/3.glb') as GLBModel

  const { camera, gl } = useThree()

  const rightCupRef = useRef<THREE.Object3D>(null)
  const leftCupRef = useRef<THREE.Object3D>(null)
  const oxygenButtonRef = useRef<THREE.Object3D>(null)
  const oxygenCanRef = useRef<THREE.Object3D>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const orbitControlsRef = useRef<any>(null)
  const specialMeshesRef = useRef<THREE.Object3D[]>([])

  const [showFlame, setShowFlame] = useState(true)
  const [leftFlameOpacity, setLeftFlameOpacity] = useState(1)
  const [leftFlameScale, setLeftFlameScale] = useState(1)

  const [rightFlameOpacity, setRightFlameOpacity] = useState(1)
  const [rightFlameScale, setRightFlameScale] = useState(1)
  const [hovered, setHovered] = useState(false)
  const [experimentPhase, setExperimentPhase] = useState<ExperimentPhase>('selectingCup')
  const [currentModel, setCurrentModel] = useState<GLBModel>(model0)
  const [oxygenCanOpacity, setOxygenCanOpacity] = useState(1)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useCursor(hovered)

  useEffect(() => {
    if (currentModel.animations && currentModel.animations.length > 0) {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
      mixerRef.current = new THREE.AnimationMixer(currentModel.scene)

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

  useEffect(() => {
    const clock = new THREE.Clock()
    const animate = () => {
      if (mixerRef.current) mixerRef.current.update(clock.getDelta())
      requestAnimationFrame(animate)
    }
    animate()
  }, [])

  useEffect(() => {
    if (!experimentStarted) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
      setShowFlame(true)
      setLeftFlameOpacity(1)
      setLeftFlameScale(1)

      setRightFlameOpacity(1)
      setRightFlameScale(1)
      setExperimentPhase('selectingCup')
      setHovered(false)
      setCurrentModel(model0)
      setOxygenCanOpacity(1)
      
      // oxygen_spray와 oxygen_spray_button 복구
      if (oxygenCanRef.current) {
        oxygenCanRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true
            mesh.visible = true
            
            // Material 복구
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            mats.forEach((m: any) => {
              if (m && m.userData?.__orig) {
                m.transparent = m.userData.__orig.transparent
                m.opacity = m.userData.__orig.opacity
                m.depthWrite = m.userData.__orig.depthWrite
                m.needsUpdate = true
              }
            })
          }
        })
      }
      
      if (oxygenButtonRef.current) {
        oxygenButtonRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true
            mesh.visible = true
            
            // Material 복구
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            mats.forEach((m: any) => {
              if (m && m.userData?.__orig) {
                m.transparent = m.userData.__orig.transparent
                m.opacity = m.userData.__orig.opacity
                m.depthWrite = m.userData.__orig.depthWrite
                m.needsUpdate = true
              }
            })
          }
        })
      }
      
      oxygenCanRef.current = null
      oxygenButtonRef.current = null
      specialMeshesRef.current = []
      camera.position.set(...EXPERIMENT_CONFIG.cameraPositions.initial)
      camera.lookAt(0, 0, 0)
    }
  }, [experimentStarted, camera, model0])

  useEffect(() => {
    if (experimentStarted && experimentPhase === 'selectingCup') {
      setCurrentModel(model0)
      onPhaseChange('selectingCup')
      camera.position.set(...EXPERIMENT_CONFIG.cameraPositions.initial)
      camera.lookAt(0, 0, 0)
    }
  }, [experimentStarted, experimentPhase, onPhaseChange, model0, currentModel])

  useEffect(() => {
    if (currentModel === model0 || currentModel === model1) {
      setOxygenCanOpacity(1)
    }
  }, [currentModel, model0, model1])

  useEffect(() => {
    // Clear previous special meshes
    specialMeshesRef.current = []

    currentModel.scene.traverse((child) => {
      // Find special meshes that should be hidden initially
      if (
        child.name === 'st_set_Hatthylla_ljus_penna_bok_matta_vaskapolySurface170' ||
        child.name === 'polySurface170'
      ) {
        specialMeshesRef.current.push(child)
        child.visible = false
      }

      if (child.name === 'Plane') {
        child.scale.set(200, 20, 20)
      }
      if (child.name === 'Acryl_Cup1') {
        rightCupRef.current = child
        child.renderOrder = 1
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
        child.renderOrder = 1
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
      } else if (child.name === 'Oxygen_spray_button') {
        oxygenButtonRef.current = child
        child.renderOrder = 10
        child.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh
            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map((m: any) => {
                const c = m.clone()
                c.transparent = true
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
              c.transparent = true
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
      } else if (child.name === 'Oxygen_spray') {
        oxygenCanRef.current = child
        child.renderOrder = 5
        if (currentModel === model3) {
          child.visible = false
        }
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
    setOxygenCanOpacity(1)

    timeoutRef.current = setTimeout(() => {
      setExperimentPhase('oxygenCanDisappearing')
      onPhaseChange('oxygenCanDisappearing')

      let startTime = Date.now()
      const fadeDuration = 1000

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / fadeDuration, 1)
        const remaining = 1 - progress
        setOxygenCanOpacity(remaining)

        if (progress === 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)

          timeoutRef.current = setTimeout(() => {
            setExperimentPhase('cameraTrackOut')
            onPhaseChange('cameraTrackOut')

            const startPos = camera.position.clone()
            const targetPos = new THREE.Vector3(...EXPERIMENT_CONFIG.cameraPositions.trackOut)

            const startLookAt = new THREE.Vector3(0, 0, 0)
            const targetLookAt = new THREE.Vector3(-5.8, -0.45, -2.5)

            let cameraProgress = 0

            const trackOut = () => {
              cameraProgress += 0.02
              if (cameraProgress <= 1) {
                camera.position.lerpVectors(startPos, targetPos, cameraProgress)

                const currentLookAt = new THREE.Vector3()
                currentLookAt.lerpVectors(startLookAt, targetLookAt, cameraProgress)

                if (orbitControlsRef.current) {
                  orbitControlsRef.current.target.copy(currentLookAt)
                  orbitControlsRef.current.update()
                }

                requestAnimationFrame(trackOut)
              } else {
                setExperimentPhase('readyToCover')
                onPhaseChange('readyToCover')
              }
            }
            trackOut()
          }, 500)
        }
      }, 16)
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

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (showIntro) return
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
      if (showIntro) return
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
  }, [camera, gl, currentModel, experimentPhase, showIntro])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // Control visibility of special meshes based on experimentPhase
    const shouldShowSpecialMeshes =
      experimentPhase === 'cameraTrackOut' ||
      experimentPhase === 'readyToCover' ||
      experimentPhase === 'covering' ||
      experimentPhase === 'burning' ||
      experimentPhase === 'leftOut' ||
      experimentPhase === 'rightOut' ||
      experimentPhase === 'finished'

    specialMeshesRef.current.forEach((mesh) => {
      mesh.visible = shouldShowSpecialMeshes
    })

    const applyBlink = (mesh: THREE.Mesh, v: number) => {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m: any) => {
        if (!m) return
        const o = m.userData?.__orig
        if (!o) return
        m.transparent = true
        m.opacity = THREE.MathUtils.clamp((o.opacity ?? 1) * v, 0, 1)
        m.depthWrite = false
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

    const applyOpacity = (mesh: THREE.Mesh, opacity: number) => {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m: any) => {
        if (!m) return
        const o = m.userData?.__orig
        if (!o) return
        m.transparent = true
        m.opacity = THREE.MathUtils.clamp((o.opacity ?? 1) * opacity, 0, 1)
        m.depthWrite = false
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

    if (experimentPhase === 'oxygenSupply' && hovered && oxygenButtonRef.current) {
      const blink = 0.8 + Math.sin(t * 6) * 0.2
      oxygenButtonRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) applyBlink(child as THREE.Mesh, blink)
      })
    }

    // oxygenSupplying 단계에서는 버튼만 흐리게 처리
    if (experimentPhase === 'oxygenSupplying' && oxygenButtonRef.current) {
      oxygenButtonRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          mats.forEach((m: any) => {
            if (!m) return
            m.transparent = true
            m.opacity = 0.3
            m.needsUpdate = true
          })
        }
      })
    }

    if (experimentPhase === 'oxygenCanDisappearing' || experimentPhase === 'readyToCover') {
      if (oxygenCanRef.current) {
        oxygenCanRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            applyOpacity(child as THREE.Mesh, oxygenCanOpacity)
            // 그림자 제어: opacity가 낮으면 그림자도 끄기
            const mesh = child as THREE.Mesh
            if (oxygenCanOpacity < 0.5) {
              mesh.castShadow = false
              mesh.receiveShadow = false
            }
          }
        })
      }
      
      // 버튼도 동일하게 처리
      if (oxygenButtonRef.current) {
        oxygenButtonRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            applyOpacity(child as THREE.Mesh, oxygenCanOpacity)
            const mesh = child as THREE.Mesh
            if (oxygenCanOpacity < 0.5) {
              mesh.castShadow = false
              mesh.receiveShadow = false
            }
          }
        })
      }
    }
  })

  // Determine if Flame should be visible based on experimentPhase
  const shouldShowFlame =
    showFlame &&
    (experimentPhase === 'cameraTrackOut' ||
      experimentPhase === 'readyToCover' ||
      experimentPhase === 'covering' ||
      experimentPhase === 'burning' ||
      experimentPhase === 'leftOut' ||
      experimentPhase === 'rightOut')

  return (
    <group>
      <primitive object={currentModel.scene} scale={5.0} position={[0, 0, 0]} />

      <Environment preset='city' />
      {shouldShowFlame && (
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
      {experimentPhase === 'oxygenSupply' && <SpeechBubble position={[10.2, 9.3, -2]} html='----- 버튼' />}
      {(experimentPhase === 'readyToCover' ||
        experimentPhase === 'covering' ||
        experimentPhase === 'burning' ||
        experimentPhase === 'leftOut' ||
        experimentPhase === 'finished' ||
        experimentPhase === 'rightOut') && (
        <SpeechBubble2 position={[-11, 5, 5]} html='산소를 공급하지 않은 아크릴 통' />
      )}
      {(experimentPhase === 'readyToCover' ||
        experimentPhase === 'covering' ||
        experimentPhase === 'burning' ||
        experimentPhase === 'leftOut' ||
        experimentPhase === 'finished' ||
        experimentPhase === 'rightOut') && <SpeechBubble2 position={[-3.5, 5, 5]} html='산소를 공급한 아크릴 통' />}

      <OrbitControls
        ref={orbitControlsRef}
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