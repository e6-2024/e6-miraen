import { Ray } from '@/components/5-1-2/Ray';
import { Lens } from '@/components/5-1-2/Lens';
import * as THREE from 'three';
import { useMemo } from 'react';
import { Reflector } from '@react-three/drei';
import { OpticalMode, LensType, RayStates, OpticalSurface } from '@/types/5-1-2/types';
import { getRayOrigins } from '@/utils/5-1-2/utils';

interface OpticalLabProps {
  mode: OpticalMode;
  lensType?: LensType;
  rayStates: RayStates;
  laserAngle?: number;
}

export function OpticalLab({
  mode,
  lensType = 'convex',
  rayStates,
  laserAngle = 45
}: OpticalLabProps) {
  // Ray 시작점
  const rayOrigins = useMemo(() => getRayOrigins(mode), [mode]);

  // 반사용 방향 벡터
  const rayDirection = useMemo(() => {
    const angleRad = (laserAngle * Math.PI) / 180;
    return new THREE.Vector3(Math.cos(angleRad), 0, Math.sin(angleRad)).normalize();
  }, [laserAngle]);

  // 반사/굴절 표면 정의
  const reflectSurfaces = useMemo<OpticalSurface[]>(() => {
    if (mode === 'reflection') {
      return [{
        position: new THREE.Vector3(0, 0, 0),
        normal: new THREE.Vector3(-1, 0, 0),
        type: 'mirror'
      }];
    } 
    
    if (mode === 'refraction') {
      return [
        {
          position: new THREE.Vector3(-3.4, 1, 2),
          normal: new THREE.Vector3(-1, 0, 0),
          type: 'lens',
          refractiveIndex: 1.5,
          lensType,
          surface: 'entrance'
        },
        {
          position: new THREE.Vector3(-3 + 0.3, 1, 2),
          normal: new THREE.Vector3(1, 0, 0),
          type: 'lens',
          refractiveIndex: 1.0,
          lensType,
          surface: 'exit'
        }
      ];
    }
    
    return [];
  }, [mode, lensType]);

  const renderRays = () => {
    const direction = mode === 'reflection' ? rayDirection : new THREE.Vector3(1, 0, 0);
    
    return rayOrigins.map((origin, index) => 
      rayStates[index] && (
        <Ray
          key={`${mode}-${index}`}
          origin={origin}
          direction={direction}
          reflectSurfaces={reflectSurfaces}
          color="red"
        />
      )
    );
  };

  return (
    <>
      {renderRays()}
      
      {/* 반사 모드: 거울 */}
      {mode === 'reflection' && (
        <>
          <Reflector
            resolution={2048}
            args={[10, 30]}
            mirror={0.9}
            mixStrength={0.5}
            rotation={[Math.PI / 2, 3*Math.PI / 2, 0]} 
            position={[0, 5, 2]}
          >
            {(Material: React.ElementType, props) => (
              <Material
                color="white"
                metalness={0.8}
                roughness={0.2}
                side={THREE.DoubleSide}
                {...props}
              />
            )}
          </Reflector>
          <mesh position={[0.13, 5, 2.0]}>
            <boxGeometry args={[0.2, 10, 30]} />
            <meshStandardMaterial color="gray" />
          </mesh>
        </>
      )}

      {/* 굴절 모드: 렌즈 */}
      {mode === 'refraction' && (
        <Lens 
          position={new THREE.Vector3(-3, 0.6, -0.5)} 
          type={lensType}
        />
      )}
    </>
  );
}