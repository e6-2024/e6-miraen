import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RootWaterAbsorptionProps {
  isActive: boolean
  rootPosition: THREE.Vector3
}

export function RootWaterAbsorption({ isActive, rootPosition }: RootWaterAbsorptionProps) {
  const particlesRef = useRef([])
  const groupRef = useRef<THREE.Group>(null)

  const particles = useMemo(() => {
    const particleCount = 80
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const radius = 3 + Math.random() * 4
      const height = -2 + Math.random() * 4

      particles.push({
        id: i,
        startPosition: new THREE.Vector3(
          rootPosition.x + Math.cos(angle) * radius,
          rootPosition.y + height,
          rootPosition.z + Math.sin(angle) * radius,
        ),
        targetPosition: rootPosition.clone(),
        currentPosition: new THREE.Vector3(),
        progress: Math.random() * 0.8,
        speed: 0.1 + Math.random() * 0.1,
        scale: 0.08 + Math.random() * 0.12,
      })
    }
    return particles
  }, [rootPosition])

  useFrame((state, delta) => {
    if (!isActive || !groupRef.current) return

    particles.forEach((particle, index) => {
      particle.progress += delta * particle.speed

      if (particle.progress >= 1) {
        particle.progress = 0
      }

      const t = particle.progress
      const eased = 1 - Math.pow(1 - t, 3)

      particle.currentPosition.copy(particle.startPosition).lerp(particle.targetPosition, eased)

      const scale = particle.scale * (1 - eased * 0.8)

      const mesh = groupRef.current?.children[index] as THREE.Mesh
      if (mesh) {
        mesh.position.copy(particle.currentPosition)
        mesh.scale.setScalar(scale)
        const material = mesh.material as THREE.MeshStandardMaterial
        material.opacity = 1 - eased * 0.5
      }
    })
  })

  return (
    <group ref={groupRef} visible={isActive}>
      {particles.map((particle) => (
        <mesh key={particle.id} position={particle.startPosition}>
          <sphereGeometry args={[particle.scale, 12, 12]} />
          <meshStandardMaterial
            color='#2196f3'
            transparent
            opacity={0.9}
            metalness={0.3}
            roughness={0.1}
            emissive='#0066CC'
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}
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
    const particleCount = 100
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
        scale: Math.random() * 0.06,
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
            color='#E3F2FD'
            transparent
            opacity={0.0}
            metalness={0}
            roughness={0.9}
            emissive='#BBDEFB'
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
    const particleCount = 10
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        progress: (i / particleCount) * 1.2,
        speed: Math.random() * 0.03,
        scale: 0.08 + Math.random() * 0.06,
        currentPosition: new THREE.Vector3(),
        opacity: 0.9 + Math.random() * 0.1,
        waveOffset: Math.random() * Math.PI * 2,
        pulsePhase: Math.random() * Math.PI * 2,
      })
    }
    return particles
  }, [])

  const pipelineParticles = useMemo(() => {
    const count = 30
    const particles = []

    for (let i = 0; i < count; i++) {
      particles.push({
        id: i,
        progress: (i / count) * 0.9,
        speed: 0.3,
        scale: 0.12 + Math.random() * 0.08,
        currentPosition: new THREE.Vector3(),
        glowIntensity: 0.5 + Math.random() * 0.5,
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

        const waveX = Math.sin(time * 2 + particle.waveOffset) * 0.1
        const waveZ = Math.cos(time * 2 + particle.waveOffset) * 0.1

        particle.currentPosition.copy(position)
        particle.currentPosition.x += waveX
        particle.currentPosition.z += waveZ

        const mesh = groupRef.current?.children[index] as THREE.Mesh
        if (mesh) {
          mesh.position.copy(particle.currentPosition)

          const pulseScale = 1 + Math.sin(time * 4 + particle.pulsePhase) * 0.3
          mesh.scale.setScalar(particle.scale * pulseScale)

          const material = mesh.material as THREE.MeshStandardMaterial

          const visibility = Math.sin(particle.progress * Math.PI)
          material.opacity = particle.opacity * visibility * 0.9
          material.emissiveIntensity = 0.3 + Math.sin(time * 3 + particle.pulsePhase) * 0.2
        }
      }
    })

    pipelineParticles.forEach((particle, index) => {
      particle.progress += delta * particle.speed

      if (particle.progress >= 1.1) {
        particle.progress = -0.1
      }

      if (particle.progress >= 0 && particle.progress <= 1) {
        const position = getPositionOnPath(particle.progress)
        particle.currentPosition.copy(position)

        const meshIndex = particles.length + index
        const mesh = groupRef.current?.children[meshIndex] as THREE.Mesh
        if (mesh) {
          mesh.position.copy(particle.currentPosition)

          const pulseScale = 1 + Math.sin(time * 6 + index) * 0.5
          mesh.scale.setScalar(particle.scale * pulseScale)

          const material = mesh.material as THREE.MeshStandardMaterial
          const visibility = Math.sin(particle.progress * Math.PI)
          material.opacity = visibility * 0.8
          material.emissiveIntensity = particle.glowIntensity + Math.sin(time * 5 + index) * 0.4
        }
      }
    })
  })

  return (
    <group ref={groupRef} visible={isActive}>
      {particles.map((particle) => (
        <mesh key={particle.id}>
          <sphereGeometry args={[particle.scale, 12, 12]} />
          <meshStandardMaterial
            color='#4FC3F7'
            transparent
            opacity={particle.opacity}
            metalness={0.4}
            roughness={0.2}
            emissive='#03A9F4'
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {pipelineParticles.map((particle) => (
        <mesh key={`pipeline-${particle.id}`}>
          <sphereGeometry args={[particle.scale, 16, 16]} />
          <meshStandardMaterial
            color='#00E5FF'
            transparent
            opacity={0.7}
            metalness={0.1}
            roughness={0.1}
            emissive='#00BCD4'
            emissiveIntensity={particle.glowIntensity}
          />
        </mesh>
      ))}
    </group>
  )
}