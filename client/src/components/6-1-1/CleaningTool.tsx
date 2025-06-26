import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface CleaningToolProps {
  modelPath: string
  visible: boolean
  scale?: number
  rotation?: [number, number, number]
}

export const CleaningTool = ({ modelPath, visible, scale = 1, rotation = [0, 0, 0] }: CleaningToolProps) => {
  const gltf = useGLTF(modelPath)
  const meshRef = useRef<THREE.Group>(null)
  const { camera, gl } = useThree()
  
  // 마우스 위치를 저장할 ref
  const mousePosition = useRef(new THREE.Vector2())
  
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // 마우스 좌표를 정규화된 디바이스 좌표로 변환 (-1 to +1)
      mousePosition.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mousePosition.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    
    if (visible) {
      window.addEventListener('mousemove', handleMouseMove)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [visible])
  
  useFrame(() => {
    if (meshRef.current && visible) {
      // 마우스 위치를 3D 공간 좌표로 변환
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mousePosition.current, camera)
      
      // 카메라 앞 일정 거리에 도구 배치
      const distance = 2
      const direction = raycaster.ray.direction.clone()
      const newPosition = camera.position.clone().add(direction.multiplyScalar(distance))
      
      // 부드러운 이동을 위한 lerp 적용
      meshRef.current.position.lerp(newPosition, 0.1)
      
      // 기본 회전값 적용 후 카메라를 향하도록 회전
      const lookAtPosition = camera.position.clone()
      meshRef.current.lookAt(lookAtPosition)
      
      // 추가 회전값 적용
      meshRef.current.rotation.x += rotation[0]
      meshRef.current.rotation.y += rotation[1]
      meshRef.current.rotation.z += rotation[2]
    }
  })
  
  if (!visible) return null
  
  return (
    <group ref={meshRef} scale={scale}>
      <primitive object={gltf.scene.clone()} />
    </group>
  )
}

// 각 도구별 컴포넌트
export const RagTool = ({ visible }: { visible: boolean }) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Rag/rag2.gltf" 
    visible={visible} 
    scale={0.3} 
    rotation={[0, -Math.PI/2, 0]}
  />
)

export const SprayTool = ({ visible }: { visible: boolean }) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Spray/Spray.gltf" 
    visible={visible} 
    scale={0.1} 
    rotation={[Math.PI/4, Math.PI/6, -Math.PI/8]}
  />
)

// Preload models
useGLTF.preload('/models/6-1-1/Rag/rag2.gltf')
useGLTF.preload('/models/6-1-1/Spray/Spray.gltf')