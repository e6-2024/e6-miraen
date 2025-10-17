import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RootWaterAbsorptionProps {
  isActive: boolean
  rootPosition: THREE.Vector3
  debugMarker?: boolean // 중심 디버그 구 표시
  swirl?: number // 0 = 직선 수렴, 0.0~0.6 정도 권장
  ringRadiusMin?: number // 시작 반지름 최소
  ringRadiusMax?: number // 시작 반지름 최대
  hemisphere?: boolean // 반구(아래쪽/위쪽) 제한
}

export function RootWaterAbsorption({
  isActive,
  rootPosition,
  debugMarker = false,
  swirl = 0.9,
  ringRadiusMin = 0.2,
  ringRadiusMax = 0.4,
  hemisphere = true,
}: RootWaterAbsorptionProps) {
  const particlesRef = useRef<THREE.Mesh[]>([])
  const groupRef = useRef<THREE.Group>(null)

  // 방사형 시작점 생성: 원/반구 표면에서 시작해 중심으로 수렴
  const particles = useMemo(() => {
    const particleCount = 12
    const list: {
      id: number
      startPosition: THREE.Vector3
      targetPosition: THREE.Vector3
      currentPosition: THREE.Vector3
      dir: THREE.Vector3
      ortho: THREE.Vector3
      progress: number
      speed: number
      scale: number
    }[] = []

    const up = new THREE.Vector3(0, 1, 0)

    for (let i = 0; i < particleCount; i++) {
      const r = THREE.MathUtils.lerp(ringRadiusMin, ringRadiusMax, Math.random())
      const theta = Math.random() * Math.PI * 2 // 방위각
      let phi = Math.acos(THREE.MathUtils.randFloatSpread(2)) // 0..π (균일 구표본)
      if (hemisphere) {
        phi = THREE.MathUtils.lerp(Math.PI / 2, Math.PI, Math.random())
      }

      // 구면좌표 → 데카르트
      const offset = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      )

      const start = rootPosition.clone().add(offset)
      const target = rootPosition.clone()

      // 방사 방향(정규화)
      const dir = target.clone().sub(start).normalize()

      const base = Math.abs(dir.dot(up)) > 0.98 ? new THREE.Vector3(1, 0, 0) : up
      const ortho = new THREE.Vector3().crossVectors(dir, base).normalize()

      list.push({
        id: i,
        startPosition: start,
        targetPosition: target,
        currentPosition: start.clone(),
        dir,
        ortho,
        progress: Math.random() * 0.4,
        speed: 0.35 + Math.random() * 0.25,
        scale: 0.06 + Math.random() * 0.09,
      })
    }
    return list
  }, [rootPosition, ringRadiusMin, ringRadiusMax, hemisphere])

  useFrame((_, delta) => {
    if (!isActive || !groupRef.current) return

    particles.forEach((p, i) => {
      p.progress += delta * p.speed
      if (p.progress >= 1) p.progress = 0
      const t = p.progress
      const eased = 1 - Math.pow(1 - t, 2.4)

      p.currentPosition.copy(p.startPosition).lerp(p.targetPosition, eased)
      if (swirl !== 0) {
        const swirlAmt = swirl * (1.0 - eased)
        p.currentPosition.addScaledVector(p.ortho, swirlAmt * 0.12)
      }
      const s = p.scale * (1.0 - eased * 0.7)
      const mesh = groupRef.current.children[i] as THREE.Mesh
      if (mesh) {
        mesh.position.copy(p.currentPosition)
        mesh.scale.setScalar(s)
        const material = mesh.material as THREE.MeshStandardMaterial
        material.opacity = 0.65 - eased * 0.45
        const stretch = 1.0 + (1.0 - eased) * 0.6
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.dir)
        mesh.quaternion.copy(q)
        mesh.scale.set(0.6 * s, stretch * s, 0.6 * s)
      }
    })
  })

  return (
    <group>
      {debugMarker && (
        <mesh position={rootPosition}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color='red' />
        </mesh>
      )}

      <group ref={groupRef} visible={isActive}>
        {particles.map((p) => (
          <mesh key={p.id} position={p.startPosition}>
            <sphereGeometry args={[p.scale, 10, 10]} />
            <meshStandardMaterial
              color={'#0095ff'}
              transparent
              opacity={0.0}
              metalness={0}
              roughness={0.9}
              emissive={'#0095ff'}
              emissiveIntensity={0.35}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

interface LeafEvaporationProps {
  isActive: boolean
  leafPosition: THREE.Vector3
}

export function LeafEvaporation({ isActive, leafPosition }: LeafEvaporationProps) {
  const particlesRef = useRef([])
  const groupRef = useRef<THREE.Group>(null)

  const particles = useMemo(() => {
    const particleCount = 200
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const radius = Math.random() * 0.1

      particles.push({
        id: i,
        startPosition: new THREE.Vector3(
          leafPosition.x + Math.cos(angle) * radius,
          leafPosition.y - 0.2,
          leafPosition.z + Math.sin(angle) * radius,
        ),
        targetPosition: new THREE.Vector3(
          leafPosition.x + Math.cos(angle) * (radius + 1),
          leafPosition.y + Math.random() * 2,
          leafPosition.z + Math.sin(angle) * (radius + 1),
        ),
        currentPosition: new THREE.Vector3(),
        progress: Math.random() * 0.6,
        speed: 0.05 + Math.random() * 0.15,
        scale: Math.random() * 0.045,
      })
    }
    return particles
  }, [leafPosition])

  useFrame((state, delta) => {
    if (!isActive || !groupRef.current) return

    particles.forEach((particle, index) => {
      particle.progress += delta * particle.speed

      if (particle.progress >= 1) {
        particle.progress = 0
      }

      const t = particle.progress
      const eased = t * t

      particle.currentPosition.copy(particle.startPosition).lerp(particle.targetPosition, eased)

      const scale = particle.scale * (1 + eased * 3)
      const opacity = 0.3 * (1 - eased)

      const mesh = groupRef.current?.children[index] as THREE.Mesh
      if (mesh) {
        mesh.position.copy(particle.currentPosition)
        mesh.scale.setScalar(scale)
        const material = mesh.material as THREE.MeshStandardMaterial
        material.opacity = opacity
      }
    })
  })

  return (
    <group ref={groupRef} visible={isActive}>
      {particles.map((particle) => (
        <mesh key={particle.id} position={particle.startPosition}>
          <sphereGeometry args={[particle.scale, 12, 12]} />
          <meshStandardMaterial
            color='#0095ff'
            transparent
            opacity={0.0}
            metalness={0}
            roughness={0.9}
            emissive='#0095ff'
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

interface StemWaterMovementProps {
  isActive: boolean
  pathPoints: THREE.Vector3[]
}

export function StemWaterMovement({ isActive, pathPoints }: StemWaterMovementProps) {
  const particlesRef = useRef([])
  const groupRef = useRef<THREE.Group>(null)

  const particles = useMemo(() => {
    const particleCount = 80
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        progress: (i / particleCount) * 1.2,
        speed: Math.random() * 0.06,
        scale: 0.1 + Math.random() * 0.02,
        currentPosition: new THREE.Vector3(),
        opacity: 0.9 + Math.random() * 0.9,
        waveOffset: Math.random() * Math.PI * 2,
        pulsePhase: Math.random() * Math.PI * 2,
      })
    }
    return particles
  }, [])

  const pipelineParticles = useMemo(() => {
    const count = 120
    const particles = []

    for (let i = 0; i < count; i++) {
      particles.push({
        id: i,
        progress: (i / count) * 0.9,
        speed: 0.35,
        scale: 0.1 + Math.random() * 0.2,
        currentPosition: new THREE.Vector3(),
        glowIntensity: 0.9 + Math.random() * 0.5,
      })
    }
    return particles
  }, [])

  const getPositionOnPath = (t: number) => {
    const clampedT = Math.max(0, Math.min(1, t))
    const segmentIndex = Math.floor(clampedT * (pathPoints.length - 1))
    const localT = (clampedT * (pathPoints.length - 1)) % 1

    if (segmentIndex >= pathPoints.length - 1) {
      return pathPoints[pathPoints.length - 1].clone()
    }

    const startPoint = pathPoints[segmentIndex]
    const endPoint = pathPoints[segmentIndex + 1]

    return startPoint.clone().lerp(endPoint, localT)
  }

  useFrame((state, delta) => {
    if (!isActive || !groupRef.current) return

    const time = state.clock.elapsedTime

    particles.forEach((particle, index) => {
      particle.progress += delta * particle.speed

      if (particle.progress >= 1.1) {
        particle.progress = -0.1
      }

      if (particle.progress >= 0 && particle.progress <= 1) {
        const position = getPositionOnPath(particle.progress)
        particle.currentPosition.copy(position)
        const mesh = groupRef.current?.children[index] as THREE.Mesh
        if (mesh) {
          mesh.position.copy(particle.currentPosition)
          const pulseScale = 1 + Math.sin(time * 4 + particle.pulsePhase) * 0.3
          mesh.scale.setScalar(particle.scale * pulseScale)
          const material = mesh.material as THREE.MeshStandardMaterial
          const visibility = Math.sin(particle.progress * Math.PI)
          material.opacity = particle.opacity * visibility * 0.5
        }
      }
    })
  })

  return (
    <group ref={groupRef} visible={isActive}>
      {pipelineParticles.map((particle) => (
        <mesh key={`pipeline-${particle.id}`}>
          <sphereGeometry args={[particle.scale, 16, 16]} />
          <meshStandardMaterial
            color='#E3F2FD'
            transparent
            opacity={0.0}
            metalness={0}
            roughness={0.9}
            emissive='#BBDEFB'
            emissiveIntensity={particle.glowIntensity}
          />
        </mesh>
      ))}
    </group>
  )
}
