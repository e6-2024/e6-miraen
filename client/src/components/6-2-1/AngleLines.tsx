import React, { useMemo, useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import Protractor from './Protractor'
import Ruler from './Ruler'

interface AngleLinesProps {
  azimuth: number
  altitude: number
  shadowLength: number
  angleGroundLevel?: number
  sunPosition: {
    sunX: number
    sunY: number
    sunZ: number
    azimuthRad: number
    altitudeRad: number
  }
}

function AngleLines({ azimuth, altitude, shadowLength, angleGroundLevel = -0.3, sunPosition }: AngleLinesProps) {
  const { scene } = useThree()
  const dashedLineRef = useRef<THREE.Line>(null)
  const angleLineRef = useRef<THREE.Line>(null)
  const [poleInfo, setPoleInfo] = useState<{ height: number; topPosition: [number, number, number] }>({
    height: 2.0,
    topPosition: [0, 2.0, 0],
  })

  useEffect(() => {
    const findPoleModel = () => {
      let poleHeight = 4.0
      let poleTopY = 2.0

      scene.traverse((child) => {
        if (child.name && child.name.toLowerCase().includes('cylinder')) {
          const box = new THREE.Box3().setFromObject(child)
          poleHeight = box.max.y - box.min.y
          poleTopY = box.max.y
          console.log('Pole found:', { height: poleHeight, topY: poleTopY })
        }
      })

      setPoleInfo({
        height: poleHeight,
        topPosition: [0, poleTopY, 0], // Removed 'as const'
      })
    }

    const timer = setTimeout(findPoleModel, 1000)
    return () => clearTimeout(timer)
  }, [scene])

  const shadowEnd = useMemo(() => {
    const poleTop = new THREE.Vector3(...poleInfo.topPosition)
    const sunDir = new THREE.Vector3(sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ).normalize()

    const groundLevel = -1

    const t = (poleTop.y - groundLevel) / sunDir.y

    const shadowEndPoint = new THREE.Vector3(poleTop.x - sunDir.x * t, groundLevel, poleTop.z - sunDir.z * t)

    return [shadowEndPoint.x, shadowEndPoint.y, shadowEndPoint.z] as const
  }, [sunPosition, poleInfo.topPosition])

  const straightLineGeometry = useMemo(() => {
    const poleTop = new THREE.Vector3(...poleInfo.topPosition)
    const shadowEndVec = new THREE.Vector3(...shadowEnd)
    const sunPositionVec = new THREE.Vector3(sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ)

    const visualDistance = 3.0
    const direction = sunPositionVec.clone().normalize()
    const visualSunPos = poleTop.clone().add(direction.multiplyScalar(visualDistance))

    const linePoints = [shadowEndVec, poleTop, visualSunPos]

    return new THREE.BufferGeometry().setFromPoints(linePoints)
  }, [shadowEnd, poleInfo.topPosition, sunPosition])

  const angleArcGeometry = useMemo(() => {
    const poleTop = new THREE.Vector3(...poleInfo.topPosition)
    const shadowEndVec = new THREE.Vector3(...shadowEnd)

    // 그림자 끝점에서 막대 꼭대기로 향하는 직선에서 angleGroundLevel 높이의 지점 계산
    const direction = poleTop.clone().sub(shadowEndVec).normalize()
    const t = (angleGroundLevel - shadowEndVec.y) / direction.y
    const basePosition = shadowEndVec.clone().add(direction.multiplyScalar(t))

    const radius = 0.25
    const segments = 20
    const points = []

    const sunDir = new THREE.Vector3(sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ).normalize()
    const horizontalDir = new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize()

    const angle = Math.asin(sunDir.y)

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const currentAngle = angle * t

      const direction = horizontalDir.clone()
      direction.y = Math.tan(currentAngle) * Math.sqrt(direction.x * direction.x + direction.z * direction.z)
      direction.normalize().multiplyScalar(radius)

      const point = basePosition.clone().add(direction)
      points.push(point)
    }

    return new THREE.BufferGeometry().setFromPoints(points)
  }, [shadowEnd, angleGroundLevel, sunPosition, poleInfo.topPosition])

  useFrame(() => {
    if (dashedLineRef.current) {
      dashedLineRef.current.computeLineDistances()
    }
  })

  return (
    <group>
      {/* 기존 선들 */}
      <primitive object={new THREE.Line(straightLineGeometry)} ref={dashedLineRef}>
        <lineDashedMaterial color='#ffffff' linewidth={10} dashSize={0.08} gapSize={0.04} transparent opacity={0.9} />
      </primitive>

      <primitive object={new THREE.Line(angleArcGeometry)} ref={angleLineRef}>
        <lineBasicMaterial color='#ffffff' linewidth={30} />
      </primitive>

      {/* 새로운 각도기 컴포넌트 */}
      <Protractor
        sunPosition={sunPosition}
        shadowEnd={shadowEnd}
        poleTopPosition={poleInfo.topPosition}
        angleGroundLevel={angleGroundLevel}
      />

      {/* 새로운 자 컴포넌트 */}
      <Ruler shadowEnd={shadowEnd} poleTopPosition={poleInfo.topPosition} />

      {/* 각도 텍스트 */}
      <Text
        position={[
          shadowEnd[0] +
            (poleInfo.topPosition[0] - shadowEnd[0]) *
              ((angleGroundLevel - shadowEnd[1]) / (poleInfo.topPosition[1] - shadowEnd[1])) +
            0.35 * Math.sin(sunPosition.azimuthRad),
          angleGroundLevel + 0.15,
          shadowEnd[2] +
            (poleInfo.topPosition[2] - shadowEnd[2]) *
              ((angleGroundLevel - shadowEnd[1]) / (poleInfo.topPosition[1] - shadowEnd[1])) +
            0.35 * Math.cos(sunPosition.azimuthRad),
        ]}
        fontSize={0.08}
        color='#003366'
        anchorX='center'
        anchorY='middle'
        outlineWidth={0.006}
        outlineColor='#ffffff'
        font='/fonts/Maplestory Bold.ttf'>
        {altitude.toFixed(1)}°
      </Text>
    </group>
  )
}

export default AngleLines