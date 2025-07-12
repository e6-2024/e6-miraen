// scenes/OpticalLab.tsx
import { Ray } from '../components/5-1-2/Ray';
import { LensConvex } from '../components/5-1-2/LensConvex';
import { LensConcave } from '../components/5-1-2/LensConcave';
import * as THREE from 'three';
import { useMemo } from 'react';
import { Reflector } from '@react-three/drei';

interface OpticalLabProps {
  mode: 'direct' | 'reflection' | 'refraction';
  lensType?: 'convex' | 'concave';
  rayStates: [boolean, boolean, boolean]; // 개별 Ray 상태 배열
}

export function OpticalLab({
  mode,
  lensType = 'convex',
  rayStates,
}: OpticalLabProps) {
  const mirrorPosition = new THREE.Vector3(1, 0, 0);

  const mirrorNormal = useMemo(() => {
    const normal = new THREE.Vector3(-1, 0, 0);
    return normal;
  }, []);

  const rayDirection = useMemo(() => {
    const angleRad = (45 * Math.PI) / 180;
    return new THREE.Vector3(
      Math.cos(angleRad),
      0,               
      Math.sin(angleRad)
    ).normalize();
  }, []);

  // 각 Ray의 시작점을 개별적으로 정의
  const rayOrigins = useMemo(() => {
    const angleRad = (45 * Math.PI) / 180;
    const baseZ = -3 * Math.tan(angleRad);
    
    return [
      new THREE.Vector3(-2, 0.5, baseZ),   // Ray 1
      new THREE.Vector3(-2, 0, baseZ),     // Ray 2  
      new THREE.Vector3(-2, -0.5, baseZ),  // Ray 3
    ];
  }, []);

  // 직진 모드의 Ray 시작점
  const directRayOrigins = useMemo(() => [
    new THREE.Vector3(-5, 0.5, 0.3),   // Ray 1
    new THREE.Vector3(-5, 0, 0.3),     // Ray 2
    new THREE.Vector3(-5, -0.5, 0.3),  // Ray 3
  ], []);

  // 굴절 모드의 Ray 시작점  
  const refractionRayOrigins = useMemo(() => [
    new THREE.Vector3(-5, 0.5, 0.3),   // Ray 1
    new THREE.Vector3(-5, 0, 0.3),     // Ray 2
    new THREE.Vector3(-5, -0.5, 0.3),  // Ray 3
  ], []);

  const lensPosition = new THREE.Vector3(-3, 0, 0);

  const reflectSurfaces = useMemo(() => {
    if (mode === 'reflection') {
      return [
        {
          position: mirrorPosition,
          normal: mirrorNormal,
          type: 'mirror' as const,
        },
      ];
    } else if (mode === 'refraction') {
      return [
        {
          position: lensPosition,
          normal: new THREE.Vector3(-1, 0, 0),
          type: 'lens' as const,
          refractiveIndex: 1.5,
          lensType: lensType,
        },
      ];
    }
    return [];
  }, [mode, mirrorPosition, mirrorNormal, lensPosition, lensType]);

  return (
    <>
      {/* 직진 모드 */}
      {mode === 'direct' && (
        <>
          {directRayOrigins.map((origin, index) => 
            rayStates[index] && (
              <Ray
                key={`direct-${index}`}
                origin={origin}
                direction={new THREE.Vector3(1, 0, 0)}
                reflectSurfaces={reflectSurfaces}
                color="red"
              />
            )
          )}
        </>
      )}

      {/* 반사 모드 */}
      {mode === 'reflection' && (
        <>
          {rayOrigins.map((origin, index) => 
            rayStates[index] && (
              <Ray
                key={`reflection-${index}`}
                origin={origin}
                direction={rayDirection}
                reflectSurfaces={reflectSurfaces}
                color="red"
                length={15}
              />
            )
          )}
          
          {/* 거울 */}
          <Reflector
            resolution={2048}
            args={[10, 10]}
            mirror={0.9}
            mixStrength={0.5}
            mixBlur={0}
            blur={[0, 0]}
            rotation={[Math.PI / 2, 3*Math.PI / 2, 0]} 
            position={[0, 0, 0]}
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
        </>
      )}

      {/* 굴절 모드 */}
      {mode === 'refraction' && (
        <>
          {refractionRayOrigins.map((origin, index) => 
            rayStates[index] && (
              <Ray
                key={`refraction-${index}`}
                origin={origin}
                direction={new THREE.Vector3(1, 0, 0)}
                reflectSurfaces={reflectSurfaces}
                color="red"
              />
            )
          )}

          {/* 렌즈 */}
          {lensType === 'convex' && <LensConvex position={lensPosition} />}
          {lensType === 'concave' && <LensConcave position={lensPosition} />}
        </>
      )}
    </>
  );
}