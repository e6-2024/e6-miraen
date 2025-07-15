// components/5-1-2/LaserPointer.tsx
import { useGLTF } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface LaserPointerProps {
  position: [number, number, number]
  rotation: [number, number, number]
  angle: number
  visible: boolean
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void
  onToggle?: (buttonIndex: number) => void
  rayStates?: [boolean, boolean, boolean]
  pivotOffset?: [number, number, number]
  mode?: 'direct' | 'reflection' | 'refraction'
}

export function LaserPointer({ 
  position, 
  angle, 
  visible, 
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onToggle,
  rayStates = [false, false, false],
  pivotOffset = [0, 0, 3],
  mode
}: LaserPointerProps) {
  const { scene } = useGLTF('models/5-1-2/laser.glb')
  const pivotGroupRef = useRef<THREE.Group>(null)
  const modelGroupRef = useRef<THREE.Group>(null)

  const [hoveredButton, setHoveredButton] = useState<number | null>(null)
  const buttonObjectRefs = useRef<(THREE.Object3D | null)[]>([null, null, null])

  const getRotationByMode = (mode: string | undefined, angle: number): [number, number, number] => {
    const angleRad = (angle * Math.PI) / 180
    
    switch (mode) {
      case 'direct':
        return [0,3*Math.PI/2, 3*Math.PI/2]
      case 'reflection':
        return [0, 3*Math.PI/2 - angleRad, 3*Math.PI/2]
      case 'refraction':
        return [0, 3*Math.PI/2, 3*Math.PI/2]
    }
  }

  useEffect(() => {
    if (pivotGroupRef.current) {
      const rotation = getRotationByMode(mode, angle)
      pivotGroupRef.current.rotation.set(...rotation)
    }

    // 그림자 설정 개선
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        
        // 재질 설정 개선
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => {
              if (mat instanceof THREE.MeshStandardMaterial || 
                  mat instanceof THREE.MeshPhysicalMaterial ||
                  mat instanceof THREE.MeshLambertMaterial) {
                mat.shadowSide = THREE.DoubleSide
                // 메탈릭한 느낌을 주고 싶다면
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.metalness = 0.3
                  mat.roughness = 0.4
                }
              }
            })
          } else {
            const material = mesh.material as THREE.Material
            if (material instanceof THREE.MeshStandardMaterial || 
                material instanceof THREE.MeshPhysicalMaterial ||
                material instanceof THREE.MeshLambertMaterial) {
              material.shadowSide = THREE.DoubleSide
              // 메탈릭한 느낌을 주고 싶다면
              if (material instanceof THREE.MeshStandardMaterial) {
                material.metalness = 0.3
                material.roughness = 0.4
              }
            }
          }
        }
      }
    })
    
    const button1 = scene.getObjectByName('_holes_laser_pointer001')
    const button2 = scene.getObjectByName('_holes_laser_pointer002') 
    const button3 = scene.getObjectByName('_holes_laser_pointer003')
    
    if (button1) {
      buttonObjectRefs.current[0] = button1
    }
    if (button2) {
      buttonObjectRefs.current[1] = button2
    }
    if (button3) {
      buttonObjectRefs.current[2] = button3
    }
  }, [angle, scene, mode])

  const handleButtonClick = (e: ThreeEvent<MouseEvent>, buttonIndex: number) => {
    e.stopPropagation()
    if (onToggle) {
      onToggle(buttonIndex)
    }
  }

  const handlePointerOver = (e: ThreeEvent<PointerEvent>, buttonIndex: number) => {
    e.stopPropagation()
    setHoveredButton(buttonIndex)
  }

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredButton(null)
  }

  const getButtonIndex = (clickedObject: THREE.Object3D): number | null => {
    const objectName = clickedObject.name
    
    if (objectName === '_holes_laser_pointer001') {
      return 2
    } else if (objectName === '_holes_laser_pointer002') {
      return 0  
    } else if (objectName === '_holes_laser_pointer003') {
      return 1
    }
    
    return null
  }

  const isLaserPointer = (clickedObject: THREE.Object3D): boolean => {
    const laserBody = scene.getObjectByName('_holes_laser_pointer')
    
    const buttonIndex = getButtonIndex(clickedObject)
    const isButton = buttonIndex !== null
    const isLaserBody = clickedObject === laserBody || 
                       (laserBody && laserBody.children.includes(clickedObject)) ||
                       clickedObject.name === '_holes_laser_pointer'
    
    return !isButton && isLaserBody
  }

  if (!visible) return null

  return (
    <group
      ref={pivotGroupRef}
      position={position}
      scale={0.1}
      castShadow
      receiveShadow
    >
      <group 
        ref={modelGroupRef}
        position={[-pivotOffset[0], -pivotOffset[1], -pivotOffset[2]]}
        castShadow
        receiveShadow
        onClick={(e: ThreeEvent<MouseEvent>) => {        
          const buttonIndex = getButtonIndex(e.object)
          if (buttonIndex !== null) {
            handleButtonClick(e, buttonIndex)
          }
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          const buttonIndex = getButtonIndex(e.object)
          if (buttonIndex !== null) {
            handlePointerOver(e, buttonIndex)
          }
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          const buttonIndex = getButtonIndex(e.object)
          if (buttonIndex !== null) {
            handlePointerOut(e)
          }
        }}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          if (isLaserPointer(e.object) && onPointerDown) {
            onPointerDown(e)
          }
        }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          if (isLaserPointer(e.object) && onPointerMove) {
            onPointerMove(e)
          }
        }}
        onPointerUp={(e: ThreeEvent<PointerEvent>) => {
          if (isLaserPointer(e.object) && onPointerUp) {
            onPointerUp(e)
          }
        }}
      >
        <primitive object={scene.clone()} />
      </group>
    </group>
  )
}