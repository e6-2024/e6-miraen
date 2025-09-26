import React, { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface BeakerHighlightManagerProps {
  beakersActive: boolean
  hoveredBeaker: 'a' | 'a001' | null
  beakerARef: React.MutableRefObject<THREE.Object3D | null>
  beakerA001Ref: React.MutableRefObject<THREE.Object3D | null>
}

export function BeakerHighlightManager({
  beakersActive,
  hoveredBeaker,
  beakerARef,
  beakerA001Ref
}: BeakerHighlightManagerProps) {
  
  useEffect(() => {
    const saveOriginalMaterial = (root: THREE.Object3D | null) => {
      if (!root) return
      root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          for (const material of materials as THREE.Material[]) {
            if (!material.userData.__orig) {
              material.userData.__orig = {
                transparent: material.transparent,
                opacity: material.opacity,
                depthWrite: material.depthWrite,
                depthTest: material.depthTest,
                side: material.side,
                color: (material as any).color ? (material as any).color.clone() : null,
              }
            }
          }
        }
      })
    }
    const timer = setTimeout(() => {
      saveOriginalMaterial(beakerARef.current)
      saveOriginalMaterial(beakerA001Ref.current)
    }, 100)

    return () => clearTimeout(timer)
  }, [beakerARef, beakerA001Ref])

  useFrame((state) => {
    if (!beakersActive) return

    const t = state.clock.getElapsedTime()
    const pulseIntensity = 0.7 + Math.sin(t * 3) * 0.3

    const setMaterialProperty = (material: any, property: string, value: any) => {
      if (material && material[property] !== value) {
        material[property] = value
        material.needsUpdate = true
      }
    }

    const applyHighlight = (mesh: THREE.Mesh, intensity: number) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const material of materials as any[]) {
        const orig = material?.userData?.__orig
        if (orig) {
          material.transparent = true
          const newOpacity = THREE.MathUtils.clamp((orig.opacity ?? 1) * intensity, 0.4, 0.9)
          setMaterialProperty(material, 'opacity', newOpacity)
          material.depthWrite = newOpacity >= 0.95
          
          if (material.emissive) {
            const emissiveIntensity = (1 - intensity) * 0.1
            material.emissive.setRGB(emissiveIntensity, emissiveIntensity, emissiveIntensity)
          }
        }
      }
    }

    const restore = (mesh: THREE.Mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const material of materials as any[]) {
        const orig = material?.userData?.__orig
        if (orig) {
          material.transparent = orig.transparent
          setMaterialProperty(material, 'opacity', orig.opacity ?? 1)
          material.depthWrite = orig.depthWrite
          material.depthTest = orig.depthTest
          material.side = orig.side
          
          if (material.emissive) {
            material.emissive.setHex(0x000000)
          }
          
          if (material.color && orig.color) {
            material.color.copy(orig.color)
          }
        }
      }
    }

    const applyToObject = (root: THREE.Object3D | null, fn: (mesh: THREE.Mesh) => void) => {
      if (!root) return
      root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          fn(child as THREE.Mesh)
        }
      })
    }

    if (hoveredBeaker === 'a') {
      applyToObject(beakerARef.current, (mesh) => applyHighlight(mesh, pulseIntensity))
      applyToObject(beakerA001Ref.current, restore)
    } else if (hoveredBeaker === 'a001') {
      applyToObject(beakerA001Ref.current, (mesh) => applyHighlight(mesh, pulseIntensity))
      applyToObject(beakerARef.current, restore)
    } else {
      applyToObject(beakerARef.current, restore)
      applyToObject(beakerA001Ref.current, restore)
    }
  })

  return null
}