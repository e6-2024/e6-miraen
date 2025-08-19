'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const COLLISION_LAYER = 2

type OrientationMode = 'face' | 'yaw' | 'fixed'

interface CollisionAwareCleaningToolProps {
  modelPath: string
  visible: boolean
  scale?: number
  rotationOffset?: [number, number, number]
  onSpray?: () => void
  isSprayActive?: boolean
  collisionOffset?: [number, number, number]
  collisionType?: 'surface' | 'proximity' | 'strict'
  debugCollision?: boolean
  orientationMode?: OrientationMode
  rotationSlerp?: number
}

export const CollisionAwareCleaningTool = ({
  modelPath,
  visible,
  scale = 1,
  rotationOffset = [0, 0, 0],
  onSpray,
  isSprayActive = false,
  collisionOffset = [0, 0, 0],
  collisionType = 'surface',
  debugCollision = false,
  orientationMode = 'yaw',
  rotationSlerp = 0.2,
}: CollisionAwareCleaningToolProps) => {
  const gltf = useGLTF(modelPath)
  const meshRef = useRef<THREE.Group>(null)
  const { camera, scene } = useThree()

  const mousePosition = useRef(new THREE.Vector2())
  const [currentPosition, setCurrentPosition] = useState(() => new THREE.Vector3())
  const [targetPosition, setTargetPosition] = useState(() => new THREE.Vector3())

  const [sprayAnimations, setSprayAnimations] = useState<Array<{ id: number; startTime: number; duration: number }>>([])
  const sprayTextureRef = useRef<THREE.Mesh[]>([])

  const tmpVec = useRef(new THREE.Vector3())
  const up = useRef(new THREE.Vector3(0, 1, 0))
  const qBase = useRef(new THREE.Quaternion())
  const qTarget = useRef(new THREE.Quaternion())
  const qOffset = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotationOffset, 'XYZ')),
    [rotationOffset]
  )

  const configureShadows = (root: THREE.Object3D) => {
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        const material = child.material as THREE.Material | THREE.Material[] | undefined
        if (!material) return
        const mats = Array.isArray(material) ? material : [material]
        for (const mat of mats) {
          const anyMat = mat as any
          if (anyMat.transparent && anyMat.opacity < 0.9) {
            anyMat.side = THREE.DoubleSide
            child.castShadow = false
          } else {
            anyMat.side = THREE.FrontSide
          }
          anyMat.needsUpdate = true
        }
      }
    })
  }

  const checkCollision = (targetPos: THREE.Vector3): THREE.Vector3 => {
    const raycaster = new THREE.Raycaster()
    raycaster.layers.set(COLLISION_LAYER)

    const directions = [new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0.1), new THREE.Vector3(0, -1, -0.1)]

    let bestIntersect: THREE.Intersection | null = null
    let shortestDistance = Infinity

    for (const direction of directions) {
      direction.normalize()
      raycaster.set(targetPos.clone().add(new THREE.Vector3(0, 2, 0)), direction)
      const intersects = raycaster.intersectObjects(scene.children, true)
      if (intersects.length > 0) {
        const intersect = intersects[0]
        if (intersect.distance < shortestDistance) {
          shortestDistance = intersect.distance
          bestIntersect = intersect
        }
      }
    }

    if (bestIntersect) {
      const adjustedPosition = bestIntersect.point.clone()
      if (bestIntersect.face && bestIntersect.object instanceof THREE.Mesh) {
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(bestIntersect.object.matrixWorld)
        const worldNormal = bestIntersect.face.normal.clone().applyMatrix3(normalMatrix).normalize()
        adjustedPosition.add(worldNormal.multiplyScalar(0.3))
      } else {
        adjustedPosition.y += 0.3
      }
      adjustedPosition.add(new THREE.Vector3(...collisionOffset))
      return adjustedPosition
    }

    return targetPos
  }

  useEffect(() => {
    if (!gltf.scene) return
    const clonedScene = gltf.scene.clone()
    configureShadows(clonedScene)

    sprayTextureRef.current = []
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && (child.name.includes('Plane') || child.name.toLowerCase().includes('plane'))) {
        sprayTextureRef.current.push(child)
        child.visible = true
        child.castShadow = false
        const material = child.material as any
        const mats = Array.isArray(material) ? material : [material]
        for (const mat of mats) {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
            mat.transparent = true
            mat.opacity = 0
            mat.side = THREE.DoubleSide
            if (mat.map) {
              mat.map.wrapS = THREE.RepeatWrapping
              mat.map.wrapT = THREE.RepeatWrapping
              mat.map.repeat.set(1, 1)
              mat.map.offset.set(0, 0)
              mat.map.needsUpdate = true
            }
            mat.needsUpdate = true
          }
        }
      }
    })

    clonedScene.traverse((obj: any) => obj.layers && obj.layers.disable(COLLISION_LAYER))

    if (meshRef.current) {
      meshRef.current.clear()
      meshRef.current.add(clonedScene)
    }
  }, [gltf])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mousePosition.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }

    const triggerSpray = () => {
      if (!visible) return
      onSpray?.()
      const now = Date.now()
      setSprayAnimations((prev) => [...prev, { id: now, startTime: now, duration: 800 }])
    }

    const handleClick = () => triggerSpray()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        triggerSpray()
      }
    }

    if (visible) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('click', handleClick)
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, onSpray])

  useFrame(() => {
    if (meshRef.current && visible) {
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mousePosition.current, camera)
      const distance = 2
      const direction = raycaster.ray.direction.clone()
      const rawTargetPosition = camera.position.clone().add(direction.multiplyScalar(distance))

      let finalPosition: THREE.Vector3
      switch (collisionType) {
        case 'proximity':
          finalPosition = checkCollision(rawTargetPosition)
          break
        case 'strict':
          finalPosition = checkCollision(rawTargetPosition)
          finalPosition.y -= 0.2
          break
        default:
          finalPosition = checkCollision(rawTargetPosition)
      }

      setTargetPosition(finalPosition)

      setCurrentPosition((prev) => {
        const next = prev.clone().lerp(finalPosition, 0.15)
        meshRef.current!.position.copy(next)
        return next
      })

      const obj = meshRef.current
      obj.scale.setScalar(scale)

      if (orientationMode === 'fixed') {
        qTarget.current.copy(qOffset)
      } else if (orientationMode === 'face') {
        obj.lookAt(camera.position)
        qBase.current.copy(obj.quaternion)
        qTarget.current.copy(qBase.current).multiply(qOffset)
      } else {
        const v = tmpVec.current
        v.copy(camera.position).sub(obj.position)
        v.y = 0
        if (v.lengthSq() < 1e-6) {
          qTarget.current.copy(obj.quaternion)
        } else {
          v.normalize()
          const m = new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), v, up.current)
          qBase.current.setFromRotationMatrix(m).invert()
          qTarget.current.copy(qBase.current).multiply(qOffset)
        }
      }

      if (rotationSlerp > 0) {
        obj.quaternion.slerp(qTarget.current, rotationSlerp)
      } else {
        obj.quaternion.copy(qTarget.current)
      }
    }

    const now = Date.now()
    const active = sprayAnimations.filter((a) => now - a.startTime < a.duration)
    if (active.length !== sprayAnimations.length) setSprayAnimations(active)

    if (sprayTextureRef.current.length > 0) {
      sprayTextureRef.current.forEach((mesh) => {
        const material = mesh.material as any
        const mats = Array.isArray(material) ? material : [material]
        if (active.length > 0) {
          for (const mat of mats) {
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
              mat.opacity = 1
              mat.needsUpdate = true
            }
          }
        } else {
          for (const mat of mats) {
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
              mat.opacity = 0
              mat.needsUpdate = true
            }
          }
        }
      })
    }
  })

  if (!visible) return null
  return <group ref={meshRef} />
}

/* ---- Tool wrappers ---- */

export const CollisionSprayTool = ({
  visible,
  onSpray,
  isSprayActive = false,
}: {
  visible: boolean
  onSpray?: () => void
  isSprayActive?: boolean
}) => (
  <CollisionAwareCleaningTool
    modelPath='/models/6-1-1/Window/Window_cleaner_Spray.glb'
    visible={visible}
    scale={1.2}
    rotationOffset={[Math.PI/3, Math.PI-Math.PI/6, 0]}
    orientationMode='fixed'
    onSpray={onSpray}
    isSprayActive={isSprayActive}
    collisionOffset={[0, 0.15, 0]}
    collisionType='proximity'
    debugCollision={false}
  />
)

export const CollisionVinegarTool = ({
  visible,
  onSpray,
  isSprayActive = false,
}: {
  visible: boolean
  onSpray?: () => void
  isSprayActive?: boolean
}) => (
  <CollisionAwareCleaningTool
    modelPath='/models/6-1-1/Vinegar_Spray/Vinegar.glb'
    visible={visible}
    scale={4}
    rotationOffset={[-Math.PI/4, Math.PI, 0]}
    orientationMode='yaw'
    onSpray={onSpray}
    isSprayActive={isSprayActive}
    collisionOffset={[0, 0.2, 0]}
    collisionType='proximity'
    debugCollision={false}
  />
)

export const CollisionBleachTool = ({
  visible,
  onSpray,
  isSprayActive = false,
}: {
  visible: boolean
  onSpray?: () => void
  isSprayActive?: boolean
}) => (
  <CollisionAwareCleaningTool
    modelPath='/models/6-1-1/Bleach/Bleach.glb'
    visible={visible}
    scale={4}
    rotationOffset={[-Math.PI/4, Math.PI, 0]}
    orientationMode='yaw'
    onSpray={onSpray}
    isSprayActive={isSprayActive}
    collisionOffset={[0, 0.2, 0]}
    collisionType='proximity'
    debugCollision={false}
  />
)

export const CollisionToiletCleanerTool = ({
  visible,
  onSpray,
  isSprayActive = false,
}: {
  visible: boolean
  onSpray?: () => void
  isSprayActive?: boolean
}) => (
  <CollisionAwareCleaningTool
    modelPath='/models/6-1-1/Toilet_bleach/Toilet_Bleach.gltf'
    visible={visible}
    scale={2}
    rotationOffset={[-Math.PI/2, Math.PI-Math.PI/6, 0]}
    orientationMode='fixed'
    onSpray={onSpray}
    isSprayActive={isSprayActive}
    collisionOffset={[0, 0.1, 0]}
    collisionType='proximity'
    debugCollision={false}
  />
)

export const CollisionGlassRagTool = ({ visible }: { visible: boolean }) => (
  <CollisionAwareCleaningTool
    modelPath='/models/6-1-1/Rag/Rag.glb'
    visible={visible}
    scale={0.05}
    rotationOffset={[0, Math.PI/2, 0]}
    orientationMode='fixed'
    collisionOffset={[0, 0.1, 0]}
    collisionType='strict'
    debugCollision={false}
  />
)

export const CollisionToiletBrushTool = ({ visible }: { visible: boolean }) => (
  <CollisionAwareCleaningTool
    modelPath='/models/6-1-1/Toilet_Brush/Toilet_Brush.glb'
    visible={visible}
    scale={0.7}
    rotationOffset={[-Math.PI /4, -Math.PI/2, 0]}
    orientationMode='fixed'
    collisionOffset={[0, 0.3, 0]}
    collisionType='strict'
    debugCollision={false}
  />
)

export const CollisionBathroomScrubTool = ({ visible }: { visible: boolean }) => (
  <CollisionAwareCleaningTool
    modelPath='/models/6-1-1/Bathroom_Scrub/scrub.glb'
    visible={visible}
    scale={0.01}
    rotationOffset={[0, -Math.PI / 10, 0]}
    orientationMode='fixed'
    collisionOffset={[0, 0.17, 0]}
    collisionType='strict'
    debugCollision={false}
  />
)

/* ---- GLTF Preloads ---- */
useGLTF.preload('/models/6-1-1/Window/Window_cleaner_Spray.glb')
useGLTF.preload('/models/6-1-1/Vinegar_Spray/Vinegar.glb')
useGLTF.preload('/models/6-1-1/Bleach/Bleach.glb')
useGLTF.preload('/models/6-1-1/Toilet_bleach/Toilet_Bleach.gltf')
useGLTF.preload('/models/6-1-1/Rag/Rag.glb')
useGLTF.preload('/models/6-1-1/Toilet_Brush/Toilet_Brush.glb')
useGLTF.preload('/models/6-1-1/Bathroom_Scrub/scrub.glb')
