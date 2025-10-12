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

export function BatteryModule1({ batteryType = 'light', showBody = true, ...rest }: Battery1Props) {
  const { nodes, materials } = useGLTF('/models/6-2-3/Battery1new.glb') as AnyGLTF

  return (
    <group {...rest} dispose={null}>
      <group position={[0, 0, 0.49]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        {/* LIGHT */}
        {batteryType === 'light' && (
          <>
            {showBody && (
              <group position={[196.156, 290.374, 0]}>
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh024.geometry}
                  material={materials['phong1.041']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh024_1.geometry}
                  material={materials['Material.127']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh024_2.geometry}
                  material={materials['Material.128']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh024_3.geometry}
                  material={materials['Material.129']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh024_4.geometry}
                  material={materials['Material.130']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh024_5.geometry}
                  material={materials['Plus_Minus.018']}
                />
              </group>
            )}

            <group position={[196.156, 290.374, 0]}>
              {/* 전선/소켓 */}
              <group position={[12.283, 7.776, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={100}>
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any)['BézierCurve008'].geometry}
                  material={materials['Material.131']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any)['BézierCurve008_1'].geometry}
                  material={materials['phong1.042']}
                />
              </group>
              <group position={[-265.111, 45.867, -14.743]} rotation={[0, 1.571, 0]}>
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh025.geometry}
                  material={materials['phong1.042']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh025_1.geometry}
                  material={materials['Material.132']}
                />
              </group>
            </group>
          </>
        )}

        {/* BUZZER */}
        {batteryType === 'buzzer' && (
          <>
            {showBody && (
              <group position={[196.156, 290.374, 0]}>
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh026.geometry}
                  material={materials['phong1.043']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh026_1.geometry}
                  material={materials['Material.133']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh026_2.geometry}
                  material={materials['Material.134']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh026_3.geometry}
                  material={materials['Material.135']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh026_4.geometry}
                  material={materials['Material.136']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh026_5.geometry}
                  material={materials['Plus_Minus.020']}
                />
              </group>
            )}

            <group position={[196.156, 290.374, 0]}>
              <group position={[-105.492, 53.225, -14.743]} rotation={[0, 1.571, 0]}>
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh027.geometry}
                  material={materials['phong1.044']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh027_1.geometry}
                  material={materials['Material.137']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh027_2.geometry}
                  material={materials['Material.138']}
                />
              </group>
              <group position={[-265.111, 45.867, -14.743]} rotation={[0, 1.571, 0]}>
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh028.geometry}
                  material={materials['phong1.044']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh028_1.geometry}
                  material={materials['Material.139']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh028_2.geometry}
                  material={materials['Material.140']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh028_3.geometry}
                  material={materials['phong1.045']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh028_4.geometry}
                  material={materials['Material.141']}
                />
              </group>
            </group>
          </>
        )}

        {/* FAN */}
        {batteryType === 'fan' && (
          <>
            {/* 부착물(프로펠러/단자 등) */}
            <group position={[196.156, 290.374, 0]}>
              <group position={[-105.492, 53.225, -14.743]} rotation={[0, 1.571, 0]}>
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh029.geometry}
                  material={materials['phong1.046']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh029_1.geometry}
                  material={materials['Material.142']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh029_2.geometry}
                  material={materials['Material.143']}
                />
              </group>
              <group position={[-265.111, 45.867, -14.743]} rotation={[0, 1.571, 0]}>
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh030.geometry}
                  material={materials['phong1.046']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh030_1.geometry}
                  material={materials['Material.144']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh030_2.geometry}
                  material={materials['Material.145']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh030_3.geometry}
                  material={materials['phong1.047']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh030_4.geometry}
                  material={materials['Material.146']}
                />
              </group>
            </group>

            {/* 본체 */}
            {showBody && (
              <group position={[196.156, 290.374, 0]}>
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh031.geometry}
                  material={materials['phong1.048']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh031_1.geometry}
                  material={materials['Material.147']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh031_2.geometry}
                  material={materials['Material.148']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh031_3.geometry}
                  material={materials['Material.149']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh031_4.geometry}
                  material={materials['Material.150']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh031_5.geometry}
                  material={materials['Plus_Minus.021']}
                />
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

export function BatteryModule2({ batteryType = 'light', showBody = true, ...rest }: Battery2Props) {
  const { nodes, materials } = useGLTF('/models/6-2-3/Battery2new.glb') as AnyGLTF

  return (
    <group {...rest} dispose={null}>
      {/* ---------- FAN (모터/날개 프롭) ---------- */}
      {batteryType === 'fan' && (
        <group position={[2.084, 0, 3.472]}>
          <mesh
            castShadow
            receiveShadow
            geometry={(nodes as any)['fan-black002'].geometry}
            material={materials['Material.151']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={(nodes as any)['fan-black002_1'].geometry}
            material={materials['phong1.049']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={(nodes as any)['fan-black002_2'].geometry}
            material={materials['Material.152']}
          />
        </group>
      )}

      {/* FAN 본체/보드 + 사이드 파츠 */}
      {batteryType === 'fan' && (
        <group position={[12.276, 0, -2.136]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          {/* 본체/보드 (Mesh032 세트) */}
          {showBody && (
            <group position={[-1254.657, 262.64, 0]}>
              <group position={[139.973, 290.374, 0]}>
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh032.geometry}
                  material={materials['phong1.050']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh032_1.geometry}
                  material={materials['Material.153']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh032_2.geometry}
                  material={materials['Material.154']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh032_3.geometry}
                  material={materials['Material.155']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh032_4.geometry}
                  material={materials['Material.156']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh032_5.geometry}
                  material={materials['Plus_Minus.022']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh032_6.geometry}
                  material={materials['Plus_Minus.023']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh032_7.geometry}
                  material={materials['phong1.051']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh032_8.geometry}
                  material={materials['Material.157']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh032_9.geometry}
                  material={materials['Material.158']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh032_10.geometry}
                  material={materials['Material.159']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh032_11.geometry}
                  material={materials['Material.160']}
                />
              </group>
            </group>
          )}

          {/* 사이드 파츠 (Mesh033 세트) */}
          <group position={[-1116.292, 348.406, 0]}>
            <group position={[-265.111, 250.643, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh
                castShadow
                receiveShadow
                geometry={(nodes as any).Mesh033.geometry}
                material={materials['phong1.049']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={(nodes as any).Mesh033_1.geometry}
                material={materials['Material.161']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={(nodes as any).Mesh033_2.geometry}
                material={materials['Material.162']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={(nodes as any).Mesh033_3.geometry}
                material={materials['phong1.052']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={(nodes as any).Mesh033_4.geometry}
                material={materials['Material.163']}
              />
            </group>
          </group>
        </group>
      )}

      {/* ---------- BUZZER (빨강 와이어 + 블랙 하우징 + 본체) ---------- */}
      {batteryType === 'buzzer' && (
        <>
          {/* 빨강 와이어 (BézierCurve009 세트) */}
          <group position={[-1.996, 0.308, 0]}>
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve009.geometry}
              material={materials['Material.164']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve009_1.geometry}
              material={materials['phong1.053']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve009_2.geometry}
              material={materials['Material.165']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve009_3.geometry}
              material={materials['phong1.054']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve009_4.geometry}
              material={materials['Material.166']}
            />
          </group>

          {/* 블랙 하우징 파츠 (Mesh035 세트) */}
          <group position={[12.528, 0, -2.023]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
            <group position={[-1116.292, 337.698, 0]}>
              <group position={[91.384, 251.737, -14.743]} rotation={[0, 1.571, 0]}>
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh035.geometry}
                  material={materials['phong1.053']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh035_1.geometry}
                  material={materials['Material.175']}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={(nodes as any).Mesh035_2.geometry}
                  material={materials['Material.176']}
                />
              </group>
            </group>
          </group>

          {/* 본체/보드 (Mesh034 세트) */}
          {showBody && (
            <group position={[12.528, 0, -2.023]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
              <group position={[-1252.784, 251.339, 0]}>
                <group position={[137.461, 290.374, 0]}>
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034.geometry}
                    material={materials['phong1.055']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_1.geometry}
                    material={materials['Material.167']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_2.geometry}
                    material={materials['Material.168']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_3.geometry}
                    material={materials['Material.169']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_4.geometry}
                    material={materials['Material.170']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_5.geometry}
                    material={materials['Plus_Minus.024']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_6.geometry}
                    material={materials['Plus_Minus.025']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_7.geometry}
                    material={materials['phong1.056']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_8.geometry}
                    material={materials['Material.171']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_9.geometry}
                    material={materials['Material.172']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_10.geometry}
                    material={materials['Material.173']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_11.geometry}
                    material={materials['Material.174']}
                  />
                </group>
              </group>
            </group>
          )}
        </>
      )}

      {/* ---------- LIGHT (와이어 2세트 + 본체/보드 2세트) ---------- */}
      {batteryType === 'light' && (
        <>
          {/* 빨강/회색 와이어 A (BézierCurve010) */}
          <group position={[-1.996, 0.308, 0]}>
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve010.geometry}
              material={materials['Material.177']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve010_1.geometry}
              material={materials['phong1.057']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve010_2.geometry}
              material={materials['Material.178']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve010_3.geometry}
              material={materials['phong1.058']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve010_4.geometry}
              material={materials['Material.179']}
            />
          </group>

          {/* 빨강/회색 와이어 B (BézierCurve011) + 확장 보드(ShowBody시 Mesh036) */}
          <group position={[2.084, 0, 3.472]}>
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve011.geometry}
              material={materials['Material.180']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve011_1.geometry}
              material={materials['phong1.058']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={(nodes as any).BézierCurve011_2.geometry}
              material={materials['Material.181']}
            />

            {/* 확장 보드 (Mesh036 세트) */}
            {showBody && (
              <group position={[-2.084, 0, -2.982]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
                <group position={[130.616, 290.374, 0]}>
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh036.geometry}
                    material={materials['phong1.059']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh036_1.geometry}
                    material={materials['Material.182']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh036_2.geometry}
                    material={materials['Material.183']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh036_3.geometry}
                    material={materials['Material.184']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh036_4.geometry}
                    material={materials['Material.185']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh036_5.geometry}
                    material={materials['Plus_Minus.026']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh036_6.geometry}
                    material={materials['Plus_Minus.027']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh036_7.geometry}
                    material={materials['phong1.060']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh036_8.geometry}
                    material={materials['Material.186']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh036_9.geometry}
                    material={materials['Material.187']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh036_10.geometry}
                    material={materials['Material.188']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh036_11.geometry}
                    material={materials['Material.189']}
                  />
                </group>
              </group>
            )}
          </group>

          {/* 2배터리/보드 (Mesh034 세트) */}
          {showBody && (
            <group position={[12.528, 0, -2.023]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
              <group position={[-1252.784, 251.339, 0]}>
                <group position={[137.461, 290.374, 0]}>
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034.geometry}
                    material={materials['phong1.055']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_1.geometry}
                    material={materials['Material.167']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_2.geometry}
                    material={materials['Material.168']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_3.geometry}
                    material={materials['Material.169']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_4.geometry}
                    material={materials['Material.170']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_5.geometry}
                    material={materials['Plus_Minus.024']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_6.geometry}
                    material={materials['Plus_Minus.025']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_7.geometry}
                    material={materials['phong1.056']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_8.geometry}
                    material={materials['Material.171']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_9.geometry}
                    material={materials['Material.172']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_10.geometry}
                    material={materials['Material.173']}
                  />
                  <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes as any).Mesh034_11.geometry}
                    material={materials['Material.174']}
                  />
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
