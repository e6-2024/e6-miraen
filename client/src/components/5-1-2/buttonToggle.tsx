import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useState, useRef, useEffect } from 'react';

export function RayToggleButton({ onToggle }: { onToggle: () => void }) {
  const gltf = useGLTF('models/Light/Button.gltf');
  const buttonRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // 커서 포인터 전환
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered]);


  console.log(gltf.scene.children)

  return (
    <group
      ref={buttonRef}
      position={[0, 0, 3]}
      scale={0.5}
      onClick={(e) => {
        e.stopPropagation(); // 다른 클릭 막음
        onToggle();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}
