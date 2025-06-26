// src/components/SpaceObjects.tsx

import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree,  extend  } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { Line, Text, Billboard } from '@react-three/drei'

const horizonShader = {
  uniforms: {
    uMap:       { value: null },
    glowColor:  { value: new THREE.Color('#27548A') },
    glowFactor: { value: 1 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    void main(){
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
    }
  `,
  fragmentShader: `
    uniform sampler2D uMap;
    uniform vec3 glowColor;
    uniform float glowFactor;
    varying vec3 vNormal;
    varying vec2 vUv;
    void main(){
      vec4 base = texture2D(uMap, vUv);
      float mask = base.a * smoothstep(0.3, 0.05, 1.0 - abs(vNormal.y));
      vec3 col = base.rgb + glowColor * glowFactor * mask;
      gl_FragColor = vec4(col, base.a);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
}

// 태양
export function Sun() {
  const sunRef = useRef<THREE.Mesh>(null!)
  const sunTexture = useTexture('/models/earth/sun_texture.jpeg')
  useFrame((_, delta) => {
    sunRef.current.rotation.y += 0.05 * delta
  })
  return (
    <mesh ref={sunRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.2, 32, 32]} />
      <meshStandardMaterial
        map={sunTexture || undefined}
        emissive="orange"
        emissiveIntensity={0.8}
        emissiveMap={sunTexture || undefined}
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
      pos.set(
        [(Math.random() - 0.5) * 100,
         (Math.random() - 0.5) * 100,
         (Math.random() - 0.5) * 100],
        i * 3
      )
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  return (
    <points geometry={geom}>
      <pointsMaterial color="white" size={0.05} />
    </points>
  )
}

// 위도/경도 → 벡터 변환
function latLonToVector3(lat: number, lon: number, radius: number): [number, number, number] {
  const φ = (90 - lat) * (Math.PI / 180)
  const θ = (lon + 180) * (Math.PI / 180)
  return [
    -radius * Math.sin(φ) * Math.cos(θ),
    radius * Math.cos(φ),
    radius * Math.sin(φ) * Math.sin(θ),
  ]
}

export function EarthModel({
  position,
  onClick,
  fadeReady,
  season,
  isResetting,
  onRotationComplete,
  isSelected,
  rotationX = 0,
  rotationY = 0
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
}) {
  const seasonAngles: Record<string, number> = {
    spring: -Math.PI / 2,
    summer: Math.PI,
    fall:   Math.PI / 2,
    winter: 0,
  }

  const { scene: earthScene } = useGLTF('/models/earth/earth.gltf')
  const { scene: figureScene } = useGLTF('/models/earth/Figure.gltf')

  const lat = 26.5665
  const lon = 36.0
  const surfaceRadius = 0.43
  const figureRef = useRef<THREE.Group>(null!)
  const figurePos = useMemo(
    () => latLonToVector3(lat, lon, surfaceRadius),
    []
  )

  const seasonLabels: Record<string, string> = {
    spring: '겨울',
    summer: '가을',
    fall:   '여름',
    winter: '봄',
  }

  const panoTex = useTexture('/textures/Panorama 1.png')
  const panoPos = useMemo<[number, number, number]>(
    () => [figurePos[0], figurePos[1], figurePos[2]],
    [figurePos]
  )

  const glowMat = useMemo(() => {
    const m = new THREE.ShaderMaterial(horizonShader)
    m.uniforms.uMap.value = panoTex
    m.side        = THREE.DoubleSide
    return m
  }, [panoTex])

  const groupRef = useRef<THREE.Group>(null!)
  
  const panoRef = useRef<THREE.Mesh>(null!)
  
  const [targetAngle, setTargetAngle] = useState(seasonAngles[season] || 0)

  const { camera } = useThree()
  
  useEffect(() => {
    if (isSelected && groupRef.current) {
      setIsRotationAligned(false);
      rotationAlignedRef.current = false;
      
      const currentAngle = groupRef.current.rotation.y;
      const idealAngle = seasonAngles[season] || 0;
      
      let normalizedCurrent = currentAngle % (Math.PI * 2);
      if (normalizedCurrent < 0) normalizedCurrent += Math.PI * 2;
      
      const normalizedIdeal = idealAngle % (Math.PI * 2);
      
      let fullRotations;
      if (currentAngle >= 0) {
        fullRotations = Math.floor(currentAngle / (Math.PI * 2)) * (Math.PI * 2);
      } else {
        fullRotations = Math.ceil(currentAngle / (Math.PI * 2)) * (Math.PI * 2);
      }
      
      setTargetAngle(fullRotations + normalizedIdeal);
    }
  }, [isSelected, season, seasonAngles]);
  
  // 회전 속도 상태
  const rotationSpeed = useRef(0.2)
  
  // 회전 정렬 완료 추적 상태
  const [isRotationAligned, setIsRotationAligned] = useState(false)
  const rotationAlignedRef = useRef(false)
  
  // 애니메이션을 위한 ref
  const earthOpacityRef = useRef(1)
  const humanOpacityRef = useRef(1)
  const panoOpacityRef = useRef(0)
  
  // 리셋 감지 시 즉시 상태 변경을 위한 state 추가
  const [showPanoAndHuman, setShowPanoAndHuman] = useState(false)
  
  // 자전 여부 결정
  useEffect(() => {
    // 선택된 지구는 자전 중지 후 정렬 시작
    if (isSelected && !isResetting) {
      rotationSpeed.current = 0;
      // 정렬 상태 초기화는 목표 각도 계산 useEffect에서 처리
      // console.log('1 : 줌인')
    }
    // 리셋 중: 모든 지구 자전 복원
    else if (isResetting) {
      setShowPanoAndHuman(false);
      rotationSpeed.current = 0.2;
      setIsRotationAligned(false);
      rotationAlignedRef.current = false;
      // console.log('2 : 줌아웃')
    }
    // 카메라 이동 완료 후: 파노라마 표시
    else if (fadeReady && !isResetting) {
      setShowPanoAndHuman(true);
      rotationSpeed.current = 0;
      // console.log('3')
    }
    // 기본 상태: 자전 유지
    else if (!isSelected && !fadeReady && !isResetting) {
      rotationSpeed.current = 0.2;
      // console.log('4 : 디폴트')
    }
  }, [isResetting, fadeReady, isSelected]);

  useEffect(() => {
    if (fadeReady) {
      setIsRotationAligned(true);
      rotationAlignedRef.current = true;
    } else if (isResetting) {
      setIsRotationAligned(false);
      rotationAlignedRef.current = false;
    }
  }, [fadeReady, isResetting]);

  useEffect(() => {
    if (fadeReady) {
      if (panoRef.current) {
        panoRef.current.rotation.x = rotationX;
        panoRef.current.rotation.y = rotationY;
      }
      
      if (figureRef.current) {
        figureRef.current.rotation.x = rotationX;
        figureRef.current.rotation.y = rotationY;
      }
    }
  }, [rotationX, rotationY, fadeReady]);

  

  // 외부에서 전달된 회전 적용 (파노라마 구체)
  useEffect(() => {
    if (panoRef.current && fadeReady) {
      panoRef.current.rotation.x = rotationX;
      panoRef.current.rotation.y = rotationY;
    }
  }, [rotationX, rotationY, fadeReady]);


  

  useFrame((_, delta) => {
    if (!groupRef.current) return
    
    if (isSelected && !rotationAlignedRef.current && !fadeReady) {
      // 선택된 지구: 타겟 각도로 정렬
      // 각도 차이가 클수록 더 빠르게 회전하도록 속도 조절
      const diff = targetAngle - groupRef.current.rotation.y;
      const absDiff = Math.abs(diff);
      const damping = Math.max(1, Math.min(5, 1 + absDiff)); // 1~5 범위의 댐핑 값
      
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetAngle,
        damping,
        delta
      );
      
      // 회전이 거의 완료되었는지 확인
      const isAligned = Math.abs(groupRef.current.rotation.y - targetAngle) < 0.15;
      if (isAligned && !rotationAlignedRef.current) {
        rotationAlignedRef.current = true;
        setIsRotationAligned(true);
        groupRef.current.rotation.y = targetAngle;
        onRotationComplete?.();
      }
    } else if (!fadeReady && !isResetting && !isSelected) {
      groupRef.current.rotation.y += rotationSpeed.current * delta;
    }
    

    if (isResetting) {
      earthOpacityRef.current = THREE.MathUtils.damp(
        earthOpacityRef.current,
        1, // 지구 완전 불투명
        10,
        delta
      )
      panoOpacityRef.current = 0; // 파노라마 즉시 투명

    } else if (fadeReady) {
      // 카메라 이동 완료: 지구 즉시 숨김, 파노라마 fade in
      earthOpacityRef.current = THREE.MathUtils.damp(
        earthOpacityRef.current,
        0, // 지구 완전 불투명
        10,
        delta
      )
      panoOpacityRef.current = THREE.MathUtils.damp(
        panoOpacityRef.current,
        1, // 파노라마 완전 불투명
        10,
        delta
      )
    } else {
      // 기본 상태: 지구만 보임
      earthOpacityRef.current = THREE.MathUtils.damp(
        earthOpacityRef.current,
        1,
        10,
        delta
      )
      panoOpacityRef.current = 0; // 파노라마 즉시 투명
    }
  })

  return (
    // 최상위 그룹: onClick만 걸어두고 position/ref는 내부로 이동
    <group onClick={onClick}>
      {/* 1) 지구·피규어·파노라마: position/ref 그대로 유지 */}
      <group position={position} ref={groupRef}>
        {/* 지구 기울기 + 시즌 회전 */}
        <group rotation={[Math.PI * 23.5 / 180, Math.PI / 4 * 1.2, 0]}>
          <primitive 
            object={earthScene.clone()} 
            scale={[0.084, 0.084, 0.084]} 
            visible={earthOpacityRef.current > 0.01}
          >
            <meshStandardMaterial
              transparent
              opacity={earthOpacityRef.current}
            />
          </primitive>
          <Line
            points={[
              [0, -0.5, 0],
              [0,  0.5, 0]
            ]}
            color="white"
            lineWidth={2}
          />
  
          {/* 피규어: static tilt 그룹 안에 yaw 동적 그룹 */}
          <group position={[figurePos[0], figurePos[1] - 0.05, figurePos[2]] } >
            {/* ① static tilt 전용 그룹 */}
            <group rotation={[0, -23.5 * Math.PI / 180 - 0.5, 0]}>
              {/* ② yaw 동적 그룹 */}
              <group ref={figureRef}  raycast={() => null}>
              <primitive 
                object={figureScene.clone()} 
                scale={[0.05, 0.05, 0.05]}
                rotation={[0, Math.PI, 0]} 
              />
              </group>
            </group>
          </group>
        </group>
  
        {!isResetting && (
          <>
          <mesh 
            ref={panoRef}
            position={[panoPos[0], panoPos[1] + 0.3, panoPos[2]]} 
            scale={[0.7, 0.9, 0.7]}
            visible={fadeReady}
            raycast={() => null}
          >
            <sphereGeometry args={[1, 128, 128]} />
            <meshBasicMaterial
              map={panoTex}
              side={THREE.DoubleSide}
              transparent
              opacity={panoOpacityRef.current}
              alphaTest={0.2}
            />
          </mesh>

            </>
          )}

      </group>
  
      {/* 2) Billboard 전용 그룹: position만 상속, 회전은 전혀 없음 */}
      <group
        position={[
          position[0],
          position[1] + surfaceRadius + 0.2,
          position[2],
        ]}
      >
        <Billboard>
          <Text
            fontSize={0.08}
            color="white"
            anchorX="center"
            anchorY="bottom"
          >
            {seasonLabels[season]}
          </Text>
        </Billboard>
      </group>
    </group>
  )
  
}