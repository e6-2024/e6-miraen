import { useGLTF, useAnimations, Text, Box } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { BatteryModule0, BatteryModule1, BatteryModule2 } from './BatteryModule'
import AudioManager from '@/components/6-2-3/AudioManager'

// Individual Light Component
function LightComponent({
  modelPath,
  position,
  batteryMode,
  textPosition,
  componentName,
}: {
  modelPath: string
  position: [number, number, number]
  batteryMode: number
  textPosition: [number, number, number]
  componentName: string
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(modelPath)
  const { actions } = useAnimations(animations, groupRef)
  const [lightOn, setLightOn] = useState(false)
  
  // AudioManager 인스턴스
  const audioManager = AudioManager.getInstance()

  // 전구 상태와 배터리 모드에 따른 오디오 제어
  useEffect(() => {
    if (lightOn && batteryMode > 0) {
      // 전구가 켜지고 배터리가 있으면 오디오 재생
      audioManager.playComponentSound(
        '/sounds/6-2-3/6-2-3-2_switch-light-04-82204.mp3',
        `light-${componentName}`,
        0.6,
        false // 전구 효과음은 루프하지 않음
      ).catch((error) => {
        console.log(`${componentName} 전구 오디오 재생 실패:`, error)
      })
    } else {
      // 전구가 꺼지거나 배터리가 없으면 오디오 중지
      audioManager.stopComponentSound(`light-${componentName}`)
    }
  }, [lightOn, batteryMode, componentName, audioManager])

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return () => {
      audioManager.stopComponentSound(`light-${componentName}`)
    }
  }, [audioManager, componentName])

  // 그림자 설정
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Light_Bulb 그룹 내의 mesh들은 shadow를 처리하지 않음
          const isInLightBulbGroup = child.parent?.name === 'Light_Bulb'

          if (isInLightBulbGroup) {
            child.castShadow = false
            child.receiveShadow = false
          } else {
            child.castShadow = true
            child.receiveShadow = true
          }
        }
      })
    }
  }, [scene])

  // 애니메이션 제어
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

        if (lightOn) {
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
  }, [lightOn, actions])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    let obj: THREE.Object3D | null = e.object

    while (obj) {
      if (obj.name === 'Switch' && scene.getObjectById(obj.id)) {
        console.log(`${componentName} Switch clicked - toggling light and animation`)
        setLightOn((prev) => !prev)
        return
      }
      obj = obj.parent
    }
  }

  // 배터리 모드에 따른 밝기 계산
  const getLightIntensity = () => {
    if (batteryMode === 0) return 0 // 배터리 없음 - 불이 안 켜짐
    if (batteryMode === 1) {
      // 배터리 1개 - 낮은 밝기
      return componentName === 'Light1' ? 0.5 : 0.8
    }
    if (batteryMode === 2) {
      // 배터리 2개 - 높은 밝기
      return componentName === 'Light1' ? 2.0 : 3.0
    }
    return 0
  }

  const getEmissiveIntensity = () => {
    if (batteryMode === 0) return 0
    if (batteryMode === 1) {
      return componentName === 'Light1' ? 0.2 : 0.4
    }
    if (batteryMode === 2) {
      return componentName === 'Light1' ? 0.5 : 1.0
    }
    return 0
  }

  const getPointLightIntensity = () => {
    if (batteryMode === 0) return 0
    if (batteryMode === 1) {
      return componentName === 'Light1' ? 2 : 5
    }
    if (batteryMode === 2) {
      return componentName === 'Light1' ? 20 : 20
    }
    return 0
  }

  const getOpacity = () => {
    if (batteryMode === 0) return 0.2
    if (batteryMode === 1) return lightOn ? 0.6 : 0.3
    if (batteryMode === 2) return lightOn ? 1.0 : 0.4
    return 0.2
  }

  const lightIntensity = getLightIntensity()
  const emissiveIntensity = getEmissiveIntensity()
  const pointLightIntensity = getPointLightIntensity()
  const opacity = getOpacity()

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

      {/* 포인트 라이트 */}
      <pointLight
        position={[0.1, 1.0, -2.0]}
        intensity={lightOn && batteryMode > 0 ? pointLightIntensity : 0}
        distance={10}
        decay={2}
        color={new THREE.Color(1, 0.8, 0.4)}
      />

      {/* 배터리 모듈 렌더링 */}
      {batteryMode === 1 ? (
        <BatteryModule1 position={[0, 0, 0]} batteryType='light' />
      ) : batteryMode === 2 ? (
        <BatteryModule2 position={[0, 0, 0]} batteryType='light' />
      ) : (
        <BatteryModule0 position={[0, 0, 0]} batteryType='light' />
      )}
    </group>
  )
}

// Main Connected Lights Component
export default function ConnectedLights(props: GroupProps) {
  const [light1BatteryMode, setLight1BatteryMode] = useState(0) // 0: 없음, 1: 낮음, 2: 높음
  const [light2BatteryMode, setLight2BatteryMode] = useState(0)
  const [buttonAPressed, setButtonAPressed] = useState(false) // 버튼 A 상태
  const [buttonBPressed, setButtonBPressed] = useState(false) // 버튼 B 상태

  // AudioManager 인스턴스
  const audioManager = AudioManager.getInstance()

  const playBatteryAudio = () => {
    audioManager.playNarration('/sounds/6-2-3/narration/6-2-3-B.MP3', 0.7)
      .catch((error) => console.log('나레이션 재생 실패:', error))
  }

  // 버튼 A 클릭 - Light1을 2개로, Light2를 1개로
  const handleButtonAClick = () => {
    if (!buttonAPressed) {
      playBatteryAudio()
      audioManager.playGeneralButton()
    }
    if (buttonAPressed) {
      // 이미 눌려있으면 해제 - 모든 배터리 모드를 0으로
      setButtonAPressed(false)
      setLight1BatteryMode(0)
      setLight2BatteryMode(0)
    } else {
      // 눌려있지 않으면 누르기
      setButtonAPressed(true)
      setButtonBPressed(false) // 버튼 B 해제
      setLight1BatteryMode(2) // Light1을 배터리 2개 모드로
      setLight2BatteryMode(1) // Light2를 배터리 1개 모드로
    }
  }

  // 버튼 B 클릭 - Light1을 1개로, Light2를 2개로
  const handleButtonBClick = () => {
    if (!buttonBPressed) {
      playBatteryAudio()
      audioManager.playGeneralButton()
    }
    if (buttonBPressed) {
      // 이미 눌려있으면 해제 - 모든 배터리 모드를 0으로
      setButtonBPressed(false)
      setLight1BatteryMode(0)
      setLight2BatteryMode(0)
    } else {
      // 눌려있지 않으면 누르기
      setButtonBPressed(true)
      setButtonAPressed(false) // 버튼 A 해제
      setLight1BatteryMode(1) // Light1을 배터리 1개 모드로
      setLight2BatteryMode(2) // Light2를 배터리 2개 모드로
    }
  }

  return (
    <group {...props}>
      {/* Light1 */}
      <LightComponent
        modelPath='models/6-2-3/Light1-notConnected.glb'
        position={[-5, -0.1, 0]}
        batteryMode={light1BatteryMode}
        textPosition={[5, 3, 3]}
        componentName='Light1'
      />

      {/* Light2 */}
      <LightComponent
        modelPath='models/6-2-3/Light2-notConnected.glb'
        position={[5, -0.1, 0]}
        batteryMode={light2BatteryMode}
        textPosition={[3, 3, 3]}
        componentName='Light2'
      />

      {/* 중앙 제어 버튼들 */}
      <group position={[5.5, 0, 1]}>
        <Text
          position={[0, 1.5, -5]}
          fontSize={0.4}
          color='white'
          fontWeight='bold'
          font='/fonts/Maplestory Bold.ttf'
          anchorX='center'
          anchorY='middle'>
          우측 회로의 전지 개수를 선택해 보세요!
        </Text>
        <Box
          position={[-1.5, buttonAPressed ? -0.1 : 0, 0]}
          args={[2, 0.5, 1.2]}
          onClick={(e) => {
            e.stopPropagation()
            handleButtonAClick()
          }}
          onPointerOver={(e) => e.stopPropagation()}
          onPointerOut={(e) => e.stopPropagation()}
          castShadow
          receiveShadow>
          <meshStandardMaterial color={buttonAPressed ? '#ffd700' : '#666666'} />
          <Text
            position={[0, 0.26, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.25}
            color='black'
            fontWeight='bold'
            anchorX='center'
            font='/fonts/Maplestory Bold.ttf'
            anchorY='middle'>
            전지 : 1개
          </Text>
        </Box>

        {/* 버튼 B - Light1을 1개, Light2를 2개로 */}
        <Box
          position={[1.5, buttonBPressed ? -0.1 : 0, 0]}
          args={[2, 0.5, 1.2]}
          onClick={(e) => {
            e.stopPropagation()
            handleButtonBClick()
          }}
          onPointerOver={(e) => e.stopPropagation()}
          onPointerOut={(e) => e.stopPropagation()}
          castShadow
          receiveShadow>
          <meshStandardMaterial color={buttonBPressed ? '#87ceeb' : '#666666'} />
          <Text
            position={[0, 0.26, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontWeight='bold'
            fontSize={0.25}
            font='/fonts/Maplestory Bold.ttf'
            color='black'
            anchorX='center'
            anchorY='middle'>
            전지 : 2개
          </Text>
        </Box>
      </group>
    </group>
  )
}

useGLTF.preload('models/6-2-3/Light1-notConnected.glb')
useGLTF.preload('models/6-2-3/Light2-notConnected.glb')