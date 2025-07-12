import * as THREE from 'three';
import { useRef, useMemo, useEffect, useState } from 'react';

type RayProps = {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  length?: number;
  color?: string;
  reflectSurfaces?: {
    position: THREE.Vector3;
    normal: THREE.Vector3;
    type: 'mirror' | 'lens';
    refractiveIndex?: number;
    lensType?: 'convex' | 'concave';
    surface?: 'entrance' | 'exit';
  }[];
  depth?: number;
  maxDepth?: number;
  mirrorRotation?: THREE.Euler;
  isInsideLens?: boolean;
};

export function Ray({
  origin,
  direction,
  length = 10,
  color = 'red',
  reflectSurfaces = [],
  depth = 0,
  maxDepth = 3,
  mirrorRotation,
  isInsideLens = false
}: RayProps) {
  const [nextRay, setNextRay] = useState<React.ReactNode>(null);

  const start = useMemo(() => origin.clone(), [origin]);
  const normalizedDir = useMemo(() => direction.clone().normalize(), [direction]);

  const { end, intersectionData } = useMemo(() => {
    const tempEnd = start.clone().add(normalizedDir.clone().multiplyScalar(length));
    const ray = new THREE.Ray(start.clone(), normalizedDir.clone());

    let closestIntersection = null;
    let closestDistance = Infinity;
    let intersectionNormal = null;
    let intersectionType = null;
    let refractiveIndex = null;
    let surfaceLensType = null;
    let surfacePosition = null;
    let surfaceType = null;

    for (const surface of reflectSurfaces) {
      const planeNormal = surface.normal.clone();
      const planePoint = surface.position.clone();
      const denominator = planeNormal.dot(ray.direction);

      if (Math.abs(denominator) < 0.000001) continue;

      const t = planeNormal.dot(planePoint.clone().sub(ray.origin)) / denominator;

      if (t > 0 && t < length && t < closestDistance) {
        closestDistance = t;
        closestIntersection = ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));
        intersectionNormal = planeNormal;
        intersectionType = surface.type;
        refractiveIndex = surface.refractiveIndex;
        surfaceLensType = surface.lensType;
        surfacePosition = surface.position.clone();
        surfaceType = surface.surface;
      }
    }

    if (closestIntersection) {
      return {
        end: closestIntersection,
        intersectionData: {
          point: closestIntersection,
          normal: intersectionNormal,
          type: intersectionType,
          distance: closestDistance,
          refractiveIndex: refractiveIndex,
          lensType: surfaceLensType,
          surfacePosition: surfacePosition,
          surface: surfaceType
        },
      };
    }

    return { end: tempEnd, intersectionData: null };
  }, [start, normalizedDir, length, reflectSurfaces]);

  const position = useMemo(() => start.clone().add(end).multiplyScalar(0.5), [start, end]);
  const lengthBetween = useMemo(() => start.distanceTo(end), [start, end]);
  const quaternion = useMemo(() => {
    const dir = end.clone().sub(start).normalize();
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir
    );
  }, [start, end]);

  useEffect(() => {
    if (intersectionData && depth < maxDepth) {
      let newDirection;
      let newIsInsideLens = isInsideLens;

      if (intersectionData.type === 'mirror') {
        newDirection = normalizedDir
          .clone()
          .sub(intersectionData.normal.clone().multiplyScalar(2 * normalizedDir.dot(intersectionData.normal)));
      } else if (intersectionData.type === 'lens' && intersectionData.refractiveIndex) {
        
        if (intersectionData.surface === 'entrance') {
          // 입사면: 공기 → 렌즈
          if (intersectionData.lensType === 'convex') {
            const offsetY = intersectionData.point.y - 5.0;
            const offsetZ = intersectionData.point.z;
            const focalLength = 12; // 입사면에서는 약간 완만하게
            
            newDirection = new THREE.Vector3(
              1,
              -offsetY / focalLength,
              -offsetZ / focalLength
            ).normalize();
          } else if (intersectionData.lensType === 'concave') {
            const offsetY = intersectionData.point.y - 5.0;
            const offsetZ = intersectionData.point.z;
            const focalLength = 12;
            
            newDirection = new THREE.Vector3(
              1,
              offsetY / focalLength,
              offsetZ / focalLength
            ).normalize();
          }
          newIsInsideLens = true; // 렌즈 내부로 진입
          
        } else if (intersectionData.surface === 'exit') {
          // 출사면: 렌즈 → 공기
          if (intersectionData.lensType === 'convex') {
            const offsetY = intersectionData.point.y - 5.0;
            const offsetZ = intersectionData.point.z+0.6;
            const focalLength = 6; // 출사면에서 더 강하게 수렴
            
            newDirection = new THREE.Vector3(
              1,
              -offsetY / focalLength,
              -offsetZ / focalLength
            ).normalize();
          } else if (intersectionData.lensType === 'concave') {
            const offsetY = intersectionData.point.y - 5.0;
            const offsetZ = intersectionData.point.z+0.6;
            const focalLength = 6;
            
            newDirection = new THREE.Vector3(
              1,
              offsetY / focalLength,
              offsetZ / focalLength
            ).normalize();
          }
          newIsInsideLens = false; // 렌즈에서 나옴
          
        } else {
          // 기존 단일면 처리 (호환성)
          if (intersectionData.lensType === 'convex') {
            const offsetY = intersectionData.point.y - 5.0;
            const offsetZ = intersectionData.point.z-1.0;
            const focalLength = 1;
            
            newDirection = new THREE.Vector3(
              1,
              -offsetY / focalLength,
              -offsetZ / focalLength
            ).normalize();
          } else if (intersectionData.lensType === 'concave') {
            const focalLength = 1;
            const offsetY = intersectionData.point.y - 5.0;
            const offsetZ = intersectionData.point.z;
            
            newDirection = new THREE.Vector3(
              1,
              offsetY / focalLength,
              offsetZ / focalLength
            ).normalize();
          } else {
            // 스넬의 법칙 적용
            const n1 = isInsideLens ? 4.5 : 1.0;
            const n2 = isInsideLens ? 1.0 : 4.5;

            const normal = intersectionData.normal.clone();
            const cosI = -normal.dot(normalizedDir);
            
            if (cosI < 0) {
              normal.negate();
            }
            
            const n = cosI < 0 ? n2 / n1 : n1 / n2;
            const cosT2 = 1 - n * n * (1 - cosI * cosI);
            
            if (cosT2 < 0) {
              newDirection = normalizedDir
                .clone()
                .sub(normal.clone().multiplyScalar(2 * normalizedDir.dot(normal)));
            } else {
              newDirection = normalizedDir
                .clone()
                .multiplyScalar(n)
                .add(normal.clone().multiplyScalar(n * cosI - Math.sqrt(cosT2)));
            }
          }
        }
      } else {
        newDirection = normalizedDir.clone();
      }

      setNextRay(
        <Ray
          origin={intersectionData.point.clone()}
          direction={newDirection}
          length={length - intersectionData.distance}
          color={color}
          reflectSurfaces={reflectSurfaces}
          depth={depth + 1}
          maxDepth={maxDepth}
          isInsideLens={newIsInsideLens}
        />
      );
    }
  }, [intersectionData, depth, maxDepth, normalizedDir, length, color, reflectSurfaces, isInsideLens]);

  return (
    <>
      <mesh position={position} quaternion={quaternion}>
        <cylinderGeometry args={[0.01, 0.01, lengthBetween, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={5}
          toneMapped={false}
        />
      </mesh>
      {nextRay}
    </>
  );
}