import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import SieveModel from '@/components/5-2-1/SieveModel';
import Particle from '@/components/5-2-1/Particle';

interface Props {
  triggerSpawn: boolean;
  onSpawnHandled: () => void;
  selectedLevel: number;
  setGravity: React.Dispatch<React.SetStateAction<[number, number, number]>>;
  onSeparationComplete?: () => void; // 분리 완료 콜백 추가
}

type ParticleData = {
  id: string;
  radius: number;
  position: [number, number, number];
};

function Ground() {
  const wallThickness = 0.2;
  const containerSize = 16;
  const wallHeight = 2;
  const bottomY = -7;

  const color = '#ffffff';

  return (
    <group>
      {/* 바닥 */}
      <mesh position={[0, bottomY, 0]} receiveShadow>
        <boxGeometry args={[containerSize, wallThickness, containerSize]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
      </mesh>

      {/* 왼쪽 벽 */}
      <mesh position={[-containerSize / 2, bottomY + wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, containerSize]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
      </mesh>

      {/* 오른쪽 벽 */}
      <mesh position={[containerSize / 2, bottomY + wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, containerSize]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
      </mesh>

      {/* 앞쪽 벽 */}
      <mesh position={[0, bottomY + wallHeight / 2, containerSize / 2]} receiveShadow>
        <boxGeometry args={[containerSize, wallHeight, wallThickness]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
      </mesh>

      {/* 뒷쪽 벽 */}
      <mesh position={[0, bottomY + wallHeight / 2, -containerSize / 2]} receiveShadow>
        <boxGeometry args={[containerSize, wallHeight, wallThickness]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
      </mesh>
    </group>
  );
}

export default function SieveSimulation({ 
  triggerSpawn, 
  onSpawnHandled, 
  selectedLevel,
  setGravity,
  onSeparationComplete
}: Props) {
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [spawnCounter, setSpawnCounter] = useState(0);
  const [separationCheckStarted, setSeparationCheckStarted] = useState(false);
  const [separationCompleted, setSeparationCompleted] = useState(false);
  
  // 파티클 생성 - 순차적으로 떨어뜨리기
  const spawnParticles = () => {
    const particlesToSpawn = 25;
    let spawnedCount = 0;
    
    // 새로운 파티클 생성 시 분리 상태 리셋
    setSeparationCheckStarted(false);
    setSeparationCompleted(false);
    
    const spawnInterval = setInterval(() => {
      if (spawnedCount >= particlesToSpawn) {
        clearInterval(spawnInterval);
        // 모든 파티클 생성 완료 후 일정 시간 뒤에 분리 체크 시작
        setTimeout(() => {
          setSeparationCheckStarted(true);
        }, 3000); // 3초 후 분리 체크 시작
        return;
      }
      
      // 한 번에 2-3개씩 생성
      const batchSize = Math.min(3, particlesToSpawn - spawnedCount);
      const newParticles = Array.from({ length: batchSize }, (_, batchIndex) => {
        const radius = Math.random() > 0.5 ? 0.35 : 0.15;
        
        // 더 넓게 분산하고, 높이도 다르게
        const angle = (spawnedCount + batchIndex) * (Math.PI * 2 / particlesToSpawn); // 원형으로 분산
        const spread = 1.5 + Math.random() * 0.5; // 1.5~2.0 반지름
        
        return {
          id: `spawn-${spawnCounter}-${spawnedCount + batchIndex}`,
          radius,
          position: [
            Math.cos(angle) * spread + (Math.random() - 0.5) * 0.25, // 원형 + 랜덤
            8 + Math.random() * 2,  // 더 높은 곳에서
            Math.sin(angle) * spread + (Math.random() - 0.5) * 0.25
          ] as [number, number, number],
        };
      });
      
      setParticles(prev => [...prev, ...newParticles]);
      spawnedCount += batchSize;
      
    }, 200); // 200ms마다 배치 생성
    
    setSpawnCounter(prev => prev + 1);
  };

  // 분리 완료 체크 함수 (level 2에서만)
  const checkSeparationComplete = (currentParticles: ParticleData[]) => {
    if (selectedLevel !== 2 || !separationCheckStarted || separationCompleted) {
      return;
    }

    // 체 위 영역과 아래 영역의 파티클들을 분류
    const aboveSieve = currentParticles.filter(p => p.position[1] > 3); // 체 위
    const belowSieve = currentParticles.filter(p => p.position[1] < 0); // 체 아래

    // 체 위에는 큰 구슬(0.35)만, 아래에는 작은 구슬(0.15)만 있어야 함
    const aboveLargeBalls = aboveSieve.filter(p => p.radius === 0.35);
    const aboveSmallBalls = aboveSieve.filter(p => p.radius === 0.15);
    const belowLargeBalls = belowSieve.filter(p => p.radius === 0.35);
    const belowSmallBalls = belowSieve.filter(p => p.radius === 0.15);

    // 분리 조건:
    // 1. 체 위에 작은 구슬이 거의 없어야 함 (전체 작은 구슬의 10% 이하)
    // 2. 체 아래에 큰 구슬이 거의 없어야 함 (전체 큰 구슬의 10% 이하)
    // 3. 충분한 수의 파티클이 분리되어야 함
    
    const totalSmallBalls = currentParticles.filter(p => p.radius === 0.15).length;
    const totalLargeBalls = currentParticles.filter(p => p.radius === 0.35).length;
    
    const smallBallsSeparated = totalSmallBalls > 0 && (aboveSmallBalls.length / totalSmallBalls) < 0.1;
    const largeBallsSeparated = totalLargeBalls > 0 && (belowLargeBalls.length / totalLargeBalls) < 0.1;
    const enoughParticlesSeparated = belowSmallBalls.length >= 3 && aboveLargeBalls.length >= 3;

    if (largeBallsSeparated) {
      setSeparationCompleted(true);
      onSeparationComplete?.();
    }
  };

  // 파티클 정리 및 분리 체크
  useFrame(() => {
    setParticles(prev => {
      const filtered = prev.filter(p => {
        // y가 너무 아래로 떨어지거나, 체 밖으로 너무 멀리 나간 파티클 제거
        const distance = Math.sqrt(p.position[0] ** 2 + p.position[2] ** 2);
        return p.position[1] > 1; // 거리 조건 추가
      });
      
      // 파티클이 너무 많으면 오래된 것부터 제거 (성능 최적화)
      const finalParticles = filtered.length > 50 ? filtered.slice(-40) : filtered;
      
      // 분리 완료 체크
      checkSeparationComplete(finalParticles);
      
      return finalParticles;
    });
  });

  // 혼합물 넣기 버튼 처리
  useEffect(() => {
    if (triggerSpawn) {
      spawnParticles();
      onSpawnHandled();
    }
  }, [triggerSpawn, onSpawnHandled]);

  // 레벨 변경 시 분리 상태 리셋
  useEffect(() => {
    setSeparationCheckStarted(false);
    setSeparationCompleted(false);
  }, [selectedLevel]);

  return (
    <>
      <SieveModel 
        selectedLevel={selectedLevel} 
        enableFloorColliders={true}
        showColliders={false} 
      />
    
      {/* 바닥 */}
      <Ground />
      
      {/* 파티클들 */}
      {particles.map((particle) => (
        <Particle 
          key={particle.id}
          position={particle.position} 
          radius={particle.radius}
        />
      ))}
    </>
  );
}