import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult1 = GLTF & {
  nodes: {
    battery001: THREE.Mesh
    battery001_1: THREE.Mesh
    battery001_2: THREE.Mesh
    battery001_3: THREE.Mesh
    battery001_4: THREE.Mesh
    battery001_5: THREE.Mesh
    BézierCurve020: THREE.Mesh
    BézierCurve020_1: THREE.Mesh
    Mesh080: THREE.Mesh
    Mesh080_1: THREE.Mesh
    battery: THREE.Mesh
    battery_1: THREE.Mesh
    battery_2: THREE.Mesh
    battery_3: THREE.Mesh
    battery_4: THREE.Mesh
    battery_5: THREE.Mesh
    Mesh107: THREE.Mesh
    Mesh107_1: THREE.Mesh
    Mesh107_2: THREE.Mesh
    Mesh106: THREE.Mesh
    Mesh106_1: THREE.Mesh
    Mesh106_2: THREE.Mesh
    Mesh106_3: THREE.Mesh
    Mesh106_4: THREE.Mesh
    battery002: THREE.Mesh
    battery002_1: THREE.Mesh
    battery002_2: THREE.Mesh
    battery002_3: THREE.Mesh
    battery002_4: THREE.Mesh
    battery002_5: THREE.Mesh
    Mesh101: THREE.Mesh
    Mesh101_1: THREE.Mesh
    Mesh101_2: THREE.Mesh
    Mesh090: THREE.Mesh
    Mesh090_1: THREE.Mesh
    Mesh090_2: THREE.Mesh
    Mesh090_3: THREE.Mesh
    Mesh090_4: THREE.Mesh
  }
  materials: {
    ['phong1.029']: THREE.MeshPhysicalMaterial
    ['Material.103']: THREE.MeshPhysicalMaterial
    ['Material.104']: THREE.MeshPhysicalMaterial
    ['Material.105']: THREE.MeshPhysicalMaterial
    ['Material.106']: THREE.MeshPhysicalMaterial
    ['Plus_Minus.016']: THREE.MeshPhysicalMaterial
    ['Material.107']: THREE.MeshPhysicalMaterial
    ['Material.108']: THREE.MeshPhysicalMaterial
    ['phong1.032']: THREE.MeshPhysicalMaterial
    ['Material.125']: THREE.MeshPhysicalMaterial
    ['Material.127']: THREE.MeshPhysicalMaterial
    ['Material.128']: THREE.MeshPhysicalMaterial
    ['Material.129']: THREE.MeshPhysicalMaterial
    ['Plus_Minus.017']: THREE.MeshPhysicalMaterial
    ['Material.131']: THREE.MeshPhysicalMaterial
    ['Material.111']: THREE.MeshPhysicalMaterial
    ['Material.130']: THREE.MeshPhysicalMaterial
    ['Material.110']: THREE.MeshPhysicalMaterial
    ['phong1.031']: THREE.MeshPhysicalMaterial
    ['Material.113']: THREE.MeshPhysicalMaterial
    ['phong1.037']: THREE.MeshPhysicalMaterial
    ['Material.137']: THREE.MeshPhysicalMaterial
    ['Material.138']: THREE.MeshPhysicalMaterial
    ['Material.139']: THREE.MeshPhysicalMaterial
    ['Material.140']: THREE.MeshPhysicalMaterial
    ['Plus_Minus.018']: THREE.MeshPhysicalMaterial
    ['Material.142']: THREE.MeshPhysicalMaterial
    ['Material.134']: THREE.MeshPhysicalMaterial
    ['Material.141']: THREE.MeshPhysicalMaterial
    ['Material.133']: THREE.MeshPhysicalMaterial
    ['phong1.036']: THREE.MeshPhysicalMaterial
    ['Material.135']: THREE.MeshPhysicalMaterial
  }
}

type GLTFResult2 = GLTF & {
  nodes: {
    ['fan-black']: THREE.Mesh
    ['fan-black_1']: THREE.Mesh
    ['fan-black_2']: THREE.Mesh
    batterytwo: THREE.Mesh
    batterytwo_1: THREE.Mesh
    batterytwo_2: THREE.Mesh
    batterytwo_3: THREE.Mesh
    batterytwo_4: THREE.Mesh
    battertsurface1: THREE.Mesh
    battertsurface2: THREE.Mesh
    Mesh097: THREE.Mesh
    Mesh097_1: THREE.Mesh
    Mesh097_2: THREE.Mesh
    Mesh097_3: THREE.Mesh
    Mesh097_4: THREE.Mesh
    BézierCurve034: THREE.Mesh
    BézierCurve034_1: THREE.Mesh
    BézierCurve034_2: THREE.Mesh
    BézierCurve034_3: THREE.Mesh
    BézierCurve034_4: THREE.Mesh
    Mesh110: THREE.Mesh
    Mesh110_1: THREE.Mesh
    Mesh110_2: THREE.Mesh
    Mesh110_3: THREE.Mesh
    Mesh110_4: THREE.Mesh
    Mesh112: THREE.Mesh
    Mesh112_1: THREE.Mesh
    Mesh112_2: THREE.Mesh
    buzzerpolySurface1: THREE.Mesh
    buzzerpolySurface2: THREE.Mesh
    BézierCurve001: THREE.Mesh
    BézierCurve001_1: THREE.Mesh
    BézierCurve001_2: THREE.Mesh
    BézierCurve001_3: THREE.Mesh
    BézierCurve001_4: THREE.Mesh
    BézierCurve002: THREE.Mesh
    BézierCurve002_1: THREE.Mesh
    BézierCurve002_2: THREE.Mesh
    Mesh009: THREE.Mesh
    Mesh009_1: THREE.Mesh
    Mesh009_2: THREE.Mesh
    Mesh009_3: THREE.Mesh
    Mesh009_4: THREE.Mesh
    Mesh009_5: THREE.Mesh
  }
  materials: {
    ['Material.093']: THREE.MeshPhysicalMaterial
    ['phong1.028']: THREE.MeshPhysicalMaterial
    ['Material.101']: THREE.MeshPhysicalMaterial
    ['Material.096']: THREE.MeshPhysicalMaterial
    ['Material.097']: THREE.MeshPhysicalMaterial
    ['Material.098']: THREE.MeshPhysicalMaterial
    ['Material.099']: THREE.MeshPhysicalMaterial
    ['Plus_Minus.012']: THREE.MeshPhysicalMaterial
    ['Material.100']: THREE.MeshPhysicalMaterial
    ['Material.092']: THREE.MeshPhysicalMaterial
    ['phong1.027']: THREE.MeshPhysicalMaterial
    ['Material.094']: THREE.MeshPhysicalMaterial
    ['Material.117']: THREE.MeshPhysicalMaterial
    ['phong1.033']: THREE.MeshPhysicalMaterial
    ['Material.123']: THREE.MeshPhysicalMaterial
    ['phong1.034']: THREE.MeshPhysicalMaterial
    ['Material.126']: THREE.MeshPhysicalMaterial
    ['Material.119']: THREE.MeshPhysicalMaterial
    ['Material.120']: THREE.MeshPhysicalMaterial
    ['Material.121']: THREE.MeshPhysicalMaterial
    ['Material.122']: THREE.MeshPhysicalMaterial
    ['Material.124']: THREE.MeshPhysicalMaterial
    ['Material.118']: THREE.MeshPhysicalMaterial
    ['Plus_Minus.014']: THREE.MeshPhysicalMaterial
    ['Material.005']: THREE.MeshPhysicalMaterial
    ['phong1.009']: THREE.MeshPhysicalMaterial
    ['Material.014']: THREE.MeshPhysicalMaterial
    ['phong1.006']: THREE.MeshPhysicalMaterial
    ['Material.011']: THREE.MeshPhysicalMaterial
    ['Material.006']: THREE.MeshPhysicalMaterial
    ['Material.012']: THREE.MeshPhysicalMaterial
    ['Material.007']: THREE.MeshPhysicalMaterial
    ['Material.008']: THREE.MeshPhysicalMaterial
    ['Material.009']: THREE.MeshPhysicalMaterial
    ['Material.010']: THREE.MeshPhysicalMaterial
    ['Plus_Minus.002']: THREE.MeshPhysicalMaterial
  }
}

export function BatteryModule0(props: JSX.IntrinsicElements['group'] & { batteryType?: string }) {
  const { batteryType } = props
  const { nodes, materials } = useGLTF('models/6-2-3/Battery1new.glb') as GLTFResult1
  return (
    <group {...props} dispose={null}>
      {/* light */}
      {batteryType === 'light' && (
        <group position={[0, 0, 0.49]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <group position={[196.156, 290.374, 0]}>
            {/* <group>
              <mesh castShadow receiveShadow geometry={nodes.battery001.geometry} material={materials['phong1.029']} />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.battery001_1.geometry}
                material={materials['Material.103']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.battery001_2.geometry}
                material={materials['Material.104']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.battery001_3.geometry}
                material={materials['Material.105']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.battery001_4.geometry}
                material={materials['Material.106']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.battery001_5.geometry}
                material={materials['Plus_Minus.016']}
              />
            </group> */}
            <group position={[12.283, 7.777, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={100}>
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.BézierCurve020.geometry}
                material={materials['Material.107']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.BézierCurve020_1.geometry}
                material={materials['phong1.029']}
              />
            </group>
            <group position={[-265.111, 45.867, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh080.geometry} material={materials['phong1.029']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh080_1.geometry} material={materials['Material.108']} />
            </group>
          </group>
        </group>
      )}
      {/* buzzer */}
      {batteryType === 'buzzer' && (
        <group position={[0, 0, 0.49]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <group position={[196.156, 290.374, 0]}>
            {/* <group>
              <mesh castShadow receiveShadow geometry={nodes.battery.geometry} material={materials['phong1.032']} />
              <mesh castShadow receiveShadow geometry={nodes.battery_1.geometry} material={materials['Material.125']} />
              <mesh castShadow receiveShadow geometry={nodes.battery_2.geometry} material={materials['Material.127']} />
              <mesh castShadow receiveShadow geometry={nodes.battery_3.geometry} material={materials['Material.128']} />
              <mesh castShadow receiveShadow geometry={nodes.battery_4.geometry} material={materials['Material.129']} />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.battery_5.geometry}
                material={materials['Plus_Minus.017']}
              />
            </group> */}
            <group position={[-105.492, 53.225, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh107.geometry} material={materials['phong1.032']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh107_1.geometry} material={materials['Material.131']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh107_2.geometry} material={materials['Material.111']} />
            </group>
            <group position={[-265.111, 45.867, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh106.geometry} material={materials['phong1.032']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh106_1.geometry} material={materials['Material.130']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh106_2.geometry} material={materials['Material.110']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh106_3.geometry} material={materials['phong1.031']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh106_4.geometry} material={materials['Material.113']} />
            </group>
          </group>
        </group>
      )}
      {/* fan */}
      {batteryType === 'fan' && (
        <group position={[0, 0, 0.49]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <group position={[196.156, 290.374, 0]}>
            {/* <group>
              <mesh castShadow receiveShadow geometry={nodes.battery002.geometry} material={materials['phong1.037']} />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.battery002_1.geometry}
                material={materials['Material.137']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.battery002_2.geometry}
                material={materials['Material.138']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.battery002_3.geometry}
                material={materials['Material.139']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.battery002_4.geometry}
                material={materials['Material.140']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.battery002_5.geometry}
                material={materials['Plus_Minus.018']}
              />
            </group> */}
            <group position={[-105.492, 53.225, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh101.geometry} material={materials['phong1.037']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh101_1.geometry} material={materials['Material.142']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh101_2.geometry} material={materials['Material.134']} />
            </group>
            <group position={[-265.111, 45.867, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh090.geometry} material={materials['phong1.037']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh090_1.geometry} material={materials['Material.141']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh090_2.geometry} material={materials['Material.133']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh090_3.geometry} material={materials['phong1.036']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh090_4.geometry} material={materials['Material.135']} />
            </group>
          </group>
        </group>
      )}
    </group>
  )
}

export function BatteryModule1(props: JSX.IntrinsicElements['group'] & { batteryType?: string }) {
  const { batteryType } = props
  const { nodes, materials } = useGLTF('models/6-2-3/Battery1new.glb') as GLTFResult1
  return (
    <group {...props} dispose={null}>
      {/* light */}
      {batteryType === 'light' && (
        <group position={[0, 0, 0.49]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <group position={[196.156, 290.374, 0]}>
            <mesh castShadow receiveShadow geometry={nodes.battery001.geometry} material={materials['phong1.029']} />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.battery001_1.geometry}
              material={materials['Material.103']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.battery001_2.geometry}
              material={materials['Material.104']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.battery001_3.geometry}
              material={materials['Material.105']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.battery001_4.geometry}
              material={materials['Material.106']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.battery001_5.geometry}
              material={materials['Plus_Minus.016']}
            />
            <group position={[12.283, 7.777, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={100}>
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.BézierCurve020.geometry}
                material={materials['Material.107']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.BézierCurve020_1.geometry}
                material={materials['phong1.029']}
              />
            </group>
            <group position={[-265.111, 45.867, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh080.geometry} material={materials['phong1.029']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh080_1.geometry} material={materials['Material.108']} />
            </group>
          </group>
        </group>
      )}
      {/* buzzer */}
      {batteryType === 'buzzer' && (
        <group position={[0, 0, 0.49]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <group position={[196.156, 290.374, 0]}>
            <mesh castShadow receiveShadow geometry={nodes.battery.geometry} material={materials['phong1.032']} />
            <mesh castShadow receiveShadow geometry={nodes.battery_1.geometry} material={materials['Material.125']} />
            <mesh castShadow receiveShadow geometry={nodes.battery_2.geometry} material={materials['Material.127']} />
            <mesh castShadow receiveShadow geometry={nodes.battery_3.geometry} material={materials['Material.128']} />
            <mesh castShadow receiveShadow geometry={nodes.battery_4.geometry} material={materials['Material.129']} />
            <mesh castShadow receiveShadow geometry={nodes.battery_5.geometry} material={materials['Plus_Minus.017']} />
            <group position={[-105.492, 53.225, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh107.geometry} material={materials['phong1.032']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh107_1.geometry} material={materials['Material.131']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh107_2.geometry} material={materials['Material.111']} />
            </group>
            <group position={[-265.111, 45.867, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh106.geometry} material={materials['phong1.032']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh106_1.geometry} material={materials['Material.130']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh106_2.geometry} material={materials['Material.110']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh106_3.geometry} material={materials['phong1.031']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh106_4.geometry} material={materials['Material.113']} />
            </group>
          </group>
        </group>
      )}
      {/* fan */}
      {batteryType === 'fan' && (
        <group position={[0, 0, 0.49]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <group position={[196.156, 290.374, 0]}>
            <mesh castShadow receiveShadow geometry={nodes.battery002.geometry} material={materials['phong1.037']} />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.battery002_1.geometry}
              material={materials['Material.137']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.battery002_2.geometry}
              material={materials['Material.138']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.battery002_3.geometry}
              material={materials['Material.139']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.battery002_4.geometry}
              material={materials['Material.140']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.battery002_5.geometry}
              material={materials['Plus_Minus.018']}
            />
            <group position={[-105.492, 53.225, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh101.geometry} material={materials['phong1.037']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh101_1.geometry} material={materials['Material.142']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh101_2.geometry} material={materials['Material.134']} />
            </group>
            <group position={[-265.111, 45.867, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh090.geometry} material={materials['phong1.037']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh090_1.geometry} material={materials['Material.141']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh090_2.geometry} material={materials['Material.133']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh090_3.geometry} material={materials['phong1.036']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh090_4.geometry} material={materials['Material.135']} />
            </group>
          </group>
        </group>
      )}
    </group>
  )
}

useGLTF.preload('models/6-2-3/Battery1.glb')

export function BatteryModule2(props: JSX.IntrinsicElements['group'] & { batteryType?: string }) {
  const { batteryType } = props
  const { nodes, materials } = useGLTF('models/6-2-3/Battery2new.glb') as GLTFResult2
  return (
    <group {...props} dispose={null}>
      {batteryType === 'fan' && (
        <group position={[2.084, 0, 3.472]}>
          <mesh castShadow receiveShadow geometry={nodes['fan-black'].geometry} material={materials['Material.093']} />
          <mesh castShadow receiveShadow geometry={nodes['fan-black_1'].geometry} material={materials['phong1.028']} />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['fan-black_2'].geometry}
            material={materials['Material.101']}
          />
        </group>
      )}
      {/* fan */}
      <group position={[12.276, 0, -2.136]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <group position={[-1116.292, 348.406, 0]}>
          {/* fan battery */}
          {batteryType === 'fan' && (
            <group>
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.batterytwo.geometry}
                material={materials['Material.096']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.batterytwo_1.geometry}
                material={materials['Material.097']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.batterytwo_2.geometry}
                material={materials['Material.098']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.batterytwo_3.geometry}
                material={materials['phong1.028']}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.batterytwo_4.geometry}
                material={materials['Material.099']}
              />
            </group>
          )}
          {batteryType === 'fan' && (
            <group position={[-265.111, 250.643, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh097.geometry} material={materials['phong1.028']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh097_1.geometry} material={materials['Material.100']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh097_2.geometry} material={materials['Material.092']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh097_3.geometry} material={materials['phong1.027']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh097_4.geometry} material={materials['Material.094']} />
            </group>
          )}
        </group>
      </group>
      {/* buzzer-red */}
      {batteryType === 'buzzer' && (
        <group position={[-1.996, 0.308, 0]}>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.BézierCurve034.geometry}
            material={materials['Material.117']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.BézierCurve034_1.geometry}
            material={materials['phong1.033']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.BézierCurve034_2.geometry}
            material={materials['Material.123']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.BézierCurve034_3.geometry}
            material={materials['phong1.034']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.BézierCurve034_4.geometry}
            material={materials['Material.126']}
          />
        </group>
      )}
      <group position={[12.528, 0, -2.023]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <group position={[-1116.292, 337.698, 0]}>
          {/* light-twobattery */}
          {batteryType !== 'fan' && (
            <group>
              <mesh castShadow receiveShadow geometry={nodes.Mesh110.geometry} material={materials['Material.119']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh110_1.geometry} material={materials['Material.120']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh110_2.geometry} material={materials['Material.121']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh110_3.geometry} material={materials['phong1.033']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh110_4.geometry} material={materials['Material.122']} />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.buzzerpolySurface1.geometry}
                material={materials['Plus_Minus.014']}
                position={[0, 205.805, 0.732]}
              />
              <mesh
                castShadow
                receiveShadow
                geometry={nodes.buzzerpolySurface2.geometry}
                material={materials['Plus_Minus.014']}
                position={[195.092, 205.805, 0.732]}
              />
            </group>
          )}
          {/* black */}
          {batteryType === 'buzzer' && (
            <group position={[91.384, 251.737, -14.743]} rotation={[0, 1.571, 0]}>
              <mesh castShadow receiveShadow geometry={nodes.Mesh112.geometry} material={materials['phong1.033']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh112_1.geometry} material={materials['Material.124']} />
              <mesh castShadow receiveShadow geometry={nodes.Mesh112_2.geometry} material={materials['Material.118']} />
            </group>
          )}
        </group>
      </group>

      {/* light-red */}
      {batteryType === 'light' && (
        <>
          <group position={[-1.996, 0.308, 0]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.BézierCurve001.geometry}
              material={materials['Material.005']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.BézierCurve001_1.geometry}
              material={materials['phong1.009']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.BézierCurve001_2.geometry}
              material={materials['Material.014']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.BézierCurve001_3.geometry}
              material={materials['phong1.006']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.BézierCurve001_4.geometry}
              material={materials['Material.011']}
            />
          </group>
          <group position={[2.084, 0, 3.472]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.BézierCurve002.geometry}
              material={materials['Material.006']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.BézierCurve002_1.geometry}
              material={materials['phong1.006']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.BézierCurve002_2.geometry}
              material={materials['Material.012']}
            />
          </group>
        </>
      )}
      {/* <group position={[12.453, 0, -2.019]} rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
      <group position={[-1116.292, 335.611, 0]}>
        <mesh castShadow receiveShadow geometry={nodes.Mesh009.geometry} material={materials['Material.007']} />
        <mesh castShadow receiveShadow geometry={nodes.Mesh009_1.geometry} material={materials['Material.008']} />
        <mesh castShadow receiveShadow geometry={nodes.Mesh009_2.geometry} material={materials['Material.009']} />
        <mesh castShadow receiveShadow geometry={nodes.Mesh009_3.geometry} material={materials['phong1.006']} />
        <mesh castShadow receiveShadow geometry={nodes.Mesh009_4.geometry} material={materials['Material.010']} />
        <mesh castShadow receiveShadow geometry={nodes.Mesh009_5.geometry} material={materials['Plus_Minus.002']} />
      </group>
    </group> */}
    </group>
  )
}

useGLTF.preload('models/6-2-3/Battery2new.glb')
