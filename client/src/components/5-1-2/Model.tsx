import { useGLTF } from '@react-three/drei';
import { GroupProps, ThreeEvent } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { OpticalMode, RayStates } from '@/types/5-1-2/types';

interface ModelProps extends GroupProps {
  onToggle?: (buttonIndex: number) => void;
  mode?: OpticalMode;
  rayStates?: RayStates;
  laserAngle?: number;
  onAngleChange?: (angle: number) => void;
}

export default function Model({
  onToggle,
  mode,
  rayStates = [false, false, false],
  laserAngle = 45,
  onAngleChange,
  ...props
}: ModelProps) {
  const { scene } = useGLTF('models/5-1-2/Other_equipment.glb');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialAngle, setInitialAngle] = useState(45);

  // 모드별 오브젝트 표시/숨김 처리
  useEffect(() => {
    const table = scene.getObjectByName('Table');
    const paper = scene.getObjectByName('Plane');
    const frame = scene.getObjectByName('Object_10');

    // 반사 모드에서만 거울 프레임 표시
    if (frame) {
      frame.visible = mode === 'reflection';
      frame.position.set(-1.0, -0.0, 0);
    }

    // 테이블과 종이 위치 설정
    if (table) {
      table.position.set(-1.0, -0.3, 0);
    }

    if (paper) {
      paper.position.set(0, -0.7, 0);
    }
  }, [scene, mode]);

  // 그림자 설정
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // 재질 설정 개선
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          if (material instanceof THREE.MeshStandardMaterial || 
              material instanceof THREE.MeshPhysicalMaterial ||
              material instanceof THREE.MeshLambertMaterial) {
            material.shadowSide = THREE.DoubleSide;
          }
        });
      }
    });
  }, [scene]);

  // 반사 모드에서 레이저 각도 드래그 이벤트 (필요시 사용)
  const handleLaserPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (mode !== 'reflection') return;

    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialAngle(laserAngle);
  };

  return (
    <primitive 
      object={scene} 
      position={[0, 0, 0]} 
      rotation={[0, Math.PI / 2, 0]} 
      scale={[1, 1, 1]} 
      {...props} 
    />
  );
}