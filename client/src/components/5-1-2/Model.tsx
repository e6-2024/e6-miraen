// components/5-1-2/Model.tsx
import { useGLTF, Billboard, Text } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useEffect, useState, useRef } from 'react'
import * as THREE from 'three'
import { LaserPointer } from './LaserPointer'

interface ModelProps extends GroupProps {
  onToggle?: (buttonIndex: number) => void
  mode?: 'direct' | 'reflection' | 'refraction'
  rayStates?: [boolean, boolean, boolean]
  laserAngle?: number
  onAngleChange?: (angle: number) => void
}

export default function Model({ 
  onToggle, 
  mode, 
  rayStates = [false, false, false], 
  laserAngle = 45,
  onAngleChange,
  ...props 
}: ModelProps) {
  const { scene } = useGLTF('models/5-1-2/Other_equipment.glb')
  const [hoveredButton, setHoveredButton] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialAngle, setInitialAngle] = useState(45)

  useEffect(() => {
    const table = scene.getObjectByName('Table')
    const paper = scene.getObjectByName('Plane')
    const frame = scene.getObjectByName("Object_10")

    if (mode === 'reflection') {
      if (frame) {
        frame.visible = true
      }
    } else {
      if (frame) {
        frame.visible = false
      }
    }

    if (frame) {
      frame.position.set(-1.0, -0.0, 0)
    }
    
    if (table) {
      table.position.set(-1.0, -0.3, 0)
    }

    if (paper) {
      paper.position.set(0, -0.7, 0)
    }

  }, [scene, mode])

  const handleLaserPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (mode !== 'reflection') return
    
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialAngle(laserAngle)
  }

  const getLaserPointerPosition = (): [number, number, number] => {
    switch (mode) {
      case 'reflection':
        return [-9, 1.2, -4.2]
      case 'refraction':
        return [-9,5.0,-0.6]
      case 'direct':
        return [-9,1.2,-0.6]
    }
  }

  const getLaserPointerRotation = (): [number, number, number] => {
    switch (mode) {
      case 'reflection':
        return [0, 0, 0] 
      case 'refraction':
        return [0,Math.PI/2, 3*Math.PI/2]
      case 'direct':
        return [0,Math.PI/2, 3*Math.PI/2]
    }
  }

  useEffect(() => {
    // 모든 메시에 그림자 설정 적용
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        
        // 모든 오브젝트가 그림자를 만들고 받도록 설정
        mesh.castShadow = true
        mesh.receiveShadow = true
        
        // 바닥면이나 테이블 같은 큰 평면은 그림자를 더 잘 받도록 설정
        if (child.name?.toLowerCase().includes('table') || 
            child.name?.toLowerCase().includes('plane') ||
            child.name?.toLowerCase().includes('floor') ||
            child.name?.toLowerCase().includes('ground')) {
          mesh.receiveShadow = true
          // 바닥면은 그림자를 만들지 않도록 설정 (선택사항)
          mesh.castShadow = false
        }
        
        // 재질 설정 개선
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => {
              if (mat instanceof THREE.MeshStandardMaterial || 
                  mat instanceof THREE.MeshPhysicalMaterial ||
                  mat instanceof THREE.MeshLambertMaterial) {
                // 그림자가 더 잘 보이도록 재질 설정
                mat.shadowSide = THREE.DoubleSide
              }
            })
          } else {
            const material = mesh.material as THREE.Material
            if (material instanceof THREE.MeshStandardMaterial || 
                material instanceof THREE.MeshPhysicalMaterial ||
                material instanceof THREE.MeshLambertMaterial) {
              // 그림자가 더 잘 보이도록 재질 설정
              material.shadowSide = THREE.DoubleSide
            }
          }
        }
      }
    })
  }, [scene])

  return (
    <>
      <primitive 
        object={scene} 
        position={[0, 0, 0]}          
        rotation={[0, Math.PI / 2, 0]} 
        scale={[1, 1, 1]}   
        {...props} 
      />

      <LaserPointer
        position={getLaserPointerPosition()}
        rotation={getLaserPointerRotation()}
        angle={laserAngle}
        visible={true}
        onToggle={onToggle}
        rayStates={rayStates}
        onPointerDown={handleLaserPointerDown}
        pivotOffset={[0, 0, -20.0]}
        mode={mode}
      />
    </>
  )
}