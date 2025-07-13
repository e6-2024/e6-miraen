// src/components/5-2-1/SieveModel.tsx
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';


interface SieveModelProps {
  selectedLevel: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  showColliders?: boolean;
  enableFloorColliders?: boolean;
}

function SolidFloor({ showColliders = false }: { showColliders?: boolean }) {
  const ref = useRef(null);
  
  useBox(() => ({
    type: 'Static',
    args: [30, 0.3, 30], // 큰 평면
    position: [0, -0.2, 0],
    friction: 0.1,
  }), ref);

  if (showColliders) {
    return (
      <mesh ref={ref} position={[0, -0.1, 0]}>
        <boxGeometry args={[9, 0.2, 9]} />
        <meshBasicMaterial color="blue" transparent opacity={0.3} />
      </mesh>
    );
  }

  return <mesh ref={ref} />;
}

function WallBox({
  args,
  position,
  color,
  showColliders,
}: {
  args: [number, number, number];
  position: [number, number, number];
  color: string;
  showColliders?: boolean;
}) {
  const ref = useRef(null);
  useBox(() => ({
    type: 'Static',
    args,
    position,
  }), ref);

  if (showColliders) {
    return (
      <mesh ref={ref} position={position}>
        <boxGeometry args={args} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    );
  }

  return <mesh ref={ref} />;
}


function SolidCell({ 
  position, 
  args = [0.08, 0.05, 0.08], // 조금 더 작게
  showColliders = false
}: { 
  position: [number, number, number];
  args?: [number, number, number];
  showColliders?: boolean;
}) {
  const ref = useRef(null);
  
  useBox(() => ({
    type: 'Static',
    args: args,
    position: position,
    friction: 0.1,
  }), ref);

  if (showColliders) {
    return (
      <mesh ref={ref} position={position}>
        <boxGeometry args={args} />
        <meshBasicMaterial color="red" transparent opacity={0.5} />
      </mesh>
    );
  }

  return <mesh ref={ref} />;
}

// 외벽 - 진짜 원형 벽
function CircularWall({ showColliders = false }: { showColliders?: boolean }) {
  const segments = 16; // 원을 16개 세그먼트로 분할
  const radius = 3.0;
  const height = 8;
  const thickness = 0.15;
  
  const wallSegments = useMemo(() => {
    const segments_array = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const segmentWidth = (2 * Math.PI * radius) / segments;
      
      segments_array.push({
        position: [x, height / 2 - 0.1, z] as [number, number, number],
        rotation: [0, -angle, 0] as [number, number, number],
        args: [thickness, height, segmentWidth] as [number, number, number]
      });
    }
    return segments_array;
  }, []);

  return (
    <>
      {wallSegments.map((segment, index) => (
        <WallSegment 
          key={`wall-${index}`}
          position={segment.position}
          rotation={segment.rotation}
          args={segment.args}
          showColliders={showColliders}
        />
      ))}
    </>
  );
}

// 개별 벽 세그먼트 컴포넌트
function WallSegment({ 
  position, 
  rotation, 
  args, 
  showColliders 
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  args: [number, number, number];
  showColliders: boolean;
}) {
  const ref = useRef(null);
  
  useBox(() => ({
    type: 'Static',
    args: args,
    position: position,
    rotation: rotation,
    friction: 0.1,
  }), ref);

  if (showColliders) {
    return (
      <mesh ref={ref} position={position} rotation={rotation}>
        <boxGeometry args={args} />
        <meshBasicMaterial color="green" transparent opacity={0.0} />
      </mesh>
    );
  }

  return <mesh ref={ref} />;
}

function SieveFloor({ selectedLevel, showColliders = false }: { selectedLevel: number; showColliders?: boolean }) {
  const cells = useMemo(() => {
    const result = [];
    const size = 2.5;
    
    
    if (selectedLevel === 0) {
      for (let x = -size; x <= size; x += 0.8) {
        for (let z = -size; z <= size; z += 0.8) {
          result.push([x, -0.2, z]);
        }
      }
    } else if (selectedLevel === 2) {
      for (let x = -size; x <= size; x += 0.4) {
        for (let z = -size; z <= size; z += 0.4) {
          result.push([x, -0.2, z]);
        }
      }
    }
    
    return result;
  }, [selectedLevel]);

  return (
    <>
      {selectedLevel === 1 && <SolidFloor showColliders={showColliders} />}
      
      {cells.map((pos, index) => (
        <SolidCell 
          key={`level-${selectedLevel}-cell-${index}`}
          position={pos as [number, number, number]}
          showColliders={showColliders}
        />
      ))}
    </>
  );
}

function GroundContainer({ showColliders = false }: { showColliders?: boolean }) {
  const wallThickness = 0.2;
  const containerSize = 16;
  const wallHeight = 2;
  const bottomY = -7;

  const walls = [
    {
      name: 'Bottom',
      args: [containerSize, wallThickness, containerSize] as [number, number, number],
      position: [0, bottomY, 0] as [number, number, number],
      color: 'orange',
    },
    {
      name: 'Left',
      args: [wallThickness, wallHeight, containerSize] as [number, number, number],
      position: [-(containerSize / 2), bottomY + wallHeight / 2, 0] as [number, number, number],
      color: 'red',
    },
    {
      name: 'Right',
      args: [wallThickness, wallHeight, containerSize] as [number, number, number],
      position: [containerSize / 2, bottomY + wallHeight / 2, 0] as [number, number, number],
      color: 'blue',
    },
    {
      name: 'Front',
      args: [containerSize, wallHeight, wallThickness] as [number, number, number],
      position: [0, bottomY + wallHeight / 2, containerSize / 2] as [number, number, number],
      color: 'green',
    },
    {
      name: 'Back',
      args: [containerSize, wallHeight, wallThickness] as [number, number, number],
      position: [0, bottomY + wallHeight / 2, -containerSize / 2] as [number, number, number],
      color: 'yellow',
    },
  ];

  return (
    <>
      {walls.map((wall, index) => (
        <WallBox
          key={index}
          args={wall.args}
          position={wall.position}
          color={wall.color}
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
  enableFloorColliders = true
}: SieveModelProps) {
  const { scene } = useGLTF('/models/5-2-1/Strainers.gltf');
  const mesh = scene.children[selectedLevel]?.clone();

  useEffect(() => {
    if (mesh) {
      mesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [mesh]);



  return (
    <>
      {mesh && (
        <primitive 
          object={mesh} 
          position={[0, -0.68, 0]} 
          scale={0.22} 
        />
      )}

      {enableFloorColliders && (
        <SieveFloor selectedLevel={selectedLevel} showColliders={showColliders} />
      )}
      <GroundContainer showColliders={showColliders} />

      <CircularWall showColliders={showColliders} />
    </>
  );
}