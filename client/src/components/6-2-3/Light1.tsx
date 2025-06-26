// components/Light1.tsx
import { useGLTF } from '@react-three/drei'
import { GroupProps } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

interface Light1Props extends GroupProps {
  lightIntensity?: number
}

export default function Light1({ lightIntensity = 1.0, ...props }: Light1Props) {
  const { scene } = useGLTF('models/6-2-3/Light_1.gltf')
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
          emissive={new THREE.Color(1, 0.6, 0.2)}
          emissiveIntensity={lightIntensity * 0.5}
          transparent
          opacity={0.6 + lightIntensity * 0.2}
        />
      </mesh>
      
      {/* Point Light */}
      <pointLight
        position={[0.1, 1.0, -2.0]}
        intensity={lightIntensity * 2}
        distance={10}
        decay={2}
        color={new THREE.Color(1, 0.8, 0.4)}
      />
    </group>
  )
}
