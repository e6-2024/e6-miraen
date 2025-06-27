import { useGLTF, useAnimations } from '@react-three/drei'
import { GroupProps, useFrame, ThreeEvent } from '@react-three/fiber'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

interface Fan2Props extends GroupProps {
  speed?: number
}

export default function Fan2({ speed = 1.0, ...props }: Fan2Props) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('models/6-2-3/Fan_2.gltf')
  const { actions, mixer } = useAnimations(animations, groupRef)
  const fanBladeRef = useRef<THREE.Mesh | null>(null)
  const [isRotating, setIsRotating] = useState(false)

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
      const actionName = Object.keys(actions)[0] // 첫 번째 애니메이션 사용
      const action = actions[actionName]
      
      if (action) {
        const animationDuration = action.getClip().duration
        const halfDuration = animationDuration / 2
        
        action.reset()
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.timeScale = 1
        
        if (isRotating) {
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
  }, [isRotating, actions])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    // 이벤트 전파 완전 차단
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    let obj: THREE.Object3D | null = e.object
    
    // 이 컴포넌트의 scene 내부에 있는 Switch인지 확인
    while (obj) {
      if (obj.name === 'Switch' && scene.getObjectById(obj.id)) {
        console.log('Fan2 Switch clicked - toggling rotation and animation')
        setIsRotating((prev) => !prev)
        return // 처리 완료 후 즉시 리턴
      }
      obj = obj.parent
    }
  }

  useFrame((state, delta) => {
    if (fanBladeRef.current && isRotating) {
      fanBladeRef.current.rotation.y += delta * speed * 20
    }
  })

  return (
    <group ref={groupRef} {...props}>
      <primitive 
        object={scene} 
        onPointerDown={handlePointerDown}
        // 추가적인 이벤트 핸들러로 이벤트 차단 강화
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
    </group>
  )
}