import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

function getFullscreenTriangle() {
  const geometry = new THREE.BufferGeometry()
  const vertices = new Float32Array([-1, -1, 3, -1, -1, 3])
  const uvs = new Float32Array([0, 0, 2, 0, 0, 2])

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 2))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

  return geometry
}

const usePostProcess = () => {
  const { size, gl } = useThree()
  const dpr = gl.getPixelRatio()

  const [screenCamera, screenScene, screen, renderTarget] = useMemo(() => {
    const screenScene = new THREE.Scene()
    const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const screen = new THREE.Mesh(getFullscreenTriangle())
    screen.frustumCulled = false
    screenScene.add(screen)

    const renderTarget = new THREE.WebGLRenderTarget(512, 512, {
      depthBuffer: true,
    })
    
    // renderTarget.texture.encoding = THREE.sRGBEncoding
    renderTarget.depthTexture = new THREE.DepthTexture(512, 512)
    
    

    const material = new THREE.RawShaderMaterial({
      uniforms: {
        diffuse: { value: renderTarget.texture },
        time: { value: 0 },
      },
      vertexShader: /* glsl */ `
        in vec2 uv;
        in vec3 position;
        precision highp float;

        out vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        out highp vec4 pc_fragColor;

        uniform sampler2D diffuse;
        uniform float time;
        in vec2 vUv;

        float radial(vec2 pos, float radius) {
          float result = length(pos) - radius;
          result = fract(result * 1.0);
          float result2 = 1.0 - result;
          float fresult = result * result2;
          fresult = pow((fresult * 3.0), 7.0);
          return fresult;
        }

        void main() {
          vec2 c_uv = vUv * 2.0 - 1.0;
          vec2 o_uv = vUv * 0.8;
          float gradient = radial(c_uv, time * 0.8);
          vec2 fuv = mix(vUv, o_uv, gradient);
          pc_fragColor = texture(diffuse, fuv);
        }
      `,
      glslVersion: THREE.GLSL3,
    })

    screen.material = material

    return [screenCamera, screenScene, screen, renderTarget] as const
  }, [gl])

  useEffect(() => {
    const { width, height } = size
    const w = width * dpr
    const h = height * dpr
    renderTarget.setSize(w, h)
  }, [dpr, size, renderTarget])

  useFrame(({ scene, camera, gl }, delta) => {
    gl.setRenderTarget(renderTarget)
    gl.render(scene, camera)

    gl.setRenderTarget(null)
    const mat = screen.material as THREE.RawShaderMaterial
    mat.uniforms.time.value += delta

    gl.render(screenScene, screenCamera)
  }, 1)

  return null
}

export default usePostProcess
