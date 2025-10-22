// Meat.tsx
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
                    ctx.drawImage(originalImg as CanvasImageSource, 0, 0, canvas.width, canvas.height)

                    ctx.globalAlpha = blendFactor
                    ctx.globalCompositeOperation = 'source-over'
                    const cookedImg = cookedTexture.image as HTMLImageElement | HTMLCanvasElement
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