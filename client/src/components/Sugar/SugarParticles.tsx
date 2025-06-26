import { useRef, useEffect, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const GRAVITY = -2.0
const WATER_LEVEL = 0.8

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
}

export function SugarParticles({
  startPosition = [0, 2, 0],
  shouldDrop = false,
  sugarAmount = 1.0,
  onAllDissolved,
  beakerId = 'default',
  isCompleted = false,
}: SugarParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)

  // 안정적인 인스턴스 데이터 - beakerId 변경으로 재생성되지 않도록
  const instanceData = useMemo(() => {
    const dummy = new THREE.Object3D()
    const numParticles = Math.floor(300 * sugarAmount)
    const timeOffset = Math.random() * 1000
    return {
      dummy,
      numParticles,
      timeOffset,
    }
  }, []) // 의존성 제거하여 한 번만 생성

  // 각 인스턴스별 독립적인 상태
  const particles = useRef<Particle[]>([])
  const remaining = useRef(0)
  const active = useRef(false)
  const hasCalledCallback = useRef(false)
  const lastShouldDrop = useRef(false)

  // 파티클 초기화 함수
  const initializeParticles = useCallback(() => {
    if (particles.current.length > 0) return // 이미 초기화되었으면 스킵

    console.log(`${beakerId}: 파티클 초기화`)
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

  // 컴포넌트 마운트 시 파티클 초기화
  useEffect(() => {
    initializeParticles()
  }, [initializeParticles])

  // 실험 완료 시 컴포넌트 언마운트
  useEffect(() => {
    if (isCompleted) {
      console.log(`${beakerId}: 실험 완료로 인한 파티클 정리`)
      // 모든 파티클을 removed 상태로 변경
      particles.current.forEach((p) => {
        p.state = 'removed'
        p.opacity = 0
        p.scale = 0
      })
      active.current = false
    }
  }, [isCompleted, beakerId])

  // shouldDrop 상태 변경 처리
  // shouldDrop 상태 변경 처리
  useEffect(() => {
    // 실험이 완료된 경우 더 이상 파티클 드롭하지 않음
    if (isCompleted) return

    const currentShouldDrop = shouldDrop
    const prevShouldDrop = lastShouldDrop.current

    console.log(`${beakerId}: shouldDrop 변경 - prev: ${prevShouldDrop}, current: ${currentShouldDrop}, active: ${active.current}`)

    if (currentShouldDrop && !prevShouldDrop) {
      // 드롭 시작
      console.log(`${beakerId}: 설탕 드롭 시작!`)
      active.current = true
      remaining.current = instanceData.numParticles
      hasCalledCallback.current = false

      // 파티클이 초기화되지 않았다면 초기화
      if (particles.current.length === 0) {
        initializeParticles()
      }

      // 모든 파티클을 falling 상태로 변경
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
      console.log(`${beakerId}: ${particles.current.length}개 파티클이 falling 상태로 변경됨`)
    } else if (!currentShouldDrop && prevShouldDrop) {
      // 드롭 중지 (다음 스푼을 위한 준비)
      console.log(`${beakerId}: 설탕 드롭 중지, 다음 스푼 준비`)
      active.current = false
      hasCalledCallback.current = false
      remaining.current = instanceData.numParticles

      // 모든 파티클을 다시 초기 위치에 대기 상태로
      particles.current.forEach((p) => {
        p.state = 'waiting'
        p.pos.copy(p.initialPos)
        p.opacity = 1
        p.scale = 0.5 + Math.random() * 0.4
        p.age = 0
      })
    }

    lastShouldDrop.current = currentShouldDrop
  }, [shouldDrop, beakerId, instanceData.numParticles, initializeParticles, isCompleted])

  const handleDissolved = useCallback(() => {
    console.log(`${beakerId}: 모든 파티클 용해 완료`)
    hasCalledCallback.current = true

    setTimeout(() => {
      if (onAllDissolved) {
        console.log(`${beakerId}: onAllDissolved 콜백 호출`)
        onAllDissolved()
      }
    }, 200)
  }, [beakerId, onAllDissolved])

  // 애니메이션 루프
  useFrame((state, delta) => {
    if (!meshRef.current || particles.current.length === 0 || isCompleted) return

    const localTime = state.clock.elapsedTime + instanceData.timeOffset

    // shouldDrop이 false이거나 active가 false인 경우: 모든 파티클을 초기 위치에 표시
    if (!shouldDrop || !active.current) {
      particles.current.forEach((p, i) => {
        if (p.state === 'waiting') {
          instanceData.dummy.position.copy(p.initialPos)
          instanceData.dummy.scale.set(p.scale, p.scale, p.scale)
        } else {
          // removed 상태의 파티클은 숨김
          instanceData.dummy.position.set(0, -100, 0)
          instanceData.dummy.scale.set(0, 0, 0)
        }
        instanceData.dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
      })
      meshRef.current.instanceMatrix.needsUpdate = true
      return
    }

    // 애니메이션 실행 중 (shouldDrop이 true이고 active가 true일 때)
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

      p.age += delta

      // falling 단계
      if (p.state === 'falling') {
        if (p.age < p.delay) {
          // 대기 중이지만 초기 위치에서 표시
          instanceData.dummy.position.copy(p.initialPos)
          instanceData.dummy.scale.set(p.scale, p.scale, p.scale)
          instanceData.dummy.updateMatrix()
          meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
          return
        }

        // 낙하 시작
        p.vel.y += GRAVITY * delta
        p.vel.multiplyScalar(0.98)
        p.pos.addScaledVector(p.vel, delta)

        // 물에 닿으면 sinking으로 전환
        if (p.pos.y <= WATER_LEVEL) {
          p.pos.y = WATER_LEVEL
          p.state = 'sinking'
          p.age = 0

          // 방사형 방향 설정
          const center = new THREE.Vector3(startPosition[0], WATER_LEVEL, startPosition[2])
          const dir = p.pos.clone().sub(center)
          dir.y = 0
          p.radialDir =
            dir.length() > 0.01
              ? dir.normalize()
              : new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
        }

        // falling 상태에서의 렌더링
        instanceData.dummy.position.copy(p.pos)
        instanceData.dummy.scale.set(p.scale, p.scale, p.scale)
        instanceData.dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
        return
      }

      // sinking 단계
      if (p.state === 'sinking') {
        // 용해 - 아래로 내려가는 속도는 유지
        const dissolveSpeed = 0.08 * (1 + sugarAmount * 0.1)
        p.pos.y -= dissolveSpeed * delta

        // 방사형 확산 - 더 점진적으로 조정
        const radialSpeed = 0.06 * (1 - p.opacity)
        if (p.radialDir) {
          p.pos.x += p.radialDir.x * radialSpeed * delta
          p.pos.z += p.radialDir.z * radialSpeed * delta
        }

        // 브라운 운동 - 더 자연스럽게 조정
        const diffBase = 0.003
        const diffusion = diffBase + (1 - p.opacity) * 0.01
        const seedX = i * 0.1 + instanceData.timeOffset
        const seedZ = i * 0.15 + instanceData.timeOffset
        p.pos.x += Math.sin(localTime * 10 + seedX) * diffusion * delta
        p.pos.z += Math.cos(localTime * 8 + seedZ) * diffusion * delta

        // 투명도와 크기 감소 - 물속에서 더 깊이 내려갈 수 있도록 매우 천천히
        const fadeSpeed = 0.3 * (1 / sugarAmount)
        p.opacity = Math.max(0, p.opacity - fadeSpeed * delta)
        p.scale = Math.max(0, p.scale - 0.15 * delta)

        // 완전 용해 확인
        if (p.opacity <= 0 || p.scale <= 0) {
          p.state = 'removed'
          remainingCount--

          instanceData.dummy.position.set(0, -100, 0)
          instanceData.dummy.scale.set(0, 0, 0)
          instanceData.dummy.updateMatrix()
          meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
          return
        }

        // sinking 상태에서의 렌더링
        instanceData.dummy.position.copy(p.pos)
        instanceData.dummy.scale.set(p.scale, p.scale, p.scale)
        instanceData.dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
        return
      }

      // waiting 상태 (초기 대기)
      if (p.state === 'waiting') {
        instanceData.dummy.position.copy(p.initialPos)
        instanceData.dummy.scale.set(p.scale, p.scale, p.scale)
        instanceData.dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, instanceData.dummy.matrix)
        return
      }
    })

    // 모든 파티클이 용해되었을 때 콜백 호출
    if (remainingCount === 0 && active.current && !hasCalledCallback.current && shouldDrop) {
      console.log(`${beakerId}: 모든 파티클 용해 완료, 콜백 호출`)
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