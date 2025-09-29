// components/5-1-3/DropZoneDebug.tsx
import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

type Ref3D = React.MutableRefObject<THREE.Object3D | null>

interface DropZoneDebugProps {
  enabled?: boolean

  // 비커 참조(왼/오)
  leftRef: Ref3D
  rightRef: Ref3D

  // Fallback 위치/수위 (실제 씬 값과 맞춰주세요)
  leftBeakerPosition?: [number, number, number]
  rightBeakerPosition?: [number, number, number]
  leftWaterLevel?: number
  rightWaterLevel?: number

  // 판정/클램프용 파라미터 (TomatoDragManager와 동일한 값)
  beakerRadiusOverride?: number   // 내부 반지름을 강제로 고정하고 싶을 때
  tomatoRadius?: number           // 기본 0.12
  rPad?: number                   // 기본 0.06 (벽 여유)
  yPad?: number                   // 기본 0.22 (윗면 근처 허용 오차)
}

type BeakerGeom = {
  center: THREE.Vector3
  rimY: number
  innerR: number
}

export function DropZoneDebug({
  enabled = true,
  leftRef,
  rightRef,
  leftBeakerPosition = [-2.15, -0.5, -0.2],
  rightBeakerPosition = [ 2.34, -0.5, -0.2],
  leftWaterLevel = 0.9,
  rightWaterLevel = 0.9,
  beakerRadiusOverride,
  tomatoRadius = 0.12,
  rPad = 0.06,
  yPad = 0.22,
}: DropZoneDebugProps) {
  const getBeakerGeom = (ref: Ref3D, fallbackPos: [number, number, number], waterLevel: number): BeakerGeom => {
    const center = new THREE.Vector3(...fallbackPos)
    let rimY = fallbackPos[1] + waterLevel
    let innerR = beakerRadiusOverride ?? 0.57

    const obj = ref.current
    if (obj) {
      obj.updateWorldMatrix(true, true)
      obj.getWorldPosition(center)

      // bbox로 내부 반경 추정 (벽 두께 보정)
      const box = new THREE.Box3().setFromObject(obj)
      const size = new THREE.Vector3()
      box.getSize(size)
      const estRadius = Math.max(size.x, size.z) * 0.5 * 0.48
      if (beakerRadiusOverride == null) {
        innerR = THREE.MathUtils.clamp(estRadius, 0.45, 0.75)
      }
      // 윗면은 물 표면으로 고정 (씬 편차 회피)
      rimY = fallbackPos[1] + waterLevel
    }
    return { center, rimY, innerR }
  }

  const leftGeom = useMemo(
    () => getBeakerGeom(leftRef, leftBeakerPosition, leftWaterLevel),
    [leftRef, leftBeakerPosition, leftWaterLevel, beakerRadiusOverride]
  )
  const rightGeom = useMemo(
    () => getBeakerGeom(rightRef, rightBeakerPosition, rightWaterLevel),
    [rightRef, rightBeakerPosition, rightWaterLevel, beakerRadiusOverride]
  )

  if (!enabled) return null

  const mkRings = (geom: BeakerGeom, label: string) => {
    const coreR = geom.innerR
    const clampR = geom.innerR + tomatoRadius + rPad
    const topY = geom.rimY + yPad
    const botY = geom.rimY - yPad

    return (
      <group key={label}>
        {/* 중심 마커 */}
        <mesh position={[geom.center.x, geom.rimY, geom.center.z]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshBasicMaterial color={'white'} />
        </mesh>

        {/* 드랍 판정 원 (innerR) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[geom.center.x, geom.rimY + 0.002, geom.center.z]}>
          <ringGeometry args={[coreR - 0.003, coreR + 0.003, 64]} />
          <meshBasicMaterial color={'#00ff7f'} />
        </mesh>

        {/* 침투방지 최소 반경 (innerR + tomatoRadius + rPad) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[geom.center.x, geom.rimY + 0.004, geom.center.z]}>
          <ringGeometry args={[clampR - 0.003, clampR + 0.003, 64]} />
          <meshBasicMaterial color={'#ffd54f'} />
        </mesh>

        {/* Y 윈도우 상단/하단 시각화 (얇은 디스크) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[geom.center.x, topY, geom.center.z]}>
          <circleGeometry args={[coreR * 0.15, 48]} />
          <meshBasicMaterial color={'#42a5f5'} transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[geom.center.x, botY, geom.center.z]}>
          <circleGeometry args={[coreR * 0.15, 48]} />
          <meshBasicMaterial color={'#ef5350'} transparent opacity={0.5} />
        </mesh>

        {/* 라벨 */}
        <Html
          position={[geom.center.x, geom.rimY + 0.1, geom.center.z]}
          style={{
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '6px 8px',
            borderRadius: 6,
            fontSize: 12,
            whiteSpace: 'pre',
          }}>
          {`${label}
innerR: ${geom.innerR.toFixed(3)}
clampR: ${(geom.innerR + tomatoRadius + rPad).toFixed(3)}
rimY: ${geom.rimY.toFixed(3)}
yPad: ${yPad.toFixed(2)}`}
        </Html>
      </group>
    )
  }

  return (
    <>
      {mkRings(leftGeom, 'LEFT')}
      {mkRings(rightGeom, 'RIGHT')}
    </>
  )
}
