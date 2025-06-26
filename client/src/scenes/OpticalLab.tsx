import { Ray } from '../components/5-1-2/Ray';
import { LensConvex } from '../components/5-1-2/LensConvex';
import { LensConcave } from '../components/5-1-2/LensConcave';
import * as THREE from 'three';
import { useMemo } from 'react';
import { Reflector } from '@react-three/drei';
import Model from '@/components/5-1-2/Model'

interface OpticalLabProps {
  mode: 'direct' | 'reflection' | 'refraction';
  lensType?: 'convex' | 'concave';
  rayVisible?: boolean;
}

export function OpticalLab({
  mode,
  lensType = 'convex',
  rayVisible = true,
}: OpticalLabProps) {
  const mirrorPosition = new THREE.Vector3(1, 0, 0);
  const mirrorRotation = new THREE.Euler(Math.PI / 2, Math.PI / 2, 0);

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

  const rayOrigins = useMemo(() => {
    const angleRad = (45 * Math.PI) / 180;
    const baseZ = -3 * Math.tan(angleRad);
    
    return [
      new THREE.Vector3(-2, 0.5, baseZ), 
      new THREE.Vector3(-2, 0, baseZ),
      new THREE.Vector3(-2, -0.5, baseZ),
    ];
  }, []);

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
      {mode === 'direct' && rayVisible && (
        <>
              <Ray
                origin={new THREE.Vector3(-5, 0, 0.3)}
                direction={new THREE.Vector3(1, 0, 0)}
                reflectSurfaces={reflectSurfaces}
                color="red"
              />
              <Ray
                origin={new THREE.Vector3(-5, 0.5, 0.3)}
                direction={new THREE.Vector3(1, 0, 0)}
                reflectSurfaces={reflectSurfaces}
                color="red"
              />
              <Ray
                origin={new THREE.Vector3(-5, -0.5, 0.3)}
                direction={new THREE.Vector3(1, 0, 0)}
                reflectSurfaces={reflectSurfaces}
                color="red"
              />
            </>
      )}

      {mode === 'reflection' && (
        <>
          {rayVisible && (
            <>
              {rayOrigins.map((origin, index) => (
                <Ray
                  key={index}
                  origin={origin}
                  direction={rayDirection}
                  reflectSurfaces={reflectSurfaces}
                  color="red"
                  length={15}
                />
              ))}
            </>
          )}
          <Reflector
            resolution={2048}
            args={[5, 3]}
            mirror={0.9}
            mixStrength={0.5}
            mixBlur={0}
            blur={[0, 0]}
            rotation={[Math.PI / 2, 3*Math.PI / 2, 0]} 
            position={[1, 0, 0]}
          >
            {(Material: React.ElementType, props) => (
              <Material
                color="white"
                metalness={0.8}
                roughness={0.2}
                {...props}
              />
            )}
          </Reflector>

        </>
      )}

      {/* 굴절 모드 */}
      {mode === 'refraction' && (
        <>
          {rayVisible && (
            <>
              <Ray
                origin={new THREE.Vector3(-5, 0, 0.3)}
                direction={new THREE.Vector3(1, 0, 0)}
                reflectSurfaces={reflectSurfaces}
                color="red"
              />
              <Ray
                origin={new THREE.Vector3(-5, 0.5, 0.3)}
                direction={new THREE.Vector3(1, 0, 0)}
                reflectSurfaces={reflectSurfaces}
                color="red"
              />
              <Ray
                origin={new THREE.Vector3(-5, -0.5, 0.3)}
                direction={new THREE.Vector3(1, 0, 0)}
                reflectSurfaces={reflectSurfaces}
                color="red"
              />
            </>
          )}

          {/* 렌즈 */}
          {lensType === 'convex' && <LensConvex position={lensPosition} />}
          {lensType === 'concave' && <LensConcave position={lensPosition} />}
        </>
      )}
    </>
  );
}