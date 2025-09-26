// components/5-1-3/ExperimentScene.tsx
import { OrbitControls, Environment, Lightformer, PerformanceMonitor, useGLTF } from '@react-three/drei'
import { useState, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ORBIT_CONTROLS_CONFIG } from '@/utils/5-1-3/utils'
import { SugarParticles } from './SugarParticles'
import { RealisticWater } from './RealisticWater'

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

  // 설탕 파티클
  const [leftSugarDropping, setLeftSugarDropping] = useState(false)
  const [rightSugarDropping, setRightSugarDropping] = useState(false)

  // 디스크 회전 상태
  const [discRotating, setDiscRotating] = useState(false)

  // 참조들
  const beakerARef = useRef<THREE.Object3D>(null)
  const beakerA001Ref = useRef<THREE.Object3D>(null)
  const discRef = useRef<THREE.Object3D>(null)
  const sphereRef = useRef<THREE.Object3D>(null)

  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const spoonMixerRef = useRef<THREE.AnimationMixer | null>(null)
  const animationFinishedRef = useRef(false)

  const isDraggingRef = useRef(false)
  const selectingRef = useRef(false)
  const rotationRef = useRef(0)
  const waitIntervalRef = useRef<number | null>(null)
  const warnedRef = useRef(false)
  const lastSelectedSideRef = useRef<'left' | 'right' | null>(null)

  const initialRotationRef = useRef(0)
  const targetRotationRef = useRef(Math.PI)

  const getBase = () => currentModel?.scene || null
  const getSpoon = () => currentSpoonModel?.scene || null

  const findByName = (root: THREE.Object3D | null, name: string) =>
    (root?.getObjectByName(name) as THREE.Object3D | null) || null

  const refreshNodeRefs = () => {
    const base = getBase()
    const spoon = getSpoon()

    // 베이스 모델에서만 찾음
    beakerARef.current = findByName(base, 'Beaker_a')
    beakerA001Ref.current = findByName(base, 'Beaker_a001')

    // 숟가락 GLB에서만 찾음
    discRef.current = findByName(spoon, 'pDisc1')
    sphereRef.current = findByName(spoon, 'Sphere')
  }

  // 실험 시작시: 모델 로드 + 5초 후 비커 활성화
  useEffect(() => {
    if (!experimentStarted) return
    setCurrentModel(model0)

    const timer = window.setTimeout(() => {
      setBeakersActive(true)
      onNarrationComplete?.()
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [experimentStarted, model0, onNarrationComplete])

  // 메인 모델 애니메이션 세팅 (없으면 즉시 통과)
  useEffect(() => {
    if (!currentModel) return

    if (!currentModel.animations || currentModel.animations.length === 0) {
      animationFinishedRef.current = true
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
        mixerRef.current = null
      }
      return
    }

    mixerRef.current?.stopAllAction()
    mixerRef.current = new THREE.AnimationMixer(currentModel.scene)
    animationFinishedRef.current = false

    currentModel.animations.forEach((clip) => {
      const action = mixerRef.current!.clipAction(clip)
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
    })

    const onFinished = () => {
      animationFinishedRef.current = true
    }
    mixerRef.current.addEventListener('finished', onFinished)

    return () => {
      mixerRef.current?.removeEventListener('finished', onFinished)
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
    }
  }, [currentModel])

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

    selectingRef.current = true
    const unlock = window.setTimeout(() => (selectingRef.current = false), 1500)

    const onSpoonFinished = () => {
      if (lastSelectedSideRef.current) {
        startSugarExperiment(lastSelectedSideRef.current)
      }
    }
    spoonMixerRef.current.addEventListener('finished', onSpoonFinished)

    return () => {
      window.clearTimeout(unlock)
      spoonMixerRef.current?.removeEventListener('finished', onSpoonFinished)
      spoonMixerRef.current?.stopAllAction()
      spoonMixerRef.current = null
    }
  }, [currentSpoonModel])

  useEffect(() => {
    refreshNodeRefs()
    setDiscRotating(false)
    rotationRef.current = 0
  }, [currentModel, currentSpoonModel])

  const refSearchTries = useRef(0)
  useFrame(() => {
    if (
      (!beakerARef.current || !beakerA001Ref.current || !discRef.current || !sphereRef.current) &&
      refSearchTries.current < 30
    ) {
      refSearchTries.current += 1
      refreshNodeRefs()
    }
  })
  const startSugarExperiment = (side: 'left' | 'right') => {
    startDiscRotation()
    window.setTimeout(() => {
      if (side === 'left') setLeftSugarDropping(true)
      else setRightSugarDropping(true)
    }, 1000)
  }

  const startDiscRotation = () => {
    if (!animationFinishedRef.current) {
      if (waitIntervalRef.current !== null) return
      waitIntervalRef.current = window.setInterval(() => {
        if (animationFinishedRef.current) {
          if (waitIntervalRef.current !== null) {
            window.clearInterval(waitIntervalRef.current)
            waitIntervalRef.current = null
          }
          startActualDiscRotation()
        }
      }, 100)
      return
    }
    startActualDiscRotation()
  }

  const startActualDiscRotation = () => {
    if (!discRef.current) return

    setDiscRotating(true)

    // ✅ 현재 모델의 rotation.x/z 값을 기억해둠
    rotationRef.current = 0
    initialRotationRef.current = discRef.current.rotation.x // 또는 .z (축 확인!)
    targetRotationRef.current = initialRotationRef.current + Math.PI
  }

  useEffect(() => {
    ;(window as any).startLeftSugarExperiment = () => startSugarExperiment('left')
    ;(window as any).startRightSugarExperiment = () => startSugarExperiment('right')
    return () => {
      delete (window as any).startLeftSugarExperiment
      delete (window as any).startRightSugarExperiment
    }
  }, [])

  // 레이캐스트로 비커 hover/선택
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
          lastSelectedSideRef.current = 'left'
          setCurrentSpoonModel(spoonLeftModel)
          onBeakerSelected?.('left')
          return
        }
      }
      if (beakerA001Ref.current) {
        const hitA001 = raycaster.intersectObject(beakerA001Ref.current, true).length > 0
        if (hitA001) {
          setSelectedBeaker('right')
          lastSelectedSideRef.current = 'right'
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

  // 인터벌 정리
  useEffect(() => {
    return () => {
      if (waitIntervalRef.current !== null) {
        window.clearInterval(waitIntervalRef.current)
        waitIntervalRef.current = null
      }
    }
  }, [])

  // 프레임 업데이트: 믹서 + 디스크 회전 + 스피어 페이드 + 비커 하이라이트
  useFrame((state, delta) => {
    mixerRef.current?.update(delta)
    spoonMixerRef.current?.update(delta)

    if (discRotating && discRef.current) {
      rotationRef.current += delta * 3 // 회전 진행률
      const nextAngle = initialRotationRef.current + rotationRef.current

      discRef.current.rotation.x = Math.min(nextAngle, targetRotationRef.current)

      if (nextAngle >= targetRotationRef.current) {
        // ✅ 정확히 목표 각도에서 멈추기
        discRef.current.rotation.x = targetRotationRef.current
        setDiscRotating(false)
        if (sphereRef.current) sphereRef.current.visible = false
      }
    }

    // 비커 깜빡임(hover)
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

      {experimentStarted && currentModel && !currentSpoonModel && (
        <primitive object={currentModel.scene} scale={0.5} position={[-0.7, -1, 0]} />
      )}
      {(currentModel || currentSpoonModel) && (
        <>
          <RealisticWater position={[-2.15, -0.5, -0.2]} beakerRadius={0.57} waterLevel={0.9} />
          <RealisticWater position={[2.34, -0.5, -0.2]} beakerRadius={0.57} waterLevel={0.9} />
        </>
      )}
      {currentSpoonModel && (
        <>
          <primitive object={currentSpoonModel.scene} scale={0.5} position={[-0.7, -1, 0]} />
        </>
      )}

      {/* 설탕 파티클 */}
      {leftSugarDropping && (
        <SugarParticles shouldDrop={true} sugarAmount={1.0} startPosition={[-2.26, 1.068, -0.22]} beakerId='LEFT' />
      )}
      {rightSugarDropping && (
        <SugarParticles shouldDrop={true} sugarAmount={5.0} startPosition={[2.42, 0.96, -0.22]} beakerId='RIGHT' />
      )}

      <OrbitControls
        {...ORBIT_CONTROLS_CONFIG}
        onStart={() => (isDraggingRef.current = true)}
        onEnd={() => (isDraggingRef.current = false)}
      />
    </>
  )
}

useGLTF.preload('/models/5-1-3/0.glb')
useGLTF.preload('/models/5-1-3/Spoon_left.glb')
useGLTF.preload('/models/5-1-3/Spoon_right.glb')
