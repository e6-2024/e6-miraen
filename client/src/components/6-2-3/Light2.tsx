import { useGLTF, useAnimations } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

interface Light2Props extends GroupProps {
  lightIntensity?: number
}

export default function Light2({ 
  lightIntensity = 1.0, 
  ...props 
}: Light2Props) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('models/6-2-3/Light_2.gltf')
  const { actions, mixer } = useAnimations(animations, groupRef)
  const [lightOn, setLightOn] = useState(false)

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
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    let obj: THREE.Object3D | null = e.object
    
    while (obj) {
    if (obj.name === 'Switch' && scene.getObjectById(obj.id)) {
        console.log('Light2 Switch clicked - toggling light and animation')
        setLightOn((prev) => !prev)
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

      <mesh position={[0.1, 1.0, -2.0]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial
          color={new THREE.Color(1, 0.8, 0.4)}
          emissive={new THREE.Color(2, 0.6, 0.2)}
          emissiveIntensity={lightOn ? 2 : 0}
          transparent
          opacity={lightOn ? 1 : 0.4}
        />
      </mesh><Text
        position={[3, 3, 3]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        스위치를 눌러보세요!
      </Text>
      
      <pointLight
        position={[0.1, 1.0, -2.0]}
        intensity={lightOn ? 20 : 0}
        distance={10}
        decay={2}
        color={new THREE.Color(1, 0.8, 0.4)}
        castShadow
      />
    </group>
  )
}