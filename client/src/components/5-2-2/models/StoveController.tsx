import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { thermalVertexShader2, thermalFragmentShader2 } from '@/components/5-2-2/shaders/thermalShader2'

interface StoveControllerProps extends GroupProps {
  thermalMode?: boolean
  isHeating?: boolean
  foodOnPan?: string
  heatingTime?: number
  onRotationChange?: (rotation: number) => void
  disabled?: boolean
  resetTrigger?: number // 초기화 트리거 추가
}

export default function StoveController({
  thermalMode = false,
  isHeating = false,
  foodOnPan = null,
  heatingTime = 0,
  onRotationChange,
  disabled = false,
  resetTrigger = 0,
  ...props
}: StoveControllerProps) {
  const { scene } = useGLTF('models/5-2-2/Stove_Control.glb')
  const [originalMaterials, setOriginalMaterials] = useState<Map<THREE.Mesh, THREE.Material>>(new Map())
  const thermalMaterialRef = useRef<THREE.ShaderMaterial>()
  const groupRef = useRef<THREE.Group>(null)

  // 회전 관련 상태
  const [currentRotation, setCurrentRotation] = useState(0)
  const [targetRotation, setTargetRotation] = useState(0)
  const [isOn, setIsOn] = useState(false)

  // 모델 오프셋 상태로 관리
  const [modelOffset, setModelOffset] = useState<THREE.Vector3 | null>(null)

  // 모델 중심점 계산 및 오프셋 설정
  // resetTrigger가 변경될 때 회전 상태 초기화
  useEffect(() => {
    if (resetTrigger > 0) {
      setCurrentRotation(0)
      setTargetRotation(0)
      setIsOn(false)
    }
  }, [resetTrigger])

  useEffect(() => {
    const box = new THREE.Box3()
    box.setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())

    // 중심점을 원점으로 만들기 위한 오프셋 설정
    setModelOffset(center.clone().negate())
  }, [scene])

  // 클릭 핸들러 - 사운드 제거
  const handleClick = () => {
    if (disabled) return

    const newIsOn = !isOn
    setIsOn(newIsOn)

    // 90도(π/2) 회전으로 ON/OFF 구분
    setTargetRotation(newIsOn ? Math.PI / 2 : 0)

    // 부모 컴포넌트에 상태 전달
    if (onRotationChange) {
      onRotationChange(newIsOn ? 1 : 0)
    }
  }

  useEffect(() => {
    const materials = new Map<THREE.Mesh, THREE.Material>()

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.needsUpdate = true
        }
      }
    })

    if (materials.size > 0) {
      setOriginalMaterials(materials)
    }
  }, [scene])

  useEffect(() => {
    if (thermalMode) {
      const thermalMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader2,
        fragmentShader: thermalFragmentShader2,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0.01 },
          heatingTime: { value: heatingTime },
          baseColor: { value: new THREE.Color(0.3, 0.3, 0.5) },
          centerPoint: { value: new THREE.Vector3(0, 0, 0) },
          isHeating: { value: isHeating },
        },
      })

      thermalMaterialRef.current = thermalMaterial

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = thermalMaterial
        }
      })
    } else {
      originalMaterials.forEach((material, mesh) => {
        mesh.material = material
      })
    }
  }, [thermalMode, scene, originalMaterials])

  useEffect(() => {
    if (thermalMode && thermalMaterialRef.current) {
      thermalMaterialRef.current.uniforms.heatingTime.value = heatingTime
      thermalMaterialRef.current.uniforms.isHeating.value = isHeating
    }
  }, [heatingTime, isHeating, thermalMode])

  useEffect(() => {
    if (onRotationChange) {
      onRotationChange(isOn ? 1 : 0)
    }
  }, [isOn, onRotationChange])

  useFrame(({ clock }) => {
    if (thermalMode && thermalMaterialRef.current) {
      thermalMaterialRef.current.uniforms.time.value = clock.getElapsedTime()
    }

    // 부드러운 회전 애니메이션
    if (Math.abs(targetRotation - currentRotation) > 0.01) {
      setCurrentRotation((prev) => {
        const diff = targetRotation - prev
        return prev + diff * 0.1 // 부드러운 애니메이션을 위한 lerp
      })
    }
  })

  return (
    <group ref={groupRef} {...props}>
      {/* 모델 오프셋이 계산될 때까지 대기 */}
      {modelOffset && (
        <group
          rotation-y={currentRotation}
          onClick={handleClick}
          onPointerOver={() => {
            if (!disabled) document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'default'
          }}>
          {/* 모델을 중심점 기준으로 오프셋 적용 */}
          <group position={[modelOffset.x, modelOffset.y, modelOffset.z]}>
            <primitive object={scene} />
          </group>
        </group>
      )}
    </group>
  )
}
