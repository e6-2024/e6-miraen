import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CuttingBoardProps {
  position: [number, number, number]
  wipingProgress: number
  isInteractive: boolean
  sprayEffect: boolean
  isCompleted?: boolean
  onWiping?: (intensity: number) => void
  scale?: number
  rotation?: [number, number, number]
}

export const CuttingBoard: React.FC<CuttingBoardProps> = ({ 
  position,
  wipingProgress,
  isInteractive,
  sprayEffect,
  isCompleted = false,
  onWiping,
  scale = 1.2,
  rotation = [0, Math.PI/2, 0]
}) => {
  const gltf = useGLTF('/models/6-1-1/Cutting_Board/Cutting_Board.gltf')
  const groupRef = useRef<THREE.Group>(null)
  const ragMeshRef = useRef<THREE.Mesh>(null)
  const bloodMeshRef = useRef<THREE.Mesh>(null)
  const sprayMeshRef = useRef<THREE.Mesh>(null)
  
  const lastMousePosition = useRef(new THREE.Vector2())
  const mouseVelocity = useRef(0)
  
  const initialRagX = useRef<number>(0)
  const currentRagX = useRef<number>(0)

  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach(mat => {
            mat.side = THREE.DoubleSide
          })
        }
      })
    }
  }, [gltf])

  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child.name === 'Tower_Material001_0' && child instanceof THREE.Mesh) {
          ragMeshRef.current = child
          initialRagX.current = child.position.x
          currentRagX.current = child.position.x
        }
        
        if (child.name === 'Plane__10_001' && child instanceof THREE.Mesh) {
          bloodMeshRef.current = child
        }
        
        if (child.name === 'Plane__10_002' && child instanceof THREE.Mesh) {
          sprayMeshRef.current = child
        }
      })
    }
  }, [gltf.scene])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isInteractive) return
      
      const newMousePos = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      )
      
      const deltaX = newMousePos.x - lastMousePosition.current.x
      const deltaY = newMousePos.y - lastMousePosition.current.y
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      mouseVelocity.current = velocity
      lastMousePosition.current.copy(newMousePos)
      
      if (onWiping && velocity > 0.005) {
        onWiping(velocity * 20)
      }
    }
    
    if (isInteractive) {
      window.addEventListener('mousemove', handleMouseMove)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isInteractive, onWiping])

  useFrame((state, delta) => {
    if (!ragMeshRef.current || !bloodMeshRef.current || !sprayMeshRef.current) return
    
    if (isInteractive) {
      const targetX = initialRagX.current + mouseVelocity.current * 8
      currentRagX.current = THREE.MathUtils.lerp(currentRagX.current, targetX, delta * 10)
      ragMeshRef.current.position.x = currentRagX.current
      
      currentRagX.current = THREE.MathUtils.lerp(currentRagX.current, initialRagX.current, delta * 3)
      
      mouseVelocity.current *= 0.9
    } else {
      ragMeshRef.current.position.x = initialRagX.current
    }
    
    const opacity = Math.max(0, (100 - wipingProgress) / 100)
    
    if (bloodMeshRef.current.material) {
      const material = bloodMeshRef.current.material as THREE.MeshStandardMaterial
      material.transparent = true
      material.opacity = opacity
      material.needsUpdate = true
      
      if (opacity <= 0.01) {
        bloodMeshRef.current.scale.setScalar(0)
      } else {
        bloodMeshRef.current.scale.setScalar(0.0003)
      }
    }
    
    if (sprayMeshRef.current.material) {
      const material = sprayMeshRef.current.material as THREE.MeshStandardMaterial
      material.transparent = true
      
      if (sprayEffect && opacity > 0.01 && !isCompleted) {
        const sprayOpacity = Math.max(0, 1.0 - (wipingProgress / 100))
        material.opacity = sprayOpacity
        sprayMeshRef.current.scale.setScalar(sprayOpacity > 0.01 ? 0.0003 : 0)
        sprayMeshRef.current.visible = sprayOpacity > 0.01
      } else {
        material.opacity = 0.0
        sprayMeshRef.current.scale.setScalar(0)
        sprayMeshRef.current.visible = false
      }
      
      material.needsUpdate = true
    }
  })
  
  return (
    <group ref={groupRef} scale={scale} position={position} rotation={rotation}>
      <primitive object={gltf.scene.clone()} />
    </group>
  )
}

useGLTF.preload('/models/6-1-1/Cutting_Board/Cutting_Board.gltf')