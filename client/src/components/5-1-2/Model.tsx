// components/Model.tsx
import { useGLTF,  Billboard, Text} from '@react-three/drei'
import { GroupProps, ThreeEvent } from '@react-three/fiber'
import { useEffect, useState, useRef } from 'react'
import * as THREE from 'three'

interface ModelProps extends GroupProps {
  onToggle?: () => void
  mode?: 'direct' | 'reflection' | 'refraction'
}

export default function Model({ onToggle, mode, ...props }: ModelProps) {
  const { scene } = useGLTF('models/Light/GLTFs/Light_Experiment.gltf')
  const [hovered, setHovered] = useState(false)
  const buttonObjectRef = useRef<THREE.Object3D | null>(null)

  useEffect(() => {
    const holeLaserPointer = scene.getObjectByName('_holeLaser_Pointer002')
    const table = scene.getObjectByName('Table')
    const paper = scene.getObjectByName('Plane')
    
    if (holeLaserPointer) {
      if (mode === 'reflection') {
        holeLaserPointer.position.set(-1.0, 0, 0)
        holeLaserPointer.rotation.set(Math.PI/2, 0, Math.PI/4)
      } else {
        holeLaserPointer.position.set(0.3, 0, 2.7)
        holeLaserPointer.rotation.set(Math.PI/2, 0, 0)
      }
    } 
    
    if(table){
      table.position.set(0,-0.5,0)
    }

    if(paper){
      paper.position.set(0,-0.7,0)
    }

    if (scene.children[1] && scene.children[1].children && scene.children[1].children[1]) {
      buttonObjectRef.current = scene.children[1].children[1]
    }
  }, [scene, mode])

  // 커서 포인터 전환
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
  }, [hovered])

  const handleButtonClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (onToggle) {
      onToggle()
    }
  }

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
  }

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(false)
  }

  const getBillboardPosition = () => {
    if (mode === 'reflection') {
      return [-2.0, 1.5, -4.5] as [number, number, number] 
    } else {
      return [-6, 1.5, 0] as [number, number, number]
    }
  }

  console.log(scene.children)

  return (
    <>
      <primitive 
        object={scene} 
        position={[0, -1, 0]}          
        rotation={[0, Math.PI / 2, 0]} 
        scale={[1, 1, 1]}   
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (buttonObjectRef.current && e.object === buttonObjectRef.current) {
            handleButtonClick(e)
          }
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          if (buttonObjectRef.current && e.object === buttonObjectRef.current) {
            handlePointerOver(e)
          }
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          if (buttonObjectRef.current && e.object === buttonObjectRef.current) {
            handlePointerOut(e)
          }
        }}
        {...props} 
      />
      
      <Billboard position={getBillboardPosition()}>
        <Text 
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          font='/fonts/Maplestory Bold.ttf'
        >
          버튼을 눌러보세요!
        </Text>
      </Billboard>
    </>
  )
}