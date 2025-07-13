// thermalShader2.js - 1구 버너용 수정 버전
export const thermalVertexShader2 = `
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
`;

export const thermalFragmentShader2 = `
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
  
  vec3 thermalColorStove(float temp) {
    if (temp < 0.1) return vec3(0.0, 0.0, 0.0); // Black (very cold)
    else if (temp < 0.25) return mix(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), (temp - 0.1) * 6.67); // Black to Deep Blue
    else if (temp < 0.4) return mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0), (temp - 0.25) * 6.67); // Deep Blue to Green
    else if (temp < 0.55) return mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (temp - 0.4) * 6.67); // Green to Yellow
    else if (temp < 0.7) return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.5, 0.0), (temp - 0.55) * 6.67); // Yellow to Orange
    else if (temp < 0.85) return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.0, 0.0), (temp - 0.7) * 6.67); // Orange to Red
    else return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0), (temp - 0.85) * 6.67); // Red to White
  }
  
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  float multiNoise(vec2 p, float time) {
    float n1 = noise(p * 6.0 + time * 0.4) * 0.5;
    float n2 = noise(p * 12.0 - time * 0.25) * 0.25;
    float n3 = noise(p * 24.0 + time * 0.6) * 0.125;
    float n4 = noise(p * 48.0 - time * 0.15) * 0.0625;
    return n1 + n2 + n3 + n4;
  }
  
  void main() {
    float baseNoise = multiNoise(vUv, time) * 0.1;
    float heatNoise = noise(vUv * 15.0 + time * 0.8) * 0.07;
    float spatialNoise = noise(vWorldPosition.xz * 4.0 + time * 0.25) * 0.07;
    
    // 중앙 버너로부터의 거리 계산
    float distanceFromBurner = length(vWorldPosition - centerPoint) / 1.0;
    
    // 기본 온도
    float baseTemp = 0.15;
    
    if (isHeating) {
      float heatProgress = min(heatingTime / 5.0, 1.0);
      
      // 버너로부터의 가열 효과 계산
      float burnerHeat = 0.0;
      
      if (distanceFromBurner < 0.4) {
        burnerHeat = exp(-distanceFromBurner * 8.0) * heatProgress * 0.8;
      } else if (distanceFromBurner < 0.6) {
        burnerHeat = exp(-distanceFromBurner * 5.0) * heatProgress * 0.4;
      } else {
        burnerHeat = exp(-distanceFromBurner * 12.0) * heatProgress * 0.1;
      }
      
      float globalHeat = heatProgress * 0.01;
      
      baseTemp = 0.15 + globalHeat + burnerHeat;
      
      // 버너에서 멀리 떨어진 곳 강제 냉각
      if (distanceFromBurner > 0.4) {
        float coolFactor = (distanceFromBurner - 0.4) * 8.0;
        baseTemp = mix(baseTemp, 0.16, coolFactor);
      }
      
      // 추가 강제 냉각
      if (distanceFromBurner > 0.6) {
        float extremeCoolFactor = (distanceFromBurner - 0.6) * 15.0;
        baseTemp = mix(baseTemp, 0.15, extremeCoolFactor);
      }
      
      // 온도 제한
      if (distanceFromBurner < 0.3) {
        baseTemp = min(baseTemp, 0.95);
      } else {
        baseTemp = min(baseTemp, 0.5);
      }
    }
    
    // 노이즈 효과들 적용
    baseTemp += baseNoise + heatNoise + spatialNoise;
    
    // 낮은 온도에서의 불안정성
    if (baseTemp > 0.3) {
      float tempNoise = noise(vUv * 35.0 + time * 1.2) * (baseTemp - 0.3) * 0.025;
      baseTemp += tempNoise;
    }
    
    // 강화된 가장자리 냉각 효과
    float viewAngle = abs(dot(vNormal, normalize(vPosition)));
    float edgeCooling = 1.0 - pow(viewAngle, 2.5);
    baseTemp -= edgeCooling * 0.08;
    
    // UV 기반 가장자리 냉각
    float uvEdgeDistance = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    if (uvEdgeDistance < 0.25) {
      float uvCoolFactor = (0.25 - uvEdgeDistance) / 0.25;
      baseTemp -= uvCoolFactor * 0.1;
    }
    
    baseTemp = clamp(baseTemp, 0.0, 1.0);
    
    vec3 color = thermalColorStove(baseTemp);
    
    // 노이즈 기반 색상 변조
    float colorNoise = multiNoise(vUv * 20.0, time * 0.6) * 0.06;
    color += vec3(colorNoise * 0.3, colorNoise * 0.15, colorNoise * 0.4);
    
    // 글로우 효과
    if (baseTemp > 0.5) {
      float glowNoise = noise(vUv * 25.0 + time * 1.0) * 0.1;
      color += vec3(0.1, 0.03, 0.0) * (baseTemp - 0.5) * 1.2 * (1.0 + glowNoise);
    }
    
    // 노이즈 오버레이
    float overlayNoise = noise(vUv * 80.0 + time * 2.0) * 0.015;
    color = mix(color, color + vec3(overlayNoise), 0.2);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;