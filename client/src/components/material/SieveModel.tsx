import { useRef, useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import { Group } from 'three';

interface SieveModelProps {
  selectedLevel: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  showColliders?: boolean;
}

type Hole = {
  position: [number, number, number];
  radius: number;
};

const holeDataByLevel: Record<number, Hole[]> = {
  0: [
    { position: [0, 0, 0.4], radius: 0.43 },
    { position: [0.03, 0, -0.6], radius: 0.43 },
    { position: [0.67, 0, -0.15], radius: 0.43 },
    { position: [-0.67, 0, -0.15], radius: 0.43},

    { position: [-0.7, 0, 0.5], radius: 0.2 },
    { position: [-0.7, 0, -0.75], radius: 0.3 },
    { position: [0.7, 0, -0.8], radius: 0.2 },
    { position: [0.7, 0, 0.5], radius: 0.3 },

    { position: [0, 0, 1.4], radius: 0.43 },
    { position: [-1.2, 0, -1.2], radius: 0.43 },
    { position: [-1.5, 0, 0], radius: 0.43 },
    { position: [-1.2, 0, 0.9], radius: 0.43 },
    { position: [0, 0, -1.5], radius: 0.43 },
    { position: [1.2, 0, -1.2], radius: 0.43 },
    { position: [1.6, 0, -0.2], radius: 0.43 },
    { position: [1.2, 0, 1.1], radius: 0.43 },
    
    { position: [0, 0, 2.4], radius: 0.45 },
    { position: [1.1, 0, 2.2], radius: 0.45 },
    { position: [1.9, 0, 1.7], radius: 0.45 },
    { position: [2.3, 0, 0.8], radius: 0.45 },
    { position: [2.5, 0, -0.1], radius: 0.45 },
    { position: [2.3, 0, -1.1], radius: 0.45 },
    { position: [1.7, 0, -1.7], radius: 0.45 },
    { position: [0.9, 0, -2.2], radius: 0.45 },
    { position: [0, 0, -2.4], radius: 0.45 },
    { position: [-0.9, 0, -2.2], radius: 0.45 },
    { position: [-1.7, 0, -1.9], radius: 0.45 },
    { position: [-2.3, 0, -1.1], radius: 0.45 },
    { position: [-2.4, 0, 0], radius: 0.45 },
    { position: [-2.2, 0, 0.8], radius: 0.45 },
    { position: [-1.9, 0, 1.6], radius: 0.45 },
    { position: [-0.9, 0, 2.2], radius: 0.45 },
  ],
  1: [], // 막힘
  2: [
    { position: [0, 0, 0], radius: 0.21 },
    { position: [0, 0, 0.75], radius: 0.21 },
    { position: [0, 0, 1.5], radius: 0.21 },
    { position: [0, 0, -0.75], radius: 0.21 },
    { position: [0, 0, -1.5], radius: 0.21 },
    { position: [0.75, 0, 0], radius: 0.21 },
    { position: [1.5, 0, 0], radius: 0.21 },
    { position: [-0.75, 0, 0], radius: 0.212 },
    { position: [-1.5, 0, 0], radius: 0.212 },
    { position: [0.75, 0, 0.75], radius: 0.212 },
    { position: [0.75, 0, 1.5], radius: 0.212 },
    { position: [1.5, 0, 1.5], radius: 0.212 },
    { position: [1.5, 0, 0.75], radius: 0.212 },
    { position: [-0.75, 0, 0.75], radius: 0.21 },
    { position: [-0.75, 0, 1.5], radius: 0.21 },
    { position: [-1.5, 0, 1.5], radius: 0.21 },
    { position: [-1.5, 0, 0.75], radius: 0.21 },
    { position: [-0.75, 0, -0.75], radius: 0.21 },
    { position: [-0.75, 0, -1.5], radius: 0.21 },
    { position: [-1.5, 0, -1.5], radius: 0.21 },
    { position: [-1.5, 0, -0.75], radius: 0.21 },
    { position: [0.75, 0, -0.75], radius: 0.21 },
    { position: [0.75, 0, -1.5], radius: 0.21 },
    { position: [1.5, 0, -1.5], radius: 0.21 },
    { position: [1.5, 0, -0.75], radius: 0.21 },
    { position: [2.25, 0, -0.75], radius: 0.21 },
    { position: [2.25, 0, 0], radius: 0.21 },
    { position: [2.25, 0, 0.75], radius: 0.21 },
    { position: [2.25, 0, 1.5], radius: 0.21 },
    { position: [2.25, 0, -1.5], radius: 0.2 },
    { position: [-2.25, 0, -0.75], radius: 0.21 },
    { position: [-2.25, 0, 0], radius: 0.21 },
    { position: [-2.25, 0, 0.75], radius: 0.21 },
    { position: [-2.25, 0, 1.5], radius: 0.21 },
    { position: [-2.25, 0, -1.5], radius: 0.2 },
  ],
};

// 개별 충돌 셀 컴포넌트 - 위치만 받고 회전은 상위에서 처리
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
    args: [0.3 * 0.95, 0.05, 0.3 * 0.95],
    position: position,
    friction: 0.1,
  }), ref);
  
  // 충돌체 시각화
  if (showColliders) {
    return (
      <mesh ref={ref} position={position}>
        <boxGeometry args={[0.3 * 0.95, 0.05, 0.3 * 0.95]} />
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

// 체의 물리 구조 생성 컴포넌트
function SievePhysics({ 
  selectedLevel, 
  showColliders = false
}: { 
  selectedLevel: number;
  showColliders?: boolean;
}) {
  const gridCells = useMemo(() => {
    const cells: { position: [number, number, number]; key: string }[] = [];
    const gridSize = 3.0;
    const spacing = 0.3;
    const holes = holeDataByLevel[selectedLevel];
    
    for (let x = -gridSize; x <= gridSize; x += spacing) {
      for (let z = -gridSize; z <= gridSize; z += spacing) {
        const pos: [number, number, number] = [x, -0.2, z];
        
        const isHole = holes.some(hole => {
          const dx = hole.position[0] - pos[0];
          const dz = hole.position[2] - pos[2];
          const distance = Math.sqrt(dx * dx + dz * dz);
          return distance < hole.radius;
        });
        
        if (!isHole) {
          cells.push({
            position: pos,
            key: `${x.toFixed(2)}-${z.toFixed(2)}`
          });
        }
      }
    }
    
    return cells;
  }, [selectedLevel]);

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
  showColliders = false
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

      {/* 물리 충돌체들 - 별도 그룹 없이 직접 배치 */}
      <SievePhysics 
        selectedLevel={selectedLevel} 
        showColliders={showColliders}
      />

      <CurvedWallCollider 
        showColliders={showColliders}
      />
    </>
  );
}