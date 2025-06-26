import { useState, useRef, useEffect } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import SieveModel from '@/components/material/SieveModel';
import Particle from '@/components/material/Particle';

interface Props {
  triggerSpawn: boolean;
  onSpawnHandled: () => void;
  triggerShake: boolean;
  onShakeHandled: () => void;
  selectedLevel: number;
  setGravity: React.Dispatch<React.SetStateAction<[number, number, number]>>;
}

type ParticleData = {
  id: string;
  radius: number;
  position: [number, number, number];
  canPassThrough: boolean; // 체를 통과할 수 있는지 여부
};

// 체의 구멍 크기에 따른 통과 가능한 입자 크기 설정
const getPassableRadius = (selectedLevel: number): number => {
  switch (selectedLevel) {
    case 0: // 큰 구멍 - 중간, 작은 입자만 통과
      return 0.3;
    case 1: // 막힌 체 - 아무것도 통과 못함
      return 0;
    case 2: // 작은 구멍 - 작은 입자만 통과
      return 0.2;
    default:
      return 0.3;
  }
};

export default function SieveSimulationButton({ 
  triggerSpawn, 
  onSpawnHandled, 
  triggerShake,
  onShakeHandled,
  selectedLevel,
  setGravity,
}: Props) {
  const groupRef = useRef<Group>(null);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [sievePosition, setSievePosition] = useState<[number, number, number]>([0, 0, 0]);
  const [sieveRotation, setSieveRotation] = useState<[number, number, number]>([0, 0, 0]);
  
  const spawnParticles = () => {
    const passableRadius = getPassableRadius(selectedLevel);
    
    const newParticles = Array.from({ length: 15 }, () => {
      const radius = [0.35, 0.25, 0.15][Math.floor(Math.random() * 3)];
      const x = (Math.random() - 0.5) * 2.5;
      const z = (Math.random() - 0.5) * 2.5;
      const y = 3 + Math.random() * 1;
      
      // 입자가 체를 통과할 수 있는지 판단
      const canPassThrough = radius <= passableRadius;
      
      return {
        id: crypto.randomUUID(),
        radius,
        position: [x, y, z] as [number, number, number],
        canPassThrough,
      };
    });
    setParticles((prev) => [...prev, ...newParticles]);
  };

  // 체 흔들기 함수
  const shakeParticles = () => {
    setIsShaking(true);
    
    // 체를 X축 방향으로 좌우로 크게 흔들기
    let shakeCount = 0;
    const maxShakes = 20; // 흔들림 횟수 증가
    const baseIntensity = 0.3; // 기본 흔들림 강도
    
    const shakeInterval = setInterval(() => {
      if (groupRef.current && shakeCount < maxShakes) {
        // 사인파 형태로 좌우 흔들림 (더 자연스러운 움직임)
        const progress = shakeCount / maxShakes;
        const intensity = baseIntensity * (1 - progress * 0.7); // 점점 약해지는 강도
        
        // X축 위치 변화 (좌우로 흔들기)
        const xOffset = Math.sin(shakeCount * 0.8) * intensity;
        
        groupRef.current.position.x = xOffset;
        
        // 물리 충돌체들도 같이 움직이도록 상태 업데이트
        setSievePosition([xOffset, 0, 0]);
        
        shakeCount++;
      } else {
        clearInterval(shakeInterval);
        if (groupRef.current) {
          // 원래 위치로 복원
          groupRef.current.position.x = 0;
          groupRef.current.rotation.x = 0;
          groupRef.current.rotation.z = 0;
        }
        // 물리 충돌체들도 원래 위치로
        setSievePosition([0, 0, 0]);
        setSieveRotation([0, 0, 0]);
        setIsShaking(false);
      }
    }, 80); // 조금 더 빠른 흔들림
  };

  // 떨어진 particle 제거
  useFrame(() => {
    setParticles((prev) => prev.filter((p) => p.position[1] > -5));
  });

  // 외부 trigger로 입자 생성
  useEffect(() => {
    if (triggerSpawn) {
      spawnParticles();
      onSpawnHandled();
    }
  }, [triggerSpawn, onSpawnHandled, selectedLevel]);

  // 체 흔들기 trigger
  useEffect(() => {
    if (triggerShake && !isShaking) {
      shakeParticles();
      onShakeHandled();
    }
  }, [triggerShake, onShakeHandled, isShaking]);

  // 체 레벨이 변경되면 기존 입자들의 통과 가능 여부 재계산
  useEffect(() => {
    const passableRadius = getPassableRadius(selectedLevel);
    setParticles(prev => prev.map(particle => ({
      ...particle,
      canPassThrough: particle.radius <= passableRadius
    })));
  }, [selectedLevel]);

  return (
    <>
      <group ref={groupRef}>
        <SieveModel 
          selectedLevel={selectedLevel} 
          position={sievePosition}
          rotation={sieveRotation}
        />
      </group>
      
      {/* 입자들 */}
      {particles.map((p) => (
        <Particle 
          key={p.id} 
          position={p.position} 
          radius={p.radius}
        />
      ))}
      
      {/* 체 정보 표시 */}
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}