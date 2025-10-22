// Fish.tsx
import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { thermalVertexShader, thermalFragmentShader } from '@/components/5-2-2/models/shaders/thermalShader4'

interface FishProps extends Omit<GroupProps, 'position'> {
  thermalMode?: boolean
  isHeating?: boolean
  heatingTime?: number
  heatingProgress?: number
  heatSourcePosition?: [number, number, number]
  position?: [number, number, number]
}

export function Fish({
  thermalMode = false,
  isHeating = false,
  heatingTime = 0,
  heatingProgress = 0,
  heatSourcePosition = [0, 0, 0],
  position = [0, 0, 0],
  ...props
}: FishProps) {
  const { scene } = useGLTF('models/5-2-2/Fish.glb')
  const [originalMaterials, setOriginalMaterials] = useState<Map<THREE.Mesh, THREE.Material>>(new Map())

  const [cookedTextures, setCookedTextures] = useState<{
    normal1: THREE.Texture | null
    albedo1: THREE.Texture | null
    normal2: THREE.Texture | null
    albedo2: THREE.Texture | null
  }>({ normal1: null, albedo1: null, normal2: null, albedo2: null })

  const thermalMaterialRef = useRef<THREE.ShaderMaterial>()
  const groupRef = useRef<THREE.Group>(null)
  const [prevThermalMode, setPrevThermalMode] = useState(thermalMode)

  // 모델 바운드 캐싱
  const boundsRef = useRef<{ bottomY: number; topY: number } | null>(null)

  const computeBounds = () => {
    if (!groupRef.current) return null
    const box = new THREE.Box3()
    groupRef.current.updateWorldMatrix(true, true)
    box.setFromObject(groupRef.current)
    return { bottomY: box.min.y, topY: box.max.y }
  }

  const getCurrentCenterPoint = () => {
    if (!groupRef.current) return new THREE.Vector3(...position)
    const box = new THREE.Box3()
    groupRef.current.updateWorldMatrix(true, true)
    box.setFromObject(groupRef.current)
    return box.getCenter(new THREE.Vector3())
  }

  useEffect(() => {
    const materials = new Map<THREE.Mesh, THREE.Material>()

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true

        // 원본 머티리얼을 살짝 '식재료'스럽게 보정 (Meat와 동일 로직)
        const mat = (child.material as THREE.Material).clone()
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.metalness = Math.min((mat.metalness ?? 0) * 0.1, 0.1)
          mat.roughness = Math.max((mat.roughness ?? 1) * 2.0, 1.0)
          mat.needsUpdate = true
        }
        materials.set(child, mat)
        child.material = mat
      }
    })

    if (materials.size > 0) setOriginalMaterials(materials)

    // 조리 텍스처 로드
    const loader = new THREE.TextureLoader()
    const loadTexture = (path: string) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          path,
          (texture) => {
            texture.flipY = false
            resolve(texture)
          },
          undefined,
          reject,
        )
      })

    Promise.all([
      loadTexture('/textures/5-2-2/CookedMackerel_body_Normal.png'),
      loadTexture('/textures/5-2-2/CookedMackerel_body_AlbedoTransparency.png'),
      loadTexture('/textures/5-2-2/CookedMackerel1.001_Normal.png'),
      loadTexture('/textures/5-2-2/CookedMackerel1.001_AlbedoTransparency.png'),
    ])
      .then(([normal1, albedo1, normal2, albedo2]) => {
        setCookedTextures({ normal1, albedo1, normal2, albedo2 })
      })
      .catch((error) => {
        console.warn('Cooked textures loading failed:', error)
      })

    // 초기 바운드 계산
    const b = computeBounds()
    if (b) boundsRef.current = b
  }, [scene])

  useEffect(() => {
    if (thermalMode) {
      // 모드 전환 시 기존 셰이더 정리
      if (thermalMode !== prevThermalMode && thermalMaterialRef.current) {
        thermalMaterialRef.current.dispose()
        thermalMaterialRef.current = undefined
      }

      const currentCenter = getCurrentCenterPoint()
      const b = computeBounds() || boundsRef.current
      if (b) boundsRef.current = b

      const thermalMaterial = new THREE.ShaderMaterial({
        vertexShader: thermalVertexShader,
        fragmentShader: thermalFragmentShader,
        uniforms: {
          time: { value: 0 },
          temperature: { value: 0.15 },
          heatingTime: { value: heatingTime },
          baseColor: { value: new THREE.Color(0.2, 0.4, 0.2) },
          centerPoint: { value: currentCenter },
          isHeating: { value: isHeating },
          bottomY: { value: b ? b.bottomY : 0 },
          topY: { value: b ? b.topY : 1 },
          heatProgress: { value: Math.min(Math.max(heatingProgress / 100, 0), 1) },
          lightDir: { value: new THREE.Vector3(0.6, 1.0, 0.3).normalize() },
        },
      })

      thermalMaterialRef.current = thermalMaterial

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = thermalMaterial
        }
      })
    } else {
      // thermal off → 셰이더 정리
      if (thermalMode !== prevThermalMode && thermalMaterialRef.current) {
        thermalMaterialRef.current.dispose()
        thermalMaterialRef.current = undefined
      }

      // 조리 텍스처 블렌딩 (몸통/기타 파츠 2종)
      if (cookedTextures.albedo1 || cookedTextures.albedo2) {
        const blendFactor = heatingProgress > 0 ? Math.min(heatingProgress / 100, 1.0) : 0.1

        scene.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return
          const originalMaterial = originalMaterials.get(child) as THREE.MeshStandardMaterial
          if (!originalMaterial) return

          // 이름은 GLB 내 material.name 기준 (프로젝트와 동일)
          const isBody = originalMaterial.name === 'Mackerel_body.001'
          const isOther = originalMaterial.name === 'Mackerel1.002'

          if (blendFactor > 0 && (isBody || isOther)) {
            const material = originalMaterial.clone()

            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (ctx && originalMaterial.map) {
              canvas.width = 512
              canvas.height = 512

              const originalImg = (originalMaterial.map as THREE.Texture).image as
                | HTMLImageElement
                | HTMLCanvasElement

              if (originalImg) {
                ctx.drawImage(originalImg as CanvasImageSource, 0, 0, canvas.width, canvas.height)

                ctx.globalAlpha = blendFactor
                ctx.globalCompositeOperation = 'source-over'

                const cookedImg =
                  (isBody ? cookedTextures.albedo1?.image : cookedTextures.albedo2?.image) as
                    | HTMLImageElement
                    | HTMLCanvasElement
                    | undefined

                if (cookedImg) {
                  ctx.drawImage(cookedImg as CanvasImageSource, 0, 0, canvas.width, canvas.height)
                }

                const blendedTexture = new THREE.CanvasTexture(canvas)
                blendedTexture.flipY = false
                material.map = blendedTexture
                material.needsUpdate = true
              }
            }
            child.material = material
          } else {
            child.material = originalMaterial
          }
        })
      } else {
        // 원복
        originalMaterials.forEach((material, mesh) => {
          mesh.material = material
        })
      }
    }

    setPrevThermalMode(thermalMode)
  }, [thermalMode, scene, originalMaterials, position, isHeating, heatingProgress, cookedTextures])

  // 외부 prop 변화 시 유니폼 최신화
  useEffect(() => {
    if (thermalMode && thermalMaterialRef.current) {
      const currentCenter = getCurrentCenterPoint()
      thermalMaterialRef.current.uniforms.heatingTime.value = heatingTime
      thermalMaterialRef.current.uniforms.isHeating.value = isHeating
      thermalMaterialRef.current.uniforms.centerPoint.value = currentCenter
      thermalMaterialRef.current.uniforms.heatProgress.value = Math.min(Math.max(heatingProgress / 100, 0), 1)

      const b = computeBounds() || boundsRef.current
      if (b) {
        boundsRef.current = b
        thermalMaterialRef.current.uniforms.bottomY.value = b.bottomY
        thermalMaterialRef.current.uniforms.topY.value = b.topY
      }
    }
  }, [heatingTime, isHeating, heatingProgress, thermalMode, position])

  // 프레임 업데이트
  useFrame(({ clock }) => {
    if (thermalMode && thermalMaterialRef.current) {
      thermalMaterialRef.current.uniforms.time.value = clock.getElapsedTime()

      const currentCenter = getCurrentCenterPoint()
      thermalMaterialRef.current.uniforms.centerPoint.value = currentCenter

      const b = computeBounds()
      if (b) {
        boundsRef.current = b
        thermalMaterialRef.current.uniforms.bottomY.value = b.bottomY
        thermalMaterialRef.current.uniforms.topY.value = b.topY
      }
    }
  })

  useEffect(() => {
    return () => {
      if (thermalMaterialRef.current) {
        thermalMaterialRef.current.dispose()
        thermalMaterialRef.current = undefined
      }
    }
  }, [])

  return (
    <group ref={groupRef} position={position} {...props}>
      <primitive object={scene} />
    </group>
  )
}

export default Fish
