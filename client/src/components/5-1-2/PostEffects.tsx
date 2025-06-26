import { EffectComposer, Bloom } from '@react-three/postprocessing';

export default function PostEffects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.0}
        luminanceSmoothing={0.0}
        mipmapBlur
      />
    </EffectComposer>
  );
}
