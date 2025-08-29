import { useGLTF } from '@react-three/drei';
import { GroupProps, ThreeEvent } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { OpticalMode, RayStates } from '@/types/5-1-2/types';

export default function Background() {
  const { scene } = useGLTF('models/Anatomy/Plane.glb');
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
      position={[0, -13.5, 0]} 
      rotation={[0, 0, 0]} 
      scale={[20, 20, 20]} 
    />
  );
}