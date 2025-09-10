import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect } from 'react'
import * as THREE from 'three'

interface CameraControllerProps {
  showIntro: boolean
  target?: [number, number, number]
  minDistance?: number
  maxDistance?: number
  maxPolarAngle?: number
  minPolarAngle?: number
}

export function CameraController({ 
  showIntro, 
  target = [0, 0, 0],
  minDistance = 0,
  maxDistance = 6,
  maxPolarAngle = Math.PI / 2,
  minPolarAngle = 0
}: CameraControllerProps) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 1.2, 2.2)
    camera.lookAt(new THREE.Vector3(...target))
    camera.updateProjectionMatrix()
  }, [camera, target])

  return (
    <OrbitControls
      target={target}
      enableRotate={!showIntro}
      enableZoom={!showIntro}
      enablePan={!showIntro}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={maxPolarAngle}
      minPolarAngle={minPolarAngle}
      enableDamping={true}
      dampingFactor={0.05}
    />
  )
}