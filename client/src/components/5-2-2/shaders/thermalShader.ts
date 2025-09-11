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

  // 모델 세로 바운드
  uniform float bottomY;
  uniform float topY;
  uniform float heatProgress;

  // ✅ 광원: 월드 공간 기준 방향 (정규화 권장)
  uniform vec3 lightDir;

  varying vec2 vUv;
  varying vec3 vNormal;        // view space normal
  varying vec3 vPosition;      // view space position
  varying vec3 vWorldPosition; // world space position

  vec3 thermalColor(float temp) {
    if (temp < 0.1) return vec3(0.0, 0.0, 0.0);
    else if (temp < 0.25) return mix(vec3(0.0), vec3(0.0, 0.0, 1.0), (temp - 0.1) * 6.67);
    else if (temp < 0.3)  return mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0), (temp - 0.25) * 6.67);
    else if (temp < 0.45) return mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (temp - 0.4) * 6.67);
    else if (temp < 0.6)  return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.5, 0.0), (temp - 0.55) * 6.67);
    else if (temp < 0.75) return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.0, 0.0), (temp - 0.7) * 6.67);
    else                  return mix(vec3(1.0, 0.0, 0.0), vec3(1.0), (temp - 0.85) * 6.67);
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
    // 기본 텍스처 변동(가열 여부와 무관)
    float baseNoise    = multiNoise(vUv, time) * 0.08;
    float heatNoise    = noise(vUv * 8.0 + time * 1.0) * 0.05;
    float spatialNoise = noise(vWorldPosition.xz * 2.0 + time * 0.3) * 0.06;

    float h = clamp((vWorldPosition.y - bottomY) / max(topY - bottomY, 1e-5), 0.0, 1.0);
    float baseTemp = 0.15;

    if (isHeating) {
      float p = clamp(heatProgress, 0.0, 1.0);
      float headY = mix(bottomY, topY, min(p * 1.25, 1.0));
      float band = 0.16 * (topY - bottomY);
      float belowMask = 1.0 - smoothstep(headY - band, headY + band, vWorldPosition.y);
      float verticalFalloff = exp(- (1.0 - h) * 1.5);

      float centerHeat = belowMask * verticalFalloff * 1.2;
      float globalHeat = p * 0.12;

      baseTemp = 0.15 + globalHeat + centerHeat;

      // (가열 시) 가장자리 쿨링
      float viewAngle = abs(dot(vNormal, normalize(vPosition)));
      float edgeCooling = 1.0 - pow(viewAngle, 2.5);
      baseTemp -= edgeCooling * 0.08;

      float uvEdgeDistance = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
      if (uvEdgeDistance < 0.25) {
        float uvCool = (0.25 - uvEdgeDistance) / 0.25;
        baseTemp -= uvCool * 0.1;
      }
    }

    // 가열 여부와 무관하게 약간의 변동
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

    // 너무 납작/어둡지 않게 ambient 0.35 + diffuse 0.65
    color *= (0.35 + 0.65 * diff);

    gl_FragColor = vec4(color, 1.0);
  }
`;

