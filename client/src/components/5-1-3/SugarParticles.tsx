import { useRef, useEffect, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const GRAVITY = -3.0
const WATER_LEVEL = 0

interface Particle {
  pos: THREE.Vector3
  vel: THREE.Vector3
  age: number
  delay: number
  state: 'waiting' | 'falling' | 'sinking' | 'removed'
  opacity: number
  scale: number
  initialPos: THREE.Vector3
  radialDir?: THREE.Vector3
}

interface SugarParticlesProps {
  startPosition?: [number, number, number]
  shouldDrop?: boolean
  sugarAmount?: number
  onAllDissolved?: () => void
  beakerId?: string
  isCompleted?: boolean
  spoonCount?: number
}

export function SugarParticles({
  startPosition = [0, 2, 0],
  shouldDrop = false,
  sugarAmount = 1.0,
  onAllDissolved,
  beakerId = 'default',
  isCompleted = false,
  spoonCount = 1,
}: SugarParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)

  const instanceData = useMemo(() => {
    const dummy = new THREE.Object3D()
    const numParticles = Math.floor(300 * sugarAmount)
    const timeOffset = Math.random() * 1000
    return {
      dummy,
      numParticles,
      timeOffset,
    }
  }, [])

  const particles = useRef<Particle[]>([])
  const remaining = useRef(0)
  const active = useRef(false)
  const hasCalledCallback = useRef(false)
  const lastShouldDrop = useRef(false)
  const currentSpoonRef = useRef(0)

  const initializeParticles = useCallback(() => {
    if (particles.current.length > 0) return
    const arr: Particle[] = []
    for (let i = 0; i < instanceData.numParticles; i++) {
      const base = new THREE.Vector3(
        startPosition[0] + (Math.random() - 0.5) * 0.2,
        startPosition[1],
        startPosition[2] + (Math.random() - 0.5) * 0.2,
      )
      arr.push({
        initialPos: base.clone(),
        pos: base.clone(),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.05, Math.random() * 0.4 + 0.1, (Math.random() - 0.5) * 0.05),
        age: 0,
        delay: Math.random() * 0.4,
        state: 'waiting',
        opacity: 1,
        scale: 0.5 + Math.random() * 0.4,
      })
    }

    particles.current = arr
    remaining.current = instanceData.numParticles
    active.current = false
    hasCalledCallback.current = false
    lastShouldDrop.current = false
  }, [beakerId, instanceData.numParticles, startPosition])

  useEffect(() => {
    initializeParticles()
  }, [initializeParticles])

  useEffect(() => {
    if (isCompleted) {
      particles.current.forEach((p) => {
        p.state = 'removed'
        p.opacity = 0
        p.scale = 0
      })
      active.current = false
    }
  }, [isCompleted, beakerId])

  useEffect(() => {
    if (isCompleted) return

    const currentShouldDrop = shouldDrop
    const prevShouldDrop = lastShouldDrop.current

    if (currentShouldDrop && !prevShouldDrop) {
      currentSpoonRef.current += 1
      console.log(`${beakerId}: 설탕 드롭 시작! (${currentSpoonRef.current}번째 스푼)`)
      active.current = true
      remaining.current = instanceData.numParticles
      hasCalledCallback.current = false

      if (particles.current.length === 0) {
        initializeParticles()
      }

      particles.current.forEach((p) => {
        p.pos.copy(p.initialPos)
        p.vel.set((Math.random() - 0.5) * 0.05, Math.random() * 0.4 + 0.1, (Math.random() - 0.5) * 0.05)
        p.age = 0
        p.delay = Math.random() * 0.4
        p.state = 'falling'
        p.radialDir = undefined
        p.opacity = 1
        p.scale = 0.5 + Math.random() * 0.4
      })
    } else if (!currentShouldDrop && prevShouldDrop) {
      active.current = false
      hasCalledCallback.current = false
      remaining.current = instanceData.numParticles

      particles.current.forEach((p) => {
        p.state = 'waiting'
        p.pos.copy(p.initialPos)
        p.opacity = 1
        p.scale = 0.5 + Math.random() * 0.4
        p.age = 0
        p.vel.set(0, 0, 0)
      })
    }

    lastShouldDrop.current = currentShouldDrop
  }, [shouldDrop, beakerId, instanceData.numParticles, initializeParticles, isCompleted])

  const handleDissolved = useCallback(() => {
    hasCalledCallback.current = true
    console.log(`${beakerId}: 모든 파티클 용해 완료!`)

    setTimeout(() => {
      if (onAllDissolved) {
        onAllDissolved()
      }
    }, 200)
  }, [beakerId, onAllDissolved])

  useFrame((state, delta) => {
    if (!meshRef.current || particles.current.length === 0 || isCompleted) return

    const localTime = state.clock.elapsedTime + instanceData.timeOffset
    const clampedDelta = Math.min(delta, 1 / 30)

    if (!shouldDrop || !active.current) {
      particles.current.forEach((p, i) => {
        if (p.state === 'waiting') {
          instanceData.dummy.position.copy(p.initialPos)
          instanceData.dummy.scale.set(p.scale, p.scale, p.scale)
        } else {
          instanceData.dummy.position.set(0, -100, 0)
          instanceData.dummy.scale.set(0, 0, 0)
        }
        instanceData.dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
      })
      meshRef.current.instanceMatrix.needsUpdate = true
      return
    }

    let remainingCount = 0

    particles.current.forEach((p, i) => {
      if (p.state === 'removed') {
        instanceData.dummy.position.set(0, -100, 0)
        instanceData.dummy.scale.set(0, 0, 0)
        instanceData.dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
        return
      }

      if (p.state === 'waiting' || p.state === 'falling' || p.state === 'sinking') {
        remainingCount++
      }

      p.age += clampedDelta

      if (p.state === 'falling') {
        if (p.age < p.delay) {
          instanceData.dummy.position.copy(p.initialPos)
          instanceData.dummy.scale.set(p.scale, p.scale, p.scale)
          instanceData.dummy.updateMatrix()
          meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
          return
        }

        p.vel.y += GRAVITY * clampedDelta
        p.vel.multiplyScalar(0.98)
        p.pos.addScaledVector(p.vel, clampedDelta)

        if (p.pos.y <= WATER_LEVEL) {
          p.pos.y = WATER_LEVEL
          p.state = 'sinking'
          p.age = 0

          const center = new THREE.Vector3(startPosition[0], WATER_LEVEL, startPosition[2])
          const dir = p.pos.clone().sub(center)
          dir.y = 0
          p.radialDir =
            dir.length() > 0.01
              ? dir.normalize()
              : new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
        }

        instanceData.dummy.position.copy(p.pos)
        instanceData.dummy.scale.set(p.scale, p.scale, p.scale)
        instanceData.dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
        return
      }

      if (p.state === 'sinking') {
        const dissolveSpeed = 0.08 * (1 + sugarAmount * 0.1)
        p.pos.y -= dissolveSpeed * clampedDelta

        const radialSpeed = 0.06 * (1 - p.opacity)
        if (p.radialDir) {
          p.pos.x += p.radialDir.x * radialSpeed * clampedDelta
          p.pos.z += p.radialDir.z * radialSpeed * clampedDelta
        }

        const diffBase = 0.003
        const diffusion = diffBase + (1 - p.opacity) * 0.01
        const seedX = i * 0.1 + instanceData.timeOffset
        const seedZ = i * 0.15 + instanceData.timeOffset
        p.pos.x += Math.sin(localTime * 10 + seedX) * diffusion * clampedDelta
        p.pos.z += Math.cos(localTime * 8 + seedZ) * diffusion * clampedDelta

        const fadeSpeed = 0.3 * (1 / sugarAmount)
        p.opacity = Math.max(0, p.opacity - fadeSpeed * clampedDelta)
        p.scale = Math.max(0, p.scale - 0.15 * clampedDelta)

        if (p.opacity <= 0 || p.scale <= 0) {
          p.state = 'removed'
          remainingCount--

          instanceData.dummy.position.set(0, -100, 0)
          instanceData.dummy.scale.set(0, 0, 0)
          instanceData.dummy.updateMatrix()
          meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
          return
        }

        instanceData.dummy.position.copy(p.pos)
        instanceData.dummy.scale.set(p.scale, p.scale, p.scale)
        instanceData.dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
        return
      }

      if (p.state === 'waiting') {
        instanceData.dummy.position.copy(p.initialPos)
        instanceData.dummy.scale.set(p.scale, p.scale, p.scale)
        instanceData.dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
        return
      }
    })

    if (remainingCount === 0 && active.current && !hasCalledCallback.current && shouldDrop) {
      handleDissolved()
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, instanceData.numParticles]}
      frustumCulled={false}
      name={`sugar-particles-${beakerId}`}
    >
      <sphereGeometry args={[0.005, 6, 6]} />
      <meshStandardMaterial transparent opacity={1} color='white' depthWrite={false} />
    </instancedMesh>
  )
}