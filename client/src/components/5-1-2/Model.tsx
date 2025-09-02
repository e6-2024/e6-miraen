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

  useEffect(() => {
    const table = scene.getObjectByName('Sketchfab_model')
    const pSphere1= scene.getObjectByName('pSphere1');
    const paper = scene.getObjectByName('Plane');
    const frame = scene.getObjectByName('Object_10');

    if(pSphere1){
      scene.remove(pSphere1)
    }

    if (frame) {
      frame.visible = mode === 'reflection';
      frame.position.set(-0.0, -0.0, 0);
    }

    if (table) {
      table.scale.set(0.75,1.1,1.1);
      table.position.set(-12, -35.3, 0);
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