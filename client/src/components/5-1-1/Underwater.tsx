import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface UnderwaterEnvironmentProps {
  sceneIndex: number
}

export default function UnderwaterEnvironment({ sceneIndex }: UnderwaterEnvironmentProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  const CausticPlane = () => {
    const planeRef = useRef<THREE.Mesh>(null)
    
    const causticMaterial = useMemo(() => {
      return new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          opacity: { value: 0.2 } 
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
            vec2 uv = vUv * 4.0;
            
            float caustic1 = sin(uv.x * 2.0 + time) * sin(uv.y * 2.0 + time * 0.7);
            float caustic2 = sin(uv.x * 1.5 + time * 0.8) * sin(uv.y * 1.8 + time * 1.2);
            
            float pattern = (caustic1 + caustic2) * 0.5 + 0.5;
            pattern = pow(pattern, 3.0);
            
            vec3 lightColor = vec3(0.3, 0.5, 0.7);  // 파란 톤
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
        position={[0, 0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={causticMaterial}
      >
        <planeGeometry args={[25, 25]} /> 
      </mesh>
    )
  }
  
  if (sceneIndex !== 1 && sceneIndex !== 2) return null
  
  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.2} color={0x004080} />  
      
      <directionalLight 
        castShadow
        position={[5, 10, 5]} 
        intensity={1.2}   
        color={0x88ccff}   
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-bias={-0.0005}
      />
      
      <pointLight 
        position={[0, 8, 0]} 
        color={0x6699cc} 
        intensity={0.6}  
        distance={25}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      <spotLight
        position={[-10, 5, 10]}
        target-position={[0, 0, 0]}
        intensity={0.5}
        angle={Math.PI / 3} 
        penumbra={0.5}
        color={0x4488bb}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      <spotLight
        position={[10, 5, -10]}
        target-position={[0, 0, 0]}
        intensity={0.3}
        angle={Math.PI / 3}
        penumbra={0.5}
        color={0x5599cc}
        castShadow={false}
      />
      <CausticPlane />
    </group>
  )
}