import { EffectComposer, Bloom } from '@react-three/postprocessing';

interface PostEffectsProps {
  bloomIntensity?: number;
  luminanceThreshold?: number;
  luminanceSmoothing?: number;
  mipmapBlur?: boolean;
}

export default function PostEffects({
  bloomIntensity = 0.5,
  luminanceThreshold = 0.0,
  luminanceSmoothing = 0.0,
  mipmapBlur = true
}: PostEffectsProps) {
  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={luminanceThreshold}
        luminanceSmoothing={luminanceSmoothing}
        mipmapBlur={mipmapBlur}
      />
    </EffectComposer>
  );
}
