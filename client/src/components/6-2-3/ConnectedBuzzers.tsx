import { useGLTF, useAnimations, Text, Box } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useRef, useEffect, useState, createContext, useContext } from 'react'
import * as THREE from 'three'
import { BatteryModule0, BatteryModule1, BatteryModule2 } from './BatteryModule'

// 전역 스위치 상태 컨텍스트
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
  
  // 배터리 모드별 오디오 레퍼런스
  const audioRef1 = useRef<HTMLAudioElement | null>(null) // 배터리 1개용
  const audioRef2 = useRef<HTMLAudioElement | null>(null) // 배터리 2개용
  
  const [buzzerOn, setBuzzerOn] = useState(false)
  const { activeBuzzer, setActiveBuzzer } = useContext(SwitchContext)
  const [blinkColor, setBlinkColor] = useState<'blue' | 'red'>('blue')

  // 전역 활성 버저 상태가 변경될 때 현재 버저의 상태 업데이트
  useEffect(() => {
    if (activeBuzzer !== componentName) {
      setBuzzerOn(false)
    }
  }, [activeBuzzer, componentName])

  // 오디오 초기화 - 배터리 모드별로 다른 파일
  useEffect(() => {
    // 배터리 1개용 오디오
    if (!audioRef1.current) {
      audioRef1.current = new Audio('/sounds/6-2-3/buzzer1.MP3') // 배터리 1개용 파일
      audioRef1.current.loop = true
      audioRef1.current.volume = 0.7
    }

    // 배터리 2개용 오디오
    if (!audioRef2.current) {
      audioRef2.current = new Audio('/sounds/6-2-3/buzzer2.MP3') // 배터리 2개용 파일
      audioRef2.current.loop = true
      audioRef2.current.volume = 0.7
    }

    return () => {
      if (audioRef1.current) {
        audioRef1.current.pause()
        audioRef1.current = null
      }
      if (audioRef2.current) {
        audioRef2.current.pause()
        audioRef2.current = null
      }
    }
  }, [])

  // 버저 상태와 배터리 모드에 따른 오디오 제어
  useEffect(() => {
    // 모든 오디오 중지
    if (audioRef1.current) {
      audioRef1.current.pause()
    }
    if (audioRef2.current) {
      audioRef2.current.pause()
    }

    if (buzzerOn && batteryMode > 0) {
      let currentAudio: HTMLAudioElement | null = null

      // 배터리 모드에 따라 다른 오디오 선택
      if (batteryMode === 1) {
        currentAudio = audioRef1.current // 배터리 1개용 사운드
      } else if (batteryMode === 2) {
        currentAudio = audioRef2.current // 배터리 2개용 사운드
      }

      // 선택된 오디오 재생
      if (currentAudio) {
        currentAudio.currentTime = 0
        currentAudio.play().catch((error) => {
          console.log(`${componentName} 소리 재생 실패:`, error)
        })
      }
    }
  }, [buzzerOn, batteryMode, componentName])

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

  const playBatteryAudio = () => {
    const audio = new Audio('/sounds/6-2-3/narration/6-2-3-C.MP3')
    audio.volume = 0.7
    audio.play().catch((error) => console.log('오디오 재생 실패:', error))
  }

  // 버튼 A 클릭 - Buzzer1을 2개로, Buzzer2를 1개로
  const handleButtonAClick = () => {
    if (!buttonAPressed) {
      playBatteryAudio()
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
            <meshStandardMaterial color={buttonAPressed ? '#ff6b6b' : '#666666'} />
            <Text
              position={[0, 0.26, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.5}
              color='white'
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
              color='white'
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