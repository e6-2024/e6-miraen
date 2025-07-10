// src/scenes/SieveSimulation.tsx
import { useState, useRef, useEffect } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import SieveModel from '@/components/5-2-1/SieveModel';
import Particle from '@/components/5-2-1/Particle';

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

// 바닥 컴포넌트 추가
function Ground() {
  const ref = useRef(null);
  
  useBox(() => ({
    type: 'Static',
    args: [20, 1, 20], // 큰 바닥
    position: [0, -8, 0], // 체 아래 훨씬 아래쪽
    friction: 0.6,
  }), ref);

  return (
    <mesh ref={ref} position={[0, -8, 0]} receiveShadow>
      <boxGeometry args={[20, 1, 20]} />
      <meshStandardMaterial color="lightgray" />
    </mesh>
  );
}
// 투명 수집 상자 컴포넌트
function CollectionBox() {
  const ref = useRef(null);
  
  // 물리 충돌체 (바닥만)
  useBox(() => ({
    type: 'Static',
    args: [4, 0.1, 4], // 바닥 크기
    position: [0, -4, 0], // 체 아래 위치
    friction: 0.5,
  }), ref);

  return (
    <group>
      {/* 시각적 표시용 투명 상자 */}
      <mesh position={[0, -3.5, 0]}>
        <boxGeometry args={[4, 1, 4]} />
        <meshStandardMaterial 
          color="lightblue" 
          transparent 
          opacity={0.2} 
          wireframe={false}
        />
      </mesh>
      
      {/* 물리 충돌체 (보이지 않음) */}
      <mesh ref={ref} position={[0, -4, 0]}>
        <boxGeometry args={[4, 0.1, 4]} />
        <meshStandardMaterial visible={false} />
      </mesh>
      
      {/* 레이블 */}
      <mesh position={[0, -2.8, 2.2]}>
        <planeGeometry args={[2, 0.4]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}

export default function SieveSimulation({ 
  triggerSpawn, 
  onSpawnHandled, 
  selectedLevel,
  setGravity,
}: Props) {
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [spawnKey, setSpawnKey] = useState(0); // 강제 리렌더링을 위한 키
  
  const spawnParticles = () => {
    // 기존 파티클 제거
    setParticles([]);
    
    // 약간의 지연 후 새 파티클 생성
    setTimeout(() => {
      const newParticles = Array.from({ length: 15 }, (_, index) => {
        const sizes = [0.35, 0.15];
        const radius = sizes[Math.floor(Math.random() * 2)];
        const x = (Math.random() - 0.5) * 1.5;
        const z = (Math.random() - 0.5) * 1.5;
        const y = 2 + Math.random() * 1;
        
        return {
          id: `${spawnKey}-${index}`,
          radius,
          position: [x, y, z] as [number, number, number],
        };
      });
      
      setParticles(newParticles);
      setSpawnKey(prev => prev + 1);
    }, 100);
  };

  // 파티클이 체를 통과할 수 있는지 확인하는 함수
  const canParticlePass = (particleRadius: number, sieveLevel: number) => {
    switch (sieveLevel) {
      case 0: // 큰 체 - 모든 파티클 통과
        return true;
      case 1: // 작은 체 - 어떤 파티클도 통과 안됨
        return false;
      case 2: // 중간 체 - 초록색(작은) 파티클만 통과
        return particleRadius <= 0.15;
      default:
        return false;
    }
  };

  // 파티클 위치 업데이트 (너무 멀리 떨어진 것만 제거)
  useFrame(() => {
    setParticles((prev) => {
      return prev.filter((p) => {
        // 너무 멀리 떨어진 파티클만 제거
        return p.position[1] > -10;
      });
    });
  });

  // 외부 trigger로 입자 생성
  useEffect(() => {
    if (triggerSpawn) {
      spawnParticles();
      onSpawnHandled();
    }
  }, [triggerSpawn, onSpawnHandled]);

  // 레벨이 변경되면 기존 파티클 리셋
  useEffect(() => {
    setParticles([]);
    setSpawnKey(prev => prev + 1);
  }, [selectedLevel]);

  return (
    <>
      {/* 체 모델 */}
      <SieveModel 
        selectedLevel={selectedLevel} 
        rotation={[0, 0, 0]}
        showColliders={false} 
        enableFloorColliders={true}
      />
      
      {/* 수집 상자 */}
      <CollectionBox />
      
      {/* 바닥 */}
      <Ground />
      
      {/* 테스트 파티클 - 항상 떨어지는 파티클 */}
      <Particle position={[0, 4, 0]} radius={0.2} />
      
      {/* 입자들 - 키를 사용하여 강제 리렌더링 */}
      <group key={`particles-${spawnKey}`}>
        {particles.map((p) => (
          <Particle 
            key={p.id} 
            position={p.position} 
            radius={p.radius}
          />
        ))}
      </group>
    </>
  );
}