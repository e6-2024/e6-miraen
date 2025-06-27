// components/Light1.tsx
import { useGLTF } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

interface Light1Props extends GroupProps {
  lightIntensity?: number
}

export default function Light1({
  lightIntensity = 1.0,
  ...props
}: Light1Props) {
  // GLTF 로드
  const { scene } = useGLTF('models/6-2-3/Light_1.gltf')
  const groupRef = useRef<THREE.Group>(null)

  // 불 켜짐 여부 상태
  const [lightOn, setLightOn] = useState(false)

  // 스위치 그룹 회전으로 시각적 토글 표현
  useEffect(() => {
    const switchGroup = scene.getObjectByName('Switch') as THREE.Group | undefined
    if (switchGroup) {
      switchGroup.rotation.x = lightOn ? Math.PI / 6 : 0
    }
  }, [lightOn, scene])

  // 클릭 이벤트 핸들러: 클릭된 오브젝트가 Switch 그룹 하위인지 검사
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()  // 이벤트 전파 차단
    let obj: THREE.Object3D | null = e.object
    while (obj) {
      if (obj.name === 'Switch') {
        setLightOn((prev) => !prev)
        break
      }
      obj = obj.parent
    }
  }

  return (
    <group ref={groupRef} {...props}>
      {/* GLTF 전체를 렌더링하며 클릭 리스너 연결 */}
      <primitive
        object={scene}
        onPointerDown={handlePointerDown}
      />

      {/* 전구 발광체: lightOn에 따라 emissiveIntensity와 opacity 조절 */}
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

      {/* 실제 조명 역할을 하는 포인트 라이트 */}
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
