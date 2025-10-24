import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface PressureSphereBeautifulProps {
  position: [number, number, number]
  type: 'high' | 'low'
  label?: string
  size?: number
  color?: string
  visible?: boolean
  animated?: boolean
}

export const PressureSphereBeautiful: React.FC<PressureSphereBeautifulProps> = ({
  position,
  type,
  label,
  size = 3,
  color,
  visible = true,
  animated = true,
}) => {
  const sphereRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  
  // 색상 결정
  const sphereColor = color || '#6c5ce7'

  // 부드러운 그라데이션 쉐이더
  const gradientMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(sphereColor) },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // 중앙에서의 거리 (0 = 중앙, 1 = 표면)
          float distFromCenter = length(vPosition) / 2.3; // sqrt(3) for sphere
          
          // 매우 부드러운 그라데이션 (중앙은 진하게, 가장자리는 투명하게)
          float alpha = 1.0 - smoothstep(0.0, 1.0, distFromCenter);
          alpha = pow(alpha, 1.5); // 더 부드럽게
          
          // 약간의 빛 효과
          float glow = 1.0 - distFromCenter;
          vec3 finalColor = color + vec3(0.15) * glow;
          
          gl_FragColor = vec4(finalColor, alpha * 0.8);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })
  }, [sphereColor])

  // 외곽 빛 효과 쉐이더
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(sphereColor) },
        viewVector: { value: new THREE.Vector3() },
        time: { value: 0 },
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.3 - dot(vNormal, vNormel), 2.0);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float intensity;
        
        void main() {
          vec3 glow = color * intensity;
          gl_FragColor = vec4(glow, intensity * 2.9);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [sphereColor])

  // 애니메이션
  useFrame((state) => {
    if (animated && sphereRef.current && glowRef.current) {

      
      // 시간 업데이트
      gradientMaterial.uniforms.time.value = state.clock.elapsedTime
      glowMaterial.uniforms.time.value = state.clock.elapsedTime
      
      // 카메라 방향 업데이트
      glowMaterial.uniforms.viewVector.value = new THREE.Vector3().subVectors(
        state.camera.position,
        glowRef.current.position
      )
    }
  })

  if (!visible) return null

  return (
    <group position={position}>
      {/* 메인 그라데이션 구체 */}
      <mesh ref={sphereRef} material={gradientMaterial}>
        <sphereGeometry args={[size, 64, 64]} />
      </mesh>
      
      {/* 외곽 빛 효과 */}
      <mesh ref={glowRef} material={glowMaterial}>
        <sphereGeometry args={[size * 1.15, 32, 32]} />
      </mesh>

    </group>
  )
}