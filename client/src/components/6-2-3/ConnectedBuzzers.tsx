import { useGLTF, useAnimations, Text } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useRef, useEffect, useState, createContext, useContext } from 'react'
import * as THREE from 'three'
import { BatteryModule1, BatteryModule2 } from './BatteryModule'
import { BatteryButton1, BatteryButton2 } from './BatteryButton'
import AudioManager from '@/utils/6-2-3/audioManager'
import { CrayonTextBox } from '../common/CrayonTextBox'

type Props = JSX.IntrinsicElements['group'] & {
  onBatteryClick?: () => void
  onAllBatteriesConnected?: () => void
}

interface SwitchContextType {
  activeBuzzer: string | null
  setActiveBuzzer: (buzzer: string | null) => void
}

const SwitchContext = createContext<SwitchContextType>({
  activeBuzzer: null,
  setActiveBuzzer: () => {},
})

function BuzzerComponent({
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

  const [buzzerOn, setBuzzerOn] = useState(false)
  const { activeBuzzer, setActiveBuzzer } = useContext(SwitchContext)
  const [blinkColor, setBlinkColor] = useState<'blue' | 'red'>('blue')

  const audioManager = AudioManager.getInstance()
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (activeBuzzer !== componentName) {
      setBuzzerOn(false)
    }
  }, [activeBuzzer, componentName])

  useEffect(() => {
    if (currentAudioRef.current) {
      audioManager.stopComponentSound(`buzzer-${componentName}`)
      currentAudioRef.current = null
    }

    if (buzzerOn && batteryMode > 0) {
      const audioPath = batteryMode === 1 ? '/sounds/6-2-3/buzzer1.MP3' : '/sounds/6-2-3/buzzer2.MP3'
      const volume = batteryMode === 1 ? 0.7 : 0.9

      audioManager
        .playComponentSound(audioPath, `buzzer-${componentName}`, volume, true)
        .then((audio) => {
          currentAudioRef.current = audio
        })
        .catch((error) => {
          console.log(`${componentName} 소리 재생 실패:`, error)
        })
    }
  }, [buzzerOn, batteryMode, componentName, audioManager])

  useEffect(() => {
    return () => {
      audioManager.stopComponentSound(`buzzer-${componentName}`)
      currentAudioRef.current = null
    }
  }, [audioManager, componentName])

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const actionName = Object.keys(actions)[0]
      const action = actions[actionName]

      if (action) {
        const animationDuration = action.getClip().duration
        const halfDuration = animationDuration / 2

        action.reset()
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.timeScale = 4

        if (buzzerOn) {
          action.time = 0
          action.play()
          setTimeout(() => {
            if (action) {
              action.paused = true
            }
          }, halfDuration * 250)
        } else {
          action.time = halfDuration
          action.play()
        }
      }
    }
  }, [buzzerOn, actions])

  useEffect(() => {
    if (batteryMode > 0 && !buzzerOn) {
      const interval = setInterval(() => {
        setBlinkColor((prev) => (prev === 'blue' ? 'red' : 'blue'))
      }, 500)

      return () => clearInterval(interval)
    } else {
      setBlinkColor('blue')
    }
  }, [batteryMode, buzzerOn])

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.name === 'Switch' && child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            if (batteryMode > 0 && !buzzerOn) {
              if (blinkColor === 'blue') {
                child.material.color.setHex(0x0066ff)
                child.material.emissive.setHex(0x002266)
              } else {
                child.material.color.setHex(0xff3333)
                child.material.emissive.setHex(0x662222)
              }
            } else {
              child.material.color.setHex(0xffffff)
              child.material.emissive.setHex(0x000000)
            }
          }
        }
      })
    }
  }, [scene, batteryMode, buzzerOn, blinkColor])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    let obj: THREE.Object3D | null = e.object
    while (obj) {
      if (obj.name === 'Switch' && scene.getObjectById(obj.id)) {
        if (buzzerOn) {
          setBuzzerOn(false)
          setActiveBuzzer(null)
        } else {
          setBuzzerOn(true)
          setActiveBuzzer(componentName)
        }
        return
      }
      obj = obj.parent
    }
  }

  const handleBatteryDetach = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (batteryMode > 0) {
      setBuzzerOn(false)
      setActiveBuzzer(null)
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

      {batteryMode === 1 ? (
        <group
          onPointerDown={handleBatteryDetach}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'default')}>
          <BatteryModule1 position={[0, 0, 0]} batteryType='buzzer' />
        </group>
      ) : batteryMode === 2 ? (
        <group
          onPointerDown={handleBatteryDetach}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'default')}>
          <BatteryModule2 position={[0, 0, 0]} batteryType='buzzer' />
        </group>
      ) : (
        <BatteryModule1 showBody={false} position={[0, 0, 0]} batteryType='buzzer' />
      )}
    </group>
  )
}

export default function ConnectedBuzzers(props: Props) {
  const [buzzer1BatteryMode, setBuzzer1BatteryMode] = useState(0)
  const [buzzer2BatteryMode, setBuzzer2BatteryMode] = useState(0)

  const [buzzer1Source, setBuzzer1Source] = useState<1 | 2 | null>(null)
  const [buzzer2Source, setBuzzer2Source] = useState<1 | 2 | null>(null)

  const [battery1Used, setBattery1Used] = useState(false)
  const [battery2Used, setBattery2Used] = useState(false)
  const [hasPlayedNarration, setHasPlayedNarration] = useState(false)

  const [nextTargetIsLeft, setNextTargetIsLeft] = useState(true)

  const [activeBuzzer, setActiveBuzzer] = useState<string | null>(null)

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

  const handleBattery1Click = (e: ThreeEvent<PointerEvent>) => {
    if (battery1Used) return
    audioManager.playGeneralButton()
    setBattery1Used(true)
    if (props.onBatteryClick) {
      props.onBatteryClick()
    }

    if (nextTargetIsLeft) {
      setBuzzer1BatteryMode(1)
      setBuzzer1Source(1)
      setNextTargetIsLeft(false)
    } else {
      setBuzzer2BatteryMode(1)
      setBuzzer2Source(1)
      setNextTargetIsLeft(true)
    }
  }

  const handleBattery2Click = (e: ThreeEvent<PointerEvent>) => {
    if (battery2Used) return
    audioManager.playGeneralButton()
    setBattery2Used(true)
    props.onBatteryClick?.()

    if (nextTargetIsLeft) {
      setBuzzer1BatteryMode(2)
      setBuzzer1Source(2)
      setNextTargetIsLeft(false)
    } else {
      setBuzzer2BatteryMode(2)
      setBuzzer2Source(2)
      setNextTargetIsLeft(true)
    }
  }

  const detachLeft = () => {
    if (buzzer1Source === 1) setBattery1Used(false)
    if (buzzer1Source === 2) setBattery2Used(false)
    setBuzzer1Source(null)
    setBuzzer1BatteryMode(0)
    setNextTargetIsLeft(true)
  }

  const detachRight = () => {
    if (buzzer2Source === 1) setBattery1Used(false)
    if (buzzer2Source === 2) setBattery2Used(false)
    setBuzzer2Source(null)
    setBuzzer2BatteryMode(0)
    setNextTargetIsLeft(false)
  }

  return (
    <SwitchContext.Provider value={{ activeBuzzer, setActiveBuzzer }}>
      <group {...props}>
        <BuzzerComponent
          modelPath='models/6-2-3/Buzzer1-notConnected.glb'
          position={[-5, -0.1, 0]}
          batteryMode={buzzer1BatteryMode}
          componentName='Buzzer1'
          onDetach={detachLeft}
        />

        <BuzzerComponent
          modelPath='models/6-2-3/Buzzer2-notConnected.glb'
          position={[5, -0.1, 0]}
          batteryMode={buzzer2BatteryMode}
          componentName='Buzzer2'
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

useGLTF.preload('models/6-2-3/Buzzer1-notConnected.glb')
useGLTF.preload('models/6-2-3/Buzzer2-notConnected.glb')