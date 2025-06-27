import { useGLTF, useAnimations } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'


export default function Buzzer2(props: GroupProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('models/6-2-3/Buzzer_2.gltf')
  const { actions, mixer } = useAnimations(animations, groupRef)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [buzzerOn, setBuzzerOn] = useState(false)

  // 오디오 초기화
  useEffect(() => {
    audioRef.current = new Audio('/sounds/buzzer.mp3')
    audioRef.current.volume = 0.5
    audioRef.current.loop = true // 반복 재생 설정
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // 버저 상태에 따른 오디오 제어
  useEffect(() => {
    if (audioRef.current) {
      if (buzzerOn) {
        // 스위치가 닫히면 버저 소리 지속 재생
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(error => {
          console.log('Buzzer2 소리 재생 실패:', error)
        })
      } else {
        // 스위치가 열리면 버저 소리 정지
        audioRef.current.pause()
      }
    }
  }, [buzzerOn])

  // 애니메이션 제어
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const actionName = Object.keys(actions)[0] // 첫 번째 애니메이션 사용
      const action = actions[actionName]
      
      if (action) {
        const animationDuration = action.getClip().duration
        const halfDuration = animationDuration / 2
        
        action.reset()
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.timeScale = 1
        
        if (buzzerOn) {
          // 스위치 닫기 (0초부터 절반까지)
          action.time = 0
          action.play()
          // 절반 지점에서 멈추기 위한 타이머
          setTimeout(() => {
            if (action) {
              action.paused = true
            }
          }, halfDuration * 1000)
        } else {
          // 스위치 열기 (절반부터 끝까지)
          action.time = halfDuration
          action.play()
        }
      }
    }
  }, [buzzerOn, actions])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    let obj: THREE.Object3D | null = e.object
    
    while (obj) {
      if (obj.name === 'Switch' && scene.getObjectById(obj.id)) {
        console.log('Buzzer2 Switch clicked - toggling buzzer and animation')
        setBuzzerOn((prev) => !prev)
        return
      }
      obj = obj.parent
    }
  }

  return (
    <group ref={groupRef} {...props}>
      <primitive 
        object={scene} 
        onPointerDown={handlePointerDown}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          e.nativeEvent.stopImmediatePropagation()
        }}
      />
      <Text
      position={[3, 3, 3]} // 스위치 위쪽 위치
      fontSize={0.3}
      color="white"
      anchorX="center"
      anchorY="middle"
    >
      스위치를 눌러보세요!
    </Text>
    <Text
      position={[-5, 3, 3]} // 스위치 위쪽 위치
      fontSize={0.3}
      color="white"
      anchorX="center"
      anchorY="middle"
    >
      스위치를 눌러보세요!
    </Text>
    </group>
  )
}

useGLTF.preload('models/6-2-3/Buzzer_2.gltf')