import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { MeshTransmissionMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

interface RealisticWaterProps {
  beakerRadius?: number
  waterLevel?: number
  position?: [number, number, number]
}

export const RealisticWater: React.FC<RealisticWaterProps> = ({
  beakerRadius = 0.8,
  waterLevel = 0.9,
  position = [0, 0, 0],
}) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const originalPositions = useRef<Float32Array | null>(null)

  const waterGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(beakerRadius, beakerRadius, waterLevel, 64, 32)

    // 원본 vertex 위치 저장
    originalPositions.current = geometry.attributes.position.array.slice() as Float32Array

    return geometry
  }, [beakerRadius, waterLevel])

  // 물결 애니메이션
  useFrame((state) => {
    if (!meshRef.current || !originalPositions.current) return

    const time = state.clock.elapsedTime * 0.5 // 속도를 절반으로 줄임
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array
    const original = originalPositions.current

    // 상단 표면의 vertices에만 파동 효과 적용
    for (let i = 0; i < positions.length; i += 3) {
      const x = original[i]
      const y = original[i + 1]
      const z = original[i + 2]

      // 상단 표면인지 확인 (y가 waterLevel/2 근처)
      if (Math.abs(y - waterLevel / 2) < 0.01) {
        // 더 자연스러운 노이즈 기반 파동
        const noise1 = Math.sin(time * 1.2 + x * 3 + z * 2.5) * 0.003
        const noise2 = Math.cos(time * 0.8 + x * 1.8 - z * 3.2) * 0.002
        const noise3 = Math.sin(time * 1.5 + x * 0.5 + z * 0.8) * 0.0015
        const noise4 = Math.cos(time * 2.1 - x * 2.2 + z * 1.7) * 0.001

        // 가장자리에서 중앙으로 갈수록 파동 강도 줄이기
        const centerDistance = Math.sqrt(x * x + z * z)
        const falloff = Math.max(0, 1 - centerDistance / (beakerRadius * 0.8))

        const totalWave = (noise1 + noise2 + noise3 + noise4) * falloff
        positions[i + 1] = y + totalWave
      } else {
        // 다른 부분은 원본 위치 유지
        positions[i] = original[i]
        positions[i + 1] = original[i + 1]
        positions[i + 2] = original[i + 2]
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true
    meshRef.current.geometry.computeVertexNormals() // 조명을 위해 법선 재계산
  })

  return (
    <mesh ref={meshRef} geometry={waterGeometry} position={position}>
      <MeshTransmissionMaterial
        transmission={0.98}
        transparent={true}
        opacity={0.5}
        roughness={0.15}
        thickness={0.15}
        ior={1.33}
        chromaticAberration={0.005}
        clearcoat={0.3}
        clearcoatRoughness={0.25}
        color='#f0f8ff'
        distortion={0.02}
        distortionScale={0.2}
        temporalDistortion={0.05}
        envMapIntensity={0.8}
        attenuationColor='#e6f3ff'
        attenuationDistance={0.8}
      />
    </mesh>
  )
}
