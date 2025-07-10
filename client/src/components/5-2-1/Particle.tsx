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
    mass: radius > 0.3 ? 2 : 1, // 큰 파티클이 더 무겁게
    position,
    args: [radius],
    allowSleep: false,
    material: {
      friction: 0.4,
      restitution: 0.3,
    },
  }), ref);

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial
        color={
          radius > 0.3
            ? 'orange'      // 큰 파티클 (0.35) - 주황색
            : 'limegreen'   // 작은 파티클 (0.15) - 초록색
        }
      />
    </mesh>
  );
}