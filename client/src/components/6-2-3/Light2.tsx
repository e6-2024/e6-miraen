// components/Light2.tsx
import { useGLTF } from '@react-three/drei'
import { GroupProps } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

interface Light2Props extends GroupProps {
  lightIntensity?: number
}

export default function Light2({ lightIntensity = 1.0, ...props }: Light2Props) {
  const { scene } = useGLTF('models/6-2-3/Light_2.gltf')
  const groupRef = useRef<THREE.Group>(null)

  return (
    <group ref={groupRef} {...props}>
      {/* 기존 3D 모델 */}
      <primitive object={scene} />
      
      {/* 전구 효과 - emissive sphere */}
      <mesh position={[0.1, 1.0, -2.0]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial
          color={new THREE.Color(1, 0.8, 0.4)}
          emissive={new THREE.Color(2, 0.6, 0.2)}
          emissiveIntensity={2}
          transparent
          opacity={1}
        />
      </mesh>
      
      {/* Point Light */}
      <pointLight
        position={[0.1, 1.0, -2.0]}
        intensity={20}
        distance={10}
        decay={2}
        color={new THREE.Color(1, 0.8, 0.4)}
      />
    </group>
  )
}
