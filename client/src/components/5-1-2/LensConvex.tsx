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
  scale = 0.3,
  scale2 = 0.2,
  positionOffset =  [0, -0.93, 0],
}: LensConvexProps) {
  const { scene } = useGLTF('/models/Light/convex lens.gltf');
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
          const newMaterial = new THREE.MeshPhysicalMaterial({
            transparent: true,
            opacity: 0.94,
            transmission: 0.95,
            ior: 1.7,
            thickness: 0.9,
            roughness: 0.4,
            metalness: 0.1,
            clearcoat: 0.0,
            clearcoatRoughness: 0,
            color: new THREE.Color(0x000000),
            envMapIntensity: 0,
          });
          
          child.material = newMaterial;
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
      rotation={[0, Math.PI/2, 0]}
      position={adjustedPosition}
      scale={[scale2, scale, scale]}
    />
  );
}
