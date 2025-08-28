import { useGLTF } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { LaserPointerProps } from '@/types/5-1-2/types';
import { getLaserPointerRotation } from '@/utils/5-1-2/utils';

export function LaserPointer({ 
  position, 
  angle, 
  visible, 
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onToggle,
  rayStates = [false, false, false],
  pivotOffset = [0, 0, 3],
  mode
}: LaserPointerProps) {
  const { scene } = useGLTF('models/5-1-2/laser.glb');
  const pivotGroupRef = useRef<THREE.Group>(null);
  const modelGroupRef = useRef<THREE.Group>(null);
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);

  // 버튼 인덱스 매핑
  const getButtonIndex = (objectName: string): number | null => {
    const buttonMap: Record<string, number> = {
      '_holes_laser_pointer001': 2,
      '_holes_laser_pointer002': 0,
      '_holes_laser_pointer003': 1
    };
    return buttonMap[objectName] ?? null;
  };

  // 레이저 포인터 본체 확인
  const isLaserBody = (clickedObject: THREE.Object3D): boolean => {
    const laserBody = scene.getObjectByName('_holes_laser_pointer');
    const buttonIndex = getButtonIndex(clickedObject.name);
    const isButton = buttonIndex !== null;
    const isBody = clickedObject === laserBody || 
                   (laserBody?.children.includes(clickedObject)) ||
                   clickedObject.name === '_holes_laser_pointer';
    
    return !isButton && isBody;
  };

  useEffect(() => {
    if (pivotGroupRef.current && mode) {
      const rotation = getLaserPointerRotation(mode, angle);
      pivotGroupRef.current.rotation.set(...rotation);
    }

    // 그림자 및 재질 설정
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          if (material instanceof THREE.MeshStandardMaterial) {
            material.shadowSide = THREE.DoubleSide;
            material.metalness = 0.3;
            material.roughness = 0.4;
          }
        });
      }
    });
  }, [angle, scene, mode]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    const buttonIndex = getButtonIndex(e.object.name);
    if (buttonIndex !== null) {
      e.stopPropagation();
      onToggle?.(buttonIndex);
    }
  };

  const handlePointerEvents = (
    e: ThreeEvent<PointerEvent>, 
    eventType: 'over' | 'out' | 'down' | 'move' | 'up'
  ) => {
    const buttonIndex = getButtonIndex(e.object.name);
    
    if (buttonIndex !== null) {
      e.stopPropagation();
      if (eventType === 'over') setHoveredButton(buttonIndex);
      if (eventType === 'out') setHoveredButton(null);
    } else if (isLaserBody(e.object)) {
      const handlers = { 
        down: onPointerDown, 
        move: onPointerMove, 
        up: onPointerUp 
      };
      handlers[eventType as keyof typeof handlers]?.(e);
    }
  };

  if (!visible) return null;

  return (
    <group
      ref={pivotGroupRef}
      position={position}
      scale={0.1}
      castShadow
      receiveShadow
    >
      <group 
        ref={modelGroupRef}
        position={[-pivotOffset[0], -pivotOffset[1], -pivotOffset[2]]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={(e) => handlePointerEvents(e, 'over')}
        onPointerOut={(e) => handlePointerEvents(e, 'out')}
        onPointerDown={(e) => handlePointerEvents(e, 'down')}
        onPointerMove={(e) => handlePointerEvents(e, 'move')}
        onPointerUp={(e) => handlePointerEvents(e, 'up')}
      >
        <primitive object={scene.clone()} />
      </group>
    </group>
  );
}