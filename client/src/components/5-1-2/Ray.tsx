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
  }[];
  depth?: number;
  maxDepth?: number;
  mirrorRotation?: THREE.Euler;
};

export function Ray({
  origin,
  direction,
  length = 10,
  color = 'red',
  reflectSurfaces = [],
  depth = 0,
  maxDepth = 3,
  mirrorRotation
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

    

    for (const surface of reflectSurfaces) {
      // 평면과의 교차점 계산
      const planeNormal = surface.normal.clone();
      const planePoint = surface.position.clone();
      const denominator = planeNormal.dot(ray.direction);

      if (Math.abs(denominator) < 0.000001) continue; // 평행한 경우 스킵

      const t = planeNormal.dot(planePoint.clone().sub(ray.origin)) / denominator;

      if (t > 0 && t < length && t < closestDistance) {
        closestDistance = t;
        closestIntersection = ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));
        intersectionNormal = planeNormal;
        intersectionType = surface.type;
        refractiveIndex = surface.refractiveIndex;
        surfaceLensType = surface.lensType;
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
          lensType: surfaceLensType
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
      new THREE.Vector3(0, 1, 0), // 기본 cylinder 방향
      dir
    );
  }, [start, end]);

  useEffect(() => {
    if (intersectionData && depth < maxDepth) {
      let newDirection;

      if (intersectionData.type === 'mirror') {
        // 반사 - 반사각 = 입사각
        newDirection = normalizedDir
          .clone()
          .sub(intersectionData.normal.clone().multiplyScalar(2 * normalizedDir.dot(intersectionData.normal)));
      } else if (intersectionData.type === 'lens' && intersectionData.refractiveIndex) {
        // 렌즈 타입에 따른 굴절 처리
        if (intersectionData.lensType === 'convex') {
          // 볼록 렌즈 - 광선이 중심을 향하도록 굴절
          const lensCenter = intersectionData.point.clone();
          lensCenter.x = intersectionData.point.x; // x좌표는 유지
          lensCenter.y = 0; // 렌즈의 중심 y좌표는 0
          lensCenter.z = 0; // 렌즈의 중심 z좌표는 0
          
          // 렌즈 중심으로부터의 거리 계산
          const distFromCenter = Math.sqrt(
            Math.pow(intersectionData.point.y, 2) + 
            Math.pow(intersectionData.point.z, 2)
          );
          
          // 중심에서 멀수록 더 많이 굴절시킴
          const convergeFactor = 0.15 * distFromCenter;
          
          // 초점 거리 (렌즈 중심으로부터 광선이 모이는 지점까지의 거리)
          const focalLength = 5;
          
          // 중심 방향으로의 벡터 계산
          const toCenterDir = new THREE.Vector3(
            1, // x 방향은 전진
            -intersectionData.point.y * (1/focalLength), // y축 방향으로 중심을 향하게
            -intersectionData.point.z * (1/focalLength)  // z축 방향으로 중심을 향하게
          ).normalize();
          
          newDirection = toCenterDir;
        } else if (intersectionData.lensType === 'concave') {
          // 오목 렌즈: 광선을 퍼지게 만들기
          const focalLength = 5; // 가상의 초점 거리 (조절 가능)
        
          // 렌즈의 중심 좌표 (x 방향 진행 기준, y/z는 0)
          const lensCenter = new THREE.Vector3(
            intersectionData.point.x,
            0,
            0
          );
        
          // 현재 광선 위치에서 중심까지 벡터
          const fromCenter = intersectionData.point.clone().sub(lensCenter);
        
          // 반대 방향 (즉, 퍼지는 방향)으로 설정
          const divergeDir = new THREE.Vector3(
            1, // x는 그대로 전진
            fromCenter.y / focalLength,  // y/z는 중심축에서 멀어질수록 더 퍼짐
            fromCenter.z / focalLength
          ).normalize();
        
          newDirection = divergeDir;
        }else {
          // 렌즈 타입이 정의되지 않은 경우 기본 굴절 적용
          const n1 = 1.0; // 공기의 굴절률
          const n2 = intersectionData.refractiveIndex; // 렌즈의 굴절률

          const normal = intersectionData.normal.clone();
          const cosI = -normal.dot(normalizedDir);
          
          // 입사 매질에서 출사 매질로 향하는 법선의 방향 조정
          if (cosI < 0) {
            normal.negate();
          }
          
          const n = cosI < 0 ? n2 / n1 : n1 / n2;
          const cosT2 = 1 - n * n * (1 - cosI * cosI);
          
          if (cosT2 < 0) {
            // 전반사 발생 (굴절 불가)
            newDirection = normalizedDir
              .clone()
              .sub(normal.clone().multiplyScalar(2 * normalizedDir.dot(normal)));
          } else {
            // 굴절
            newDirection = normalizedDir
              .clone()
              .multiplyScalar(n)
              .add(normal.clone().multiplyScalar(n * cosI - Math.sqrt(cosT2)));
          }
        }
      } else {
        // 미정의 타입이면 원래 방향 유지
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
        />
      );
    }
  }, [intersectionData, depth, maxDepth, normalizedDir, length, color, reflectSurfaces]);

  return (
    <>
      {/* 레이저 본체: Cylinder */}
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