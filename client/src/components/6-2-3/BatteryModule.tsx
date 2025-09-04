import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type BatteryType = 'light' | 'buzzer' | 'fan'

// 간단 타입(길어진 노드/머티리얼 이름 대응 위해 느슨하게)
type AnyGLTF = GLTF & {
  nodes: Record<string, THREE.Mesh>
  materials: Record<string, THREE.Material>
}

/* =========================
   Battery 1 ( /Battery1new.glb )
   - light:   Mesh105 set + BézierCurve001 + Mesh001
   - buzzer:  Mesh007 set + (Mesh002, Mesh003 set)
   - fan:     (Mesh004, Mesh005 set) + Mesh006 set
========================= */

type Battery1Props = JSX.IntrinsicElements['group'] & {
  batteryType?: BatteryType
  showBody?: boolean // 예전 BatteryModule0(본체 숨김) 대응
}

export function BatteryModule1({
  batteryType = 'light',
  showBody = true,
  ...rest
}: Battery1Props) {
  const { nodes, materials } = useGLTF('/models/6-2-3/Battery1new.glb') as AnyGLTF

  return (
    <group {...rest} dispose={null}>
      <group position={[0, 0, 0.49]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        {/* LIGHT */}
        {batteryType === 'light' && (
          <>
            {showBody && (
              <group position={[196.156, 290.374, 0]}>
                <mesh castShadow receiveShadow geometry={nodes.Mesh105.geometry} material={materials['phong1.006']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh105_1.geometry} material={materials['Material.025']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh105_2.geometry} material={materials['Material.112']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh105_3.geometry} material={materials['Material.026']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh105_4.geometry} material={materials['Material.027']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh105_5.geometry} material={materials['Plus_Minus.013']} />
              </group>
            )}
            <group position={[196.156, 290.374, 0]}>
              <group position={[12.283, 7.776, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={100}>
                <mesh castShadow receiveShadow geometry={nodes.BézierCurve001.geometry} material={materials['Material.005']} />
                <mesh castShadow receiveShadow geometry={nodes.BézierCurve001_1.geometry} material={materials['phong1.001']} />
              </group>
              <group position={[-265.111, 45.867, -14.743]} rotation={[0, 1.571, 0]}>
                <mesh castShadow receiveShadow geometry={nodes.Mesh001.geometry} material={materials['phong1.001']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh001_1.geometry} material={materials['Material.006']} />
              </group>
            </group>
          </>
        )}

        {/* BUZZER */}
        {batteryType === 'buzzer' && (
          <>
            {showBody && (
              <group position={[196.156, 290.374, 0]}>
                <mesh castShadow receiveShadow geometry={nodes.Mesh007.geometry} material={materials['phong1.008']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh007_1.geometry} material={materials['Material.032']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh007_2.geometry} material={materials['Material.033']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh007_3.geometry} material={materials['Material.034']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh007_4.geometry} material={materials['Material.035']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh007_5.geometry} material={materials['Plus_Minus.006']} />
              </group>
            )}
            
            <group position={[196.156, 290.374, 0]}>
              <group position={[-105.492, 53.225, -14.743]} rotation={[0, 1.571, 0]}>
                <mesh castShadow receiveShadow geometry={nodes.Mesh002.geometry} material={materials['phong1.002']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh002_1.geometry} material={materials['Material.011']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh002_2.geometry} material={materials['Material.012']} />
              </group>
              <group position={[-265.111, 45.867, -14.743]} rotation={[0, 1.571, 0]}>
                <mesh castShadow receiveShadow geometry={nodes.Mesh003.geometry} material={materials['phong1.002']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh003_1.geometry} material={materials['Material.013']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh003_2.geometry} material={materials['Material.014']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh003_3.geometry} material={materials['phong1.003']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh003_4.geometry} material={materials['Material.015']} />
              </group>
            </group>
          </>
        )}

        {/* FAN */}
        {batteryType === 'fan' && (
          <>
            <group position={[196.156, 290.374, 0]}>
              <group position={[-105.492, 53.225, -14.743]} rotation={[0, 1.571, 0]}>
                <mesh castShadow receiveShadow geometry={nodes.Mesh004.geometry} material={materials['phong1.004']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh004_1.geometry} material={materials['Material.020']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh004_2.geometry} material={materials['Material.021']} />
              </group>
              <group position={[-265.111, 45.867, -14.743]} rotation={[0, 1.571, 0]}>
                <mesh castShadow receiveShadow geometry={nodes.Mesh005.geometry} material={materials['phong1.004']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh005_1.geometry} material={materials['Material.022']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh005_2.geometry} material={materials['Material.023']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh005_3.geometry} material={materials['phong1.005']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh005_4.geometry} material={materials['Material.024']} />
              </group>
            </group>
            {showBody && (
              <group position={[196.156, 290.374, 0]}>
                <mesh castShadow receiveShadow geometry={nodes.Mesh006.geometry} material={materials['phong1.007']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh006_1.geometry} material={materials['Material.028']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh006_2.geometry} material={materials['Material.029']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh006_3.geometry} material={materials['Material.030']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh006_4.geometry} material={materials['Material.031']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh006_5.geometry} material={materials['Plus_Minus.005']} />
              </group>
            )}
          </>
        )}
      </group>
    </group>
  )
}

useGLTF.preload('/models/6-2-3/Battery1new.glb')

type Battery2Props = JSX.IntrinsicElements['group'] & {
  batteryType?: BatteryType
  showBody?: boolean
}

export function BatteryModule2({
  batteryType = 'light',
  showBody = true,
  ...rest
}: Battery2Props) {
  const { nodes, materials } = useGLTF('/models/6-2-3/Battery2new.glb') as AnyGLTF

  return (
    <group {...rest} dispose={null}>
      {/* FAN 프롭(모터/날개) */}
      {batteryType === 'fan' && (
        <group position={[2.084, 0, 3.472]}>
          <mesh castShadow receiveShadow geometry={nodes['fan-black'].geometry} material={materials['Material.093']} />
          <mesh castShadow receiveShadow geometry={nodes['fan-black_1'].geometry} material={materials['phong1.028']} />
          <mesh castShadow receiveShadow geometry={nodes['fan-black_2'].geometry} material={materials['Material.101']} />
        </group>
      )}

      <group position={[12.276, 0, -2.136]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        {/* FAN 배터리/보드 (예전 batterytwo 대응) */}
        {batteryType === 'fan' && showBody && (
          <group position={[-1254.656, 262.64, 0]}>
            <group position={[139.973, 290.374, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh010.geometry} material={materials['phong1.013']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh010_1.geometry} material={materials['Material.053']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh010_2.geometry} material={materials['Material.056']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh010_3.geometry} material={materials['Material.058']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh010_4.geometry} material={materials['Material.059']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh010_5.geometry} material={materials['Plus_Minus.010']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh010_6.geometry} material={materials['Plus_Minus.011']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh010_7.geometry} material={materials['phong1.014']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh010_8.geometry} material={materials['Material.060']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh010_9.geometry} material={materials['Material.067']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh010_10.geometry} material={materials['Material.068']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh010_11.geometry} material={materials['Material.069']} />
            </group>
          </group>
        )}

        {/* FAN 사이드 파츠(예전 Mesh097 set) */}
        {batteryType === 'fan' && (
          <group position={[-1116.292, 348.406, 0]}>
            <group position={[-265.111, 250.643, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh097.geometry} material={materials['phong1.028']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh097_1.geometry} material={materials['Material.100']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh097_2.geometry} material={materials['Material.092']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh097_3.geometry} material={materials['phong1.027']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh097_4.geometry} material={materials['Material.094']} />
            </group>
          </group>
        )}
      </group>

      {/* BUZZER (빨강 와이어 + 블랙 모듈) */}
      {batteryType === 'buzzer' && (
        <>
          {/* 빨강 와이어/커브 */}
          <group position={[-1.996, 0.308, 0]}>
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve034.geometry} material={materials['Material.117']} />
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve034_1.geometry} material={materials['phong1.033']} />
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve034_2.geometry} material={materials['Material.123']} />
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve034_3.geometry} material={materials['phong1.034']} />
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve034_4.geometry} material={materials['Material.126']} />
          </group>

          {/* 블랙 하우징 파츠 */}
          <group position={[12.528, 0, -2.023]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
            <group position={[-1116.292, 337.698, 0]}>
              <group position={[91.384, 251.737, -14.743]} rotation={[0, 1.571, 0]}>
                <mesh castShadow receiveShadow geometry={nodes.Mesh112.geometry} material={materials['phong1.033']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh112_1.geometry} material={materials['Material.124']} />
                <mesh castShadow receiveShadow geometry={nodes.Mesh112_2.geometry} material={materials['Material.118']} />
              </group>
            </group>
          </group>

          {showBody && (
              <group position={[12.528, 0, -2.023]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
                <group position={[-1252.784, 251.339, 0]}>
                  <group position={[137.461, 290.374, 0]}>
                     <mesh castShadow receiveShadow geometry={nodes.Mesh011.geometry} material={materials['phong1.017']} />
                    <mesh castShadow receiveShadow geometry={nodes.Mesh011_1.geometry} material={materials['Material.070']} />
                    <mesh castShadow receiveShadow geometry={nodes.Mesh011_2.geometry} material={materials['Material.071']} />
                    <mesh castShadow receiveShadow geometry={nodes.Mesh011_3.geometry} material={materials['Material.072']} />
                    <mesh castShadow receiveShadow geometry={nodes.Mesh011_4.geometry} material={materials['Material.073']} />
                    <mesh castShadow receiveShadow geometry={nodes.Mesh011_5.geometry} material={materials['Plus_Minus.015']} />
                    <mesh castShadow receiveShadow geometry={nodes.Mesh011_6.geometry} material={materials['Plus_Minus.019']} />
                    <mesh castShadow receiveShadow geometry={nodes.Mesh011_7.geometry} material={materials['phong1.018']} />
                    <mesh castShadow receiveShadow geometry={nodes.Mesh011_8.geometry} material={materials['Material.074']} />
                    <mesh castShadow receiveShadow geometry={nodes.Mesh011_9.geometry} material={materials['Material.075']} />
                    <mesh castShadow receiveShadow geometry={nodes.Mesh011_10.geometry} material={materials['Material.076']} />
                    <mesh castShadow receiveShadow geometry={nodes.Mesh011_11.geometry} material={materials['Material.077']} />
                  </group>
                </group>
              </group>
            )}
        </>
      )}

      {/* LIGHT (빨강/회색 와이어 + 2배터리/보드 + 확장 보드) */}
      {batteryType === 'light' && (
        <>
          {/* 빨강/회색 와이어 */}
          <group position={[-1.996, 0.308, 0]}>
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve002.geometry} material={materials['Material.036']} />
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve002_1.geometry} material={materials['phong1.009']} />
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve002_2.geometry} material={materials['Material.037']} />
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve002_3.geometry} material={materials['phong1.010']} />
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve002_4.geometry} material={materials['Material.038']} />
          </group>
          <group position={[2.084, 0, 3.472]}>
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve003.geometry} material={materials['Material.039']} />
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve003_1.geometry} material={materials['phong1.010']} />
            <mesh castShadow receiveShadow geometry={nodes.BézierCurve003_2.geometry} material={materials['Material.040']} />
            {/* 확장 보드/배터리(예전 Mesh011 set) */}
            {showBody && (
              <group position={[-2.084, 0, -2.982]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
                <group position={[130.616, 290.374, 0]}>
                  <mesh castShadow receiveShadow geometry={nodes.Mesh011.geometry} material={materials['phong1.017']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh011_1.geometry} material={materials['Material.070']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh011_2.geometry} material={materials['Material.071']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh011_3.geometry} material={materials['Material.072']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh011_4.geometry} material={materials['Material.073']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh011_5.geometry} material={materials['Plus_Minus.015']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh011_6.geometry} material={materials['Plus_Minus.019']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh011_7.geometry} material={materials['phong1.018']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh011_8.geometry} material={materials['Material.074']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh011_9.geometry} material={materials['Material.075']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh011_10.geometry} material={materials['Material.076']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh011_11.geometry} material={materials['Material.077']} />
                </group>
              </group>
            )}
          </group>

          {/* 2배터리/보드(예전 Mesh110 역할) → 여기선 Mesh008 set로 보임 */}
          {showBody && (
            <group position={[12.528, 0, -2.023]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
              <group position={[-1252.784, 251.339, 0]}>
                <group position={[137.461, 290.374, 0]}>
                  <mesh castShadow receiveShadow geometry={nodes.Mesh008.geometry} material={materials['phong1.011']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh008_1.geometry} material={materials['Material.045']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh008_2.geometry} material={materials['Material.046']} />
                  <mesh castShadow receiveShadow geometry={nodes.Mesh008_3.geometry} material={materials['Material.047']} />
                </group>
              </group>
            </group>
          )}
        </>
      )}
    </group>
  )
}

useGLTF.preload('/models/6-2-3/Battery2new.glb')
