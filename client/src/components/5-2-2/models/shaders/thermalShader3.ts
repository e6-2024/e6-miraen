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
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  vec3 thermalColor(float temp) {
    // 온도에 따른 색상 매핑: black -> blue -> purple -> red -> orange -> yellow -> white
    if (temp < 0.1) return vec3(0.0, 0.0, 0.0); // Black (very cold)
    else if (temp < 0.25) return mix(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), (temp - 0.1) * 6.67); // Black to Deep Blue
    else if (temp < 0.3) return mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0), (temp - 0.25) * 6.67); // Deep Blue to Green
    else if (temp < 0.45) return mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (temp - 0.4) * 6.67); // Green to Yellow
    else if (temp < 0.6) return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.5, 0.0), (temp - 0.55) * 6.67); // Yellow to Orange
    else if (temp < 0.80) return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.0, 0.0), (temp - 0.7) * 6.67); // Orange to Red
    else return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0), (temp - 0.85) * 6.67); // Red to White
  }
    
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  // 다중 레이어 노이즈 함수
  float multiNoise(vec2 p, float time) {
    float n1 = noise(p * 8.0 + time * 0.5) * 0.5;
    float n2 = noise(p * 16.0 - time * 0.3) * 0.25;
    float n3 = noise(p * 32.0 + time * 0.7) * 0.125;
    float n4 = noise(p * 64.0 - time * 0.2) * 0.0625;
    return n1 + n2 + n3 + n4;
  }
  
  void main() {
    // 다양한 노이즈 레이어
    float baseNoise = multiNoise(vUv, time) * 0.1; // 노이즈 감소
    float heatNoise = noise(vUv * 20.0 + time * 1.0) * 0.07; // 노이즈 감소
    float spatialNoise = noise(vWorldPosition.xz * 5.0 + time * 0.3) * 0.07; // 노이즈 감소
    
    // 중앙점으로부터의 거리 계산 (정규화)
    float distanceFromCenter = length(vWorldPosition - centerPoint) / 1.2; // 거리 스케일 감소로 열 확산 줄임
    
    // 기본 온도 (파란색 시작점)
    float baseTemp = 0.22;
    
    if (isHeating) {
      // 가열 진행도 (0 ~ 1)
      float heatProgress = min(heatingTime / 10.0, 1.0);
      
      // 거리에 따른 온도 그라데이션 (매우 급격하게)
      float distanceFactor = exp(-distanceFromCenter * 5.0); // 4.0 -> 5.0
      
      // 초기에는 중앙만 뜨겁고, 시간이 지나면 전체가 뜨거워짐
      // 중앙 집중 가열 (초기에 강함)
      float centerHeat = distanceFactor * heatProgress * 0.8;
      
      // 전체적인 베이스 온도 상승 (시간에 따라 점점 증가)
      // heatProgress^2를 사용해서 초반에는 천천히, 후반에 빠르게 상승
      float globalHeat = pow(heatProgress, 1.5) * 0.7;
      
      baseTemp = 0.22 + centerHeat + globalHeat;
      
      // 시간에 따라 외곽 온도 제한도 점점 풀림
      float maxTempByDistance = 0.3 + distanceFactor * 0.4 + heatProgress * 0.6;
      baseTemp = min(baseTemp, maxTempByDistance);
    }
    
    // 노이즈 효과들 적용 (줄임)
    baseTemp += baseNoise + heatNoise + spatialNoise;
    
    // 온도에 따른 추가 노이즈 (줄임)
    if (baseTemp > 0.4) {
      float tempNoise = noise(vUv * 40.0 + time * 2.0) * (baseTemp - 0.4) * 0.03; // 0.03으로 감소
      baseTemp += tempNoise;
    }
    
    // 강화된 가장자리 냉각 효과
    float viewAngle = abs(dot(vNormal, normalize(vPosition)));
    float edgeCooling = 1.0 - pow(viewAngle, 2.0); // 지수 줄여서 더 넓은 범위에서 냉각
    baseTemp -= edgeCooling * 0.12; // 냉각 효과 대폭 증가 (0.12)
    
    // UV 기반 가장자리 냉각 (추가)
    float uvEdgeDistance = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    if (uvEdgeDistance < 0.5) { // 가장자리 30% 영역
      float uvCoolFactor = (0.5 - uvEdgeDistance) / 0.5; // 0~1
      baseTemp -= uvCoolFactor * 0.15; // 추가 냉각
    }
    
    baseTemp = clamp(baseTemp, 0.0, 1.0);
    
    vec3 color = thermalColor(baseTemp);
    
    // 높은 온도에서 글로우 효과 (줄임)
    if (baseTemp > 0.6) {
      color += vec3(0.2, 0.1, 0.0) * (baseTemp - 0.6) * 1.5; // 글로우 감소
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`
