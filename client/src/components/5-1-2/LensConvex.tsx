import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';

type LensConvexProps = {
  position: THREE.Vector3;
  radius?: number;
  height?: number;
  thickness?: number;
  scale?: number;
  scale2?: number;
  positionOffset?: [number, number, number];
};

export function LensConvex({
  position,
  scale = 1.0,
  scale2 = 1.0,
  positionOffset =  [0, -0.93, 0],
}: LensConvexProps) {
  const { scene } = useGLTF('/models/5-1-2/Convex_lens.glb');
  const meshRef = useRef<THREE.Group>(null);
  
  const adjustedPosition = [
    position.x + positionOffset[0],
    position.y + positionOffset[1],
    position.z + positionOffset[2]
  ] as [number, number, number];
  
  useEffect(() => {
    if (meshRef.current && scene) {
      const clonedScene = scene.clone();
      
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material && child.material.name === 'Convex Lens.001') {
            
            const coloredMaterial = new THREE.MeshPhysicalMaterial({
              transparent: true,
              opacity: 0.96,
              transmission: 0.95,
              ior: 1.5,
              thickness: 1.0,
              roughness: 0.0,
              metalness: 0.0,
              clearcoat: 0.2,
              clearcoatRoughness: 0.0,
              color: new THREE.Color(0xffffff),
              envMapIntensity: 0.2,
            });
            coloredMaterial.color = new THREE.Color(0x009BF5);
            coloredMaterial.opacity =0.1;
          }
          
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      if (meshRef.current.children.length > 0) {
        meshRef.current.clear();
      }
      meshRef.current.add(clonedScene);
    }
  }, [scene]);
  
  return (
    <group 
      ref={meshRef}
      rotation={[0, 3*Math.PI/2, 0]}
      position={adjustedPosition}
      scale={[scale2, scale, scale]}
    />
  );
}