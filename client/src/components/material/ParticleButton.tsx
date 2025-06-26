import { useSphere } from '@react-three/cannon';
import { useRef, useEffect } from 'react';
import { Mesh, Vector3 } from 'three';

interface Props {
  position: [number, number, number];
  radius: number;
  forcePosition?: boolean; // 강제로 위치를 설정할지 여부
}

export default function ParticleButton({ position, radius, forcePosition = false }: Props) {
  const ref = useRef<Mesh>(null);
  
  const colliderScale = radius > 0.3 ? 0.9 : 0.95; 
  
  const [, api] = useSphere(() => ({
    mass: forcePosition ? 0 : 1, // 강제 위치 설정 시 질량 0으로 (고정)
    position,
    args: [radius * colliderScale],
    allowSleep: false,
  }), ref);

  // 위치가 변경될 때마다 물리 엔진 위치도 업데이트
  useEffect(() => {
    if (forcePosition) {
      api.position.set(position[0], position[1], position[2]);
      api.velocity.set(0, 0, 0); // 속도도 0으로 초기화
    }
  }, [position, forcePosition, api]);

  // 렌더링 위치도 직접 업데이트
  useEffect(() => {
    if (ref.current && forcePosition) {
      ref.current.position.set(position[0], position[1], position[2]);
    }
  }, [position, forcePosition]);

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial
        color={
          radius > 0.3
            ? 'orange'      
            : radius > 0.2
            ? 'skyblue'  
            : 'limegreen'  
        }
      />
    </mesh>
  );
}