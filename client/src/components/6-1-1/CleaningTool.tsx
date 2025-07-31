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
  
  const mousePosition = useRef(new THREE.Vector2())

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
    
    if (visible) {
      window.addEventListener('mousemove', handleMouseMove)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [visible])
  
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
    }
  })
  
  if (!visible) return null
  
  return (
    <group ref={meshRef} scale={scale}>
      <primitive object={gltf.scene.clone()} />
    </group>
  )
}

//도마
export const CuttingBoard = ({ visible }: { visible: boolean }) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Cutting_Board/Cutting_Board.glb" 
    visible={visible} 
    scale={1.3} 
    rotation={[Math.PI/4, Math.PI/6, -Math.PI/8]}
  />
)


// 스프레이 도구들
export const SprayTool = ({ visible }: { visible: boolean }) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Window/Window_cleaner_Spray.glb" 
    visible={visible} 
    scale={1.3} 
    rotation={[Math.PI/4, Math.PI/6, -Math.PI/8]}
  />
)

export const VinegarTool = ({ visible }: { visible: boolean }) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Vinegar_Spray/Vinegar.glb" 
    visible={visible} 
    scale={4} 
    rotation={[Math.PI/2, 0, 0]}
  />
)

export const BleachTool = ({ visible }: { visible: boolean }) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Bleach/Bleach.glb" 
    visible={visible} 
    scale={0.2} 
    rotation={[0, Math.PI/4, 0]}
  />
)

export const ToiletCleanerTool = ({ visible }: { visible: boolean }) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Toilet_bleach/Toilet_Spray.glb" 
    visible={visible} 
    scale={0.03} 
    rotation={[Math.PI, -Math.PI/4, Math.PI/2]}
  />
)

// 각 미션별 닦기 도구들
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

export const KitchenSpongeTool = ({ visible }: { visible: boolean }) => (
  <CleaningTool 
    modelPath="/models/6-1-1/Kitchen_Scrub/Kitchen_Scrub.glb" 
    visible={visible} 
    scale={0.05} 
    rotation={[0, Math.PI/2, 0]}
  />
)

useGLTF.preload('/models/6-1-1/Window/Window_cleaner_Spray.glb')
useGLTF.preload('/models/6-1-1/Vinegar_Spray/Kitchen_Scrub.glb')
useGLTF.preload('/models/6-1-1/Bleach/Bleach.glb')
useGLTF.preload('/models/6-1-1/Toilet_bleach/Toilet_Spray.glb')

useGLTF.preload('/models/6-1-1/Rag/Rag.glb')
useGLTF.preload('/models/6-1-1/Toilet_Brush/Toilet_Brush.glb')
useGLTF.preload('/models/6-1-1/Bathroom_Scrub/Bathroom_Scrub.glb')
useGLTF.preload('/models/6-1-1/Kitchen_Scrub/Kitchen_Scrub.glb')

