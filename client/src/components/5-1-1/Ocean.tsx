import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Ocean({ 
  timeSpeed = 0.5,        // 전체 애니메이션 속도 (기본값: 1.0)
  flowSpeed = 0.5,        // 물 흐름 속도 (기본값: 1.0) 
  waveSpeed = 0.5,        // 파도 생성 속도 (기본값: 1.0)
  textureUrl = null,      // 텍스처 URL (선택사항)
  normalMapUrl = null,    // 노말맵 URL (선택사항)
  textureScale = 1.0,     // 텍스처 스케일
  textureOpacity = 1.0,   // 텍스처 투명도
  waterLevel = 5          // 물의 높이 (새로 추가)
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // 텍스처 상태 관리
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [normalMap, setNormalMap] = useState<THREE.Texture | null>(null)
  
  // 텍스처 로딩
  useEffect(() => {
    if (textureUrl) {
      const loader = new THREE.TextureLoader()
      loader.load(textureUrl, (loadedTexture) => {
        setTexture(loadedTexture)
      })
    } else {
      setTexture(null)
    }
  }, [textureUrl])
  
  useEffect(() => {
    if (normalMapUrl) {
      const loader = new THREE.TextureLoader()
      loader.load(normalMapUrl, (loadedTexture) => {
        setNormalMap(loadedTexture)
      })
    } else {
      setNormalMap(null)
    }
  }, [normalMapUrl])
  
  // 텍스처 설정
  useMemo(() => {
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(textureScale, textureScale)
    }
    if (normalMap) {
      normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping
      normalMap.repeat.set(textureScale, textureScale)
    }
  }, [texture, normalMap, textureScale])
  
  const waterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0.0 },
        iResolution: { value: new THREE.Vector3(1920, 1080, 1) },
        opacity: { value: 0.4 },
        // 속도 조절을 위한 uniform
        uTimeSpeed: { value: timeSpeed },
        uFlowSpeed: { value: flowSpeed },
        uWaveSpeed: { value: waveSpeed },
        // 텍스처 관련 uniform
        uTexture: { value: texture },
        uNormalMap: { value: normalMap },
        uTextureScale: { value: textureScale },
        uTextureOpacity: { value: textureOpacity },
        uHasTexture: { value: texture ? 1.0 : 0.0 },
        uHasNormalMap: { value: normalMap ? 1.0 : 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float iTime;
        uniform vec3 iResolution;
        uniform float opacity;
        
        // 속도 조절을 위한 uniform
        uniform float uTimeSpeed;
        uniform float uFlowSpeed;
        uniform float uWaveSpeed;
        
        // 텍스처 관련 uniform
        uniform sampler2D uTexture;
        uniform sampler2D uNormalMap;
        uniform float uTextureScale;
        uniform float uTextureOpacity;
        uniform float uHasTexture;
        uniform float uHasNormalMap;
        
        varying vec2 vUv;
        varying vec3 vWorldPos;
        
        // Shadertoy 원본 코드 - 물 관련 부분만 추출
        float g_fTime;
        
        #define MOD2 vec2(4.438975,3.972973)
        
        float Hash( float p ) {
            vec2 p2 = fract(vec2(p) * MOD2);
            p2 += dot(p2.yx, p2.xy+19.19);
            return fract(p2.x * p2.y);    
        }
        
        vec2 Hash2( float p ) {
            vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
            p3 += dot(p3, p3.yzx + 19.19);
            return fract((p3.xx+p3.yz)*p3.zy);
        }
        
        float SmoothNoise(in vec2 o) {
            vec2 p = floor(o);
            vec2 f = fract(o);
                
            float n = p.x + p.y*57.0;
        
            float a = Hash(n+  0.0);
            float b = Hash(n+  1.0);
            float c = Hash(n+ 57.0);
            float d = Hash(n+ 58.0);
            
            vec2 f2 = f * f;
            vec2 f3 = f2 * f;
            
            vec2 t = 3.0 * f2 - 2.0 * f3;
            
            float u = t.x;
            float v = t.y;
        
            float res = a + (b-a)*u +(c-a)*v + (a-b+d-c)*u*v;
            
            return res;
        }
        
        vec3 SmoothNoise_DXY(in vec2 o) {
            vec2 p = floor(o);
            vec2 f = fract(o);
                
            float n = p.x + p.y*57.0;
        
            float a = Hash(n+  0.0);
            float b = Hash(n+  1.0);
            float c = Hash(n+ 57.0);
            float d = Hash(n+ 58.0);
            
            vec2 f2 = f * f;
            vec2 f3 = f2 * f;
            
            vec2 t = 3.0 * f2 - 2.0 * f3;
            vec2 dt = 6.0 * f - 6.0 * f2;
            
            float u = t.x;
            float v = t.y;
            float du = dt.x;	
            float dv = dt.y;	
        
            float res = a + (b-a)*u +(c-a)*v + (a-b+d-c)*u*v;
            
            float dx = (b-a)*du + (a-b+d-c)*du*v;
            float dy = (c-a)*dv + (a-b+d-c)*u*dv;    
            
            return vec3(dx, dy, res);
        }
        
        vec3 FBM_DXY( vec2 p, vec2 flow, float ps, float df ) {
            vec3 f = vec3(0.0);
            float tot = 0.0;
            float a = 1.0;
            for( int i=0; i<4; i++) {
                p += flow * uWaveSpeed;
                flow *= -0.75;
                vec3 v = SmoothNoise_DXY( p );
                f += v * a;
                p += v.xy * df;
                p *= 2.0;
                tot += a;
                a *= ps;
            }
            return f / tot;
        }
        
        float GetRiverMeander( const float x ) {
            return sin(x * 0.3) * 1.5;
        }
        
        float GetRiverMeanderDx( const float x ) {
            return cos(x * 0.3) * 1.5 * 0.3;
        }
        
        vec2 GetBaseFlow( const vec2 vPos ) {
            return vec2( 1.0 * uFlowSpeed, GetRiverMeanderDx(vPos.x) * uFlowSpeed );
        }
        
        float GetRiverBedOffset( const vec3 vPos ) {
            float fRiverBedDepth = 0.3 + (0.5 + 0.5 * sin( vPos.x * 0.001 + 3.0)) * 0.4;
            float fRiverBedWidth = 2.0 + cos( vPos.x * 0.1 ) * 1.0;
            
            float fRiverBedAmount = smoothstep( fRiverBedWidth, fRiverBedWidth * 0.5, abs(vPos.z - GetRiverMeander(vPos.x)) );
                
            return fRiverBedAmount * fRiverBedDepth;    
        }
        
        float GetTerrainHeightSimple( const vec3 vPos ) {    
            float fbm = SmoothNoise( vPos.xz * vec2(0.5, 1.0) );
            float fTerrainHeight = fbm * fbm;
            
            fTerrainHeight -= GetRiverBedOffset(vPos);
                
            return fTerrainHeight;
        }
        
        float GetFlowDistance( const vec2 vPos ) {
            return -GetTerrainHeightSimple( vec3( vPos.x, 0.0, vPos.y ) );
        }
        
        vec2 GetGradient( const vec2 vPos ) {
            vec2 vDelta = vec2(0.01, 0.00);
            float dx = GetFlowDistance( vPos + vDelta.xy ) - GetFlowDistance( vPos - vDelta.xy );
            float dy = GetFlowDistance( vPos + vDelta.yx ) - GetFlowDistance( vPos - vDelta.yx );
            return vec2( dx, dy );
        }
        
        vec3 GetFlowRate( const vec2 vPos ) {
            vec2 vBaseFlow = GetBaseFlow( vPos );
            vec2 vFlow = vBaseFlow;
            float fFoam = 0.0;
        
            float fDepth = -GetTerrainHeightSimple( vec3(vPos.x, 0.0, vPos.y) );
            float fDist = GetFlowDistance( vPos );
            vec2 vGradient = GetGradient( vPos );
            
            vFlow += -vGradient * 40.0 / (1.0 + fDist * 1.5);
            vFlow *= 1.0 / (1.0 + fDist * 0.5);
        
            float fBehindObstacle = 0.5 - dot( normalize(vGradient), -normalize(vFlow)) * 0.5;
            float fSlowDist = clamp( fDepth * 5.0, 0.0, 1.0);
            fSlowDist = mix(fSlowDist * 0.9 + 0.1, 1.0, fBehindObstacle * 0.9);
            fSlowDist = 0.5 + fSlowDist * 0.5;
            vFlow *= fSlowDist;
            
            float fFoamScale1 = 0.5;
            float fFoamCutoff = 0.4;
            float fFoamScale2 = 0.35;
            
            fFoam = abs(length( vFlow )) * fFoamScale1;
            fFoam += clamp( fFoam - fFoamCutoff, 0.0, 1.0 );
            fFoam = 1.0 - pow( fDist, fFoam * fFoamScale2 );
            
            return vec3( vFlow * 0.6 * uFlowSpeed, fFoam  );
        }
        
        vec4 SampleWaterNormal( vec2 vUV, vec2 vFlowOffset, float fMag, float fFoam ) {    
            float fGradientAscent = 0.25 + (fFoam * -1.5);
            vec3 dxy = FBM_DXY(vUV * 20.0, vFlowOffset * 20.0, 0.75 + fFoam * 0.25, fGradientAscent);
            float fScale = max(0.25, 1.0 - fFoam * 5.0);
            vec3 vBlended = mix( vec3(0.0, 1.0, 0.0), normalize( vec3(dxy.x, fMag, dxy.y) ), fScale );
            return vec4( normalize( vBlended ), dxy.z * fScale );
        }
        
        float SampleWaterFoam( vec2 vUV, vec2 vFlowOffset, float fFoam ) {
            float f =  FBM_DXY(vUV * 30.0, vFlowOffset * 50.0, 0.8, -0.5 ).z;
            float fAmount = 0.2;
            f = max( 0.0, (f - fAmount) / fAmount );
            return pow( 0.5, f );
        }
        
        vec4 SampleFlowingNormal( const vec2 vUV, const vec2 vFlowRate, const float fFoam, const float time, out float fOutFoamTex ) {
            float fMag = 2.5 / (1.0 + dot( vFlowRate, vFlowRate ) * 5.0);
            float t0 = fract( time );
            float t1 = fract( time + 0.5 );
            
            float i0 = floor( time );
            float i1 = floor( time + 0.5 );
            
            float o0 = t0 - 0.5;
            float o1 = t1 - 0.5;
            
            vec2 vUV0 = vUV + Hash2(i0);
            vec2 vUV1 = vUV + Hash2(i1);
            
            vec4 sample0 = SampleWaterNormal( vUV0, vFlowRate * o0, fMag, fFoam );
            vec4 sample1 = SampleWaterNormal( vUV1, vFlowRate * o1, fMag, fFoam );
        
            float weight = abs( t0 - 0.5 ) * 2.0;
        
            float foam0 = SampleWaterFoam( vUV0, vFlowRate * o0 * 0.25, fFoam );
            float foam1 = SampleWaterFoam( vUV1, vFlowRate * o1 * 0.25, fFoam );
            
            vec4 result = mix( sample0, sample1, weight );
            result.xyz = normalize(result.xyz);
        
            fOutFoamTex = mix( foam0, foam1, weight );
        
            return result;
        }
        
        void main() {
            g_fTime = iTime * uTimeSpeed;
            
            // 월드 좌표를 UV 좌표로 변환
            vec2 worldUV = vWorldPos.xz * 0.1;
            
            // Shadertoy 물 효과 계산
            vec3 vFlowRateAndFoam = GetFlowRate( worldUV );
            vec2 vFlowRate = vFlowRateAndFoam.xy;
            float fFoam = vFlowRateAndFoam.z;
            
            float fFoamScale = 1.5;
            float fFoamOffset = 0.2;
            fFoam = clamp( (fFoam - fFoamOffset) * fFoamScale, 0.0, 1.0 );
            fFoam = fFoam * fFoam * 0.5;
            
            float fWaterFoamTex = 1.0;
            vec4 vWaterNormalAndHeight = SampleFlowingNormal( worldUV, vFlowRate, fFoam, g_fTime, fWaterFoamTex );
            
            // 기본 물 색상 계산
            vec3 deepWaterColor = vec3(0.0, 0.4, 0.7);
            vec3 shallowWaterColor = vec3(0.3, 0.7, 0.9);
            vec3 foamColor = vec3(0.9, 0.95, 1.0);
            
            float depth = clamp(vWaterNormalAndHeight.w * 2.0, 0.0, 1.0);
            vec3 waterColor = mix(shallowWaterColor, deepWaterColor, depth);
            
            // 외부 텍스처 적용
            if (uHasTexture > 0.5) {
                // 흐름에 따라 텍스처 UV 왜곡
                vec2 textureUV = worldUV * uTextureScale;
                textureUV += vFlowRate * g_fTime * 0.1; // 흐름 방향으로 텍스처 이동
                
                vec4 texColor = texture2D(uTexture, textureUV);
                
                // 텍스처와 기본 물 색상 블렌딩
                waterColor = mix(waterColor, texColor.rgb, texColor.a * uTextureOpacity);
            }
            
            // 노말맵 적용 (있는 경우)
            if (uHasNormalMap > 0.5) {
                vec2 normalUV = worldUV * uTextureScale;
                normalUV += vFlowRate * g_fTime * 0.05;
                
                vec3 normalMapSample = texture2D(uNormalMap, normalUV).rgb * 2.0 - 1.0;
                // 기존 노말과 노말맵 블렌딩
                vWaterNormalAndHeight.xyz = normalize(mix(vWaterNormalAndHeight.xyz, normalMapSample, 0.5));
            }
            
            // 거품 효과 적용
            float fFoamBlend = 1.0 - pow( fWaterFoamTex, fFoam * 5.0);
            vec3 finalColor = mix(waterColor, foamColor, fFoamBlend * 0.7 );
            
            // 물결에 따른 밝기 변화
            float brightness = 0.8 + vWaterNormalAndHeight.w * 0.4;
            finalColor *= brightness;
            
            // 햇빛 반사 효과
            float sunReflection = max(0.0, vWaterNormalAndHeight.y) * 0.5;
            finalColor += vec3(1.0, 0.9, 0.7) * sunReflection;
            
            // 프레넬 반사
            float fresnel = pow(1.0 - abs(dot(vec3(0.0, 0.0, 1.0), vWaterNormalAndHeight.xyz)), 2.0);
            finalColor = mix(finalColor, vec3(0.6, 0.8, 1.0), fresnel * 0.3);
            
            gl_FragColor = vec4(finalColor, opacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  }, [timeSpeed, flowSpeed, waveSpeed, texture, normalMap, textureScale, textureOpacity])

  // uniform 값 업데이트
  useMemo(() => {
    if (waterMaterial.uniforms) {
      waterMaterial.uniforms.uTimeSpeed.value = timeSpeed
      waterMaterial.uniforms.uFlowSpeed.value = flowSpeed
      waterMaterial.uniforms.uWaveSpeed.value = waveSpeed
      waterMaterial.uniforms.uTexture.value = texture
      waterMaterial.uniforms.uNormalMap.value = normalMap
      waterMaterial.uniforms.uTextureScale.value = textureScale
      waterMaterial.uniforms.uTextureOpacity.value = textureOpacity
      waterMaterial.uniforms.uHasTexture.value = texture ? 1.0 : 0.0
      waterMaterial.uniforms.uHasNormalMap.value = normalMap ? 1.0 : 0.0
    }
  }, [timeSpeed, flowSpeed, waveSpeed, texture, normalMap, textureScale, textureOpacity, waterMaterial])

  useFrame((_, delta) => {
    if (meshRef.current && meshRef.current.material instanceof THREE.ShaderMaterial) {
      meshRef.current.material.uniforms.iTime.value += delta
    }
  })

  return (
    <mesh 
      ref={meshRef}
      position={[0, waterLevel, 0]} // waterLevel prop 사용
      rotation={[-Math.PI / 2, 0, 0]}
      material={waterMaterial}
      castShadow
      receiveShadow
    >
      <planeGeometry args={[24, 24, 3, 3]} />
    </mesh>
  )
}