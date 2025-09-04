import { useGLTF, useAnimations, Text } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useRef, useEffect, useState, createContext, useContext } from 'react'
import * as THREE from 'three'
import { BatteryModule1, BatteryModule2 } from './BatteryModule'
import { BatteryButton1, BatteryButton2 } from './BatteryButton'
import AudioManager from '@/utils/6-2-3/audioManager' 

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
  componentName,
}: {
  modelPath: string
  position: [number, number, number]
  batteryMode: number
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

  // 버저 상태와 배터리 모드에 따른 오디오 제어 (소리 크기 개선)
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

      // 전지 2개일 때 소리를 더 크게 설정 (0.7 -> 0.9)
      const volume = batteryMode === 1 ? 0.7 : 0.9

      // 버저 사운드는 루프로 재생
      audioManager.playComponentSound(
        audioPath,
        `buzzer-${componentName}`,
        volume,
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
        <BatteryModule1 showBody={false} position={[0, 0, 0]} batteryType='buzzer' />
      )}
    </group>
  )
}

// Main Connected Buzzers Component
export default function ConnectedBuzzers(props: GroupProps) {
  // 배터리 연결 상태: 0=없음, 1=1개, 2=2개
  const [buzzer1BatteryMode, setBuzzer1BatteryMode] = useState(0)
  const [buzzer2BatteryMode, setBuzzer2BatteryMode] = useState(0)
  
  // 전지 사용 상태 추적
  const [battery1Used, setBattery1Used] = useState(false)
  const [battery2Used, setBattery2Used] = useState(false)
  
  // 다음에 연결될 회로 추적 (true=왼쪽, false=오른쪽)
  const [nextTargetIsLeft, setNextTargetIsLeft] = useState(true)
  
  const [activeBuzzer, setActiveBuzzer] = useState<string | null>(null)

  // AudioManager 인스턴스
  const audioManager = AudioManager.getInstance()

  const playBatteryAudio = () => {
    audioManager.playNarration('/sounds/6-2-3/narration/6-2-3-C.MP3', 0.7)
      .catch((error) => console.log('나레이션 재생 실패:', error))
  }

  // 전지 1개 클릭
  const handleBattery1Click = (e: ThreeEvent<PointerEvent>) => {
    if (battery1Used) return // 이미 사용된 전지는 클릭 불가
    
    playBatteryAudio()
    audioManager.playGeneralButton()
    
    setBattery1Used(true)
    
    if (nextTargetIsLeft) {
      // 왼쪽 회로에 연결
      setBuzzer1BatteryMode(1)
      setNextTargetIsLeft(false) // 다음은 오른쪽으로
    } else {
      // 오른쪽 회로에 연결
      setBuzzer2BatteryMode(1)
      setNextTargetIsLeft(true) // 다음은 왼쪽으로
    }
  }

  // 전지 2개 클릭
  const handleBattery2Click = (e: ThreeEvent<PointerEvent>) => {
    if (battery2Used) return // 이미 사용된 전지는 클릭 불가
    
    playBatteryAudio()
    audioManager.playGeneralButton()
    
    setBattery2Used(true)
    
    if (nextTargetIsLeft) {
      // 왼쪽 회로에 연결
      setBuzzer1BatteryMode(2)
      setNextTargetIsLeft(false) // 다음은 오른쪽으로
    } else {
      // 오른쪽 회로에 연결
      setBuzzer2BatteryMode(2)
      setNextTargetIsLeft(true) // 다음은 왼쪽으로
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
          componentName='Buzzer1'
        />

        {/* Buzzer2 */}
        <BuzzerComponent
          modelPath='models/6-2-3/Buzzer2-notConnected.glb'
          position={[5, -0.1, 0]}
          batteryMode={buzzer2BatteryMode}
          componentName='Buzzer2'
        />

        <group position={[0, 1, 6]}>
          <BatteryButton1
            position={[-2.5, 0, 0]}
            isUsed={battery1Used}
            onClick={handleBattery1Click}
          />

          <BatteryButton2
            position={[2.5, 0, 0]}
            isUsed={battery2Used}
            onClick={handleBattery2Click}
          />
        </group>
      </group>
    </SwitchContext.Provider>
  )
}

// 모델 프리로드
useGLTF.preload('models/6-2-3/Buzzer1-notConnected.glb')
useGLTF.preload('models/6-2-3/Buzzer2-notConnected.glb')