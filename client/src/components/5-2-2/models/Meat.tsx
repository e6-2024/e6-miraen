// Fish.tsx - 1/3 지점 가열을 위한 수정된 버전
import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { thermalVertexShader, thermalFragmentShader } from '@/components/5-2-2/shaders/thermalShader'

interface MeatProps extends GroupProps {
  thermalMode?: boolean;
  isHeating?: boolean;
  heatingTime?: number;
  heatSourcePosition?: [number, number, number];
}

export function Meat({ 
  thermalMode = false, 
  isHeating = false, 
  heatingTime = 0, 
  heatSourcePosition = [0, 0, 0], 
  ...props 
}: MeatProps) {
  const { scene } = useGLTF('models/5-2-2/Meat.glb')
  const [originalMaterials, setOriginalMaterials] = useState<Map<THREE.Mesh, THREE.Material>>(new Map())
  const [oneThirdPoint, setOneThirdPoint] = useState(new THREE.Vector3(0, 0, 0))
  const thermalMaterialRef = useRef<THREE.ShaderMaterial>()
  
  // 원본 재질 저장 및 1/3 지점 계산
  useEffect(() => {
    const materials = new Map<THREE.Mesh, THREE.Material>()
    const box = new THREE.Box3()
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // 원본 재질 저장
        if (!originalMaterials.has(child)) {
          materials.set(child, child.material)
        }
        
        // 모델의 바운딩 박스 계산
        box.expandByObject(child)
      }
    })
    
    if (materials.size > 0) {
      setOriginalMaterials(materials)
    }
    
    // 모델의 1/3 지점 계산 (아래에서부터 1/3 높이)
    const min = box.min
    const max = box.max
    const oneThird = new THREE.Vector3(
      (min.x + max.x) / 2,
      (min.y + max.y) / 2,
      min.z + (max.z - min.z) * (1/3)
    )
    setOneThirdPoint(oneThird)
  }, [scene])

  // 열화상 모드 전환 시 재질 변경
  useEffect(() => {
    if (thermalMode) {
      // 열화상 재질 생성
      const thermalMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader,
        fragmentShader: thermalFragmentShader,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0.15 }, // 초기 온도 (파란색)
          heatingTime: { value: heatingTime },
          baseColor: { value: new THREE.Color(0.9, 0.3, 0.1) },
          centerPoint: { value: oneThirdPoint }, // 1/3 지점을 가열 중심으로 사용
          isHeating: { value: isHeating }
        }
      })
      
      thermalMaterialRef.current = thermalMaterial
      
      // 모든 메시에 열화상 재질 적용
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = thermalMaterial
        }
      })
    } else {
      // 원본 재질 복원
      originalMaterials.forEach((material, mesh) => {
        mesh.material = material
      })
    }
  }, [thermalMode, scene, originalMaterials, oneThirdPoint])

  // 가열 시간과 상태 실시간 업데이트
  useEffect(() => {
    if (thermalMode && thermalMaterialRef.current) {
      thermalMaterialRef.current.uniforms.heatingTime.value = heatingTime
      thermalMaterialRef.current.uniforms.isHeating.value = isHeating
      thermalMaterialRef.current.uniforms.centerPoint.value = oneThirdPoint
    }
  }, [heatingTime, isHeating, thermalMode, oneThirdPoint])

  // 매 프레임마다 시간 업데이트 (노이즈 애니메이션용)
  useFrame(({ clock }) => {
    if (thermalMode && thermalMaterialRef.current) {
      thermalMaterialRef.current.uniforms.time.value = clock.getElapsedTime()
    }
  })
  
  return <primitive object={scene} {...props} />
}

// Export default for compatibility
export default Meat