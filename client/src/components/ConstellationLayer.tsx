import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface ConstellationLayerProps {
  activeSeason: string | null
  enableInteraction: boolean
  fadeOut?: boolean
  // 외부에서 회전을 제어하기 위한 props 추가
  rotationX?: number
  rotationY?: number
  rotationZ?: number
}

export function ConstellationLayer({
  activeSeason,
  enableInteraction,
  fadeOut = false,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
}: ConstellationLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const opacity = useRef(0)
  const { camera } = useThree()

  useEffect(() => {
    if (!meshRef.current) return
    // Y축 초기 회전만 한 번 적용
    meshRef.current.rotation.set(0, Math.PI / 2, 0)
    opacity.current = fadeOut ? 1 : 0
  }, [activeSeason, fadeOut])
  
  

  const getRotationFactorsForCamera = useMemo(() => {
    if (!activeSeason) return { xFactor: 1, yFactor: 1, zFactor: 1 };

    let xFactor = 1;
    let yFactor = 1;
    let zFactor = 1;
    
    const seasons = ['winter', 'spring', 'summer', 'fall'];
    const index = seasons.indexOf(activeSeason);
    const angle = (index * Math.PI) / 2;
    const posX = Math.cos(angle) * 2;
    const posZ = Math.sin(angle) * 2;
    
    // 위치에 따른 회전 방향 조정
    if (posX > 1) {  // 뒷쪽
      xFactor = 1; 
      yFactor = 1;  
      console.log('선택1')

    } else if (posX < -1) {  // 앞쪽
      xFactor = -1; 
      yFactor = 1;  
      console.log('선택2')

    } else if (posZ > 1) {  //오른쪽
      zFactor = 1;
      yFactor = 1; 
      console.log('선택3')
    } else {  // 왼쪽
      zFactor = -1;
      yFactor = 1; 
      console.log('선택4')
    }
    
    return { xFactor, yFactor, zFactor };
  }, [activeSeason]);

  // 페이드 인/아웃 효과 및 회전 적용
  useFrame(() => {
    if (!meshRef.current) return
    if (fadeOut) {
      opacity.current = THREE.MathUtils.lerp(opacity.current, 0, 0.02)
    } else if (activeSeason) {
      opacity.current = THREE.MathUtils.lerp(opacity.current, 1, 0.02)
    }
    ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity.current
    
    // 외부에서 전달받은 회전값 적용 (enableInteraction이 true일 때만)
    if (enableInteraction) {
      const { xFactor, yFactor, zFactor } = getRotationFactorsForCamera;
      
      if ((activeSeason === 'spring' || activeSeason === 'fall')) {
        meshRef.current.rotation.z = rotationZ * zFactor;
        meshRef.current.rotation.y = rotationY * yFactor;
      } else {
        meshRef.current.rotation.x = rotationX * xFactor;
        meshRef.current.rotation.y = rotationY * yFactor;
      }
    }
  })

  // 별자리 텍스처 로드
  const texturePath = '/textures/constellation_figures.jpg'
  const tex = useMemo(
    () => (activeSeason ? new THREE.TextureLoader().load(texturePath) : null),
    [activeSeason]
  )

  
  if (!tex) return null

  return (
    <mesh 
      ref={meshRef}
      scale={[300, 300, 300]}
      raycast={() => null}
    >
      <sphereGeometry args={[1, 32, 32]}  />
      <meshBasicMaterial
        map={tex}
        color={new THREE.Color(0.9, 0.9, 0.9).multiplyScalar(0.7)}
        side={THREE.BackSide}
        transparent
        opacity={0}
        
      />
    </mesh>
  )
}