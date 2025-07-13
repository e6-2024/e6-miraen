// src/components/5-2-1/Particle.tsx
import { useSphere } from '@react-three/cannon';
import { useRef, useEffect } from 'react';
import { Mesh } from 'three';

interface Props {
  position: [number, number, number];
  radius: number;
}

export default function Particle({ position, radius }: Props) {
  const ref = useRef<Mesh>(null);
  
  const [, api] = useSphere(() => ({
    mass: radius > 0.3 ? 1.5 : 0.8, // 질량 약간 줄여서 계산 부하 감소
    position,
    args: [radius],
    material: {
      friction: 0.3, // 마찰 줄여서 부드럽게
      restitution: 0.2, // 튕김 줄여서 안정적으로
    },
  }), ref);

  // 생성 직후 살짝 흔들어서 잠들지 않게 하기
  useEffect(() => {
    const timer = setTimeout(() => {
      if (api) {
        api.velocity.set(
          (Math.random() - 0.5) * 0.01, // 초기 속도 줄임
          -0.1,
          (Math.random() - 0.5) * 0.01
        );
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [api]);

  return (
    <mesh ref={ref} castShadow>
      {/* LOD: 낮은 폴리곤으로 성능 최적화 */}
      <sphereGeometry args={[radius, 12, 8]} /> 
      <meshStandardMaterial
        color={radius > 0.3 ? 'orange' : 'limegreen'}
      />
    </mesh>
  );
}