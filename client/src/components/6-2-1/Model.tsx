import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  modelPath?: string;
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
  onSceneLoaded?: (scene: THREE.Group) => void;
}

function Model({ 
  modelPath = 'models/6-2-1/pole.glb',
  position = [0, 0.3, 0],
  scale = 1,
  rotation = [0, 0, 0],
  onSceneLoaded = null 
}: ModelProps) {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene && groupRef.current) {
      // 기존 children 제거
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }

      // 씬 복제
      const clonedScene = scene.clone();
      
      // 모든 메쉬에 그림자 속성 적용
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          
          // 그림자 투사 및 수신 활성화
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          
          // 재질이 있다면 업데이트
          if (mesh.material) {
            // 재질이 배열인 경우 각각 처리
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => {
                mat.needsUpdate = true;
              });
            } else {
              mesh.material.needsUpdate = true;
            }
          }
        }
      });

      // 그룹에 복제된 씬 추가
      groupRef.current.add(clonedScene);

      // 부모 컴포넌트에 로드 완료 알림
      if (onSceneLoaded) {
        onSceneLoaded(groupRef.current);
      }
    }
  }, [scene, onSceneLoaded]);

  return (
    <group 
      ref={groupRef}
      position={position}
      scale={scale}
      rotation={rotation}
    />
  );
}


export default Model;