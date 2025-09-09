import React, { useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { SunPosition } from '@/types/6-2-1/types';

// 태양 조명 컴포넌트
interface SunLightProps {
  sunPosition: SunPosition;
}

export function SunLight({ sunPosition }: SunLightProps) {
  return (
    <directionalLight
      position={[sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ]}
      intensity={2}
      color='#FFFFFF'
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-camera-far={50}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
      shadow-camera-near={0.1}
      shadow-bias={-0.0005}
    />
  );
}

// 나침반 표시 컴포넌트
export function CompassBillboard() {
  const compassData = [
    { position: [0, 0.2, 8] as [number, number, number], text: '북', color: '#ff4444' },
    { position: [8, 0.2, 0] as [number, number, number], text: '동', color: '#44ff44' },
    { position: [0, 0.2, -8] as [number, number, number], text: '남', color: '#4444ff' },
    { position: [-8, 0.2, 0] as [number, number, number], text: '서', color: '#ffff44' },
  ];

  return (
    <>
      {compassData.map((compass, index) => (
        <Billboard key={index} position={compass.position}>
          <Text 
            font="/fonts/Maplestory Bold.ttf" 
            fontSize={0.7} 
            color={compass.color} 
            anchorX='center' 
            anchorY='middle'
          >
            {compass.text}
          </Text>
        </Billboard>
      ))}
    </>
  );
}

// 막대와 그림자 컴포넌트
export function PoleAndShadow() {
  return (
    <>
      {/* 그림자 평면 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.5} />
      </mesh>

      {/* 막대 */}
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.5, 32]} />
        <meshStandardMaterial color='black' envMapIntensity={0} />
      </mesh>
    </>
  );
}

// 각도선 컴포넌트
interface AngleLinesProps {
  azimuth: number;
  altitude: number;
  shadowLength: number;
  sunPosition: SunPosition;
  angleGroundLevel?: number;
}

export function AngleLines({ 
  azimuth, 
  altitude, 
  shadowLength, 
  sunPosition, 
  angleGroundLevel = 0 
}: AngleLinesProps) {
  const poleInfo = {
    height: 2.55,
    topPosition: [0, 2.55, 0] as const,
    radius: 0.1
  };

  const shadowEnd = useMemo(() => {
    const poleTop = new THREE.Vector3(...poleInfo.topPosition);
    const sunDir = new THREE.Vector3(sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ).normalize();
    const groundLevel = 0;
    const t = (poleTop.y - groundLevel) / sunDir.y;
    const shadowEndPoint = new THREE.Vector3(poleTop.x - sunDir.x * t, groundLevel, poleTop.z - sunDir.z * t);
    return [shadowEndPoint.x, shadowEndPoint.y, shadowEndPoint.z] as const;
  }, [sunPosition, poleInfo.topPosition]);

  const lineGeometry = useMemo(() => {
    const poleTop = new THREE.Vector3(...poleInfo.topPosition);
    const shadowEndVec = new THREE.Vector3(...shadowEnd);
    const sunPositionVec = new THREE.Vector3(sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ);

    const visualDistance = 30.0;
    const direction = sunPositionVec.clone().normalize();
    const visualSunPos = poleTop.clone().add(direction.multiplyScalar(visualDistance));

    const linePoints = [shadowEndVec, poleTop, visualSunPos];
    return new THREE.BufferGeometry().setFromPoints(linePoints);
  }, [shadowEnd, poleInfo.topPosition, sunPosition]);

  const angleArcGeometry = useMemo(() => {
    const poleTop = new THREE.Vector3(...poleInfo.topPosition);
    const shadowEndVec = new THREE.Vector3(...shadowEnd);
    const direction = poleTop.clone().sub(shadowEndVec).normalize();
    const t = (angleGroundLevel - shadowEndVec.y) / direction.y;
    const basePosition = shadowEndVec.clone().add(direction.multiplyScalar(t));

    const radius = 0.6;
    const segments = 20;
    const points = [];

    const sunDir = new THREE.Vector3(sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ).normalize();
    const horizontalDir = new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize();
    const angle = Math.asin(sunDir.y);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const currentAngle = angle * t;
      const direction = horizontalDir.clone();
      direction.y = Math.tan(currentAngle) * Math.sqrt(direction.x * direction.x + direction.z * direction.z);
      direction.normalize().multiplyScalar(radius);
      const point = basePosition.clone().add(direction);
      points.push(point);
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [shadowEnd, angleGroundLevel, sunPosition, poleInfo.topPosition]);

  const textPosition = useMemo(() => {
    const poleTop = new THREE.Vector3(...poleInfo.topPosition);
    const shadowEndVec = new THREE.Vector3(...shadowEnd);
    const direction = poleTop.clone().sub(shadowEndVec).normalize();
    const t = (angleGroundLevel - shadowEndVec.y) / direction.y;
    const basePosition = shadowEndVec.clone().add(direction.multiplyScalar(t));
    
    const sunDir = new THREE.Vector3(sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ).normalize();
    const horizontalDir = new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize();
    const angle = Math.asin(sunDir.y);
    
    const halfAngle = angle * 0.5;
    const textDirection = horizontalDir.clone();
    textDirection.y = Math.tan(halfAngle) * Math.sqrt(textDirection.x * textDirection.x + textDirection.z * textDirection.z);
    textDirection.normalize().multiplyScalar(1.7);
    
    const textPos = basePosition.clone().add(textDirection);
    return [textPos.x, textPos.y, textPos.z] as const;
  }, [shadowEnd, angleGroundLevel, sunPosition, poleInfo.topPosition]);

  return (
    <group>
      {/* 점선 */}
      <primitive object={new THREE.Line(lineGeometry)}>
        <lineDashedMaterial 
          color='#ffffff' 
          linewidth={60} 
          dashSize={0.1} 
          gapSize={0.04} 
          transparent 
          opacity={1} 
        />
      </primitive>

      {/* 각도 호 */}
      <primitive object={new THREE.Line(angleArcGeometry)}>
        <lineBasicMaterial color='#ffffff' linewidth={60} />
      </primitive>

      {/* 각도 텍스트 */}
      <Billboard position={textPosition}>
        <Text
          fontSize={0.3}
          color='#003366'
          anchorX='center'
          anchorY='middle'
          outlineWidth={0.006}
          outlineColor='#ffffff'
          font='/fonts/Maplestory Bold.ttf'
        >
          {altitude.toFixed(1)}°
        </Text>
      </Billboard>
    </group>
  );
}