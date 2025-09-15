// components/Flame.tsx
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FlameProps {
  position?: [number, number, number]
  opacity?: number
  scale?: number
  thermalMode?: boolean
}

export default function Flame({
  position = [0, 1.2, 0],
  opacity = 1,
  scale = 1,
  thermalMode = false,
}: FlameProps) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null)

  // opacity 변경 시
  useEffect(() => {
    if (matRef.current) {
      matRef.current.uniforms.opacity.value = opacity
    }
  }, [opacity])

  // thermalMode 변경 시 (float 0/1로 전달)
  useEffect(() => {
    if (matRef.current) {
      matRef.current.uniforms.thermalMode.value = thermalMode ? 1.0 : 0.0
      matRef.current.needsUpdate = true
    }
  }, [thermalMode])

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.time.value = clock.getElapsedTime()
      // 빠른 UI 변화 반영
      matRef.current.uniforms.opacity.value = opacity
    }
  })

  return (
    <mesh position={position} rotation={[0, -Math.PI / 4, 0]} scale={[0.1 * scale, 0.1 * scale, 0.1 * scale]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <shaderMaterial
        // 🔑 모드가 바뀌면 재초기화(컴파일)되도록 key 부여
        key={thermalMode ? 'flame-thermal' : 'flame-normal'}
        ref={matRef}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        uniforms={{
          time: { value: 0 },
          opacity: { value: opacity },
          thermalMode: { value: thermalMode ? 1.0 : 0.0 },
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}

const vertexShader = /* glsl */ `
precision mediump float;

uniform float time;
varying vec2 vUv;
varying float hValue;

// 2D Random
float random (in vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 2D Noise
float noise (in vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f*f*(3.0-2.0*f);

  return mix(a, b, u.x) +
         (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

void main() {
  vUv = uv;
  vec3 pos = position;

  pos *= vec3(0.8, 2.0, 0.725);
  hValue = (position.y + 0.5);
  float posXZlen = length(position.xz);

  // flame height
  pos.y *= 1.0 + (
    cos((posXZlen + 0.25) * 3.1415926) * 0.9 +
    noise(vec2(0.0, time)) * 0.125 +
    noise(vec2(position.x + time, position.z + time)) * 0.5
  ) * position.y;

  // trembling
  pos.x += noise(vec2(time * 2.0, (position.y - time) * 4.0)) * hValue * 0.0312;
  pos.z += noise(vec2((position.y - time) * 4.0, time * 2.0)) * hValue * 0.0312;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = /* glsl */ `
precision mediump float;

varying float hValue;
varying vec2 vUv;

uniform float opacity;
uniform float thermalMode; // 0.0 or 1.0
uniform float time;

vec3 heatmapGradient(float t) {
  // 불꽃/열감 그라데이션
  return clamp(
    (pow(t, 1.5) * 0.8 + 0.2) *
    vec3(smoothstep(0.0, 0.35, t) + t * 0.5,
         smoothstep(0.5, 1.0, t),
         max(1.0 - t * 1.7, t * 7.0 - 6.0)),
    0.0, 1.0
  );
}

void main() {
  float v = abs(smoothstep(0.0, 0.4, hValue) - 1.0);
  float a = (1.0 - v) * 0.9;
  a -= 1.0 - smoothstep(1.0, 0.98, hValue); // 상단 페이드

  // 🔁 열화상 모드: 무조건 순백색, 가시성 보장을 위해 알파 1.0
  if (thermalMode > 0.5) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    return;
  }

  // 일반 모드
  if (opacity < 0.01) discard;

  vec3 color = heatmapGradient(smoothstep(0.0, 0.3, hValue)) * vec3(0.95, 0.95, 0.4);
  color = mix(vec3(0.0, 0.0, 1.0), color, smoothstep(0.0, 0.3, hValue)); // 아래쪽 파랑 힌트
  color += vec3(1.0, 0.9, 0.5) * (1.05 - vUv.y);
  color = mix(color, vec3(0.66, 0.32, 0.03), smoothstep(0.95, 1.0, hValue)); // 끝 붉은빛
  a *= opacity * opacity;

  gl_FragColor = vec4(color, a);
}
`
