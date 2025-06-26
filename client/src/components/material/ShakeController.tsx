import { useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';

interface PhysicsRef {
  xTilt: number;
  zTilt: number;
}

interface Props {
  groupRef: React.RefObject<Group>;
  shake: boolean;
  physicsRef: React.RefObject<PhysicsRef>;
}

export default function ShakeController({ groupRef, shake, physicsRef }: Props) {
  const time = useRef(0);
  const intensity = useRef(0);
  const maxIntensity = 0.2; // 최대 흔들림 강도

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    // 흔들기 상태에 따라 강도 조정
    if (shake) {
      intensity.current = Math.min(intensity.current + delta * 2, maxIntensity);
    } else {
      intensity.current = Math.max(intensity.current - delta * 3, 0);
    }
    
    // 새로운 각도 계산
    time.current += delta * 10;
    const angleX = Math.sin(time.current) * intensity.current;
    const angleZ = Math.cos(time.current * 1.3) * intensity.current;
    
    // 체에 회전 적용
    groupRef.current.rotation.x = angleX;
    groupRef.current.rotation.z = angleZ;
    
    // 물리 상태 업데이트 (공통 참조로 공들에 영향)
    if (physicsRef.current) {
      physicsRef.current.xTilt = angleX;
      physicsRef.current.zTilt = angleZ;
    }
  });

  return null;
}