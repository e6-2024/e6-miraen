import { useGLTF, useAnimations, Text } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useRef, useEffect, useState, createContext, useContext } from 'react'
import * as THREE from 'three'
import { BatteryModule1, BatteryModule2 } from './BatteryModule'
import AudioManager from '@/utils/6-2-3/audioManager'
import { BatteryButton1, BatteryButton2 } from './BatteryButton'

type Props = JSX.IntrinsicElements['group'] & {
  onBatteryClick?: () => void
  onAllBatteriesConnected?: () => void
}

interface SwitchContextType {
  activeLight: string | null
  setActiveLight: (light: string | null) => void
}

const SwitchContext = createContext<SwitchContextType>({
  activeLight: null,
  setActiveLight: () => {},
})

function LightComponent({
  modelPath,
  position,
  batteryMode,
  componentName,
  onDetach,
}: {
  modelPath: string
  position: [number, number, number]
  batteryMode: number
  componentName: string
  onDetach?: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(modelPath)
  const { actions } = useAnimations(animations, groupRef)

  const [lightOn, setLightOn] = useState(false)
  const { activeLight, setActiveLight } = useContext(SwitchContext)

  const audioManager = AudioManager.getInstance()

  useEffect(() => {
    if (activeLight !== componentName) {
      setLightOn(false)
    }
  }, [activeLight, componentName])

  useEffect(() => {
    if (lightOn && batteryMode > 0) {
      audioManager
        .playComponentSound('/sounds/6-2-3/6-2-3-2_switch-light-04-82204.mp3', `light-${componentName}`, 0.6, false)
        .catch((err) => console.log(`${componentName} 전구 오디오 재생 실패:`, err))
    } else {
      audioManager.stopComponentSound(`light-${componentName}`)
    }
  }, [lightOn, batteryMode, componentName, audioManager])

  useEffect(() => {
    return () => {
      audioManager.stopComponentSound(`light-${componentName}`)
    }
  }, [audioManager, componentName])

  useEffect(() => {
    if (!scene) return

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const inBulb = child.parent?.name === 'Light_Bulb'
        if (inBulb) {
          child.castShadow = false
          child.receiveShadow = false
        } else {
          child.castShadow = true
          child.receiveShadow = true
        }

        if (child.material instanceof THREE.MeshStandardMaterial) {
          const mat = child.material
          const isBulbSurface =
            inBulb || /bulb|glass|lamp|light/i.test(child.name) || /bulb|glass|lamp|light/i.test(mat.name)

          if (isBulbSurface) {
            const emissiveIntensity =
              batteryMode === 0
                ? 0
                : batteryMode === 1
                ? componentName === 'Light1'
                  ? 0.1
                  : 0.1
                : componentName === 'Light1'
                ? 0.5
                : 1.0
            const opacity = batteryMode === 0 ? 0.2 : batteryMode === 1 ? (lightOn ? 0.6 : 0.3) : lightOn ? 1.0 : 0.4

            mat.transparent = true
            mat.opacity = opacity
            mat.emissive = new THREE.Color(1.0, 0.8, 0.4)
            mat.emissiveIntensity = 1
            mat.emissive.multiplyScalar(lightOn && batteryMode > 0 ? emissiveIntensity : 0)
          }
        }
      }
    })
  }, [scene, lightOn, batteryMode, componentName])

  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return
    const actionName = Object.keys(actions)[0]
    const action = actions[actionName]
    if (!action) return

    const clipDur = action.getClip().duration
    const half = clipDur / 2

    action.reset()
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true
    action.timeScale = 4

    if (lightOn) {
      action.time = 0
      action.play()
      setTimeout(() => {
        if (action) action.paused = true
      }, half * 250)
    } else {
      action.time = half
      action.play()
    }
  }, [lightOn, actions])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    let obj: THREE.Object3D | null = e.object
    while (obj) {
      if (obj.name === 'Switch' && scene.getObjectById(obj.id)) {
        setLightOn((prev) => !prev)
        return
      }
      obj = obj.parent
    }
  }

  const pointLightIntensity =
    batteryMode === 0
      ? 0
      : batteryMode === 1
      ? componentName === 'Light1'
        ? 2
        : 5
      : componentName === 'Light1'
      ? 20
      : 20

  const handleBatteryDetach = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (batteryMode > 0) {
      setLightOn(false)
      setActiveLight(null)
      onDetach && onDetach()
    }
  }

  return (
    <group ref={groupRef} position={position}>
      <primitive
        object={scene}
        onPointerDown={handlePointerDown}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          e.nativeEvent.stopImmediatePropagation()
        }}
      />

      <pointLight
        position={[0.1, 1.0, -2.0]}
        intensity={lightOn && batteryMode > 0 ? pointLightIntensity : 0}
        distance={10}
        decay={2}
        color={new THREE.Color(1, 0.8, 0.4)}
      />

      {batteryMode === 1 ? (
        <group
          onPointerDown={handleBatteryDetach}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'default')}>
          <BatteryModule1 position={[0, 0, 0]} batteryType='light' />
        </group>
      ) : batteryMode === 2 ? (
        <group
          onPointerDown={handleBatteryDetach}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'default')}>
          <BatteryModule2 position={[0, 0, 0]} batteryType='light' />
        </group>
      ) : (
        <BatteryModule1 showBody={false} position={[0, 0, 0]} batteryType='light' />
      )}

      <Text
        position={[0, -1, 3]}
        fontSize={0.2}
        color={lightOn && batteryMode > 0 ? 'gold' : 'gray'}
        anchorX='center'
        anchorY='middle'>
        {batteryMode === 0 ? '전원 없음' : lightOn ? (batteryMode === 1 ? '켜짐 (약한 빛)' : '켜짐 (강한 빛)') : '꺼짐'}
      </Text>
    </group>
  )
}

export default function ConnectedLights(props: Props) {
  const [light1BatteryMode, setLight1BatteryMode] = useState(0)
  const [light2BatteryMode, setLight2BatteryMode] = useState(0)

  const [battery1Used, setBattery1Used] = useState(false)
  const [battery2Used, setBattery2Used] = useState(false)
  const [hasPlayedNarration, setHasPlayedNarration] = useState(false)

  const [light1Source, setLight1Source] = useState<1 | 2 | null>(null)
  const [light2Source, setLight2Source] = useState<1 | 2 | null>(null)

  const [nextTargetIsLeft, setNextTargetIsLeft] = useState(true)
  const [activeLight, setActiveLight] = useState<string | null>(null)

  const audioManager = AudioManager.getInstance()

  useEffect(() => {
    if (battery1Used && battery2Used && !hasPlayedNarration) {
      setHasPlayedNarration(true)
      props.onAllBatteriesConnected?.()
    }
  }, [battery1Used, battery2Used, hasPlayedNarration, props])

  useEffect(() => {
    if (!battery1Used || !battery2Used) {
      setHasPlayedNarration(false)
    }
  }, [battery1Used, battery2Used])

  const handleBattery1Click = () => {
    if (battery1Used) return
    if (props.onBatteryClick) {
      props.onBatteryClick()
    }
    audioManager.playGeneralButton()
    setBattery1Used(true)

    if (nextTargetIsLeft) {
      setLight1BatteryMode(1)
      setLight1Source(1)
      setNextTargetIsLeft(false)
    } else {
      setLight2BatteryMode(1)
      setLight2Source(1)
      setNextTargetIsLeft(true)
    }
  }

  const handleBattery2Click = () => {
    if (battery2Used) return
    if (props.onBatteryClick) {
      props.onBatteryClick()
    }
    audioManager.playGeneralButton()
    setBattery2Used(true)

    if (nextTargetIsLeft) {
      setLight1BatteryMode(2)
      setLight1Source(2)
      setNextTargetIsLeft(false)
    } else {
      setLight2BatteryMode(2)
      setLight2Source(2)
      setNextTargetIsLeft(true)
    }
  }

  const detachLeft = () => {
    if (light1Source === 1) setBattery1Used(false)
    if (light1Source === 2) setBattery2Used(false)
    setLight1Source(null)
    setLight1BatteryMode(0)
    setActiveLight(null)
    setNextTargetIsLeft(true)
  }

  const detachRight = () => {
    if (light2Source === 1) setBattery1Used(false)
    if (light2Source === 2) setBattery2Used(false)
    setLight2Source(null)
    setLight2BatteryMode(0)
    setActiveLight(null)
    setNextTargetIsLeft(false)
  }

  return (
    <SwitchContext.Provider value={{ activeLight, setActiveLight }}>
      <group {...props}>
        <LightComponent
          modelPath='models/6-2-3/Light1-notConnected.glb'
          position={[-5, -0.1, 0]}
          batteryMode={light1BatteryMode}
          componentName='Light1'
          onDetach={detachLeft}
        />

        <LightComponent
          modelPath='models/6-2-3/Light2-notConnected.glb'
          position={[5, -0.1, 0]}
          batteryMode={light2BatteryMode}
          componentName='Light2'
          onDetach={detachRight}
        />

        <group position={[0, 1, 6.66]}>
          <BatteryButton1 position={[-2.5, 0, 0]} isUsed={battery1Used} onClick={handleBattery1Click} />
          <BatteryButton2 position={[2.5, 0, 0]} isUsed={battery2Used} onClick={handleBattery2Click} />
        </group>
      </group>
    </SwitchContext.Provider>
  )
}

useGLTF.preload('models/6-2-3/Light1-notConnected.glb')
useGLTF.preload('models/6-2-3/Light2-notConnected.glb')