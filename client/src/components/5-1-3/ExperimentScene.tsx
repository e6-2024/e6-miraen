// components/5-1-3/ExperimentScene.tsx
import {
  OrbitControls,
  Environment,
  Lightformer,
  PerformanceMonitor,
  useGLTF,
  ContactShadows,
  AccumulativeShadows,
  RandomizedLight,
} from '@react-three/drei'
import { useState, useEffect, useCallback, useRef } from 'react'
import * as THREE from 'three'
import { ORBIT_CONTROLS_CONFIG } from '@/utils/5-1-3/utils'
import { SugarParticles } from './SugarParticles'
import { RealisticWater } from './RealisticWater'
import { ModelManager } from './ModelManager'
import { DiscRotationManager } from './DiscRotationManager'
import { BeakerHighlightManager } from './BeakerHighlightManager'
import { GlassStickManager } from './GlassStickManager'
import { TomatoDragManager } from './TomatoDragManager'
import { TomatoWipingManager } from './TomatoWipingManager'
import { DirectTomato } from './DirectTomato'
import { useNodeRefs } from '@/hook/5-1-3/useNodeRefs'
import { useExperimentState } from '@/hook/5-1-3/useExperimentState'
import { GLBRenderer } from './GLBRenderer'

interface GLBModel {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
}

interface ExperimentSceneProps {
  experimentStarted: boolean
  onNarrationComplete?: () => void
  onBeakerSelected?: (beaker: 'left' | 'right') => void
  onStickComplete?: (side: 'left' | 'right') => void
  onTomatoExperimentComplete?: (side: 'left' | 'right') => void
  resetToken?: number
}

export function ExperimentScene({
  experimentStarted,
  onNarrationComplete,
  onBeakerSelected,
  onStickComplete,
  onTomatoExperimentComplete,
  resetToken = 0,
}: ExperimentSceneProps) {
  const model0 = useGLTF('/models/5-1-3/0.glb') as GLBModel
  const spoonLeftModel = useGLTF('/models/5-1-3/Spoon_left.glb') as GLBModel
  const spoonRightModel = useGLTF('/models/5-1-3/Spoon_right.glb') as GLBModel

  const [perfSucks, degrade] = useState(false)
  const [currentModel, setCurrentModel] = useState<GLBModel | null>(null)
  const [currentSpoonModel, setCurrentSpoonModel] = useState<GLBModel | null>(null)
  const [hoveredBeaker, setHoveredBeaker] = useState<'a' | 'a001' | null>(null)
  const [beakersActive, setBeakersActive] = useState(false)

  const [tomatoExperimentActive, setTomatoExperimentActive] = useState(false)
  const [leftTomatoDropped, setLeftTomatoDropped] = useState(false)
  const [rightTomatoDropped, setRightTomatoDropped] = useState(false)
  const [leftTomatoPosition, setLeftTomatoPosition] = useState<[number, number, number]>([0, 0, 0])
  const [rightTomatoPosition, setRightTomatoPosition] = useState<[number, number, number]>([0, 0, 0])

  const [showTomatoWiping, setShowTomatoWiping] = useState(false)
  const [tomatoWipingAnimating, setTomatoWipingAnimating] = useState(false)

  const {
    selectedBeaker,
    setSelectedBeaker,
    leftSugarDropping,
    rightSugarDropping,
    discRotating,
    setDiscRotating,
    leftSpoonCount,
    rightSpoonCount,
    leftComplete,
    rightComplete,
    showGlassStick,
    glassStickAnimating,
    setGlassStickAnimating,
    selectingRef,
    lastSelectedSideRef,
    animationFinishedRef,
    startSugarExperiment,
    handleSpoonComplete,
    reset,
  } = useExperimentState()

  const { beakerARef, beakerA001Ref, discRef, sphereRef } = useNodeRefs(currentModel, currentSpoonModel)

  const [leftStickDissolved, setLeftStickDissolved] = useState(false)
  const [rightStickDissolved, setRightStickDissolved] = useState(false)

  const bothDone = leftStickDissolved && rightStickDissolved
  const startedSidesRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false })
  const spoonFinishFallbackRef = useRef<number | null>(null)

  useEffect(() => {
    if (!experimentStarted) return
    setCurrentModel(model0)
    const t = setTimeout(() => {
      setBeakersActive(false)
      onNarrationComplete?.()
    }, 300)
    return () => clearTimeout(t)
  }, [experimentStarted, model0, onNarrationComplete])

  useEffect(() => {
    const scenes: (THREE.Object3D | undefined)[] = [
      model0?.scene,
      currentModel?.scene,
      currentSpoonModel?.scene,
      spoonLeftModel?.scene,
      spoonRightModel?.scene,
    ]

    const bothDone = leftStickDissolved && rightStickDissolved
    const hideUntilDone = new Set(['Dish', 'Cherry_tomatos', 'Sketchfab_model'])
    const sugarbowlRegex = /sugar\s*bowl/i
    const cylinderRegex = /^cylinder$/i

    scenes.forEach((scene) => {
      if (!scene) return
      scene.traverse((obj) => {
        if (!obj.name) return
        if (hideUntilDone.has(obj.name)) {
          obj.visible = bothDone
        }
        if (sugarbowlRegex.test(obj.name)) {
          obj.visible = !bothDone
        }
        if (cylinderRegex.test(obj.name)) {
          obj.visible = !bothDone
        }
      })
    })
  }, [
    model0,
    currentModel,
    currentSpoonModel,
    spoonLeftModel,
    spoonRightModel,
    leftStickDissolved,
    rightStickDissolved,
  ])

  useEffect(() => {
    reset()
    setLeftTomatoDropped(false)
    setRightTomatoDropped(false)
    setLeftStickDissolved(false)
    setRightStickDissolved(false)
    setTomatoExperimentActive(false)
    setShowTomatoWiping(false)
    setTomatoWipingAnimating(false)
    setBeakersActive(false)
    setHoveredBeaker(null)
    ;(window as any).resetSphereOpacity?.()
    selectingRef.current = false
    lastSelectedSideRef.current = null
    animationFinishedRef.current = false
    startedSidesRef.current = { left: false, right: false }
    if (spoonFinishFallbackRef.current) {
      clearTimeout(spoonFinishFallbackRef.current)
      spoonFinishFallbackRef.current = null
    }

    setCurrentSpoonModel(null)
    setCurrentModel(model0)
  }, [resetToken, reset, model0, selectingRef, lastSelectedSideRef, animationFinishedRef])

  const handleAnimationFinished = useCallback(() => {
    animationFinishedRef.current = true
  }, [animationFinishedRef])

  const handleSpoonAnimationFinished = useCallback(() => {
    selectingRef.current = true
    const unlock = window.setTimeout(() => (selectingRef.current = false), 400)

    const side = lastSelectedSideRef.current
    if (side && !startedSidesRef.current[side]) {
      startedSidesRef.current[side] = true
      startSugarExperiment(side)
      if (spoonFinishFallbackRef.current) {
        clearTimeout(spoonFinishFallbackRef.current)
        spoonFinishFallbackRef.current = null
      }
    }
    return () => window.clearTimeout(unlock)
  }, [startSugarExperiment, lastSelectedSideRef, selectingRef])

  const handleSugarDissolved = useCallback(
    (side: 'left' | 'right') => {
      handleSpoonComplete(side)
    },
    [handleSpoonComplete],
  )

  const handleDiscRotationComplete = useCallback(() => {
    ;(window as any).resetSphereOpacity?.()
  }, [])

  const handleStickDissolved = useCallback(
    (side: 'left' | 'right') => {
      if (side === 'left') {
        setLeftStickDissolved(true)
        onStickComplete?.('left')
      } else {
        setRightStickDissolved(true)
        onStickComplete?.('right')
      }
    },
    [onStickComplete],
  )

  useEffect(() => {
    if (leftStickDissolved && rightStickDissolved && !tomatoExperimentActive) {
      setTomatoExperimentActive(true)
      setBeakersActive(false)
    }
  }, [leftStickDissolved, rightStickDissolved, tomatoExperimentActive])

  const handleTomatoDropped = useCallback(
    (beaker: 'left' | 'right', p: [number, number, number]) => {
      if (beaker === 'left') {
        setLeftTomatoDropped(true)
        setLeftTomatoPosition(p)
        onTomatoExperimentComplete?.('left')
      } else {
        setRightTomatoDropped(true)
        setRightTomatoPosition(p)
        onTomatoExperimentComplete?.('right')
      }
    },
    [onTomatoExperimentComplete],
  )

  const handleTomatoPickedUp = useCallback((beaker: 'left' | 'right') => {
    if (beaker === 'left') setLeftTomatoDropped(false)
    else setRightTomatoDropped(false)
    setShowTomatoWiping(true)
    setTomatoWipingAnimating(true)
  }, [])

  const handleWipingComplete = useCallback(() => {
    setShowTomatoWiping(false)
    setTomatoWipingAnimating(false)
  }, [])

  useEffect(() => {
    ;(window as any).prepareSugarSide = (side: 'left' | 'right') => {
      lastSelectedSideRef.current = side
      setSelectedBeaker(side)
      setCurrentSpoonModel(side === 'left' ? spoonLeftModel : spoonRightModel)
      onBeakerSelected?.(side)

      if (spoonFinishFallbackRef.current) clearTimeout(spoonFinishFallbackRef.current)
      spoonFinishFallbackRef.current = window.setTimeout(() => {
        if (!startedSidesRef.current[side]) {
          startedSidesRef.current[side] = true
          startSugarExperiment(side)
        }
      }, 2200)
    }
    return () => {
      delete (window as any).prepareSugarSide
    }
  }, [spoonLeftModel, spoonRightModel, startSugarExperiment, setSelectedBeaker, lastSelectedSideRef, onBeakerSelected])

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

      <ModelManager
        experimentStarted={experimentStarted}
        currentModel={currentModel}
        currentSpoonModel={currentSpoonModel}
        onAnimationFinished={handleAnimationFinished}
        onSpoonAnimationFinished={handleSpoonAnimationFinished}
        showTomatoWiping={showTomatoWiping}
      />

      {(currentModel || currentSpoonModel) && (
        <>
          {!bothDone && <GLBRenderer src='/models/5-1-3/sugar.glb' scale={0.5} position={[-0.7, -1, 0]} />}
          <RealisticWater position={[-2.15, -0.5, -0.2]} beakerRadius={0.57} waterLevel={0.9} />
          <RealisticWater
            position={rightSpoonCount >= 5 ? [2.34, -0.47, -0.2] : [2.34, -0.5, -0.2]}
            beakerRadius={0.57}
            waterLevel={rightSpoonCount >= 5 ? 0.95 : 0.9}
          />
        </>
      )}

      <DiscRotationManager
        discRef={discRef}
        sphereRef={sphereRef}
        discRotating={discRotating}
        setDiscRotating={setDiscRotating}
        animationFinishedRef={animationFinishedRef}
        onRotationComplete={handleDiscRotationComplete}
        leftSpoonCount={leftSpoonCount}
        rightSpoonCount={rightSpoonCount}
        selectedBeaker={selectedBeaker}
      />

      <BeakerHighlightManager
        beakersActive={beakersActive && !tomatoExperimentActive}
        hoveredBeaker={hoveredBeaker}
        beakerARef={beakerARef}
        beakerA001Ref={beakerA001Ref}
      />

      <GlassStickManager
        showGlassStick={showGlassStick}
        glassStickAnimating={glassStickAnimating}
        setGlassStickAnimating={setGlassStickAnimating}
        leftComplete={leftComplete}
        rightComplete={rightComplete}
        onDissolved={handleStickDissolved}
      />

      <TomatoWipingManager
        showTomatoWiping={showTomatoWiping}
        tomatoWipingAnimating={tomatoWipingAnimating}
        setTomatoWipingAnimating={setTomatoWipingAnimating}
        onWipingComplete={handleWipingComplete}
      />

      <TomatoDragManager
        tomatoActive={tomatoExperimentActive}
        currentModel={currentModel}
        currentSpoonModel={currentSpoonModel}
        beakerARef={beakerARef}
        beakerA001Ref={beakerA001Ref}
        onTomatoDropped={handleTomatoDropped}
        leftTomatoDropped={leftTomatoDropped}
        rightTomatoDropped={rightTomatoDropped}
        showTomatoWiping={showTomatoWiping}
      />

      {leftTomatoDropped && (
        <DirectTomato
          startPosition={leftTomatoPosition}
          sugarConcentration={leftSpoonCount * 2.1}
          beakerRadius={0.57}
          waterLevel={0.8}
          beakerPosition={[-2.15, -1.05, -0.2]}
          isDropped={true}
          maxRiseHeight={leftTomatoPosition[1] + 0.1}
          isDraggable={true}
          onPickedUp={() => handleTomatoPickedUp('left')}
        />
      )}

      {rightTomatoDropped && (
        <DirectTomato
          startPosition={rightTomatoPosition}
          sugarConcentration={rightSpoonCount * 4.2}
          beakerRadius={0.57}
          waterLevel={rightSpoonCount >= 4 ? 0.9 : 0.85}
          beakerPosition={[2.34, rightSpoonCount >= 4 ? -1.1 : -1.2, -0.2]}
          isDropped={true}
          maxRiseHeight={-0.45}
          isDraggable={true}
          onPickedUp={() => handleTomatoPickedUp('right')}
        />
      )}

      {leftSugarDropping && (
        <SugarParticles
          shouldDrop={true}
          sugarAmount={1.0}
          startPosition={[-2.26, 1.068, -0.22]}
          beakerId='LEFT'
          onAllDissolved={() => handleSugarDissolved('left')}
          spoonCount={leftSpoonCount}
        />
      )}
      {rightSugarDropping && (
        <SugarParticles
          shouldDrop={true}
          sugarAmount={1.0}
          startPosition={[2.42, 0.96, -0.22]}
          beakerId='RIGHT'
          onAllDissolved={() => handleSugarDissolved('right')}
          spoonCount={rightSpoonCount}
        />
      )}

      <OrbitControls
        makeDefault
        {...ORBIT_CONTROLS_CONFIG}
        onStart={() => (window as any).setDragging?.(true)}
        onEnd={() => (window as any).setDragging?.(false)}
      />

      <ContactShadows position={[0, -1, 0]} opacity={0.75} blur={2.0} />
      <AccumulativeShadows position={[0, -1, 0]} scale={50} color='#000' opacity={0.05} alphaTest={1} frames={60}>
        <RandomizedLight radius={0.5} ambient={0.21} intensity={1.5} position={[5, 3, 0]} />
      </AccumulativeShadows>
    </>
  )
}
