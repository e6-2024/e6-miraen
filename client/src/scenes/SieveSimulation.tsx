import { useState, useRef, useEffect } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import SieveModel from '@/components/material/SieveModel';
import Particle from '@/components/material/Particle';
import TiltController from '@/components/material/TiltController';

interface Props {
  triggerSpawn: boolean;
  onSpawnHandled: () => void;
  selectedLevel: number;
  setGravity: React.Dispatch<React.SetStateAction<[number, number, number]>>;
}

type ParticleData = {
  id: string;
  radius: number;
  position: [number, number, number];
};

export default function SieveSimulation({ 
  triggerSpawn, 
  onSpawnHandled, 
  selectedLevel,
  setGravity,
}: Props) {
  const groupRef = useRef<Group>(null);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  
  const spawnParticles = () => {
    const newParticles = Array.from({ length: 10 }, () => {
      const radius = [0.35, 0.25, 0.15][Math.floor(Math.random() * 3)];
      const x = (Math.random() - 0.5) * 3;
      const z = (Math.random() - 0.5) * 3;
      const y = 3 + Math.random() * 2;
      return {
        id: crypto.randomUUID(),
        radius,
        position: [x, y, z] as [number, number, number],
      };
    });
    setParticles((prev) => [...prev, ...newParticles]);
  };

  // 떨어진 particle 제거
  useFrame(() => {
    setParticles((prev) => prev.filter((p) => p.position[1] > -3));
  });

  // 외부 trigger로 입자 생성
  useEffect(() => {
    if (triggerSpawn) {
      spawnParticles();
      onSpawnHandled();
    }
  }, [triggerSpawn, onSpawnHandled]);

  return (
    <>
      {/* 시각적 모델과 물리 충돌체를 같은 그룹에서 관리 */}
      <group ref={groupRef}>
        <SieveModel 
          selectedLevel={selectedLevel} 
          rotation={[0, 0, 0]} // 내부 회전은 0으로 설정
          showColliders={false} 
        />
      </group>
      
      {/* TiltController는 groupRef만 회전시킴 - onRotationChange 제거 */}
      <TiltController 
        groupRef={groupRef} 
        setGravity={setGravity}
      />
      
      {/* 입자들은 체 밖에 배치 */}
      {particles.map((p) => (
        <Particle 
          key={p.id} 
          position={p.position} 
          radius={p.radius}
        />
      ))}
    </>
  );
}