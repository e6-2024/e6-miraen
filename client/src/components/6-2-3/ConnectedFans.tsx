import { useGLTF, useAnimations, Text } from '@react-three/drei'
import { GroupProps, useFrame, ThreeEvent } from '@react-three/fiber'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { BatteryModule1, BatteryModule2 } from './BatteryModule'
import AudioManager from '@/utils/6-2-3/audioManager'
import { BatteryButton1, BatteryButton2 } from './BatteryButton'

function FanComponent({
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

  const fanBladeRef = useRef<THREE.Mesh | null>(null)
  const [isRotating, setIsRotating] = useState(false)

  const audioManager = AudioManager.getInstance()
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // 회전/배터리 모드에 따른 팬 소리
  useEffect(() => {
    if (currentAudioRef.current) {
      audioManager.stopComponentSound(`fan-${componentName}`)
      currentAudioRef.current = null
    }

    if (isRotating && batteryMode > 0) {
      const audioPath = '/sounds/6-2-3/6-2-3-4_table-fan-sound-01-318509.mp3'
      const volume = batteryMode === 1 ? 0.5 : 0.7
      audioManager
        .playComponentSound(audioPath, `fan-${componentName}`, volume, true)
        .then((audio) => {
          currentAudioRef.current = audio
        })
        .catch((error) => {
          console.log(`${componentName} 팬 오디오 재생 실패:`, error)
        })
    }
  }, [isRotating, batteryMode, componentName, audioManager])

  // 언마운트 정리
  useEffect(() => {
    return () => {
      audioManager.stopComponentSound(`fan-${componentName}`)
      currentAudioRef.current = null
    }
  }, [audioManager, componentName])

  // 팬 블레이드 찾기
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if (child.name === 'Fan' || child.name.includes('Fan')) {
          fanBladeRef.current = child as THREE.Mesh
        }
      })
    }
  }, [])

  // 스위치 애니메이션
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return
    const actionName = Object.keys(actions)[0]
    const action = actions[actionName]
    if (!action) return

    const animationDuration = action.getClip().duration
    const halfDuration = animationDuration / 2

    action.reset()
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true
    action.timeScale = 4

    if (isRotating) {
      action.time = 0
      action.play()
      setTimeout(() => {
        if (action) action.paused = true
      }, halfDuration * 250)
    } else {
      action.time = halfDuration
      action.play()
    }
  }, [isRotating, actions])

  // 스위치 클릭 → 해당 팬만 토글 (배터리 있어야 작동)
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    let obj: THREE.Object3D | null = e.object
    while (obj) {
      if (obj.name === 'Switch' && scene.getObjectById(obj.id)) {
        if (batteryMode > 0) setIsRotating((prev) => !prev)
        return
      }
      obj = obj.parent
    }
  }

  // 배터리 분리
  const handleBatteryDetach = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (batteryMode > 0) {
      setIsRotating(false)
      onDetach && onDetach()
    }
  }

  const rotationSpeed =
    batteryMode === 0
      ? 0
      : batteryMode === 1
      ? componentName === 'Fan1'
        ? 5
        : 8
      : componentName === 'Fan1'
      ? 15
      : 25

  useFrame((_, delta) => {
    if (fanBladeRef.current && isRotating && batteryMode > 0) {
      fanBladeRef.current.rotation.y += delta * rotationSpeed
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <primitive
        object={scene}
        onPointerDown={handlePointerDown}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          e.nativeEvent.stopImmediatePropagation()
        }}
        castShadow
        receiveShadow
      />

      {/* 배터리 모듈 (클릭으로 분리) */}
      {batteryMode === 1 ? (
        <group
          onPointerDown={handleBatteryDetach}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'default')}
        >
          <BatteryModule1 position={[0, 0, 0]} batteryType='fan' />
        </group>
      ) : batteryMode === 2 ? (
        <group
          onPointerDown={handleBatteryDetach}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'default')}
        >
          <BatteryModule2 position={[0, 0, 0]} batteryType='fan' />
        </group>
      ) : (
        <BatteryModule1 showBody={false} position={[0, 0, 0]} batteryType='fan' />
      )}

      <Text
        position={[0, -1, 3]}
        fontSize={0.2}
        color={isRotating && batteryMode > 0 ? 'lightgreen' : 'gray'}
        anchorX='center'
        anchorY='middle'
      >
        {batteryMode === 0 ? '전원 없음' : isRotating ? `회전 중 (속도: ${batteryMode === 1 ? '느림' : '빠름'})` : '정지'}
      </Text>
    </group>
  )
}

export default function ConnectedFans(props: GroupProps) {
  const [fan1BatteryMode, setFan1BatteryMode] = useState(0)
  const [fan2BatteryMode, setFan2BatteryMode] = useState(0)

  const [battery1Used, setBattery1Used] = useState(false)
  const [battery2Used, setBattery2Used] = useState(false)

  const [fan1Source, setFan1Source] = useState<1 | 2 | null>(null)
  const [fan2Source, setFan2Source] = useState<1 | 2 | null>(null)

  const [nextTargetIsLeft, setNextTargetIsLeft] = useState(true)

  const audioManager = AudioManager.getInstance()
  const playBatteryAudio = () => {
    audioManager.playNarration('/sounds/6-2-3/narration/6-2-3-D.MP3', 0.7).catch((e) => console.log('나레이션 재생 실패:', e))
  }

  const handleBattery1Click = () => {
    if (battery1Used) return
    playBatteryAudio()
    audioManager.playGeneralButton()
    setBattery1Used(true)

    if (nextTargetIsLeft) {
      setFan1BatteryMode(1); setFan1Source(1); setNextTargetIsLeft(false)
    } else {
      setFan2BatteryMode(1); setFan2Source(1); setNextTargetIsLeft(true)
    }
  }

  const handleBattery2Click = () => {
    if (battery2Used) return
    playBatteryAudio()
    audioManager.playGeneralButton()
    setBattery2Used(true)

    if (nextTargetIsLeft) {
      setFan1BatteryMode(2); setFan1Source(2); setNextTargetIsLeft(false)
    } else {
      setFan2BatteryMode(2); setFan2Source(2); setNextTargetIsLeft(true)
    }
  }

  const detachLeft = () => {
    if (fan1Source === 1) setBattery1Used(false)
    if (fan1Source === 2) setBattery2Used(false)
    setFan1Source(null)
    setFan1BatteryMode(0)
    setNextTargetIsLeft(true)
  }

  const detachRight = () => {
    if (fan2Source === 1) setBattery1Used(false)
    if (fan2Source === 2) setBattery2Used(false)
    setFan2Source(null)
    setFan2BatteryMode(0)
    setNextTargetIsLeft(false)
  }

  return (
    <group {...props}>
      <FanComponent
        modelPath='models/6-2-3/Fan1-notConnected.glb'
        position={[-5, -0.1, 0]}
        batteryMode={fan1BatteryMode}
        componentName='Fan1'
        onDetach={detachLeft}
      />

      <FanComponent
        modelPath='models/6-2-3/Fan2-notConnected.glb'
        position={[5, -0.1, 0]}
        batteryMode={fan2BatteryMode}
        componentName='Fan2'
        onDetach={detachRight}
      />

      {/* 중앙 배터리 버튼 */}
      <group position={[0, 1, 6.66]}>
        <BatteryButton1 position={[-2.5, 0, 0]} isUsed={battery1Used} onClick={handleBattery1Click} />
        <BatteryButton2 position={[2.5, 0, 0]} isUsed={battery2Used} onClick={handleBattery2Click} />
      </group>
    </group>
  )
}

useGLTF.preload('models/6-2-3/Fan1-notConnected.glb')
useGLTF.preload('models/6-2-3/Fan2-notConnected.glb')
