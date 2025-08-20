import * as THREE from 'three'
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'

const COLLISION_LAYER = 2

export function CollisionPlane({
  position,
  rotation,
  size = [1, 1],
  missionId,
  visible = true,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  size?: [number, number]
  missionId: string
  visible?: boolean
}) {
  const ref = useRef<THREE.Mesh>(null!)

  useEffect(() => {
    if (!ref.current) return
    ref.current.layers.set(COLLISION_LAYER)
    ref.current.userData.isCollisionPlane = true
  }, [])

  return (
    <mesh ref={ref} position={position} rotation={rotation} visible={visible}>
      <planeGeometry args={[size[0], size[1]]} />
      <meshBasicMaterial transparent opacity={visible ? 0.3 : 0} color={'#ff0000'} side={THREE.DoubleSide} />
    </mesh>
  )
}
