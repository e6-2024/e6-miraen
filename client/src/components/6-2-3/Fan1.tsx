import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

interface Fan1Props extends GroupProps {
  speed?: number
}

export default function Fan1({ speed = 1.0, ...props }: Fan1Props) {
  const { scene } = useGLTF('models/6-2-3/Fan_1.gltf')
  const groupRef = useRef<THREE.Group>(null)
  const fanBladeRef = useRef<THREE.Mesh | null>(null)



  useEffect(() => {
    if (groupRef.current) {
      // "Fan" 이름을 가진 객체를 찾아서 ref에 저장
      groupRef.current.traverse((child) => {
        if (child.name === 'Fan' || child.name.includes('Fan')) {
          fanBladeRef.current = child as THREE.Mesh
        }
      })
    }
  }, [])

  // 애니메이션 프레임마다 회전
  useFrame((state, delta) => {
    if (fanBladeRef.current && speed > 0) {
      fanBladeRef.current.rotation.y += delta * speed * 10 // speed * 10으로 회전 속도 조절
    }
  })

  return (
    <group ref={groupRef} {...props}>
      <primitive object={scene} />
    </group>
  )
}