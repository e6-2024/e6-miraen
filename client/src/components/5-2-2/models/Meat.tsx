// Meat.tsx - 구워지는 방향을 조절할 수 있는 버전
import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { thermalVertexShader, thermalFragmentShader } from '@/components/5-2-2/models/shaders/thermalShader'

interface MeatProps extends Omit<GroupProps, 'position'> {
  thermalMode?: boolean
  isHeating?: boolean
  heatingTime?: number
  heatingProgress?: number
  heatSourcePosition?: [number, number, number]
  position?: [number, number, number]
}

// ⭐ 구워지는 방향 설정 (여기를 변경하세요!)
type CookingDirection = 'Y_BOTTOM_TO_TOP' | 'Y_TOP_TO_BOTTOM' | 'X_LEFT_TO_RIGHT' | 'X_RIGHT_TO_LEFT' | 'DIAGONAL'
const COOKING_DIRECTION: CookingDirection = 'X_RIGHT_TO_LEFT' // 기본값: 아래에서 위로

export function Meat({
  thermalMode = false,
  isHeating = false,
  heatingTime = 0,
  heatingProgress = 0,
  heatSourcePosition = [0, 0, 0],
  position = [0, 0, 0],
  ...props
}: MeatProps) {
  const { scene } = useGLTF('models/5-2-2/Meat.glb')
  const [originalMaterials, setOriginalMaterials] = useState<Map<THREE.Mesh, THREE.Material>>(new Map())
  const [cookedTexture, setCookedTexture] = useState<THREE.Texture | null>(null)
  const [cookedNorTexture, setCookedNormal] = useState<THREE.Texture | null>(null)
  const [isReady, setIsReady] = useState(false)

  const thermalMaterialRef = useRef<THREE.ShaderMaterial>()
  const groupRef = useRef<THREE.Group>(null)
  const [prevThermalMode, setPrevThermalMode] = useState(thermalMode)

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

  // 방향에 따라 그라디언트 설정을 반환하는 함수
  const getGradientConfig = (direction: CookingDirection) => {
    switch (direction) {
      case 'Y_BOTTOM_TO_TOP': // 아래에서 위로 (UV의 V축 기준)
        return { x0: 0, y0: 512, x1: 0, y1: 0 }
      
      case 'Y_TOP_TO_BOTTOM': // 위에서 아래로
        return { x0: 0, y0: 0, x1: 0, y1: 512 }
      
      case 'X_LEFT_TO_RIGHT': // 왼쪽에서 오른쪽으로 (UV의 U축 기준)
        return { x0: 0, y0: 0, x1: 512, y1: 0 }
      
      case 'X_RIGHT_TO_LEFT': // 오른쪽에서 왼쪽으로
        return { x0: 512, y0: 0, x1: 0, y1: 0 }
      
      case 'DIAGONAL': // 대각선 (왼쪽 아래에서 오른쪽 위로)
        return { x0: 0, y0: 512, x1: 512, y1: 0 }
      
      default:
        return { x0: 0, y0: 512, x1: 0, y1: 0 }
    }
  }

  useEffect(() => {
    const materials = new Map<THREE.Mesh, THREE.Material>()

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true

        if (!originalMaterials.has(child)) {
          const material = child.material.clone()

          if (material instanceof THREE.MeshStandardMaterial) {
            material.metalness = Math.min(material.metalness * 0.1, 0.1)
            material.roughness = Math.max(material.roughness * 2.0, 1.0)
            material.needsUpdate = true
          }

          materials.set(child, material)
          child.material = material
        }
      }
    })

    if (materials.size > 0) {
      setOriginalMaterials(materials)
    }

    const loader = new THREE.TextureLoader()
    loader.load(
      '/textures/5-2-2/CookedSteak1.001_AlbedoTransparency.png',
      (texture) => {
        texture.flipY = false
        setCookedTexture(texture)
      },
      undefined,
      (error) => {
        console.warn('Cooked Albedo texture loading failed:', error)
        setIsReady(true)
      },
    )

    loader.load(
      '/textures/5-2-2/CookedSteak1.001_Normal.png',
      (texture) => {
        texture.flipY = false
        setCookedNormal(texture)
      },
      undefined,
      (error) => {
        console.warn('Cooked Normal texture loading failed:', error)
      },
    )
    const b = computeBounds()
    if (b) boundsRef.current = b
  }, [scene])

  useEffect(() => {
    if (thermalMode) {
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
          temperature: { value: 0.0 },
          heatingTime: { value: heatingTime },
          baseColor: { value: new THREE.Color(0.9, 0.3, 0.1) },
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
      if (thermalMode !== prevThermalMode && thermalMaterialRef.current) {
        thermalMaterialRef.current.dispose()
        thermalMaterialRef.current = undefined
      }

      if (cookedTexture) {
        const blendFactor = heatingProgress > 0 ? Math.min(heatingProgress / 100, 1.0) : 0.075

        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const originalMaterial = originalMaterials.get(child) as THREE.MeshStandardMaterial

            if (originalMaterial && blendFactor > 0) {
              const material = originalMaterial.clone()

              if (material.name === 'Steak1.002') {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                if (ctx && originalMaterial.map && cookedTexture) {
                  canvas.width = 512
                  canvas.height = 512

                  const originalImg = (originalMaterial.map as THREE.Texture).image as
                    | HTMLImageElement
                    | HTMLCanvasElement
                  if (originalImg) {
                    // 원본 이미지 그리기
                    ctx.drawImage(originalImg as CanvasImageSource, 0, 0, canvas.width, canvas.height)

                    // ⭐ 설정된 방향에 따라 그라디언트 생성
                    const gradConfig = getGradientConfig(COOKING_DIRECTION)
                    const gradient = ctx.createLinearGradient(
                      gradConfig.x0, 
                      gradConfig.y0, 
                      gradConfig.x1, 
                      gradConfig.y1
                    )
                    
                    // blendFactor에 따라 그라디언트의 진행도 조절
                    const cookProgress = blendFactor * 1.5 // 속도 조절 (더 크면 빨리, 작으면 느리게)
                    
                    if (cookProgress < 1.0) {
                      // 진행 중: 점진적으로
                      gradient.addColorStop(0, `rgba(255, 255, 255, 1)`)
                      gradient.addColorStop(Math.min(cookProgress, 0.99), `rgba(255, 255, 255, 1)`)
                      gradient.addColorStop(Math.min(cookProgress + 0.15, 1.0), `rgba(255, 255, 255, 0)`) // 0.15는 전환 영역 크기
                      gradient.addColorStop(1, `rgba(255, 255, 255, 0)`)
                    } else {
                      // 완료: 전체에 적용
                      gradient.addColorStop(0, `rgba(255, 255, 255, 1)`)
                      gradient.addColorStop(1, `rgba(255, 255, 255, 1)`)
                    }

                    // 임시 캔버스에 cooked 텍스처 + 그라디언트 마스크 적용
                    const tempCanvas = document.createElement('canvas')
                    tempCanvas.width = canvas.width
                    tempCanvas.height = canvas.height
                    const tempCtx = tempCanvas.getContext('2d')
                    
                    if (tempCtx) {
                      const cookedImg = cookedTexture.image as HTMLImageElement | HTMLCanvasElement
                      if (cookedImg) {
                        // cooked 이미지 그리기
                        tempCtx.drawImage(cookedImg as CanvasImageSource, 0, 0, canvas.width, canvas.height)
                        
                        // 그라디언트 마스크 적용
                        tempCtx.globalCompositeOperation = 'destination-in'
                        tempCtx.fillStyle = gradient
                        tempCtx.fillRect(0, 0, canvas.width, canvas.height)
                      }
                      
                      // 마스크 적용된 cooked 이미지를 원본 위에 합성
                      ctx.globalCompositeOperation = 'source-over'
                      ctx.drawImage(tempCanvas, 0, 0)
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
            } else if (originalMaterial) {
              child.material = originalMaterial
            }
          }
        })

        if (!isReady) {
          setIsReady(true)
        }
      } else {
        originalMaterials.forEach((material, mesh) => {
          mesh.material = material
        })
      }
    }

    setPrevThermalMode(thermalMode)
  }, [thermalMode, scene, originalMaterials, position, isHeating, heatingProgress, cookedTexture, isReady])

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
  }, [heatingTime, isHeating, thermalMode, position])

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
    <group ref={groupRef} position={position} visible={isReady} {...props}>
      <primitive object={scene} />
    </group>
  )
}

export default Meat