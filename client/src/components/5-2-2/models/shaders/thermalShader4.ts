export const thermalVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const thermalFragmentShader = `
  uniform float time;
  uniform float temperature;
  uniform float heatingTime;
  uniform vec3 baseColor;
  uniform vec3 centerPoint;
  uniform bool isHeating;

  uniform float bottomY;
  uniform float topY;
  uniform float heatProgress;

  uniform vec3 lightDir;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  vec3 thermalColor(float t) {
    if (t < 0.10) return vec3(0.0);

    if (t < 0.25) {
      float k = (t - 0.10) / 0.15;
      return mix(vec3(0.0), vec3(0.0, 0.0, 1.0), k);
    }
    if (t < 0.30) {
      float k = (t - 0.25) / 0.05;
      return mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0), k);
    }
    if (t < 0.45) {
      float k = (t - 0.30) / 0.15;
      return mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), k);
    }
    if (t < 0.60) {
      float k = (t - 0.45) / 0.15;
      return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.5, 0.0), k);
    }
    if (t < 0.8) {
      float k = (t - 0.60) / 0.15;
      return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.0, 0.0), k);
    }
    float k = (t - 0.75) / 0.25;
    return mix(vec3(1.0, 0.0, 0.0), vec3(1.0), k);
  }

  float noise(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  float multiNoise(vec2 p, float t){
    float n1 = noise(p * 8.0  + t * 0.5)  * 0.5;
    float n2 = noise(p * 16.0 - t * 0.3)  * 0.25;
    float n3 = noise(p * 32.0 + t * 0.7)  * 0.125;
    float n4 = noise(p * 64.0 - t * 0.2)  * 0.0625;
    return n1 + n2 + n3 + n4;
  }

  void main() {
    float baseNoise    = multiNoise(vUv, time) * 0.08;
    float heatNoise    = noise(vUv * 8.0 + time * 1.0) * 0.05;
    float spatialNoise = noise(vWorldPosition.xz * 2.0 + time * 0.3) * 0.06;

    float h = clamp((vWorldPosition.y - bottomY) / max(topY - bottomY, 1e-5), 0.0, 1.0);
    float baseTemp = 0.15;

    if (isHeating) {
      float p = clamp(heatProgress, 0.0, 1.0);
      
      // 가열 진행을 더 느리게 (지수 곡선 사용)
      float slowP = pow(p, 1.7);
      
      // 가열 높이를 더 천천히 올라가게
      float headY = mix(bottomY, topY, min(slowP * 0.5, 1.0));
      
      // 가열 밴드 폭을 좀 더 넓게
      float band = 0.22 * (topY - bottomY);
      float belowMask = 1.0 - smoothstep(headY - band, headY + band, vWorldPosition.y);
      
      // 아래쪽으로 갈수록 더 천천히 가열되도록 (지수 증가)
      float verticalFalloff = pow(1.0 - h, 1.5);
      
      // 중심 가열 강도를 낮춤
      float centerHeat = belowMask * verticalFalloff * 1.2 * slowP;
      
      // 전역 가열 속도를 대폭 낮춤
      float globalHeat = pow(p, 2.0) * 0.57;

      baseTemp = 0.15 + globalHeat + centerHeat;
    }

    baseTemp += baseNoise + heatNoise + spatialNoise;

    if (baseTemp > 0.3) {
      float tempNoise = noise(vUv * 35.0 + time * 1.2) * (baseTemp - 0.3) * 0.025;
      baseTemp += tempNoise;
    }

    baseTemp = clamp(baseTemp, 0.0, 1.0);

    vec3 color = thermalColor(baseTemp);
    if (baseTemp > 0.6) {
      color += vec3(0.2, 0.1, 0.0) * (baseTemp - 0.6) * 1.8;
    }

    vec3 L = normalize((viewMatrix * vec4(lightDir, 0.0)).xyz);
    vec3 N = normalize(vNormal);
    float diff = max(dot(N, L), 0.0);
    color *= (0.9 + 0.65 * diff);

    gl_FragColor = vec4(color, 1.0);
  }
`
