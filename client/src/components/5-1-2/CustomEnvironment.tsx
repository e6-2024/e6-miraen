import { useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { RGBELoader } from 'three-stdlib';

export function CustomEnvironment() {
  const { gl, scene } = useThree();
  const [envMap, setEnvMap] = useState<THREE.Texture | null>(null);

  // 톤 매핑 노출 설정
  useEffect(() => {
    gl.toneMappingExposure = 3.5;
  }, [gl]);

  // HDRI 환경맵 로드
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const loader = new RGBELoader();
    
    loader.load('/hdri/spot1Lux.hdr', (texture) => {
      const target = pmrem.fromEquirectangular(texture).texture;
      setEnvMap(target);
      texture.dispose();
      pmrem.dispose();
    });
    
    return () => {
      envMap?.dispose();
    };
  }, [gl]);

  // 씬에 환경맵 적용
  useEffect(() => {
    if (envMap) {
      scene.environment = envMap;
      scene.background = envMap; // 배경이 필요없으면 주석 처리
    }
    
    return () => {
      if (scene.environment === envMap) {
        scene.environment = null;
      }
      if (scene.background === envMap) {
        scene.background = null;
      }
    };
  }, [envMap, scene]);

  return null;
}