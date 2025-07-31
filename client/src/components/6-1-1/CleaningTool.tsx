import React, { useRef, useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface CleaningToolProps {
  modelPath: string
  visible: boolean
  scale?: number
  rotation?: [number, number, number]
  onSpray?: () => void
  isSprayActive?: boolean
}

export const CleaningTool = ({ 
  modelPath, 
  visible, 
  scale = 1, 
  rotation = [0, 0, 0],
  onSpray,
  isSprayActive = false
}: CleaningToolProps) => {
  const gltf = useGLTF(modelPath)
  const meshRef = useRef<THREE.Group>(null)
  const { camera, gl } = useThree()
  
  const mousePosition = useRef(new THREE.Vector2())
  const [sprayPosition, setSprayPosition] = useState<[number, number, number]>([0, 0, 0])
  const [sprayDirection, setSprayDirection] = useState<[number, number, number]>([0, 0, -1])

  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.side = THREE.DoubleSide
            })
          } else {
            child.material.side = THREE.DoubleSide
          }
        }
      })
    }
  }, [gltf])
  
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mousePosition.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    
    const handleClick = (event: MouseEvent) => {
      if (visible && onSpray) {
        onSpray()
      }
    }
    
    if (visible) {
      window.addEventListener('mousemove', handleMouseMove)
      if (onSpray) {
        window.addEventListener('click', handleClick)
      }
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [visible, onSpray])
  
  useFrame(() => {
    if (meshRef.current && visible) {
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mousePosition.current, camera)
      
      const distance = 2
      const direction = raycaster.ray.direction.clone()
      const newPosition = camera.position.clone().add(direction.multiplyScalar(distance))
      
      meshRef.current.position.lerp(newPosition, 0.1)
      const lookAtPosition = camera.position.clone()
      meshRef.current.lookAt(lookAtPosition)
      meshRef.current.rotation.x += rotation[0]
      meshRef.current.rotation.y += rotation[1]
      meshRef.current.rotation.z += rotation[2]
      
      // 스프레이 노즐 위치와 방향 업데이트 (스프레이 도구인 경우)
      if (modelPath.includes('Spray') || modelPath.includes('spray')) {
        // 스프레이 노즐 위치 (모델의 앞쪽 끝)
        const nozzleOffset = new THREE.Vector3(0, 0, -0.3) // 모델에 따라 조정 필요
        nozzleOffset.applyQuaternion(meshRef.current.quaternion)
        const nozzlePosition = meshRef.current.position.clone().add(nozzleOffset)
        
        setSprayPosition([nozzlePosition.x, nozzlePosition.y, nozzlePosition.z])
        
        // 스프레이 방향 (카메라에서 마우스 방향으로)
        const sprayDir = raycaster.ray.direction.clone()
        setSprayDirection([sprayDir.x, sprayDir.y, sprayDir.z])
      }
    }
  })
  
  if (!visible) return null
  
  return (
    <group>
      <group ref={meshRef} scale={scale}>
        <primitive object={gltf.scene.clone()} />
      </group>
    </group>
  )
}

// 스프레이 도구들 (onSpray prop 추가)
export const SprayTool = ({ 
  visible, 
  onSpray,
  isSprayActive = false 
}: { 
  visible: boolean
  onSpray?: () => void
  isSprayActive?: boolean 
}) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Window/Window_cleaner_Spray.glb" 
    visible={visible} 
    scale={1.3} 
    rotation={[Math.PI/4, Math.PI/6, -Math.PI/8]}
    onSpray={onSpray}
    isSprayActive={isSprayActive}
  />
)

export const VinegarTool = ({ 
  visible, 
  onSpray,
  isSprayActive = false 
}: { 
  visible: boolean
  onSpray?: () => void
  isSprayActive?: boolean 
}) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Vinegar_Spray/Vinegar.glb" 
    visible={visible} 
    scale={4} 
    rotation={[Math.PI/2, 0, 0]}
    onSpray={onSpray}
    isSprayActive={isSprayActive}
  />
)

export const BleachTool = ({ 
  visible, 
  onSpray,
  isSprayActive = false 
}: { 
  visible: boolean
  onSpray?: () => void
  isSprayActive?: boolean 
}) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Bleach/Bleach.glb" 
    visible={visible} 
    scale={0.2} 
    rotation={[0, Math.PI/4, 0]}
    onSpray={onSpray}
    isSprayActive={isSprayActive}
  />
)

export const ToiletCleanerTool = ({ 
  visible, 
  onSpray,
  isSprayActive = false 
}: { 
  visible: boolean
  onSpray?: () => void
  isSprayActive?: boolean 
}) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Toilet_bleach/Toilet_Spray.glb" 
    visible={visible} 
    scale={0.03} 
    rotation={[Math.PI, -Math.PI/4, Math.PI/2]}
    onSpray={onSpray}
    isSprayActive={isSprayActive}
  />
)

// 각 미션별 닦기 도구들 (기존과 동일)
export const GlassRagTool = ({ visible }: { visible: boolean }) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Rag/Rag.glb" 
    visible={visible} 
    scale={0.05} 
    rotation={[Math.PI, Math.PI/2, Math.PI]}
  />
)

export const ToiletBrushTool = ({ visible }: { visible: boolean }) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Toilet_Brush/Toilet_Brush.glb" 
    visible={visible} 
    scale={0.7} 
    rotation={[-Math.PI/2, -Math.PI, 0]}
  />
)

export const BathroomScrubTool = ({ visible }: { visible: boolean }) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Bathroom_Scrub/Bathroom_Scrub.glb" 
    visible={visible} 
    scale={0.001} 
    rotation={[Math.PI/2, 0, Math.PI/2]}
  />
)

// Preload
useGLTF.preload('/models/6-1-1/Window/Window_cleaner_Spray.glb')
useGLTF.preload('/models/6-1-1/Vinegar_Spray/Vinegar.glb')
useGLTF.preload('/models/6-1-1/Bleach/Bleach.glb')
useGLTF.preload('/models/6-1-1/Toilet_bleach/Toilet_Spray.glb')

useGLTF.preload('/models/6-1-1/Rag/Rag.glb')
useGLTF.preload('/models/6-1-1/Toilet_Brush/Toilet_Brush.glb')
useGLTF.preload('/models/6-1-1/Bathroom_Scrub/Bathroom_Scrub.glb')
