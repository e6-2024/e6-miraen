import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';

type LensConcaveProps = {
  position: THREE.Vector3;
  radius?: number;
  height?: number;
  thickness?: number;
  scale?: number;
  scale2?: number;
  positionOffset?: [number, number, number];
};

export function LensConcave({
  position,
  scale = 1.0,
  scale2 = 1.0,
  positionOffset =  [0, -0.93, 0],
}: LensConcaveProps) {
  const { scene } = useGLTF('/models/5-1-2/Concave_lens.glb');
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
          child.castShadow = true;
          child.receiveShadow = true;
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