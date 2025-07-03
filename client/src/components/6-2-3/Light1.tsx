import { useGLTF, useAnimations } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

interface Light1Props extends GroupProps {
  lightIntensity?: number
}

export default function Light1({
  lightIntensity = 1.0,
  ...props
}: Light1Props) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('models/6-2-3/Light_1.gltf')
  const { actions, mixer } = useAnimations(animations, groupRef)
  const [lightOn, setLightOn] = useState(false)

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
        action.timeScale = 1
        
        if (lightOn) {
          action.time = 0
          action.play()
          setTimeout(() => {
            if (action) {
              action.paused = true
            }
          }, halfDuration * 1000)
        } else {
          action.time = halfDuration
          action.play()
        }
      }
    }
  }, [lightOn, actions])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    let obj: THREE.Object3D | null = e.object
    
    while (obj) {
      if (obj.name === 'Switch' && scene.getObjectById(obj.id)) {
        // 스위치 클릭 시에만 이벤트 전파 차단
        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()
        console.log('Light1 Switch clicked - toggling light and animation')
        setLightOn((prev) => !prev)
        return
      }
      obj = obj.parent
    }
    // 스위치가 아닌 경우 이벤트 전파를 허용 (OrbitControls가 작동할 수 있도록)
  }

  return (
    <group ref={groupRef} {...props}>
      <primitive
        object={scene}
        onPointerDown={handlePointerDown}
        // onClick 이벤트에서 전체 차단 제거
      />

      {/* 전구 발광체 */}
      <mesh position={[0.1, 1.0, -2.0]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial
          color={new THREE.Color(1, 0.8, 0.4)}
          emissive={new THREE.Color(1, 0.6, 0.2)}
          emissiveIntensity={lightOn ? lightIntensity * 0.5 : 0}
          transparent
          opacity={lightOn ? 0.8 : 0.4}
        />
      </mesh>

      <Text
        position={[5, 3, 3]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        스위치를 눌러보세요!
      </Text>

      {/* 포인트 라이트 */}
      <pointLight
        position={[0.1, 1.0, -2.0]}
        intensity={lightOn ? lightIntensity * 2 : 0}
        distance={10}
        decay={2}
        color={new THREE.Color(1, 0.8, 0.4)}
      />
    </group>
  )
}