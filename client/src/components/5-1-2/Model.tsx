// components/5-1-2/Model.tsx
import { useGLTF, Billboard, Text } from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useEffect, useState, useRef } from 'react'
import * as THREE from 'three'

interface ModelProps extends GroupProps {
  onToggle?: (buttonIndex: number) => void
  mode?: 'direct' | 'reflection' | 'refraction'
  rayStates?: [boolean, boolean, boolean]
}

export default function Model({ onToggle, mode, rayStates = [false, false, false], ...props }: ModelProps) {
  const { scene } = useGLTF('models/5-1-2/Other_equipment.glb')
  const [hoveredButton, setHoveredButton] = useState<number | null>(null)
  
  const buttonObjectRefs = useRef<(THREE.Object3D | null)[]>([null, null, null])

  useEffect(() => {
    const holeLaserPointer = scene.getObjectByName('_holeLaser_Pointer002')
    const table = scene.getObjectByName('Table')
    const paper = scene.getObjectByName('Plane')
    const frame = scene.getObjectByName("Object_10")

    //console.log(scene.children)
    
    if (holeLaserPointer) {
      //빛의 반사에서 레이저 포이터 위치
      if (mode === 'reflection') {
        holeLaserPointer.position.set(0.0, 0, 0)
        holeLaserPointer.rotation.set(Math.PI/2,0,2.5*Math.PI/2)
      } else {
        //다른 모드에서 레이저 포인터 위치
        holeLaserPointer.position.set(0.0, 0, 0.0)
        holeLaserPointer.rotation.set(Math.PI/2, 0, 0)
      }
    } 

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
      frame.position.set(0, -0.1, 0)
    }
    
    if (table) {
      table.position.set(0, -0.5, 0)
    }

    if (paper) {
      paper.position.set(0, -0.7, 0)
    }

    // 세 개의 버튼 객체 참조 설정
    if (scene.children[1] && scene.children[1].children) {
      buttonObjectRefs.current[0] = scene.children[1].children[2]
      buttonObjectRefs.current[1] = scene.children[1].children[3]
      buttonObjectRefs.current[2] = scene.children[1].children[1]
    }


  }, [scene, mode])

  // 커서 포인터 전환
  useEffect(() => {
    document.body.style.cursor = hoveredButton !== null ? 'pointer' : 'auto'
  }, [hoveredButton])

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
    for (let i = 0; i < 3; i++) {
      if (buttonObjectRefs.current[i] && clickedObject === buttonObjectRefs.current[i]) {
        return i
      }
    }
    return null
  }

  return (
    <>
      <primitive 
        object={scene} 
        position={[0, 0, 0]}          
        rotation={[0, Math.PI / 2, 0]} 
        scale={[1, 1, 1]}   
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
        {...props} 
      />
    </>
  )
}