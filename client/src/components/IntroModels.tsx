import React, { useRef } from 'react'
import AnimatedModel from '../components/AnimatedModel'
import IntroModelController from './IntroModelController'
import * as THREE from 'three'

function IntroModels() {
  const boyGroupRef = useRef<THREE.Group>(null)
  const muscleGroupRef = useRef<THREE.Group>(null)
  const boneGroupRef = useRef<THREE.Group>(null)

  return (
    <>
      {/* 모델 회전 컨트롤러 */}
      <IntroModelController
        enabled={true}
        rotationSensitivity={0.3}
        smoothing={0.08}
        maxRotationAngle={Math.PI / 6}
        boyGroupRef={boyGroupRef}
        muscleGroupRef={muscleGroupRef}
        boneGroupRef={boneGroupRef}
        autoRotation={true}
        autoRotationSpeed={0.3}
      />

      <group ref={boyGroupRef} rotation={[0, Math.PI / 4, 0]}>
        <AnimatedModel
          url='/models/Anatomy/Boy_Pose.gltf'
          animIndex={0}
          scale={0.4}
          position={[-0.2, -0.3, 0]}
          loop={true}
          removeMuscleLayer={false}
        />
      </group>

      <group ref={muscleGroupRef} rotation={[0, -Math.PI / 4, 0]}>
        <AnimatedModel
          url='/models/Anatomy/Muscle_Pose.gltf'
          animIndex={0}
          scale={0.004}
          position={[0.2, -0.3, 0]}
          loop={true}
          removeMuscleLayer={false}
        />
      </group>

      <group ref={boneGroupRef} rotation={[0, 0, 0]}>
        <AnimatedModel
          url='/models/Anatomy/Bone_Pose.gltf'
          animIndex={0}
          scale={0.0043}
          position={[0, -0.3, 0]}
          loop={true}
          removeMuscleLayer={false}
        />
      </group>
    </>
  )
}

export default IntroModels