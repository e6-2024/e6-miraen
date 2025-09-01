import * as THREE from 'three';
import { useRef, useMemo, useEffect, useState } from 'react';
import { OpticalSurface, LensType } from '@/types/5-1-2/types';
import { calculateReflection, calculateLensRefraction } from '@/utils/5-1-2/utils';

interface RayProps {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  length?: number;
  color?: string;
  reflectSurfaces?: OpticalSurface[];
  depth?: number;
  maxDepth?: number;
  isInsideLens?: boolean;
}

export function Ray({
  origin,
  direction,
  length = 55,
  color = 'red',
  reflectSurfaces = [],
  depth = 0,
  maxDepth = 3,
  isInsideLens = false
}: RayProps) {
  const [nextRay, setNextRay] = useState<React.ReactNode>(null);

  const { start, normalizedDir } = useMemo(() => ({
    start: origin.clone(),
    normalizedDir: direction.clone().normalize()
  }), [origin, direction]);

  const { end, intersectionData } = useMemo(() => {
    const tempEnd = start.clone().add(normalizedDir.clone().multiplyScalar(length));
    const ray = new THREE.Ray(start.clone(), normalizedDir.clone());

    let closestIntersection = null;
    let closestDistance = Infinity;
    let intersectionSurface = null;

    // 가장 가까운 교점 찾기
    for (const surface of reflectSurfaces) {
      const denominator = surface.normal.dot(ray.direction);
      if (Math.abs(denominator) < 0.000001) continue;

      const t = surface.normal.dot(surface.position.clone().sub(ray.origin)) / denominator;
      if (t > 0 && t < length && t < closestDistance) {
        closestDistance = t;
        closestIntersection = ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));
        intersectionSurface = surface;
      }
    }

    return {
      end: closestIntersection || tempEnd,
      intersectionData: closestIntersection ? {
        point: closestIntersection,
        surface: intersectionSurface!,
        distance: closestDistance
      } : null
    };
  }, [start, normalizedDir, length, reflectSurfaces]);

  const { position, lengthBetween, quaternion } = useMemo(() => {
    const pos = start.clone().add(end).multiplyScalar(0.5);
    const len = start.distanceTo(end);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      end.clone().sub(start).normalize()
    );
    return { position: pos, lengthBetween: len, quaternion: quat };
  }, [start, end]);

  useEffect(() => {
    if (!intersectionData || depth >= maxDepth) {
      setNextRay(null);
      return;
    }

    const { point, surface } = intersectionData;
    let newDirection: THREE.Vector3;
    let newIsInsideLens = isInsideLens;

    if (surface.type === 'mirror') {
      newDirection = calculateReflection(normalizedDir, surface.normal);
    } else if (surface.type === 'lens') {
      if (surface.surface && surface.lensType) {
        // 렌즈 표면별 굴절 계산
        newDirection = calculateLensRefraction(point, surface.lensType, surface.surface);
        newIsInsideLens = surface.surface === 'entrance';
      } else {
        // 단순 굴절 처리
        const focalLength = 1;
        const offsetY = point.y - 5.0;
        const offsetZ = point.z;
        const sign = surface.lensType === 'convex' ? -1 : 1;
        
        newDirection = new THREE.Vector3(
          1,
          sign * offsetY / focalLength,
          sign * offsetZ / focalLength
        ).normalize();
      }
    } else {
      newDirection = normalizedDir.clone();
    }

    setNextRay(
      <Ray
        origin={point}
        direction={newDirection}
        length={length - intersectionData.distance}
        color={color}
        reflectSurfaces={reflectSurfaces}
        depth={depth + 1}
        maxDepth={maxDepth}
        isInsideLens={newIsInsideLens}
      />
    );
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