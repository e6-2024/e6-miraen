import { useRef, useEffect } from 'react';
import { InstancedMesh, Object3D } from 'three';

interface Particle {
  id: string;
  position: [number, number, number];
  radius: number;
}

interface Props {
  particles: Particle[];
}

export default function InstancedParticleSystem({ particles }: Props) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useRef(new Object3D());

  useEffect(() => {
    if (!meshRef.current) return;
    particles.forEach((p, i) => {
      dummy.current.position.set(...p.position);
      const s = p.radius * 2;
      dummy.current.scale.set(s, s, s);
      dummy.current.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.current.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [particles]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color={'limegreen'} />
    </instancedMesh>
  );
}
