import { useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { RGBELoader } from 'three-stdlib'

export function CustomEnvironment() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const [envMap, setEnvMap] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    gl.toneMappingExposure = 3.5 // 기본은 1.0, 높이면 밝아짐
  }, [gl])

  
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const loader = new RGBELoader()
    
    loader.load('/hdri/spot1Lux.hdr', (texture) => {
      const target = pmrem.fromEquirectangular(texture).texture
      setEnvMap(target)
      texture.dispose()
      pmrem.dispose()
    })
    
    return () => {
      if (envMap) {
        envMap.dispose()
      }
    }
  }, [gl])

  useEffect(() => {
    if (envMap) {
      scene.environment = envMap
      scene.background = envMap // Comment this line if not needed
    }
    
    return () => {
      if (scene.environment === envMap) {
        scene.environment = null
      }
      if (scene.background === envMap) {
        scene.background = null
      }
    }
  }, [envMap, scene])

  return null
}