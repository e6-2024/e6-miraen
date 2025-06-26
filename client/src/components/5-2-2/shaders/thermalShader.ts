export const thermalVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const thermalFragmentShader = `
  uniform float time;
  uniform float temperature;
  uniform vec3 baseColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  vec3 thermalColor(float temp) {
    // 온도 : black -> blue -> purple -> red -> orange -> yellow -> white
    if (temp < 0.1) return vec3(0.0, 0.0, 0.0); // Black (very cold)
    else if (temp < 0.2) return mix(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.8), (temp - 0.1) * 10.0); // Black to Blue
    else if (temp < 0.3) return mix(vec3(0.0, 0.0, 0.8), vec3(0.4, 0.0, 0.8), (temp - 0.2) * 10.0); // Blue to Purple
    else if (temp < 0.5) return mix(vec3(0.4, 0.0, 0.8), vec3(0.8, 0.0, 0.0), (temp - 0.3) * 5.0); // Purple to Red
    else if (temp < 0.7) return mix(vec3(0.8, 0.0, 0.0), vec3(1.0, 0.5, 0.0), (temp - 0.5) * 5.0); // Red to Orange
    else if (temp < 0.9) return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.0), (temp - 0.7) * 5.0); // Orange to Yellow
    else return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 1.0, 1.0), (temp - 0.9) * 10.0); // Yellow to White
  }
  
  // 노이즈 이펙트
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void main() {
    float thermalNoise = noise(vUv * 10.0 + time * 0.5) * 0.1;
    float distanceFromCenter = length(vUv - 0.5) * 2.0;
    
    float baseTemp = temperature + thermalNoise - distanceFromCenter * 0.2;
    
    float edgeCooling = 1.0 - pow(abs(dot(vNormal, normalize(vPosition))), 2.0);
    baseTemp += edgeCooling * 0.3;
    
    baseTemp = clamp(baseTemp, 0.0, 1.0);
    
    vec3 color = thermalColor(baseTemp);
    if (baseTemp > 0.6) {
      color += vec3(0.2, 0.1, 0.0) * (baseTemp - 0.6) * 2.5;
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;