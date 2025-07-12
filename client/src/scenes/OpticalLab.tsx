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
  rayStates: [boolean, boolean, boolean];
  laserAngle?: number; // 레이저 각도 추가
  rayOrigins?: THREE.Vector3[]; // 동적 Ray 시작점 추가
}

export function OpticalLab({
  mode,
  lensType = 'convex',
  rayStates,
  laserAngle = 45, // 기본값 45도
  rayOrigins = [], // 동적 Ray 시작점
}: OpticalLabProps) {
  const mirrorPosition = new THREE.Vector3(0, 0, 0);

  const mirrorNormal = useMemo(() => {
    const normal = new THREE.Vector3(-1, 0, 0);
    return normal;
  }, []);

  // 레이저 각도에 따른 방향 벡터 계산
  const rayDirection = useMemo(() => {
    const angleRad = (laserAngle * Math.PI) / 180;
    return new THREE.Vector3(
      Math.cos(angleRad),
      0,               
      Math.sin(angleRad)
    ).normalize();
  }, [laserAngle]);

  // 반사 모드의 Ray 시작점 - 레이저 포인터에서 전달받은 위치 사용
  const reflectionRayOrigins = useMemo(() => {
    // rayOrigins가 있으면 사용, 없으면 기본값
    if (rayOrigins.length >= 3) {
      return rayOrigins;
    }
    
    // 기본값 (기존 하드코딩된 위치)
    const laserPointerPos = new THREE.Vector3(-9, 1.2, -4.2);
    
    return [
      new THREE.Vector3(laserPointerPos.x, laserPointerPos.y + 0.6, laserPointerPos.z),   // Ray 1 (위쪽)
      new THREE.Vector3(laserPointerPos.x, laserPointerPos.y, laserPointerPos.z),          // Ray 2 (중간)
      new THREE.Vector3(laserPointerPos.x, laserPointerPos.y - 0.6, laserPointerPos.z),  // Ray 3 (아래쪽)
    ];
  }, [rayOrigins]);

  // 직진 모드의 Ray 시작점
  const directRayOrigins = useMemo(() => [
    new THREE.Vector3(-26, 1.95, -0.7),   // Ray 1
    new THREE.Vector3(-26, 1.2, -0.7),     // Ray 2
    new THREE.Vector3(-26, 0.45, -0.7),  // Ray 3
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
                length={35}
              />
            )
          )}
        </>
      )}

      {/* 반사 모드 - 이제 동적 Ray 위치 사용 */}
      {mode === 'reflection' && (
        <>
          {reflectionRayOrigins.map((origin, index) => 
            rayStates[index] && (
              <Ray
                key={`reflection-${index}`}
                origin={origin}
                direction={rayDirection}
                reflectSurfaces={reflectSurfaces}
                color="red"
                length={35}
              />
            )
          )}
          
          {/* 거울 */}
          <Reflector
            resolution={2048}
            args={[10, 30]}
            mirror={0.9}
            mixStrength={0.5}
            mixBlur={0}
            blur={[0, 0]}
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