import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FishSmellParticlesProps {
  position: [number, number, number]
  opacity: number // 0-1, 청소 진행도에 따라 감소
  count?: number
  size?: number
  color?: string
  speed?: number
}

export const FishSmellParticles: React.FC<FishSmellParticlesProps> = ({
  position,
  opacity,
  count = 50,
  size = 0.05,
  color = '#90EE90',
  speed = 0.5
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const particlesRef = useRef<{
    position: THREE.Vector3
    velocity: THREE.Vector3
    life: number
    maxLife: number
  }[]>([])
  
  // 파티클 데이터 초기화
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({
        position: new THREE.Vector3(
          position[0] + (Math.random() - 0.5) * 0.8,
          position[1] + Math.random() * 0.2,
          position[2] + (Math.random() - 0.5) * 0.8
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          Math.random() * 0.05 + 0.01,
          (Math.random() - 0.5) * 0.02
        ),
        life: Math.random() * 3 + 2,
        maxLife: Math.random() * 3 + 2
      })
    }
    return temp
  }, [count, position])

  useEffect(() => {
    particlesRef.current = particles
  }, [particles])

  // 파티클 재질 설정
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [color, opacity])

  // 파티클 지오메트리
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(size, 8, 6)
  }, [size])

  useFrame((state, delta) => {
    if (!meshRef.current || opacity <= 0) return

    const dummy = new THREE.Object3D()
    const particles = particlesRef.current

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]
      
      // 파티클 위치 업데이트
      particle.position.add(particle.velocity.clone().multiplyScalar(delta * speed))
      
      // 파티클 수명 감소
      particle.life -= delta
      
      // 파티클이 죽으면 리스폰
      if (particle.life <= 0) {
        particle.position.set(
          position[0] + (Math.random() - 0.5) * 0.8,
          position[1] + Math.random() * 0.2,
          position[2] + (Math.random() - 0.5) * 0.8
        )
        particle.velocity.set(
          (Math.random() - 0.5) * 0.02,
          Math.random() * 0.05 + 0.01,
          (Math.random() - 0.5) * 0.02
        )
        particle.life = particle.maxLife
      }

      // 파티클 크기 계산 (수명에 따라 변화)
      const lifeRatio = particle.life / particle.maxLife
      const scale = Math.sin(lifeRatio * Math.PI) * opacity * (0.5 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.3)
      
      // 파티클 흔들림 효과
      const wobble = Math.sin(state.clock.elapsedTime * 3 + i * 0.1) * 0.02
      
      dummy.position.copy(particle.position)
      dummy.position.y += wobble
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
    
    // 머티리얼 투명도 업데이트
    if (material) {
      material.opacity = opacity * 0.6
      material.needsUpdate = true
    }
  })

  // opacity가 0이면 렌더링하지 않음
  if (opacity <= 0) {
    return null
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  )
}

// 추가적인 냄새 라인 효과 컴포넌트
export const SmellLines: React.FC<{
  position: [number, number, number]
  opacity: number
  count?: number
}> = ({ position, opacity, count = 8 }) => {
  const linesRef = useRef<THREE.Group>(null)
  
  const lines = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = 0.3 + Math.random() * 0.2
      temp.push({
        startPos: new THREE.Vector3(
          position[0] + Math.cos(angle) * radius,
          position[1],
          position[2] + Math.sin(angle) * radius
        ),
        endPos: new THREE.Vector3(
          position[0] + Math.cos(angle) * radius,
          position[1] + 0.5 + Math.random() * 0.3,
          position[2] + Math.sin(angle) * radius
        ),
        phase: Math.random() * Math.PI * 2
      })
    }
    return temp
  }, [count, position])

  useFrame((state) => {
    if (!linesRef.current || opacity <= 0) return

    linesRef.current.children.forEach((line, i) => {
      if (line instanceof THREE.Line) {
        const lineData = lines[i]
        const wave = Math.sin(state.clock.elapsedTime * 2 + lineData.phase) * 0.1
        
        const geometry = line.geometry as THREE.BufferGeometry
        const positions = geometry.attributes.position.array as Float32Array
        
        // 시작점
        positions[0] = lineData.startPos.x + wave
        positions[1] = lineData.startPos.y
        positions[2] = lineData.startPos.z
        
        // 끝점
        positions[3] = lineData.endPos.x + wave
        positions[4] = lineData.endPos.y
        positions[5] = lineData.endPos.z
        
        geometry.attributes.position.needsUpdate = true
        
        // 머티리얼 투명도 업데이트
        const material = line.material as THREE.LineBasicMaterial
        material.opacity = opacity * 0.4
      }
    })
  })

  if (opacity <= 0) {
    return null
  }

  return (
    <group ref={linesRef}>
      {lines.map((_, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array(6)}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#FFE4B5"
            transparent={true}
            opacity={opacity * 0.4}
            linewidth={2}
          />
        </line>
      ))}
    </group>
  )
}

// 메인 냄새 효과 컴포넌트
export const FishSmellEffect: React.FC<{
  position: [number, number, number]
  opacity: number // 0-1, 청소 진행도에 따라 감소
  enabled?: boolean
}> = ({ position, opacity, enabled = true }) => {
  if (!enabled || opacity <= 0) {
    return null
  }

  return (
    <group>
      {/* 메인 파티클 효과 */}
      <FishSmellParticles
        position={position}
        opacity={opacity}
        count={40}
        size={0.04}
        color="#90EE90"
        speed={0.3}
      />
      
      {/* 작은 파티클 효과 */}
      <FishSmellParticles
        position={[position[0], position[1] , position[2]]}
        opacity={opacity * 0.7}
        count={20}
        size={0.02}
        color="#ADFF2F"
        speed={0.5}
      />
      
      {/* 냄새 라인 효과 */}
      <SmellLines
        position={position}
        opacity={opacity}
        count={6}
      />
    </group>
  )
}