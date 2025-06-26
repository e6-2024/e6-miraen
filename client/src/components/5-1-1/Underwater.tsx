import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface UnderwaterEnvironmentProps {
  sceneIndex: number
}

export default function UnderwaterEnvironment({ sceneIndex }: UnderwaterEnvironmentProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  // 물 속 광선 효과
  const CausticPlane = () => {
    const planeRef = useRef<THREE.Mesh>(null)
    
    const causticMaterial = useMemo(() => {
      return new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          opacity: { value: 0.3 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float opacity;
          varying vec2 vUv;
          
          void main() {
            vec2 uv = vUv * 8.0;
            
            // 물의 굴절로 인한 광선 패턴
            float caustic1 = sin(uv.x * 2.0 + time) * sin(uv.y * 2.0 + time * 0.7);
            float caustic2 = sin(uv.x * 1.5 + time * 0.8) * sin(uv.y * 1.8 + time * 1.2);
            
            float pattern = (caustic1 + caustic2) * 0.5 + 0.5;
            pattern = pow(pattern, 3.0);
            
            vec3 lightColor = vec3(0.1, 0.1, 0.1);
            gl_FragColor = vec4(lightColor * pattern, opacity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    }, [])
    
    useFrame((_, delta) => {
      if (planeRef.current && planeRef.current.material instanceof THREE.ShaderMaterial) {
        planeRef.current.material.uniforms.time.value += delta * 0.5
      }
    })
    
    return (
      <mesh 
        ref={planeRef}
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        material={causticMaterial}
      >
        <planeGeometry args={[100, 100]} />
      </mesh>
    )
  }
  
  if (sceneIndex !== 1 && sceneIndex !== 2) return null
  
  return (
    <group ref={groupRef}>
      {/* 수중 조명 설정 */}
      <ambientLight intensity={0.2} color={0x004080} />
      
      {/* 주요 방향성 조명 (그림자 생성) */}
      <directionalLight 
        castShadow
        position={[5, 10, 5]} 
        intensity={0.8}
        color={0x6699ff}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-bias={-0.0005}
      />

      
      {/* 보조 조명 */}
      <pointLight 
        position={[0, 8, 0]} 
        color={0x6699cc} 
        intensity={0.4}
        distance={20}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      {/* 측면 조명 */}
      <spotLight
        position={[-10, 5, 10]}
        target-position={[0, 0, 0]}
        intensity={0.3}
        angle={Math.PI / 4}
        penumbra={0.5}
        color={0x4488bb}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* 검정색 바닥 평면 (그림자 받기) */}
      <mesh 
        position={[0,-5, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial 
          color="#493A24"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* 물 속 광선 효과 */}
      <CausticPlane />
    </group>
  )
}