import { useGLTF, useAnimations, Text, Box } from '@react-three/drei'
import { GroupProps, useFrame, ThreeEvent } from '@react-three/fiber'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { BatteryModule0, BatteryModule1, BatteryModule2 } from './BatteryModule'
import AudioManager from '@/components/6-2-3/AudioManager'

function FanComponent({
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
  const fanBladeRef = useRef<THREE.Mesh | null>(null)
  const [isRotating, setIsRotating] = useState(false)

  // AudioManager 인스턴스
  const audioManager = AudioManager.getInstance()
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // 팬 회전 상태와 배터리 모드에 따른 오디오 제어
  useEffect(() => {
    // 기존 오디오 중지
    if (currentAudioRef.current) {
      audioManager.stopComponentSound(`fan-${componentName}`)
      currentAudioRef.current = null
    }

    if (isRotating && batteryMode > 0) {
      // 배터리 모드에 따라 다른 오디오 파일 경로 설정 (실제로는 같은 파일을 사용)
      const audioPath = '/sounds/6-2-3/6-2-3-4_table-fan-sound-01-318509.mp3'
      const volume = batteryMode === 1 ? 0.5 : 0.7

      // 팬 사운드는 루프로 재생
      audioManager.playComponentSound(
        audioPath,
        `fan-${componentName}`,
        volume,
        true // 루프 재생
      ).then((audio) => {
        currentAudioRef.current = audio
      }).catch((error) => {
        console.log(`${componentName} 팬 오디오 재생 실패:`, error)
      })
    }
  }, [isRotating, batteryMode, componentName, audioManager])

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return () => {
      audioManager.stopComponentSound(`fan-${componentName}`)
      currentAudioRef.current = null
    }
  }, [audioManager, componentName])

  // Fan 객체 찾기
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if (child.name === 'Fan' || child.name.includes('Fan')) {
          fanBladeRef.current = child as THREE.Mesh
        }
      })
    }
  }, [])

  // 스위치 애니메이션 제어
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

        if (isRotating) {
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
  }, [isRotating, actions])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    let obj: THREE.Object3D | null = e.object

    while (obj) {
      if (obj.name === 'Switch' && scene.getObjectById(obj.id)) {
        console.log(`${componentName} Switch clicked - toggling rotation and animation`)
        setIsRotating((prev) => !prev)
        return
      }
      obj = obj.parent
    }
  }

  // 배터리 모드에 따른 회전 속도 계산
  const getRotationSpeed = () => {
    if (batteryMode === 0) return 0 // 배터리 없음 - 회전 안함
    if (batteryMode === 1) {
      // 배터리 1개 - 느린 회전
      return componentName === 'Fan1' ? 5 : 8
    }
    if (batteryMode === 2) {
      // 배터리 2개 - 빠른 회전
      return componentName === 'Fan1' ? 15 : 25
    }
    return 0
  }

  const rotationSpeed = getRotationSpeed()

  // 애니메이션 프레임마다 회전
  useFrame((state, delta) => {
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
      {/* 배터리 모듈 렌더링 */}
      {batteryMode === 1 ? (
        <BatteryModule1 position={[0, 0, 0]} batteryType='fan' />
      ) : batteryMode === 2 ? (
        <BatteryModule2 position={[0, 0, 0]} batteryType='fan' />
      ) : (
        <BatteryModule0 position={[0, 0, 0]} batteryType='fan' />
      )}
      {/* 회전 상태 및 속도 표시 */}
      <Text
        position={[0, -1, 3]}
        fontSize={0.2}
        color={isRotating && batteryMode > 0 ? 'lightgreen' : 'gray'}
        anchorX='center'
        anchorY='middle'>
        {batteryMode === 0
          ? '전원 없음'
          : isRotating
          ? `회전 중 (속도: ${batteryMode === 1 ? '느림' : '빠름'})`
          : '정지'}
      </Text>
    </group>
  )
}

// Main Connected Fans Component
export default function ConnectedFans(props: GroupProps) {
  const [fan1BatteryMode, setFan1BatteryMode] = useState(0) // 0: 없음, 1: 낮음, 2: 높음
  const [fan2BatteryMode, setFan2BatteryMode] = useState(0)
  const [buttonAPressed, setButtonAPressed] = useState(false) // 버튼 A 상태
  const [buttonBPressed, setButtonBPressed] = useState(false) // 버튼 B 상태

  // AudioManager 인스턴스
  const audioManager = AudioManager.getInstance()

  const playBatteryAudio = () => {
    audioManager.playNarration('/sounds/6-2-3/narration/6-2-3-D.MP3', 0.7)
      .catch((error) => console.log('나레이션 재생 실패:', error))
  }

  // 버튼 A 클릭 - Fan1을 2개로, Fan2를 1개로
  const handleButtonAClick = () => {
    if (!buttonAPressed) {
      playBatteryAudio()
      audioManager.playGeneralButton()
    }
    if (buttonAPressed) {
      // 이미 눌려있으면 해제 - 모든 배터리 모드를 0으로
      setButtonAPressed(false)
      setFan1BatteryMode(0)
      setFan2BatteryMode(0)
    } else {
      // 눌려있지 않으면 누르기
      setButtonAPressed(true)
      setButtonBPressed(false) // 버튼 B 해제
      setFan1BatteryMode(2) // Fan1을 배터리 2개 모드로
      setFan2BatteryMode(1) // Fan2를 배터리 1개 모드로
    }
  }

  // 버튼 B 클릭 - Fan1을 1개로, Fan2를 2개로
  const handleButtonBClick = () => {
    if (!buttonBPressed) {
      playBatteryAudio()
      audioManager.playGeneralButton()
    }
    if (buttonBPressed) {
      // 이미 눌려있으면 해제 - 모든 배터리 모드를 0으로
      setButtonBPressed(false)
      setFan1BatteryMode(0)
      setFan2BatteryMode(0)
    } else {
      // 눌려있지 않으면 누르기
      setButtonBPressed(true)
      setButtonAPressed(false) // 버튼 A 해제
      setFan1BatteryMode(1) // Fan1을 배터리 1개 모드로
      setFan2BatteryMode(2) // Fan2를 배터리 2개 모드로
    }
  }

  return (
    <group {...props}>
      {/* Fan1 */}
      <FanComponent
        modelPath='models/6-2-3/Fan1-notConnected.glb'
        position={[-5, -0.1, 0]}
        batteryMode={fan1BatteryMode}
        textPosition={[5, 3, 3]}
        componentName='Fan1'
      />

      {/* Fan2 */}
      <FanComponent
        modelPath='models/6-2-3/Fan2-notConnected.glb'
        position={[5, -0.1, 0]}
        batteryMode={fan2BatteryMode}
        textPosition={[3, 3, 3]}
        componentName='Fan2'
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
          <meshStandardMaterial color={buttonAPressed ? '#40e0d0' : '#666666'} />
          <Text
            position={[0, 0.26, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.25}
            color='black'
            fontWeight='bold'
            font='/fonts/Maplestory Bold.ttf'
            anchorX='center'
            anchorY='middle'>
            전지 : 1개
          </Text>
        </Box>

        {/* 버튼 B - Fan1을 1개, Fan2를 2개로 */}
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
          <meshStandardMaterial color={buttonBPressed ? '#ff69b4' : '#666666'} />
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

// 모델 프리로드
useGLTF.preload('models/6-2-3/Fan1-notConnected.glb')
useGLTF.preload('models/6-2-3/Fan2-notConnected.glb')