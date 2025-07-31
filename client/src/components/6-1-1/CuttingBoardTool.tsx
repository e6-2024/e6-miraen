import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CuttingBoardProps {
  position: [number, number, number]
  wipingProgress: number
  isInteractive: boolean
  onWiping?: (intensity: number) => void
  scale?: number
  rotation?: [number, number, number]
}

export const CuttingBoard: React.FC<CuttingBoardProps> = ({ 
  position,
  wipingProgress,
  isInteractive,
  onWiping,
  scale = 1.2,
  rotation = [0, Math.PI/2, 0]
}) => {
  const gltf = useGLTF('/models/6-1-1/Cutting_Board/Cutting_Board.glb')
  const groupRef = useRef<THREE.Group>(null)
  const ragMeshRef = useRef<THREE.Mesh>(null)
  const bloodMeshRef = useRef<THREE.Mesh>(null)
  
  // 마우스 추적
  const lastMousePosition = useRef(new THREE.Vector2())
  const mouseVelocity = useRef(0)
  
  // 래그 위치
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
        // 래그 메쉬 찾기
        if (child.name === 'Tower_Material001_0' && child instanceof THREE.Mesh) {
          ragMeshRef.current = child
          initialRagX.current = child.position.x
          currentRagX.current = child.position.x
        }
        
        // 혈흔/얼룩 메쉬 찾기
        if (child.name === 'Plane__10_001' && child instanceof THREE.Mesh) {
          bloodMeshRef.current = child
        }
      })
    }
  }, [gltf.scene])

  // 마우스 이벤트 처리
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isInteractive) return
      
      const newMousePos = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      )
      
      // 마우스 속도 계산
      const deltaX = newMousePos.x - lastMousePosition.current.x
      const deltaY = newMousePos.y - lastMousePosition.current.y
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      mouseVelocity.current = velocity
      lastMousePosition.current.copy(newMousePos)
      
      // 닦기 콜백 호출
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
    if (!ragMeshRef.current || !bloodMeshRef.current) return
    
    if (isInteractive) {
      // X축 이동 (마우스 속도에 따라 양옆으로)
      const targetX = initialRagX.current + mouseVelocity.current * 2
      currentRagX.current = THREE.MathUtils.lerp(currentRagX.current, targetX, delta * 10)
      ragMeshRef.current.position.x = currentRagX.current
      
      // 원래 위치로 복귀
      currentRagX.current = THREE.MathUtils.lerp(currentRagX.current, initialRagX.current, delta * 3)
      
      // 마우스 속도 감소
      mouseVelocity.current *= 0.9
    } else {
      // 상호작용 불가능할 때는 원래 위치
      ragMeshRef.current.position.x = initialRagX.current
    }
    
    // 혈흔/얼룩 투명도 조절
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
  })
  
  return (
    <group ref={groupRef} scale={scale} position={position} rotation={rotation}>
      <primitive object={gltf.scene.clone()} />
    </group>
  )
}

useGLTF.preload('/models/6-1-1/Cutting_Board/Cutting_Board.glb')
