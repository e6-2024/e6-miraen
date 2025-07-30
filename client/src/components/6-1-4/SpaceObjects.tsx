// src/components/SpaceObjects.tsx

import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { Line, Text, Billboard } from '@react-three/drei'

// 태양
export function Sun() {
  const sunRef = useRef<THREE.Mesh>(null!)
  const sunTexture = useTexture('/models/6-1-4/sun_texture.jpeg')
  
  useFrame((_, delta) => {
    sunRef.current.rotation.y += 0.05 * delta
  })
  
  return (
    <mesh ref={sunRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial
        map={sunTexture}
        emissive='orange'
        emissiveIntensity={0.8}
        emissiveMap={sunTexture}
      />
    </mesh>
  )
}

// 별
export function Stars() {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(6000)
    for (let i = 0; i < 2000; i++) {
      pos.set([
        (Math.random() - 0.5) * 100, 
        (Math.random() - 0.5) * 100, 
        (Math.random() - 0.5) * 100
      ], i * 3)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  
  return (
    <points geometry={geom}>
      <pointsMaterial color='white' size={0.05} />
    </points>
  )
}

// 위도/경도 → 벡터 변환 (사용되지 않으므로 제거)
// function latLonToVector3(lat: number, lon: number, radius: number): [number, number, number] {
//   const φ = (90 - lat) * (Math.PI / 180)
//   const θ = (lon + 180) * (Math.PI / 180)
//   return [
//     -radius * Math.sin(φ) * Math.cos(θ),
//     radius * Math.cos(φ),
//     radius * Math.sin(φ) * Math.sin(θ),
//   ]
// }

export function EarthModel({
  position,
  onClick,
  fadeReady,
  season,
  isResetting,
  onRotationComplete,
  isSelected,
  rotationX = 0,
  rotationY = 0,
  hideAxisAndLabel = false
}: {
  position: [number, number, number]
  season: 'spring' | 'summer' | 'fall' | 'winter'
  onClick: () => void
  fadeReady: boolean
  isResetting: boolean
  onRotationComplete?: () => void
  isSelected?: boolean
  rotationX?: number
  rotationY?: number
  hideAxisAndLabel?: boolean
}) {
  const seasonAngles: Record<string, number> = {
    spring: -Math.PI / 2,
    summer: Math.PI,
    fall: Math.PI / 2,
    winter: 0,
  }

  const seasonLabels: Record<string, string> = {
    spring: '겨울',
    summer: '가을',
    fall: '여름',
    winter: '봄',
  }

  const { scene: earthScene } = useGLTF('/models/6-1-4/Earth.glb')
  
  const groupRef = useRef<THREE.Group>(null!)
  const earthRef = useRef<THREE.Group>(null!)
  const panoRef = useRef<THREE.Mesh>(null!)
  
  const [targetAngle, setTargetAngle] = useState(seasonAngles[season] || 0)
  const [isRotationAligned, setIsRotationAligned] = useState(false)
  
  // 회전 속도와 정렬 상태
  const rotationSpeed = useRef(0.2)
  const rotationAlignedRef = useRef(false)
  const earthOpacityRef = useRef(1)
  
  // Clone the earth scene and set up materials properly
  const clonedEarthScene = useMemo(() => {
    const cloned = earthScene.clone()
    
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat instanceof THREE.Material) {
              mat.transparent = true
            }
          })
        } else if (child.material instanceof THREE.Material) {
          child.material.transparent = true
        }
      }
    })
    
    return cloned
  }, [earthScene])
  
  // 선택된 지구 회전 처리
  useEffect(() => {
    if (isSelected && groupRef.current) {
      setIsRotationAligned(false)
      rotationAlignedRef.current = false
      
      const currentAngle = groupRef.current.rotation.y
      const idealAngle = seasonAngles[season] || 0
      
      let normalizedCurrent = currentAngle % (Math.PI * 2)
      if (normalizedCurrent < 0) normalizedCurrent += Math.PI * 2
      
      const normalizedIdeal = idealAngle % (Math.PI * 2)
      
      let fullRotations
      if (currentAngle >= 0) {
        fullRotations = Math.floor(currentAngle / (Math.PI * 2)) * (Math.PI * 2)
      } else {
        fullRotations = Math.ceil(currentAngle / (Math.PI * 2)) * (Math.PI * 2)
      }
      
      setTargetAngle(fullRotations + normalizedIdeal)
    }
  }, [isSelected, season, seasonAngles])
  
  // 자전 상태 관리
  useEffect(() => {
    if (isSelected && !isResetting) {
      rotationSpeed.current = 0
    } else if (isResetting) {
      rotationSpeed.current = 0.2
      setIsRotationAligned(false)
      rotationAlignedRef.current = false
    } else if (fadeReady && !isResetting) {
      rotationSpeed.current = 0
    } else if (!isSelected && !fadeReady && !isResetting) {
      rotationSpeed.current = 0.2
    }
  }, [isResetting, fadeReady, isSelected])

  useEffect(() => {
    if (fadeReady) {
      setIsRotationAligned(true)
      rotationAlignedRef.current = true
    } else if (isResetting) {
      setIsRotationAligned(false)
      rotationAlignedRef.current = false
    }
  }, [fadeReady, isResetting])

  // 파노라마 회전 적용
  useEffect(() => {
    if (fadeReady && panoRef.current) {
      panoRef.current.rotation.x = rotationX
      panoRef.current.rotation.y = rotationY
    }
  }, [rotationX, rotationY, fadeReady])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    
    // 회전 애니메이션
    if (isSelected && !rotationAlignedRef.current && !fadeReady) {
      const diff = targetAngle - groupRef.current.rotation.y
      const absDiff = Math.abs(diff)
      const damping = Math.max(1, Math.min(5, 1 + absDiff))
      
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetAngle,
        damping,
        delta
      )
      
      const isAligned = Math.abs(groupRef.current.rotation.y - targetAngle) < 0.15
      if (isAligned && !rotationAlignedRef.current) {
        rotationAlignedRef.current = true
        setIsRotationAligned(true)
        groupRef.current.rotation.y = targetAngle
        onRotationComplete?.()
      }
    } else if (!fadeReady && !isResetting && !isSelected) {
      groupRef.current.rotation.y += rotationSpeed.current * delta
    }
    
    // 지구 투명도 처리
    if (earthRef.current) {
      let targetOpacity = 1
      
      if (isResetting) {
        targetOpacity = 1
      } else if (fadeReady) {
        targetOpacity = 0
      } else {
        targetOpacity = 1
      }
      
      earthOpacityRef.current = THREE.MathUtils.damp(
        earthOpacityRef.current,
        targetOpacity,
        10,
        delta
      )
      
      // 지구 모델 투명도 적용
      earthRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat instanceof THREE.Material) {
                mat.opacity = earthOpacityRef.current
              }
            })
          } else if (child.material instanceof THREE.Material) {
            child.material.opacity = earthOpacityRef.current
          }
        }
      })
      
      earthRef.current.visible = earthOpacityRef.current > 0.01
    }
  })

  return (
    <group onClick={onClick}>
      <group position={position} ref={groupRef} rotation={[Math.PI * 23.5 / 180, 0, 0]}>
        <group ref={earthRef}>
          <primitive 
            object={clonedEarthScene} 
            scale={[1, 1, 1]} 
          />
        </group>
        
        {!hideAxisAndLabel && (
          <Line
            points={[
              [0, -0.5, 0],
              [0, 0.5, 0]
            ]}
            color="white"
            lineWidth={2}
          />
        )}
      </group>

      {!hideAxisAndLabel && (
        <group position={[position[0], position[1] + 0.63, position[2]]}>
          <Billboard>
            <Text
              fontSize={0.1}
              color="white"
              anchorX="center"
              anchorY="bottom"
              font='/fonts/Maplestory Bold.ttf'
            >
              {seasonLabels[season]}
            </Text>
          </Billboard>
        </group>
      )}
    </group>
  )
}