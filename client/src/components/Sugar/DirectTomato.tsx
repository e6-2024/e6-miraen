import * as THREE from 'three'
import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import { useFrame } from '@react-three/fiber'

type GLTFResult = GLTF & {
  nodes: {
    Cherry_tomato2: THREE.Mesh
  }
  materials: {
    DefaultMaterial: THREE.MeshPhysicalMaterial
  }
}

interface DirectTomatoProps {
  startPosition?: [number, number, number]
  sugarConcentration?: number // 설탕 농도 (g/100ml)
  beakerRadius?: number
  waterLevel?: number // 물 높이
  beakerPosition?: [number, number, number]
  isDropped?: boolean
  maxRiseHeight?: number // 튕겨올라가 멈출 높이
  riseSpeed?: number // (이전용, 이제 스프링으로 대체 가능)
  riseSpringStiffness?: number // ← 스프링 상수 k
  riseSpringDamping?: number // ← 감쇠 상수 c
  onDrop?: () => void
}

export const DirectTomato: React.FC<DirectTomatoProps> = ({
  startPosition = [0, 2, 0],
  sugarConcentration = 0,
  beakerRadius = 0.32,
  waterLevel = 0.56,
  beakerPosition = [0, -0.6, 0],
  isDropped = false,
  maxRiseHeight,
  riseSpeed = 1.2,
  riseSpringStiffness = 20,
  riseSpringDamping = 5,
  onDrop,
}) => {
  const { nodes, materials } = useGLTF('models/Sugar/tomato1.glb') as GLTFResult
  const meshRef = useRef<THREE.Mesh>(null!)

  // 목표 높이
  const apexY = maxRiseHeight ?? startPosition[1]

  // 상태
  const position = useRef(new THREE.Vector3(...startPosition))
  const velocity = useRef(new THREE.Vector3(0, 0, 0))
  const isInWater = useRef(false)
  const hasDropped = useRef(false)
  const hasBouncedUp = useRef(false)

  // 페이지 가시성 관련 상태 추가
  const lastTime = useRef<number | null>(null)
  const isPageVisible = useRef(true)

  // 물리 상수
  const GRAVITY = -1.5
  const WATER_DRAG = 0.92
  const AIR_DRAG = 0.99
  const BOUNCE_FACTOR = 0.3
  const MAX_DELTA = 1 / 30 // 최대 delta 값을 30fps로 제한

  // 토마토 속성
  const tomatoRadius = 0.12
  const tomatoDensity = 0.95
  const waterDensity = 1.0 + sugarConcentration * 0.004
  const densityDifference = waterDensity - tomatoDensity
  const buoyancyForce = densityDifference * 3.5

  // 페이지 가시성 변화 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden
      if (!document.hidden) {
        // 페이지가 다시 보일 때 타이머 리셋
        lastTime.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // 드롭 토글
  useEffect(() => {
    if (isDropped && !hasDropped.current) {
      hasDropped.current = true
      position.current.set(...startPosition)
      velocity.current.set((Math.random() - 0.5) * 0.3, -0.5, 0.03)
      lastTime.current = null // 타이머 리셋
      onDrop?.()
    } else if (!isDropped && hasDropped.current) {
      // 리셋
      hasDropped.current = false
      isInWater.current = false
      hasBouncedUp.current = false
      position.current.set(...startPosition)
      velocity.current.set(0, 0, 0)
      lastTime.current = null
    }
  }, [isDropped, startPosition, onDrop])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    // delta 값 제한 - 페이지 전환 시 비정상적으로 큰 값 방지
    const clampedDelta = Math.min(delta, MAX_DELTA)

    const pos = position.current
    const vel = velocity.current

    // 드롭 전 고정
    if (!hasDropped.current) {
      meshRef.current.position.set(...startPosition)
      return
    }

    // 이미 스프링 상승 중이면
    if (hasBouncedUp.current) {
      // spring F = -k * x  - c * v
      const displacement = apexY - pos.y
      const springForce = riseSpringStiffness * displacement
      const dampingForce = -riseSpringDamping * vel.y

      // dv = (spring + damping) * dt
      vel.y += (springForce + dampingForce) * clampedDelta
      

      // 위치 업데이트
      pos.y += vel.y * clampedDelta

      if (Math.abs(displacement) < 0.01 && Math.abs(vel.y) < 0.01) {
        pos.y = apexY
        vel.y = 0
      }

      meshRef.current.position.copy(pos)
      return
    }

    // 비커-물 체크
    const dx = pos.x - beakerPosition[0]
    const dz = pos.z - beakerPosition[2]
    const distanceFromCenter = Math.hypot(dx, dz)
    const insideBeaker = distanceFromCenter < beakerRadius - tomatoRadius * 0.5
    const atWaterLevel = pos.y <= beakerPosition[1] + waterLevel - tomatoRadius * 0.5
    const currentlyInWater = insideBeaker && atWaterLevel

    // 중력/부력
    if (currentlyInWater) {
      vel.y += (GRAVITY + buoyancyForce) * clampedDelta
      vel.multiplyScalar(WATER_DRAG)
    } else {
      vel.y += GRAVITY * clampedDelta
      vel.multiplyScalar(AIR_DRAG)
    }
    

    // 위치 업데이트 - clampedDelta 사용
    pos.addScaledVector(vel, clampedDelta)
    

    // 벽 충돌
    const effectiveRadius = beakerRadius - tomatoRadius
    if (distanceFromCenter > effectiveRadius) {
      const n = new THREE.Vector3(dx, 0, dz).normalize()
      pos.x = beakerPosition[0] + n.x * effectiveRadius * 0.9
      pos.z = beakerPosition[2] + n.z * effectiveRadius * 0.9
      const radialVel = vel.x * n.x + vel.z * n.z
      if (radialVel > 0) {
        vel.x -= n.x * radialVel * (1 + BOUNCE_FACTOR)
        vel.z -= n.z * radialVel * (1 + BOUNCE_FACTOR)
      }
    }

    // 바닥 충돌
    if (distanceFromCenter < beakerRadius) {
      const bottomY = beakerPosition[1] - 0.25 + tomatoRadius
      if (pos.y < bottomY) {
        pos.y = bottomY
        vel.y = Math.abs(vel.y) * BOUNCE_FACTOR

        if (sugarConcentration! > 20 && !hasBouncedUp.current) {
          hasBouncedUp.current = true
          vel.y = riseSpeed
        }
      }
    }

    if (pos.y < beakerPosition[1] - 1.0) {
      if (hasBouncedUp.current) {
        pos.y = apexY
        vel.set(0, 0, 0)
      } else {
        pos.y = beakerPosition[1] - 0.25 + tomatoRadius
        vel.y = 0
      }
    }

    if (pos.length() > 3) {
      pos.normalize().multiplyScalar(3)
      vel.set(0, 0, 0)
    }
    if (pos.y > startPosition[1] + 0.5) {
      pos.y = startPosition[1] + 0.5
      vel.y = Math.min(0, vel.y)
    }
    meshRef.current.position.copy(pos)
    meshRef.current.rotation.x += vel.y * clampedDelta * 0.5
    meshRef.current.rotation.z += vel.x * clampedDelta * 0.5
  })

  return (
    <mesh
      ref={meshRef}
      castShadow
      receiveShadow
      geometry={nodes.Cherry_tomato2.geometry}
      rotation={[Math.PI / 2, 0, 0]}
      material={materials.DefaultMaterial}
      scale={6 * 0.01}
    />
  )
}

useGLTF.preload('models/Sugar/tomato1.glb')
