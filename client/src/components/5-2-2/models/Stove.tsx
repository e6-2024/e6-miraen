import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { thermalVertexShader2, thermalFragmentShader2 } from '@/components/5-2-2/shaders/thermalShader2'

interface StoveProps extends GroupProps {
  thermalMode?: boolean
  isHeating?: boolean
  heatingTime?: number
  heatSourcePosition?: [number, number, number]
  leftBurnerPosition?: [number, number, number]
  rightBurnerPosition?: [number, number, number]
}

export default function Stove({ 
  thermalMode = false, 
  isHeating = false, 
  heatingTime = 0, 
  heatSourcePosition = [0, 0, 0], 
  leftBurnerPosition = [-0.55, 0.2, -0.1], 
  rightBurnerPosition = [0.55, 0.2, -0.1], 
  ...props 
}: StoveProps) {
  const { scene } = useGLTF('models/5-2-2/Stove.glb')
  const [originalMaterials, setOriginalMaterials] = useState<Map<THREE.Mesh, THREE.Material>>(new Map())
  const [leftBurnerPoint, setLeftBurnerPoint] = useState(new THREE.Vector3(0, 0, 0))
  const [rightBurnerPoint, setRightBurnerPoint] = useState(new THREE.Vector3(0, 0, 0))
  const thermalMaterialRef = useRef<THREE.ShaderMaterial>()

  useEffect(() => {
    const materials = new Map<THREE.Mesh, THREE.Material>()
    const box = new THREE.Box3()
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Store original materials
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
    
    // 모델의 X축 1/3 지점들 계산 (화구 2개)
    const min = box.min
    const max = box.max
    const width = max.x - min.x
    const centerY = (min.y + max.y) / 2
    const centerZ = (min.z + max.z) / 2
    
    // 왼쪽 화구: X축 -1/3 지점
    const leftBurner = new THREE.Vector3(
      min.x + width * (1/4), // X축 -1/3 지점
      centerY, // Y축 중앙
      centerZ-0.1  // Z축 중앙
    )
    
    // 오른쪽 화구: X축 +1/3 지점
    const rightBurner = new THREE.Vector3(
      min.x + width * (3/4), // X축 +1/3 지점
      centerY, // Y축 중앙
      centerZ-0.1  // Z축 중앙
    )
    
    setLeftBurnerPoint(leftBurner)
    setRightBurnerPoint(rightBurner)
  }, [scene, originalMaterials])

  useEffect(() => {
    if (thermalMode) {
      // Create thermal material for stove using the specialized shader
      const thermalMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader2,
        fragmentShader: thermalFragmentShader2,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0.15 }, // 초기 온도 (파란색)
          heatingTime: { value: heatingTime },
          baseColor: { value: new THREE.Color(0.3, 0.3, 0.5) },
          centerPoint: { value: new THREE.Vector3(0, 0, 0) }, // 사용하지 않음 (두 개의 화구가 있으므로)
          leftBurner: { value: leftBurnerPoint }, // 왼쪽 화구 중심점
          rightBurner: { value: rightBurnerPoint }, // 오른쪽 화구 중심점
          isHeating: { value: isHeating }
        }
      })
      
      thermalMaterialRef.current = thermalMaterial
      
      // Apply thermal material to all meshes
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = thermalMaterial
        }
      })
    } else {
      // Restore original materials
      originalMaterials.forEach((material, mesh) => {
        mesh.material = material
      })
    }
  }, [thermalMode, scene, originalMaterials, leftBurnerPoint, rightBurnerPoint, heatingTime, isHeating])

  // 가열 시간과 상태 업데이트
  useEffect(() => {
    if (thermalMode && thermalMaterialRef.current) {
      thermalMaterialRef.current.uniforms.heatingTime.value = heatingTime
      thermalMaterialRef.current.uniforms.isHeating.value = isHeating
      thermalMaterialRef.current.uniforms.leftBurner.value = leftBurnerPoint
      thermalMaterialRef.current.uniforms.rightBurner.value = rightBurnerPoint
    }
  }, [heatingTime, isHeating, thermalMode, leftBurnerPoint, rightBurnerPoint])

  useFrame(({ clock }) => {
    if (thermalMode && thermalMaterialRef.current) {
      thermalMaterialRef.current.uniforms.time.value = clock.getElapsedTime()
    }
  })

  return <primitive object={scene} {...props} />
}