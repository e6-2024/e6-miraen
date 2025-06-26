// thermalShader2.js - Stove용 가장자리 냉각 강화 버전
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
  uniform vec3 leftBurner;   // 왼쪽 버너 위치
  uniform vec3 rightBurner;  // 오른쪽 버너 위치
  uniform bool isHeating;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  vec3 thermalColorStove(float temp) {
    // Stove용 온도 색상 - 최대 빨간색까지만
    if (temp < 0.1) return vec3(0.0, 0.0, 0.0); // Black (very cold)
    else if (temp < 0.25) return mix(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.8), (temp - 0.1) * 6.67); // Black to Blue
    else if (temp < 0.4) return mix(vec3(0.0, 0.0, 0.8), vec3(0.3, 0.0, 0.7), (temp - 0.25) * 6.67); // Blue to Purple
    else if (temp < 0.6) return mix(vec3(0.3, 0.0, 0.7), vec3(0.7, 0.0, 0.3), (temp - 0.4) * 5.0); // Purple to Dark Red
    else if (temp < 0.8) return mix(vec3(0.7, 0.0, 0.3), vec3(0.9, 0.0, 0.0), (temp - 0.6) * 5.0); // Dark Red to Red
    else return mix(vec3(0.9, 0.0, 0.0), vec3(1.0, 0.2, 0.0), (temp - 0.8) * 5.0); // Red to Bright Red (최대)
  }
  
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  // 다중 레이어 노이즈 함수
  float multiNoise(vec2 p, float time) {
    float n1 = noise(p * 6.0 + time * 0.4) * 0.5;
    float n2 = noise(p * 12.0 - time * 0.25) * 0.25;
    float n3 = noise(p * 24.0 + time * 0.6) * 0.125;
    float n4 = noise(p * 48.0 - time * 0.15) * 0.0625;
    return n1 + n2 + n3 + n4;
  }
  
  void main() {
    // Stove용 노이즈 (더 안정적으로 감소)
    float baseNoise = multiNoise(vUv, time) * 0.1; // 0.06에서 0.04로 감소
    float heatNoise = noise(vUv * 15.0 + time * 0.8) * 0.07; // 0.03에서 0.02로 감소
    float spatialNoise = noise(vWorldPosition.xz * 4.0 + time * 0.25) * 0.07; // 0.025에서 0.015로 감소
    
    // 왼쪽과 오른쪽 버너로부터의 거리 계산 (더 작은 스케일로 열 범위 축소)
    float distanceFromLeftBurner = length(vWorldPosition - leftBurner) / 1.0; // 1.5에서 1.0으로 축소
    float distanceFromRightBurner = length(vWorldPosition - rightBurner) / 1.0; // 1.5에서 1.0으로 축소
    
    // 두 버너 중 가까운 거리 사용
    float nearestBurnerDistance = min(distanceFromLeftBurner, distanceFromRightBurner);
    
    // 기본 온도 (파란색 시작점)
    float baseTemp = 0.15;
    
    if (isHeating) {
      // 가열 진행도 (버너 근처는 빠르게, 멀리는 천천히)
      float heatProgress = min(heatingTime / 5.0, 1.0); // 15초로 빠르게
      
      // 각 버너로부터의 가열 효과 계산 (버너 근처는 강력하게, 멀리는 급격히 감소)
      float leftBurnerHeat = 0.0;
      float rightBurnerHeat = 0.0;
      
      // 왼쪽 버너 가열 (근처는 매우 빠르게 뜨거워짐)
      if (distanceFromLeftBurner < 0.4) {
        // 버너 바로 근처: 매우 빠르고 강한 가열
        leftBurnerHeat = exp(-distanceFromLeftBurner * 8.0) * heatProgress * 0.8;
      } else if (distanceFromLeftBurner < 0.6) {
        // 중간 거리: 보통 가열
        leftBurnerHeat = exp(-distanceFromLeftBurner * 5.0) * heatProgress * 0.4;
      } else {
        // 먼 거리: 거의 가열 안됨
        leftBurnerHeat = exp(-distanceFromLeftBurner * 12.0) * heatProgress * 0.1;
      }
      
      // 오른쪽 버너 가열 (같은 방식)
      if (distanceFromRightBurner < 0.3) {
        // 버너 바로 근처: 매우 빠르고 강한 가열
        rightBurnerHeat = exp(-distanceFromRightBurner * 8.0) * heatProgress * 0.8;
      } else if (distanceFromRightBurner < 0.6) {
        // 중간 거리: 보통 가열
        rightBurnerHeat = exp(-distanceFromRightBurner * 5.0) * heatProgress * 0.4;
      } else {
        // 먼 거리: 거의 가열 안됨
        rightBurnerHeat = exp(-distanceFromRightBurner * 12.0) * heatProgress * 0.1;
      }
      
      // 두 버너의 열 효과를 합산
      float totalHeat = leftBurnerHeat + rightBurnerHeat;
      
      // 전체적인 최소 가열 (거의 없음)
      float globalHeat = heatProgress * 0.01; // 거의 제로에 가깝게
      
      // 최종 온도 계산
      baseTemp = 0.15 + globalHeat + totalHeat;
      
      // 버너에서 멀리 떨어진 곳 강제 냉각 (더 엄격하게)
      if (nearestBurnerDistance > 0.4) { // 0.4로 더 낮춤
        float coolFactor = (nearestBurnerDistance - 0.4) * 8.0; // 8.0으로 증가
        baseTemp = mix(baseTemp, 0.16, coolFactor); // 더 파란색으로
      }
      
      // 추가 강제 냉각 (매우 먼 거리)
      if (nearestBurnerDistance > 0.6) {
        float extremeCoolFactor = (nearestBurnerDistance - 0.6) * 15.0; // 15.0으로 증가
        baseTemp = mix(baseTemp, 0.15, extremeCoolFactor); // 완전히 파란색으로
      }
      
      // 버너 근처는 높은 온도 허용, 멀리는 제한
      if (nearestBurnerDistance < 0.3) {
        baseTemp = min(baseTemp, 0.95); // 버너 근처는 높은 온도까지 허용
      } else {
        baseTemp = min(baseTemp, 0.5); // 멀리는 낮은 온도로 제한
      }
    }
    
    // 노이즈 효과들 적용 (감소)
    baseTemp += baseNoise + heatNoise + spatialNoise;
    
    // 낮은 온도에서의 불안정성 (감소)
    if (baseTemp > 0.3) {
      float tempNoise = noise(vUv * 35.0 + time * 1.2) * (baseTemp - 0.3) * 0.025; // 0.04에서 0.025로 감소
      baseTemp += tempNoise;
    }
    
    // 강화된 가장자리 냉각 효과
    float viewAngle = abs(dot(vNormal, normalize(vPosition)));
    float edgeCooling = 1.0 - pow(viewAngle, 2.5); // 지수를 2.5로 조정
    baseTemp -= edgeCooling * 0.08; // 냉각 효과 대폭 증가
    
    // UV 기반 가장자리 냉각 (Stove용 추가)
    float uvEdgeDistance = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    if (uvEdgeDistance < 0.25) { // 가장자리 25% 영역
      float uvCoolFactor = (0.25 - uvEdgeDistance) / 0.25;
      baseTemp -= uvCoolFactor * 0.1; // 추가 냉각
    }
    
    baseTemp = clamp(baseTemp, 0.0, 1.0);
    
    vec3 color = thermalColorStove(baseTemp);
    
    // Stove용 노이즈 기반 색상 변조 (더 차분하게)
    float colorNoise = multiNoise(vUv * 20.0, time * 0.6) * 0.06; // 0.08에서 0.06으로 감소
    color += vec3(colorNoise * 0.3, colorNoise * 0.15, colorNoise * 0.4); // 강도 감소
    
    // Stove용 글로우 효과 (더 약하게)
    if (baseTemp > 0.5) {
      float glowNoise = noise(vUv * 25.0 + time * 1.0) * 0.1; // 0.15에서 0.1로 감소
      color += vec3(0.1, 0.03, 0.0) * (baseTemp - 0.5) * 1.2 * (1.0 + glowNoise); // 강도 감소
    }
    
    // Stove용 노이즈 오버레이 (더 미묘하게)
    float overlayNoise = noise(vUv * 80.0 + time * 2.0) * 0.015; // 0.025에서 0.015로 감소
    color = mix(color, color + vec3(overlayNoise), 0.2); // 0.25에서 0.2로 감소
    
    gl_FragColor = vec4(color, 1.0);
  }
`;