import { useGLTF, Caustics } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useState, useRef } from 'react'
import * as THREE from 'three'
import { SugarParticles } from './SugarParticles'
import { RealisticWater } from './RealisticWater'

interface ModelProps extends GroupProps {
  isStirring?: boolean
  stirringSpeed?: number
  shouldDropSugar?: boolean
  sugarAmount?: number
  onAllDissolved?: () => void
  beakerId?: string
  isCompleted?: boolean
}

export default function Model({
  isStirring = false,
  stirringSpeed = 1,
  shouldDropSugar = false,
  sugarAmount = 1.0,
  onAllDissolved,
  beakerId = 'default',
  isCompleted = false,
  ...props
}: ModelProps) {
  const { scene } = useGLTF('models/Sugar/sugar.glb')
  const [filteredScene, setFilteredScene] = useState<THREE.Group | null>(null)
  const [beakerInfo, setBeakerInfo] = useState<{
    radius: number
    height: number
    position: THREE.Vector3
  } | null>(null)
  const groupRef = useRef<THREE.Group>(null!)
  const waterRef = useRef<THREE.Group>(null!)

  useEffect(() => {
    const newScene = new THREE.Group()

    // scene이 로드되기를 기다리는 로직 추가
    const setupScene = () => {
      if (scene && scene.children && scene.children.length > 0 && scene.children[0]) {
        scene.children[0].scale.set(0.1, 0.1, 0.1)
        scene.children[0].position.set(0, 0, 0)

        const box = new THREE.Box3().setFromObject(scene.children[0])
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())

        setBeakerInfo({
          radius: Math.max(size.x, size.z) * 0.4,
          height: size.y * 0.8,
          position: center,
        })

        newScene.add(scene.children[0].clone())
        setFilteredScene(newScene)
      } else {
        // scene이 아직 로드되지 않았다면 다시 시도
        setTimeout(setupScene, 100)
      }
    }

    setupScene()
  }, [scene])

  useFrame((state) => {
    if (isStirring && waterRef.current) {
      const time = state.clock.elapsedTime * stirringSpeed

      waterRef.current.rotation.y = Math.sin(time) * 0.1
      waterRef.current.position.x = Math.sin(time * 2) * 0.02
      waterRef.current.position.z = Math.cos(time * 2) * 0.02

      const waveHeight = Math.sin(time * 3) * 0.05
      waterRef.current.position.y = waveHeight
    }
  })

  // 로딩 중일 때도 기본 구조는 렌더링하도록 수정
  if (!filteredScene || !beakerInfo) {
    return (
      <group ref={groupRef} {...props}>
        {/* 로딩 중 플레이스홀더 */}
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.8, 32]} />
          <meshStandardMaterial transparent opacity={0.1} color="lightblue" />
        </mesh>
        {/* 로딩 중에도 실험이 완료되지 않았다면 SugarParticles 렌더링 */}
        {!isCompleted && (
          <SugarParticles
            shouldDrop={shouldDropSugar}
            sugarAmount={sugarAmount}
            onAllDissolved={onAllDissolved}
            startPosition={[0, 2, -0.2]}
            beakerId={beakerId}
          />
        )}
      </group>
    )
  }
  const beakerWorldPos = new THREE.Vector3().copy(beakerInfo.position)
  if (props.position) {
    if (Array.isArray(props.position)) {
      beakerWorldPos.add(new THREE.Vector3(...props.position))
    }
  }

  return (
    <group ref={groupRef} {...props}>
      <primitive object={filteredScene} />
      
      <group ref={waterRef}>
        {!isCompleted && (
          <SugarParticles
            shouldDrop={shouldDropSugar}
            sugarAmount={sugarAmount}
            onAllDissolved={onAllDissolved}
            startPosition={[0, 2, -0.2]}
            beakerId={beakerId}
          />
        )}
        <Caustics
          {...({
            causticsOnly: false,
            backside: true,
            color: [0.8, 1, 1],
            focus: [0, -1.2, 0],
            position: [
              beakerInfo.position.x - 0.02,
              beakerInfo.position.y - beakerInfo.height * 0.65,
              beakerInfo.position.z,
            ],
            lightSource: [
              beakerWorldPos.x - 1, 
              beakerWorldPos.y + 2, 
              beakerWorldPos.z + 1
            ],
            intensity: 0.5,
            ior: 1.33
          } as any)}>
          <RealisticWater
            beakerRadius={beakerInfo.radius}
            waterLevel={beakerInfo.height * 0.7}
            position={[
              beakerInfo.position.x - 0.02,
              beakerInfo.position.y - beakerInfo.height * 0.2,
              beakerInfo.position.z,
            ]}
          />
        </Caustics>
      </group>
    </group>
  )
}