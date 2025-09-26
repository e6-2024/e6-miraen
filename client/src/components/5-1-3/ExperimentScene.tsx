// components/5-1-3/ExperimentScene.tsx
import { OrbitControls, Environment, Lightformer, PerformanceMonitor, useGLTF } from '@react-three/drei'
import { useState, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ORBIT_CONTROLS_CONFIG } from '@/utils/5-1-3/utils'

interface GLBModel {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
}

interface ExperimentSceneProps {
  experimentStarted: boolean
  onNarrationComplete?: () => void
  onBeakerSelected?: (beaker: 'left' | 'right') => void
}

export function ExperimentScene({ experimentStarted, onNarrationComplete, onBeakerSelected }: ExperimentSceneProps) {
  // models
  const model0 = useGLTF('/models/5-1-3/0.glb') as GLBModel
  const spoonLeftModel = useGLTF('/models/5-1-3/Spoon_left.glb') as GLBModel
  const spoonRightModel = useGLTF('/models/5-1-3/Spoon_right.glb') as GLBModel

  const { camera, gl } = useThree()

  const [perfSucks, degrade] = useState(false)
  const [currentModel, setCurrentModel] = useState<GLBModel | null>(null)
  const [currentSpoonModel, setCurrentSpoonModel] = useState<GLBModel | null>(null)
  const [hoveredBeaker, setHoveredBeaker] = useState<'a' | 'a001' | null>(null)
  const [beakersActive, setBeakersActive] = useState(false)
  const [selectedBeaker, setSelectedBeaker] = useState<'left' | 'right' | null>(null)

  const beakerARef = useRef<THREE.Object3D>(null)
  const beakerA001Ref = useRef<THREE.Object3D>(null)

  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const spoonMixerRef = useRef<THREE.AnimationMixer | null>(null)

  const isDraggingRef = useRef(false)
  const selectingRef = useRef(false)

  // start → set model, enable beakers after narration time
  useEffect(() => {
    if (!experimentStarted) return
    setCurrentModel(model0)

    const timer = setTimeout(() => {
      setBeakersActive(true)
      onNarrationComplete?.()
    }, 5000)

    return () => clearTimeout(timer)
  }, [experimentStarted, model0, onNarrationComplete])

  // play base model clips once
  useEffect(() => {
    if (!currentModel?.animations?.length) return

    mixerRef.current?.stopAllAction()
    mixerRef.current = new THREE.AnimationMixer(currentModel.scene)

    currentModel.animations.forEach((clip) => {
      const action = mixerRef.current!.clipAction(clip)
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
    })

    return () => {
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
    }
  }, [currentModel])

  // play spoon clips once
  useEffect(() => {
    if (!currentSpoonModel?.animations?.length) return

    spoonMixerRef.current?.stopAllAction()
    spoonMixerRef.current = new THREE.AnimationMixer(currentSpoonModel.scene)

    currentSpoonModel.animations.forEach((clip) => {
      const action = spoonMixerRef.current!.clipAction(clip)
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
    })

    // 선택 락 해제(간단 타임아웃) — 필요 시 mixer 'finished' 이벤트로 대체 가능
    selectingRef.current = true
    const unlock = setTimeout(() => (selectingRef.current = false), 1500)

    return () => {
      clearTimeout(unlock)
      spoonMixerRef.current?.stopAllAction()
    }
  }, [currentSpoonModel])

  // find & clone materials for blink/restore
  useEffect(() => {
    if (!currentModel) return

    currentModel.scene.traverse((child) => {
      if (child.name === 'Beaker_a') {
        beakerARef.current = child
      } else if (child.name === 'Beaker_a001') {
        beakerA001Ref.current = child
      }

      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true

        if (Array.isArray(mesh.material)) {
          ;(mesh.material as THREE.Material[]) = (mesh.material as THREE.Material[]).map((m) => {
            const c = m.clone()
            ;(c as any).userData ||= {}
            ;(c as any).userData.__orig ||= {
              transparent: c.transparent,
              opacity: (c as any).opacity ?? 1,
              depthWrite: c.depthWrite,
              depthTest: c.depthTest,
              side: c.side,
            }
            return c
          })
        } else if (mesh.material) {
          const c: any = (mesh.material as THREE.Material).clone()
          c.userData ||= {}
          c.userData.__orig ||= {
            transparent: c.transparent,
            opacity: c.opacity ?? 1,
            depthWrite: c.depthWrite,
            depthTest: c.depthTest,
            side: c.side,
          }
          mesh.material = c
        }
      }
    })
  }, [currentModel])

  // pointer raycast (canvas element 리스너) — 드래그 보호 포함
  useEffect(() => {
    const el = gl.domElement
    if (!el) return

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const getPointer = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
    }

    const onMove = (e: PointerEvent) => {
      if (!beakersActive) return
      getPointer(e)

      let next: 'a' | 'a001' | null = null
      if (beakerARef.current) {
        const hitA = raycaster.intersectObject(beakerARef.current, true).length > 0
        if (hitA) next = 'a'
      }
      if (!next && beakerA001Ref.current) {
        const hitA001 = raycaster.intersectObject(beakerA001Ref.current, true).length > 0
        if (hitA001) next = 'a001'
      }
      setHoveredBeaker(next)
    }

    const onDown = (e: PointerEvent) => {
      if (!beakersActive || isDraggingRef.current || selectingRef.current) return
      getPointer(e)

      if (beakerARef.current) {
        const hitA = raycaster.intersectObject(beakerARef.current, true).length > 0
        if (hitA) {
          setSelectedBeaker('left')
          setCurrentSpoonModel(spoonLeftModel)
          onBeakerSelected?.('left')
          return
        }
      }
      if (beakerA001Ref.current) {
        const hitA001 = raycaster.intersectObject(beakerA001Ref.current, true).length > 0
        if (hitA001) {
          setSelectedBeaker('right')
          setCurrentSpoonModel(spoonRightModel)
          onBeakerSelected?.('right')
          return
        }
      }
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerdown', onDown)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onDown)
    }
  }, [beakersActive, camera, gl, onBeakerSelected, spoonLeftModel, spoonRightModel])

  // mixers + blink in one useFrame
  useFrame((state, delta) => {
    mixerRef.current?.update(delta)
    spoonMixerRef.current?.update(delta)

    const t = state.clock.getElapsedTime()
    const blinkV = 0.8 + Math.sin(t * 6) * 0.2

    const setOpacity = (m: any, next: number) => {
      if (m.opacity !== next) {
        m.opacity = next
        m.needsUpdate = true
      }
    }

    const applyBlink = (mesh: THREE.Mesh, v: number) => {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const m of mats as any[]) {
        const o = m?.userData?.__orig
        if (!o) continue
        m.transparent = true
        setOpacity(m, THREE.MathUtils.clamp((o.opacity ?? 1) * v, 0, 1))
        m.depthWrite = false
      }
    }

    const restore = (mesh: THREE.Mesh) => {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const m of mats as any[]) {
        const o = m?.userData?.__orig
        if (!o) continue
        m.transparent = o.transparent
        setOpacity(m, o.opacity)
        m.depthWrite = o.depthWrite
        m.depthTest = o.depthTest
        m.side = o.side
      }
    }

    const paint = (root: THREE.Object3D | null, fn: (mesh: THREE.Mesh) => void) => {
      if (!root) return
      root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) fn(child as THREE.Mesh)
      })
    }

    if (beakersActive && hoveredBeaker === 'a') {
      paint(beakerARef.current, (m) => applyBlink(m, blinkV))
      paint(beakerA001Ref.current, restore)
    } else if (beakersActive && hoveredBeaker === 'a001') {
      paint(beakerA001Ref.current, (m) => applyBlink(m, blinkV))
      paint(beakerARef.current, restore)
    } else {
      paint(beakerARef.current, restore)
      paint(beakerA001Ref.current, restore)
    }
  })

  return (
    <>
      <PerformanceMonitor onDecline={() => degrade(true)} />
      <Environment
        frames={perfSucks ? 1 : Infinity}
        preset='studio'
        resolution={perfSucks ? 128 : 256}
        background={false}
        blur={perfSucks ? 0.5 : 1}>
        <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
        <group rotation={[Math.PI / 2, 1, 0]}>
          <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
          <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[50, 2, 1]} />
        </group>
        <Lightformer
          intensity={5}
          form='ring'
          color='white'
          rotation-y={Math.PI / 2}
          position={[1, 1, 1]}
          scale={[4, 4, 1]}
        />
      </Environment>

      {experimentStarted && currentModel && !currentSpoonModel &&(
        <primitive object={currentModel.scene} scale={0.5} position={[0, -1, 0]} />
      )}

      {currentSpoonModel && <primitive object={currentSpoonModel.scene} scale={0.5} position={[0, -1, 0]} />}

      <OrbitControls
        {...ORBIT_CONTROLS_CONFIG}
        onStart={() => (isDraggingRef.current = true)}
        onEnd={() => (isDraggingRef.current = false)}
      />
    </>
  )
}

// 미리 로딩
useGLTF.preload('/models/5-1-3/0.glb')
useGLTF.preload('/models/5-1-3/Spoon_left.glb')
useGLTF.preload('/models/5-1-3/Spoon_right.glb')
