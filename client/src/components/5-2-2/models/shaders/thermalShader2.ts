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

  // ✅ 추가: z축 오프셋을 위한 유니폼
  uniform float modelDepth;     // 월드 기준 모델의 z 크기
  uniform float zShiftFactor;   // 예: 0.3 -> z 크기의 30% 만큼 +Z로 이동

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  // 구간 경계 (원하면 여기만 숫자 조절)
  const float T0 = 0.10; // black -> blue
  const float T1 = 0.60; // blue  -> green
  const float T2 = 0.63; // green -> yellow
  const float T3 = 0.65; // yellow-> orange
  const float T4 = 0.70; // orange-> red
  const float T5 = 0.70; // red   -> white 시작 (의도적으로 T4와 같게 둬 흰색 넓힘)

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float multiNoise(vec2 p, float t) {
    float n1 = noise(p *  6.0 + t * 0.4)  * 0.5;
    float n2 = noise(p * 12.0 - t * 0.25) * 0.25;
    float n3 = noise(p * 24.0 + t * 0.6)  * 0.125;
    float n4 = noise(p * 48.0 - t * 0.15) * 0.0625;
    return n1 + n2 + n3 + n4;
  }

  // 구간 보간 도우미: (x - a) / (b - a)
  float remap01(float x, float a, float b) {
    return clamp((x - a) / max(b - a, 1e-5), 0.0, 1.0);
  }

  vec3 thermalColorStove(float temp) {
    if (temp < T0) {
      return vec3(0.0); // black
    } else if (temp < T1) {
      float k = remap01(temp, T0, T1);
      return mix(vec3(0.0), vec3(0.0, 0.0, 1.0), k); // black -> blue
    } else if (temp < T2) {
      float k = remap01(temp, T1, T2);
      return mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0), k); // blue -> green
    } else if (temp < T3) {
      float k = remap01(temp, T2, T3);
      return mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), k); // green -> yellow
    } else if (temp < T4) {
      float k = remap01(temp, T3, T4);
      return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.5, 0.0), k); // yellow -> orange
    } else if (temp < T5) {
      float k = remap01(temp, T4, T5);
      return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.0, 0.0), k); // orange -> red
    } else {
      float k = remap01(temp, T5, 1.0);
      return mix(vec3(1.0, 0.0, 0.0), vec3(1.0), k); // red -> white
    }
  }

  void main() {
    float baseNoise    = multiNoise(vUv, time) * 0.08; // 살짝 약화 (0.1 -> 0.08)
    float heatNoise    = noise(vUv * 15.0 + time * 0.8) * 0.06; // 0.07 -> 0.06
    float spatialNoise = noise(vWorldPosition.xz * 4.0 + time * 0.25) * 0.06; // 0.07 -> 0.06

    // ✅ z축으로 앞쪽( +Z )으로 30% 이동한 가열 중심
    //   카메라 쪽이 -Z인 씬이면 아래의 + 를 -로 바꿔줘.
    vec3 heatCenter = centerPoint - vec3(0.0, 0.0, modelDepth * zShiftFactor);

    // 중앙 버너로부터의 거리
    float distanceFromBurner = length(vWorldPosition - heatCenter);

    // 기본 온도를 조금 높여 흰색 접근성 향상
    float baseTemp = 0.20;

    if (isHeating) {
      float heatProgress = clamp(heatingTime / 5.0, 0.0, 1.0);

      // 퍼짐 완화 지수 감쇠(사용자 값 유지: 3.0)
      float burnerHeat = exp(-distanceFromBurner * 3.0) * heatProgress * 0.9;

      // 전체가 함께 올라가는 양 (사용자 값 유지: 0.05)
      float globalHeat = heatProgress * 0.05;

      baseTemp = baseTemp + globalHeat + burnerHeat;

      // 상한 유지
      baseTemp = min(baseTemp, 1.0);
    }

    // 노이즈로 변주
    baseTemp += baseNoise + heatNoise + spatialNoise;

    // 고온에서의 미세 떨림
    if (baseTemp > 0.3) {
      float tempNoise = noise(vUv * 35.0 + time * 1.2) * (baseTemp - 0.3) * 0.025;
      baseTemp += tempNoise;
    }

    baseTemp = clamp(baseTemp, 0.0, 1.0);

    vec3 color = thermalColorStove(baseTemp);

    // 고온(흰색 근처)에서 색 노이즈를 줄여 흰색 보존
    float whiteAtten = 1.0 - smoothstep(0.65, 0.85, baseTemp); // baseTemp가 높을수록 0에 가깝게
    float colorNoise = multiNoise(vUv * 20.0, time * 0.6) * 0.06 * whiteAtten;
    color += vec3(colorNoise * 0.3, colorNoise * 0.15, colorNoise * 0.4);

    // 글로우: 흰색을 더 살리는 방향
    if (baseTemp > 0.5) {
      float glowNoise = noise(vUv * 25.0 + time * 1.0) * 0.08;
      vec3 glowCol = vec3(1.0); // 주황톤 대신 백색으로
      color += glowCol * (baseTemp - 0.5) * 1.0 * (1.0 + glowNoise);
    }

    // 오버레이는 살짝만
    float overlayNoise = noise(vUv * 80.0 + time * 2.0) * 0.012;
    color = mix(color, color + vec3(overlayNoise), 0.18);

    gl_FragColor = vec4(color, 1.0);
  }
`;
