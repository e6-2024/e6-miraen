import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface BubbleParticlesProps {
  position: [number, number, number]
  progress: number // 0-100, 청소 진행도
  count?: number
  size?: number
  color?: string
  speed?: number
}

export const BubbleParticles: React.FC<BubbleParticlesProps> = ({
  position,
  progress,
  count = 50,
  size = 0.05,
  color = '#E6F3FF',
  speed = 0.5
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const particlesRef = useRef<{
    position: THREE.Vector3
    velocity: THREE.Vector3
    life: number
    maxLife: number
    initialSize: number
  }[]>([])
  
  // 청소가 진행될수록 거품이 점점 증가 (0개 -> count개)
  const cleaningIntensity = Math.max(0, (100 - progress) / 100) // 0 -> 1로 증가
  const activeBubbleCount = cleaningIntensity === 0 ? 0 : Math.max(1, Math.floor(cleaningIntensity * count))
  
  // 파티클 데이터 초기화
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({
        position: new THREE.Vector3(
          position[0] + (Math.random() - 0.5) * 1.2, // 영역 축소
          position[1] + Math.random() * 0.1,
          position[2] + (Math.random() - 0.5) * 1.2  // 영역 축소
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          Math.random() * 0.06 + 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        life: Math.random() * 3 + 1,
        maxLife: Math.random() * 3 + 1,
        initialSize: Math.random() * 0.02 + 0.01
      })
    }
    return temp
  }, [count, position])

  useEffect(() => {
    particlesRef.current = particles
  }, [particles])

  // 거품 재질
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [color])

  // 거품 지오메트리
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(size, 8, 6)
  }, [size])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    const dummy = new THREE.Object3D()
    const particles = particlesRef.current

    // 모든 파티클 숨김
    for (let i = 0; i < count; i++) {
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    // progress가 100이면 거품 없음
    if (progress >= 100 || activeBubbleCount <= 0) {
      meshRef.current.instanceMatrix.needsUpdate = true
      return
    }

    // 활성 파티클만 처리
    for (let i = 0; i < activeBubbleCount; i++) {
      const particle = particles[i]
      
      // 파티클 위치 업데이트
      particle.position.add(particle.velocity.clone().multiplyScalar(delta * speed))
      
      // 거품이 올라가면서 흔들리는 효과
      const wobbleX = Math.sin(state.clock.elapsedTime * 2 + i * 0.5) * 0.015
      const wobbleZ = Math.cos(state.clock.elapsedTime * 1.5 + i * 0.3) * 0.015
      particle.position.x += wobbleX
      particle.position.z += wobbleZ
      
      // 파티클 수명 감소
      particle.life -= delta
      
      // 파티클이 죽으면 리스폰
      if (particle.life <= 0 || particle.position.y > position[1] + 1.5) {
        particle.position.set(
          position[0] + (Math.random() - 0.5) * 1.2, // 영역 축소
          position[1] + Math.random() * 0.1,
          position[2] + (Math.random() - 0.5) * 1.2  // 영역 축소
        )
        particle.velocity.set(
          (Math.random() - 0.5) * 0.02,
          Math.random() * 0.06 + 0.02,
          (Math.random() - 0.5) * 0.02
        )
        particle.life = particle.maxLife
      }

      // 파티클 크기 계산
      const lifeRatio = particle.life / particle.maxLife
      const bubbleGrowth = Math.sin(lifeRatio * Math.PI) * 2
      const scale = (particle.initialSize + bubbleGrowth * 0.09) * (1 + cleaningIntensity)
      
      dummy.position.copy(particle.position)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  // progress가 100이면 거품 없음
  if (progress >= 100) {
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