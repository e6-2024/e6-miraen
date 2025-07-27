import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
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

function AngleLines({ azimuth, altitude, shadowLength, angleGroundLevel = 0, sunPosition }: AngleLinesProps) {
  const dashedLineRef = useRef<THREE.Line>(null)
  const angleLineRef = useRef<THREE.Line>(null)
  
  const poleInfo = {
    height: 2.55,
    topPosition: [0, 2.55, 0] as const,
    radius: 0.1
  }

  const shadowEnd = useMemo(() => {
    const poleTop = new THREE.Vector3(...poleInfo.topPosition)
    const sunDir = new THREE.Vector3(sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ).normalize()

    const groundLevel = 0

    const t = (poleTop.y - groundLevel) / sunDir.y

    const shadowEndPoint = new THREE.Vector3(poleTop.x - sunDir.x * t, groundLevel, poleTop.z - sunDir.z * t)

    return [shadowEndPoint.x, shadowEndPoint.y, shadowEndPoint.z] as const
  }, [sunPosition, poleInfo.topPosition])

  const straightLineGeometry = useMemo(() => {
    const poleTop = new THREE.Vector3(...poleInfo.topPosition)
    const shadowEndVec = new THREE.Vector3(...shadowEnd)
    const sunPositionVec = new THREE.Vector3(sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ)

    const visualDistance = 30.0
    const direction = sunPositionVec.clone().normalize()
    const visualSunPos = poleTop.clone().add(direction.multiplyScalar(visualDistance))

    const linePoints = [shadowEndVec, poleTop, visualSunPos]

    return new THREE.BufferGeometry().setFromPoints(linePoints)
  }, [shadowEnd, poleInfo.topPosition, sunPosition])

  const angleArcGeometry = useMemo(() => {
    const poleTop = new THREE.Vector3(...poleInfo.topPosition)
    const shadowEndVec = new THREE.Vector3(...shadowEnd)

    const direction = poleTop.clone().sub(shadowEndVec).normalize()
    const t = (angleGroundLevel - shadowEndVec.y) / direction.y
    const basePosition = shadowEndVec.clone().add(direction.multiplyScalar(t))

    const radius = 0.6
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

  // Text 위치를 더 중심으로 계산
  const textPosition = useMemo(() => {
    const poleTop = new THREE.Vector3(...poleInfo.topPosition)
    const shadowEndVec = new THREE.Vector3(...shadowEnd)
    
    // 각도 호의 기준점 계산
    const direction = poleTop.clone().sub(shadowEndVec).normalize()
    const t = (angleGroundLevel - shadowEndVec.y) / direction.y
    const basePosition = shadowEndVec.clone().add(direction.multiplyScalar(t))
    
    // 각도의 중간점에서 텍스트 위치 계산
    const sunDir = new THREE.Vector3(sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ).normalize()
    const horizontalDir = new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize()
    const angle = Math.asin(sunDir.y)
    
    // 각도의 절반 지점에서 텍스트 위치
    const halfAngle = angle * 0.5
    const textDirection = horizontalDir.clone()
    textDirection.y = Math.tan(halfAngle) * Math.sqrt(textDirection.x * textDirection.x + textDirection.z * textDirection.z)
    textDirection.normalize().multiplyScalar(1.7) // 호보다 조금 더 바깥쪽
    
    const textPos = basePosition.clone().add(textDirection)
    
    return [textPos.x, textPos.y, textPos.z] as const
  }, [shadowEnd, angleGroundLevel, sunPosition, poleInfo.topPosition])

  useFrame(() => {
    if (dashedLineRef.current) {
      dashedLineRef.current.computeLineDistances()
    }
  })

  return (
    <group>
      <primitive object={new THREE.Line(straightLineGeometry)} ref={dashedLineRef}>
        <lineDashedMaterial color='#ffffff' linewidth={60} dashSize={0.1} gapSize={0.04} transparent opacity={1} />
      </primitive>

      <primitive object={new THREE.Line(angleArcGeometry)} ref={angleLineRef}>
        <lineBasicMaterial color='#ffffff' linewidth={60} />
      </primitive>

      <Protractor
        sunPosition={sunPosition}
        shadowEnd={shadowEnd}
        poleTopPosition={poleInfo.topPosition}
        angleGroundLevel={angleGroundLevel}
      />

      <Ruler shadowEnd={shadowEnd} poleTopPosition={poleInfo.topPosition} />

      <Billboard position={textPosition}>
        <Text
          fontSize={0.3}
          color='#003366'
          anchorX='center'
          anchorY='middle'
          outlineWidth={0.006}
          outlineColor='#ffffff'
          font='/fonts/Maplestory Bold.ttf'>
          {altitude.toFixed(1)}°
        </Text>
      </Billboard>
    </group>
  )
}

export default AngleLines