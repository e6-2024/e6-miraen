import { useSphere } from '@react-three/cannon';
import { useRef } from 'react';
import { Mesh } from 'three';

interface Props {
  position: [number, number, number];
  radius: number;
}

export default function Particle({ position, radius }: Props) {
  const ref = useRef<Mesh>(null);
  
  const colliderScale = radius > 0.3 ? 0.9 : 0.95; 
  
  useSphere(() => ({
    mass: 1,
    position,
    args: [radius * colliderScale],
    allowSleep: false,
  }), ref);

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