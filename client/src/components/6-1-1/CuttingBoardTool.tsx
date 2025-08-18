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
  sprayColorHex?: string
}

export const CuttingBoard: React.FC<CuttingBoardProps> = ({
  position,
  wipingProgress,
  isInteractive,
  sprayEffect,
  isCompleted = false,
  onWiping,
  scale = 1.2,
  rotation = [0, Math.PI / 2, 0],
  sprayColorHex = '#ffffff',
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
  const clonedSceneRef = useRef<THREE.Group | null>(null)
  const sprayColor = new THREE.Color(sprayColorHex)

  // 그림자 설정을 위한 함수
  const configureShadows = (scene: THREE.Object3D) => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // 기본적으로 모든 메시에 그림자 설정
        child.castShadow = true
        child.receiveShadow = true

        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach((mat) => {
            // 투명도가 높은 재질 처리
            if (mat.transparent && mat.opacity < 0.5) {
              mat.side = THREE.DoubleSide
              child.castShadow = false // 투명한 재질은 그림자 캐스팅 비활성화
            } else {
              mat.side = THREE.DoubleSide // 도마는 DoubleSide 유지
            }
            mat.needsUpdate = true
          })
        }

        // 특정 메시 이름에 따른 그림자 설정
        if (child.name.includes('Plane__10') || child.name.includes('blood') || child.name.includes('spray')) {
          child.castShadow = false // 얼룩이나 스프레이 효과는 그림자 캐스팅 안 함
        }
      }
    })
  }

  useEffect(() => {
    if (gltf.scene && !clonedSceneRef.current) {
      // 깊은 복사를 통해 독립적인 인스턴스 생성
      const clonedScene = gltf.scene.clone()
      clonedSceneRef.current = clonedScene

      // 그림자 설정 적용
      configureShadows(clonedScene)

      // 기존 재질 설정 유지
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach((mat) => {
            mat.side = THREE.DoubleSide
          })
        }
      })

      // 그룹에 클론된 씬 추가
      if (groupRef.current) {
        groupRef.current.clear()
        groupRef.current.add(clonedScene)
      }
    }
  }, [gltf])

  useEffect(() => {
    if (clonedSceneRef.current) {
      clonedSceneRef.current.traverse((child) => {
        if (child.name === 'Tower_Material001_0' && child instanceof THREE.Mesh) {
          ragMeshRef.current = child
          initialRagX.current = child.position.x
          currentRagX.current = child.position.x

          // 걸레(닦는 도구)는 그림자 캐스팅 활성화
          child.castShadow = true
          child.receiveShadow = true
        }

        if (child.name === 'Plane__10_001' && child instanceof THREE.Mesh) {
          bloodMeshRef.current = child
          // 피/얼룩은 그림자 캐스팅 비활성화, 받기는 활성화
          child.castShadow = false
          child.receiveShadow = true
        }

        if (child.name === 'Plane__10_002' && child instanceof THREE.Mesh) {
          sprayMeshRef.current = child
          // 스프레이 효과는 그림자 캐스팅 비활성화, 받기는 활성화
          child.castShadow = false
          child.receiveShadow = true
        }
      })
    }
  }, [clonedSceneRef.current])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isInteractive) return

      const newMousePos = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
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
        bloodMeshRef.current.visible = false
      } else {
        bloodMeshRef.current.scale.setScalar(0.0003)
        bloodMeshRef.current.visible = true
      }
    }

    if (sprayMeshRef.current.material) {
      const material = sprayMeshRef.current.material as THREE.MeshStandardMaterial
      material.transparent = true
      material.emissiveIntensity=0.5
      material.emissive.set(sprayColorHex)
      material.color.set(sprayColorHex)
      if (sprayEffect && opacity > 0.01 && !isCompleted) {
        const sprayOpacity = Math.max(0, 1.0 - wipingProgress / 100)
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

  return <group ref={groupRef} scale={scale} position={position} rotation={rotation} />
}

useGLTF.preload('/models/6-1-1/Cutting_Board/Cutting_Board.gltf')
