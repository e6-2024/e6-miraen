// src/components/5-2-1/SieveModel.tsx
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import { useRef, useMemo } from 'react';

interface SieveModelProps {
  selectedLevel: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  showColliders?: boolean;
  enableFloorColliders?: boolean;
}

// 개별 충돌 셀 컴포넌트
function SolidCell({ 
  position, 
  showColliders = false
}: { 
  position: [number, number, number];
  showColliders?: boolean;
}) {
  const ref = useRef(null);
  const [, api] = useBox(() => ({
    type: 'Static',
    args: [0.12, 0.05, 0.12], // 작은 충돌체 크기
    position: position,
    friction: 0.1,
  }), ref);
  
  // 충돌체 시각화
  if (showColliders) {
    return (
      <mesh ref={ref} position={position}>
        <boxGeometry args={[0.12, 0.05, 0.12]} />
        <meshBasicMaterial color="red" transparent opacity={0.3} />
      </mesh>
    );
  }
  
  return <mesh ref={ref} />;
}

// 외벽 세그먼트 컴포넌트 - 상대 위치만 계산
function WallSegment({ 
  index, 
  segments, 
  radius, 
  height, 
  thickness,
  showColliders = false
}: { 
  index: number;
  segments: number;
  radius: number;
  height: number;
  thickness: number;
  showColliders?: boolean;
}) {
  const ref = useRef(null);
  const angle = (index / segments) * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  const [, api] = useBox(() => ({
    type: 'Static',
    args: [thickness, height, (2 * Math.PI * radius) / segments],
    position: [x, height / 2 - 0.25, z],
    rotation: [0, -angle, 0],
  }), ref);
  
  return (
    <mesh 
      ref={ref} 
      position={[x, height / 2 - 0.25, z]} 
      rotation={[0, -angle, 0]}
    >
      <boxGeometry args={[thickness, height, (2 * Math.PI * radius) / segments]} />
      <meshStandardMaterial 
        wireframe 
        color={showColliders ? "blue" : "white"} 
        transparent 
        opacity={showColliders ? 0.2 : 0.0} 
      />
    </mesh>
  );
}

// 외벽 컴포넌트
function CurvedWallCollider({ 
  showColliders = false
}: {
  showColliders?: boolean;
}) {
  const segments = 32;
  const radius = 2.85; // 이 값을 조정하여 실제 체 모델과 맞춤
  const height = 5;     // 높이도 필요시 조정
  const thickness = 0.15; // 벽 두께
  
  const indices = useMemo(() => Array.from({ length: segments }, (_, i) => i), []);
  
  return (
    <>
      {indices.map((index) => (
        <WallSegment 
          key={index} 
          index={index} 
          segments={segments} 
          radius={radius} 
          height={height} 
          thickness={thickness}
          showColliders={showColliders}
        />
      ))}
    </>
  );
}

// 체의 물리 구조 생성 컴포넌트 - 레벨에 따른 간단한 필터링
function SievePhysics({ 
  selectedLevel, 
  showColliders = false,
  enableFloorColliders = true
}: { 
  selectedLevel: number;
  showColliders?: boolean;
  enableFloorColliders?: boolean;
}) {
  const gridCells = useMemo(() => {
    if (!enableFloorColliders) {
      return [];
    }

    const cells: { position: [number, number, number]; key: string }[] = [];
    const gridSize = 3.0;
    const spacing = 0.15; // 촘촘한 격자

    // 레벨에 따른 처리
    if (selectedLevel === 0) {
      // 큰 체 - 구멍이 많음 (모든 파티클 통과)
      for (let x = -gridSize; x <= gridSize; x += spacing * 3) { // 성긴 격자
        for (let z = -gridSize; z <= gridSize; z += spacing * 3) {
          const pos: [number, number, number] = [x, -0.2, z];
          cells.push({
            position: pos,
            key: `${x.toFixed(2)}-${z.toFixed(2)}`
          });
        }
      }
    } else if (selectedLevel === 1) {
      // 작은 체 - 구멍 없음 (모든 파티클 막힘)
      for (let x = -gridSize; x <= gridSize; x += spacing) {
        for (let z = -gridSize; z <= gridSize; z += spacing) {
          const pos: [number, number, number] = [x, -0.2, z];
          cells.push({
            position: pos,
            key: `${x.toFixed(2)}-${z.toFixed(2)}`
          });
        }
      }
    } else if (selectedLevel === 2) {
      // 중간 체 - 작은 구멍들 (작은 파티클만 통과)
      for (let x = -gridSize; x <= gridSize; x += spacing * 1.8) { // 중간 밀도
        for (let z = -gridSize; z <= gridSize; z += spacing * 1.8) {
          const pos: [number, number, number] = [x, -0.2, z];
          cells.push({
            position: pos,
            key: `${x.toFixed(2)}-${z.toFixed(2)}`
          });
        }
      }
    }
    
    return cells;
  }, [selectedLevel, enableFloorColliders]);

  return (
    <>
      {gridCells.map((cell) => (
        <SolidCell 
          key={cell.key} 
          position={cell.position}
          showColliders={showColliders}
        />
      ))}
    </>
  );
}

export default function SieveModel({ 
  selectedLevel, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  showColliders = false,
  enableFloorColliders = true // 기본값을 true로 변경
}: SieveModelProps) {
  const { scene } = useGLTF('/models/material/Strainers.gltf');
  const mesh = scene.children[selectedLevel]?.clone();

  return (
    <>
      {/* 시각적 메시 */}
      {mesh && (
        <primitive 
          object={mesh} 
          position={[0, -0.68, 0]} 
          scale={0.22} 
        />
      )}

      {/* 물리 충돌체들 - 레벨에 따른 간단한 격자 밀도로 필터링 */}
      <SievePhysics 
        selectedLevel={selectedLevel} 
        showColliders={showColliders}
        enableFloorColliders={enableFloorColliders}
      />

      {/* 외벽은 항상 유지 */}
      <CurvedWallCollider 
        showColliders={showColliders}
      />
    </>
  );
}