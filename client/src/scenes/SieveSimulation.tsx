import { useState, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import SieveModel from '@/components/5-2-1/SieveModel'
import Particle from '@/components/5-2-1/Particle'
import { PARTICLE_CONFIG, CONTAINER_DIMENSIONS } from '@/utils/5-2-1/sieveConfig'

interface Props {
  triggerSpawn: boolean
  onSpawnHandled: () => void
  selectedLevel: number
  setGravity: React.Dispatch<React.SetStateAction<[number, number, number]>>
  onSeparationComplete?: () => void
}

type ParticleData = {
  id: string
  radius: number
  position: [number, number, number]
}

function Ground() {
  const { size, wallThickness, wallHeight, bottomY } = CONTAINER_DIMENSIONS
  const color = '#ffffff'

  return (
    <group>
      <mesh position={[0, bottomY, 0]} receiveShadow>
        <boxGeometry args={[size, wallThickness, size]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
      </mesh>

      <mesh position={[-size / 2, bottomY + wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, size]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
      </mesh>

      <mesh position={[size / 2, bottomY + wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, size]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
      </mesh>

      <mesh position={[0, bottomY + wallHeight / 2, size / 2]} receiveShadow>
        <boxGeometry args={[size, wallHeight, wallThickness]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
      </mesh>

      <mesh position={[0, bottomY + wallHeight / 2, -size / 2]} receiveShadow>
        <boxGeometry args={[size, wallHeight, wallThickness]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
      </mesh>
    </group>
  )
}

export default function SieveSimulation({
  triggerSpawn,
  onSpawnHandled,
  selectedLevel,
  setGravity,
  onSeparationComplete,
}: Props) {
  const [particles, setParticles] = useState<ParticleData[]>([])
  const [spawnCounter, setSpawnCounter] = useState(0)
  const [separationCheckStarted, setSeparationCheckStarted] = useState(false)
  const [separationCompleted, setSeparationCompleted] = useState(false)

  const spawnParticles = () => {
    const { count, batchSize, interval, spread, height } = PARTICLE_CONFIG.SPAWN
    let spawnedCount = 0

    setSeparationCheckStarted(false)
    setSeparationCompleted(false)

    const spawnInterval = setInterval(() => {
      if (spawnedCount >= count) {
        clearInterval(spawnInterval)
        setTimeout(() => {
          setSeparationCheckStarted(true)
        }, 3000)
        return
      }

      const currentBatchSize = Math.min(batchSize, count - spawnedCount)
      const newParticles = Array.from({ length: currentBatchSize }, (_, batchIndex) => {
        const radius = Math.random() > 0.5 ? PARTICLE_CONFIG.LARGE.radius : PARTICLE_CONFIG.SMALL.radius

        const angle = (spawnedCount + batchIndex) * ((Math.PI * 2) / count)
        const spreadRadius = spread + Math.random() * 0.5

        return {
          id: `spawn-${spawnCounter}-${spawnedCount + batchIndex}`,
          radius,
          position: [
            Math.cos(angle) * spreadRadius + (Math.random() - 0.5) * 0.25,
            height + Math.random() * 2 + batchIndex * 0.5,
            Math.sin(angle) * spreadRadius + (Math.random() - 0.5) * 0.25,
          ] as [number, number, number],
        }
      })

      setParticles((prev) => [...prev, ...newParticles])
      spawnedCount += currentBatchSize
    }, interval)

    setSpawnCounter((prev) => prev + 1)
  }

  const checkSeparationComplete = (currentParticles: ParticleData[]) => {
    if (selectedLevel !== 2 || !separationCheckStarted || separationCompleted) {
      return
    }

    const aboveSieve = currentParticles.filter((p) => p.position[1] > 3)
    const belowSieve = currentParticles.filter((p) => p.position[1] < 0)

    const aboveLargeBalls = aboveSieve.filter((p) => p.radius === PARTICLE_CONFIG.LARGE.radius)
    const aboveSmallBalls = aboveSieve.filter((p) => p.radius === PARTICLE_CONFIG.SMALL.radius)
    const belowLargeBalls = belowSieve.filter((p) => p.radius === PARTICLE_CONFIG.LARGE.radius)
    const belowSmallBalls = belowSieve.filter((p) => p.radius === PARTICLE_CONFIG.SMALL.radius)

    const totalSmallBalls = currentParticles.filter((p) => p.radius === PARTICLE_CONFIG.SMALL.radius).length
    const totalLargeBalls = currentParticles.filter((p) => p.radius === PARTICLE_CONFIG.LARGE.radius).length

    const smallBallsSeparated = totalSmallBalls > 0 && aboveSmallBalls.length / totalSmallBalls < 0.1
    const largeBallsSeparated = totalLargeBalls > 0 && belowLargeBalls.length / totalLargeBalls < 0.1
    const enoughParticlesSeparated = belowSmallBalls.length >= 3 && aboveLargeBalls.length >= 3

    if (largeBallsSeparated) {
      setSeparationCompleted(true)
      onSeparationComplete?.()
    }
  }

  useFrame(() => {
    setParticles((prev) => {
      const filtered = prev.filter((p) => {
        const distance = Math.sqrt(p.position[0] ** 2 + p.position[2] ** 2)
        return p.position[1] > 1
      })

      const finalParticles = filtered.length > 50 ? filtered.slice(-40) : filtered

      checkSeparationComplete(finalParticles)

      return finalParticles
    })
  })

  useEffect(() => {
    if (triggerSpawn) {
      spawnParticles()
      onSpawnHandled()
    }
  }, [triggerSpawn, onSpawnHandled])

  useEffect(() => {
    setSeparationCheckStarted(false)
    setSeparationCompleted(false)
  }, [selectedLevel])

  return (
    <>
      <SieveModel
        selectedLevel={selectedLevel}
        enableFloorColliders={true}
        showColliders={false}
      />

      <Ground />

      {particles.map((particle) => (
        <Particle key={particle.id} position={particle.position} radius={particle.radius} />
      ))}
    </>
  )
}
