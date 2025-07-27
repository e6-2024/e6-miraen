import { useGLTF, useAnimations, Text, Box } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useRef, useEffect, useState, createContext, useContext } from 'react'
import * as THREE from 'three'
import { BatteryModule0, BatteryModule1, BatteryModule2 } from './BatteryModule'
import AudioManager from '@/components/6-2-3/AudioManager' 

interface SwitchContextType {
  activeBuzzer: string | null
  setActiveBuzzer: (buzzer: string | null) => void
}

const SwitchContext = createContext<SwitchContextType>({
  activeBuzzer: null,
  setActiveBuzzer: () => {},
})

// Individual Buzzer Component
function BuzzerComponent({
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
  
  const [buzzerOn, setBuzzerOn] = useState(false)
  const { activeBuzzer, setActiveBuzzer } = useContext(SwitchContext)
  const [blinkColor, setBlinkColor] = useState<'blue' | 'red'>('blue')

  // AudioManager 인스턴스
  const audioManager = AudioManager.getInstance()
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // 전역 활성 버저 상태가 변경될 때 현재 버저의 상태 업데이트
  useEffect(() => {
    if (activeBuzzer !== componentName) {
      setBuzzerOn(false)
    }
  }, [activeBuzzer, componentName])

  // 버저 상태와 배터리 모드에 따른 오디오 제어
  useEffect(() => {
    // 기존 오디오 중지
    if (currentAudioRef.current) {
      audioManager.stopComponentSound(`buzzer-${componentName}`)
      currentAudioRef.current = null
    }

    if (buzzerOn && batteryMode > 0) {
      // 배터리 모드에 따라 다른 오디오 파일 선택
      const audioPath = batteryMode === 1 
        ? '/sounds/6-2-3/buzzer1.MP3' 
        : '/sounds/6-2-3/buzzer2.MP3'

      // 버저 사운드는 루프로 재생
      audioManager.playComponentSound(
        audioPath,
        `buzzer-${componentName}`,
        0.7,
        true // 루프 재생
      ).then((audio) => {
        currentAudioRef.current = audio
      }).catch((error) => {
        console.log(`${componentName} 소리 재생 실패:`, error)
      })
    }
  }, [buzzerOn, batteryMode, componentName, audioManager])

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return () => {
      audioManager.stopComponentSound(`buzzer-${componentName}`)
      currentAudioRef.current = null
    }
  }, [audioManager, componentName])

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

  // 색깔 깜빡임 효과 (전지가 연결되었지만 스위치가 열려있을 때)
  useEffect(() => {
    if (batteryMode > 0 && !buzzerOn) {
      const interval = setInterval(() => {
        setBlinkColor((prev) => (prev === 'blue' ? 'red' : 'blue'))
      }, 500) // 0.5초마다 파란색과 빨간색 사이 전환

      return () => clearInterval(interval)
    } else {
      // 버저가 켜지거나 배터리가 없으면 기본 색으로 복원
      setBlinkColor('blue')
    }
  }, [batteryMode, buzzerOn])

  // Switch 머티리얼 색상 업데이트
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.name === 'Switch' && child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            if (batteryMode > 0 && !buzzerOn) {
              // 전지가 연결되어 있고 스위치가 꺼져 있을 때 깜빡임
              if (blinkColor === 'blue') {
                child.material.color.setHex(0x0066ff) // 파란색
                child.material.emissive.setHex(0x002266) // 파란색 발광
              } else {
                child.material.color.setHex(0xff3333) // 빨간색
                child.material.emissive.setHex(0x662222) // 빨간색 발광
              }
            } else {
              // 기본 상태 (원래 색상으로 복원)
              child.material.color.setHex(0xffffff) // 흰색 또는 원래 색상
              child.material.emissive.setHex(0x000000) // 발광 없음
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
        console.log(`${componentName} Switch clicked - toggling buzzer and animation`)

        if (buzzerOn) {
          // 현재 켜져있으면 끄기
          setBuzzerOn(false)
          setActiveBuzzer(null)
        } else {
          // 현재 꺼져있으면 켜기 (다른 버저는 자동으로 꺼짐)
          setBuzzerOn(true)
          setActiveBuzzer(componentName)
        }
        return
      }
      obj = obj.parent
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

      {/* 배터리 모듈 렌더링 */}
      {batteryMode === 1 ? (
        <BatteryModule1 position={[0, 0, 0]} batteryType='buzzer' />
      ) : batteryMode === 2 ? (
        <BatteryModule2 position={[0, 0, 0]} batteryType='buzzer' />
      ) : (
        <BatteryModule0 position={[0, 0, 0]} batteryType='buzzer' />
      )}
    </group>
  )
}

// Main Connected Buzzers Component
export default function ConnectedBuzzers(props: GroupProps) {
  const [buzzer1BatteryMode, setBuzzer1BatteryMode] = useState(0) // 0: 없음, 1: 낮음, 2: 높음
  const [buzzer2BatteryMode, setBuzzer2BatteryMode] = useState(0)
  const [buttonAPressed, setButtonAPressed] = useState(false) // 버튼 A 상태
  const [buttonBPressed, setButtonBPressed] = useState(false) // 버튼 B 상태
  const [activeBuzzer, setActiveBuzzer] = useState<string | null>(null)

  // AudioManager 인스턴스
  const audioManager = AudioManager.getInstance()

  const playBatteryAudio = () => {
    audioManager.playNarration('/sounds/6-2-3/narration/6-2-3-C.MP3', 0.7)
      .catch((error) => console.log('나레이션 재생 실패:', error))
  }

  // 버튼 A 클릭 - Buzzer1을 2개로, Buzzer2를 1개로
  const handleButtonAClick = () => {
    if (!buttonAPressed) {
      playBatteryAudio()
      audioManager.playGeneralButton()
    }
    if (buttonAPressed) {
      // 이미 눌려있으면 해제 - 모든 배터리 모드를 0으로
      setButtonAPressed(false)
      setBuzzer1BatteryMode(0)
      setBuzzer2BatteryMode(0)
    } else {
      // 눌려있지 않으면 누르기
      setButtonAPressed(true)
      setButtonBPressed(false) // 버튼 B 해제
      setBuzzer1BatteryMode(2) // Buzzer1을 배터리 2개 모드로
      setBuzzer2BatteryMode(1) // Buzzer2를 배터리 1개 모드로
    }
  }

  // 버튼 B 클릭 - Buzzer1을 1개로, Buzzer2를 2개로
  const handleButtonBClick = () => {
    if (!buttonBPressed) {
      playBatteryAudio()
      audioManager.playGeneralButton()
    }
    if (buttonBPressed) {
      // 이미 눌려있으면 해제 - 모든 배터리 모드를 0으로
      setButtonBPressed(false)
      setBuzzer1BatteryMode(0)
      setBuzzer2BatteryMode(0)
    } else {
      // 눌려있지 않으면 누르기
      setButtonBPressed(true)
      setButtonAPressed(false) // 버튼 A 해제
      setBuzzer1BatteryMode(1) // Buzzer1을 배터리 1개 모드로
      setBuzzer2BatteryMode(2) // Buzzer2를 배터리 2개 모드로
    }
  }

  return (
    <SwitchContext.Provider value={{ activeBuzzer, setActiveBuzzer }}>
      <group {...props}>
        {/* Buzzer1 */}
        <BuzzerComponent
          modelPath='models/6-2-3/Buzzer1-notConnected.glb'
          position={[-5, -0.1, 0]}
          batteryMode={buzzer1BatteryMode}
          textPosition={[4, 3, 3]}
          componentName='Buzzer1'
        />

        {/* Buzzer2 */}
        <BuzzerComponent
          modelPath='models/6-2-3/Buzzer2-notConnected.glb'
          position={[5, -0.1, 0]}
          batteryMode={buzzer2BatteryMode}
          textPosition={[3, 3, 3]}
          componentName='Buzzer2'
        />

        <group position={[1, 0, 6]}>
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
            <meshStandardMaterial color={buttonAPressed ? '#ff6b6b' : '#666666'} />
            <Text
              position={[0, 0.26, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.5}
              color='black'
              fontWeight='bold'
              font='/fonts/Maplestory Bold.ttf'
              anchorX='center'
              anchorY='middle'>
              1개
            </Text>
          </Box>

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
            <meshStandardMaterial color={buttonBPressed ? '#4ecdc4' : '#666666'} />
            <Text
              position={[0, 0.26, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontWeight='bold'
              fontSize={0.5}
              color='black'
              font='/fonts/Maplestory Bold.ttf'
              anchorX='center'
              anchorY='middle'>
              2개
            </Text>
          </Box>
        </group>
      </group>
    </SwitchContext.Provider>
  )
}

// 모델 프리로드
useGLTF.preload('models/6-2-3/Buzzer1-notConnected.glb')
useGLTF.preload('models/6-2-3/Buzzer2-notConnected.glb')