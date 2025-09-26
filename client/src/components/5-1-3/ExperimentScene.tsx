import {
  OrbitControls,
  Environment,
  ContactShadows,
  Lightformer,
  PerformanceMonitor,
  AccumulativeShadows,
  RandomizedLight,
} from '@react-three/drei'
import { useState } from 'react'
import Model from './Model'
import { BaseModel } from './BaseModel'
import { Tomato } from './Tomato'
import { DirectTomato } from './DirectTomato'
import { Spoon } from './Spoon'
import { EXPERIMENT_CONFIGS, BASE_MODEL_CONFIG, ORBIT_CONTROLS_CONFIG, getSpoonRotation } from '@/utils/5-1-3/utils'
import { BeakerState, TomatoState, SpoonAnimationState } from '@/types/5-1-3/types'

interface ExperimentSceneProps {
  leftBeaker: BeakerState & {
    startExperiment: () => void
    stopExperiment: () => void
    reset: () => void
    handleSpoonDissolved: () => void
  }
  rightBeaker: BeakerState & {
    startExperiment: () => void
    stopExperiment: () => void
    reset: () => void
    handleSpoonDissolved: () => void
  }
  leftTomato: TomatoState & {
    dropTomato: () => void
    handleTomatoInWater: () => void
    reset: () => void
  }
  rightTomato: TomatoState & {
    dropTomato: () => void
    handleTomatoInWater: () => void
    reset: () => void
  }
  leftSpoon: SpoonAnimationState & {
    triggerAnimation: () => void
    cleanup: () => void
  }
  rightSpoon: SpoonAnimationState & {
    triggerAnimation: () => void
    cleanup: () => void
  }
  leftConcentration: number
  rightConcentration: number
}

export function ExperimentScene({
  leftBeaker,
  rightBeaker,
  leftTomato,
  rightTomato,
  leftSpoon,
  rightSpoon,
  leftConcentration,
  rightConcentration,
}: ExperimentSceneProps) {
  const [perfSucks, degrade] = useState(false)

  return (
    <>
      <PerformanceMonitor onDecline={() => degrade(true)} />
      <Environment frames={perfSucks ? 1 : Infinity} preset='studio' resolution={256} background={false} blur={1}>
        <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
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
      <ContactShadows position={[0, -0.59, 0]} opacity={0.9} scale={10} blur={1.5} far={2} color='black' frames={2} />
      <AccumulativeShadows frames={20} alphaTest={0.15} opacity={0.1} scale={20} position={[0, -0.59, 0]}>
        <RandomizedLight amount={4} radius={3} ambient={0.3} intensity={0.5} position={[0, 2, 0]} bias={0.001} />
      </AccumulativeShadows>

      <Model
        scale={EXPERIMENT_CONFIGS.left.beaker.scale}
        position={EXPERIMENT_CONFIGS.left.beaker.position}
        shouldDropSugar={leftBeaker.isDropping}
        sugarAmount={1}
        onAllDissolved={leftBeaker.handleSpoonDissolved}
        beakerId={EXPERIMENT_CONFIGS.left.beakerId}
        isCompleted={leftBeaker.isCompleted}
      />

      {leftBeaker.isCompleted && (
        <DirectTomato
          startPosition={EXPERIMENT_CONFIGS.left.tomato.startPosition}
          sugarConcentration={leftConcentration}
          beakerRadius={EXPERIMENT_CONFIGS.left.tomato.beakerRadius}
          waterLevel={EXPERIMENT_CONFIGS.left.tomato.waterLevel}
          beakerPosition={EXPERIMENT_CONFIGS.left.tomato.beakerPosition}
          isDropped={leftTomato.isDropped}
          onDrop={leftTomato.handleTomatoInWater}
          maxRiseHeight={EXPERIMENT_CONFIGS.left.tomato.maxRiseHeight}
          riseSpeed={EXPERIMENT_CONFIGS.left.tomato.riseSpeed}
          riseSpringStiffness={EXPERIMENT_CONFIGS.left.tomato.riseSpringStiffness}
          riseSpringDamping={EXPERIMENT_CONFIGS.left.tomato.riseSpringDamping}
        />
      )}

      <BaseModel scale={BASE_MODEL_CONFIG.scale} position={BASE_MODEL_CONFIG.position} />

      {!leftBeaker.isCompleted && (
        <Tomato
          scale={BASE_MODEL_CONFIG.scale}
          position={EXPERIMENT_CONFIGS.left.tomatoStatic.position}
          rotation={EXPERIMENT_CONFIGS.left.tomatoStatic.rotation}
        />
      )}
      {!rightBeaker.isCompleted && (
        <Tomato
          scale={BASE_MODEL_CONFIG.scale}
          position={EXPERIMENT_CONFIGS.right.tomatoStatic.position}
          rotation={EXPERIMENT_CONFIGS.right.tomatoStatic.rotation}
        />
      )}

      <Spoon
        scale={20}
        position={EXPERIMENT_CONFIGS.left.spoon.position}
        rotation={getSpoonRotation(EXPERIMENT_CONFIGS.left.spoon.baseRotation, leftSpoon.rotation)}
      />

      <Spoon
        scale={20}
        position={EXPERIMENT_CONFIGS.right.spoon.position}
        rotation={getSpoonRotation(EXPERIMENT_CONFIGS.right.spoon.baseRotation, rightSpoon.rotation)}
      />

      <Model
        scale={EXPERIMENT_CONFIGS.right.beaker.scale}
        position={EXPERIMENT_CONFIGS.right.beaker.position}
        shouldDropSugar={rightBeaker.isDropping}
        sugarAmount={1}
        onAllDissolved={rightBeaker.handleSpoonDissolved}
        beakerId={EXPERIMENT_CONFIGS.right.beakerId}
        isCompleted={rightBeaker.isCompleted}
      />

      <OrbitControls {...ORBIT_CONTROLS_CONFIG} />

      {rightBeaker.isCompleted && (
        <DirectTomato
          startPosition={EXPERIMENT_CONFIGS.right.tomato.startPosition}
          sugarConcentration={rightConcentration}
          beakerRadius={EXPERIMENT_CONFIGS.right.tomato.beakerRadius}
          waterLevel={EXPERIMENT_CONFIGS.right.tomato.waterLevel}
          beakerPosition={EXPERIMENT_CONFIGS.right.tomato.beakerPosition}
          isDropped={rightTomato.isDropped}
          onDrop={rightTomato.handleTomatoInWater}
          maxRiseHeight={EXPERIMENT_CONFIGS.right.tomato.maxRiseHeight}
          riseSpeed={EXPERIMENT_CONFIGS.right.tomato.riseSpeed}
          riseSpringStiffness={EXPERIMENT_CONFIGS.right.tomato.riseSpringStiffness}
          riseSpringDamping={EXPERIMENT_CONFIGS.right.tomato.riseSpringDamping}
        />
      )}
    </>
  )
}