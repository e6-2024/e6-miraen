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
  
  const [sprayAnimations, setSprayAnimations] = useState<Array<{
    id: number
    startTime: number
    duration: number
  }>>([])
  
  const sprayTextureRef = useRef<THREE.Mesh[]>([])

  useEffect(() => {
    if (gltf.scene) {
      sprayTextureRef.current = []
      
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                mat.side = THREE.DoubleSide
              })
            } else {
              child.material.side = THREE.DoubleSide
            }
          }
        }
        
        if (child instanceof THREE.Mesh && (
          child.name === 'Plane_1' || 
          child.name === 'Plane_2' ||
          child.name.includes('Plane') ||
          child.name.toLowerCase().includes('plane')
        )) {
          sprayTextureRef.current.push(child)
          
          child.visible = true
          child.castShadow = false
          
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material]
            materials.forEach((mat, matIndex) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                mat.transparent = true
                mat.opacity = 0
                
                if (mat.map) {
                  mat.map.wrapS = THREE.RepeatWrapping
                  mat.map.wrapT = THREE.RepeatWrapping
                  mat.map.repeat.x = 1.0
                  mat.map.repeat.y = 1.0
                  mat.map.offset.x = 0.0
                  mat.map.offset.y = 0.0
                  mat.map.needsUpdate = true
                } else {
                  mat.color = new THREE.Color(0xff0000)
                }
                
                mat.needsUpdate = true
              }
            })
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
        const newAnimation = {
          id: Date.now(),
          startTime: Date.now(),
          duration: 800
        }
        setSprayAnimations(prev => {
          return [...prev, newAnimation]
        })
      }
    }
    
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && visible && onSpray) {
        event.preventDefault()
        const newAnimation = {
          id: Date.now(),
          startTime: Date.now(),
          duration: 800
        }
        setSprayAnimations(prev => {
          return [...prev, newAnimation]
        })
      }
    }
    
    if (visible) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('click', handleClick)
      window.addEventListener('keydown', handleKeyPress)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [visible, onSpray])
  
  useFrame((state) => {
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
    
    const currentTime = Date.now()
    const activeAnimations = sprayAnimations.filter(anim => 
      currentTime - anim.startTime < anim.duration
    )
    
    if (activeAnimations.length !== sprayAnimations.length) {
      setSprayAnimations(activeAnimations)
    }
    
    if (sprayTextureRef.current.length > 0) {
      sprayTextureRef.current.forEach((mesh, index) => {
        if (activeAnimations.length > 0) {
          const latestAnimation = activeAnimations[activeAnimations.length - 1]
          const progress = Math.min(1, (currentTime - latestAnimation.startTime) / latestAnimation.duration)
          
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            materials.forEach(material => {
              if (material instanceof THREE.MeshStandardMaterial || 
                  material instanceof THREE.MeshBasicMaterial) {
                material.opacity = 1.0
                material.needsUpdate = true
              }
            })
          }
        } else {
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            materials.forEach(material => {
              if (material instanceof THREE.MeshStandardMaterial || 
                  material instanceof THREE.MeshBasicMaterial) {
                material.opacity = 0
                material.needsUpdate = true
              }
            })
          }
        }
      })
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
    modelPath="/models/6-1-1/Window/Window_cleaner_Spray.gltf" 
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
    rotation={[Math.PI, 0, Math.PI/4]}
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
    scale={0.4} 
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

useGLTF.preload('/models/6-1-1/Window/Window_cleaner_Spray.gltf')
useGLTF.preload('/models/6-1-1/Vinegar_Spray/Vinegar.glb')
useGLTF.preload('/models/6-1-1/Bleach/Bleach.glb')
useGLTF.preload('/models/6-1-1/Toilet_bleach/Toilet_Spray.glb')

useGLTF.preload('/models/6-1-1/Rag/Rag.glb')
useGLTF.preload('/models/6-1-1/Toilet_Brush/Toilet_Brush.glb')
useGLTF.preload('/models/6-1-1/Bathroom_Scrub/Bathroom_Scrub.glb')