import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

interface Fan1Props extends GroupProps {
  speed?: number
}

export default function Fan1({ speed = 1.0, ...props }: Fan1Props) {
  const { scene } = useGLTF('models/6-2-3/Fan_2.gltf')
  const groupRef = useRef<THREE.Group>(null)
  const fanBladeRef = useRef<THREE.Mesh | null>(null)

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if (child.name === 'Fan' || child.name.includes('Fan')) {
          fanBladeRef.current = child as THREE.Mesh
        }
      })
    }
  }, [])

  useFrame((state, delta) => {
    if (fanBladeRef.current && speed > 0) {
      fanBladeRef.current.rotation.y += delta * speed * 20
    }
  })

  return (
    <group ref={groupRef} {...props}>
      <primitive object={scene} />
    </group>
  )
}