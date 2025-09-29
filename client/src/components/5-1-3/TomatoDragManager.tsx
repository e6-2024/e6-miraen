// components/5-1-3/TomatoDragManager.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface TomatoDragManagerProps {
  tomatoActive: boolean
  currentModel: any
  currentSpoonModel: any
  beakerARef: React.MutableRefObject<THREE.Object3D | null>
  beakerA001Ref: React.MutableRefObject<THREE.Object3D | null>
  onTomatoDropped: (beaker: 'left' | 'right', tomatoPosition: [number, number, number]) => void
  leftTomatoDropped: boolean
  rightTomatoDropped: boolean
  showTomatoWiping: boolean
  leftBeakerPosition?: [number, number, number]
  rightBeakerPosition?: [number, number, number]
  leftWaterLevel?: number
  rightWaterLevel?: number
  beakerRadiusOverride?: number
}

type BeakerGeom = {
  center: THREE.Vector3
  rimY: number
  innerR: number
}

export function TomatoDragManager({
  tomatoActive,
  currentModel,
  currentSpoonModel,
  beakerARef,
  beakerA001Ref,
  onTomatoDropped,
  leftTomatoDropped,
  rightTomatoDropped,
  showTomatoWiping,
  leftBeakerPosition = [-2.15, -0.5, -0.2],
  rightBeakerPosition = [2.34, -0.5, -0.2],
  leftWaterLevel = 0.9,
  rightWaterLevel = 0.9,
  beakerRadiusOverride,
}: TomatoDragManagerProps) {
  const { camera, gl, controls, scene } = useThree()

  const tomatoRef = useRef<THREE.Object3D | null>(null)
  const originalParentRef = useRef<THREE.Object3D | null>(null)
  const originalLocalPosRef = useRef(new THREE.Vector3())
  const originalWorldPosRef = useRef(new THREE.Vector3())

  const raycaster = useRef(new THREE.Raycaster())
  const pointerNDC = useRef(new THREE.Vector2())
  const draggingRef = useRef(false)
  const [hovered, setHovered] = useState(false)

  const dragPlane = useRef(new THREE.Plane())
  const dragPlaneZ = useRef<number>(0)
  const planeNormalXY = useRef(new THREE.Vector3(0, 0, 1))

  const HOVER_EMISSIVE = new THREE.Color(0.18, 0.08, 0.08)
  const ZERO = new THREE.Color(0, 0, 0)

  const TOMATO_R = 0.12
  const R_PAD = 0.09
  const Y_PAD = 1.0
  const SLACK = 0.02

  const grabOffsetWorld = useRef(new THREE.Vector3())
  const pivotOffsetWorld = useRef(new THREE.Vector3())
  const CENTER_GRAB = true

  const updatePointerFromEvent = (event: PointerEvent) => {
    const rect = gl.domElement.getBoundingClientRect()
    pointerNDC.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointerNDC.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  const getWorldBBoxCenter = (obj: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(obj)
    const c = new THREE.Vector3()
    box.getCenter(c)
    return c
  }

  const getBeakerGeom = useCallback(
    (
      ref: React.MutableRefObject<THREE.Object3D | null>,
      fallbackPos: THREE.Vector3,
      waterLevel: number,
    ): BeakerGeom => {
      const center = new THREE.Vector3().copy(fallbackPos)
      let rimY = fallbackPos.y + waterLevel
      let innerR = beakerRadiusOverride ?? 0.57

      const obj = ref.current
      if (obj) {
        obj.updateWorldMatrix(true, true)
        obj.getWorldPosition(center)
        const box = new THREE.Box3().setFromObject(obj)
        const size = new THREE.Vector3()
        box.getSize(size)
        const estRadius = Math.max(size.x, size.z) * 0.5 * 0.48
        if (beakerRadiusOverride == null) {
          innerR = THREE.MathUtils.clamp(estRadius, 0.45, 0.75)
        }
      }

      return { center, rimY, innerR }
    },
    [beakerRadiusOverride],
  )

  useEffect(() => {
    if (!tomatoActive) return

    const candidates: (THREE.Object3D | undefined)[] = [currentSpoonModel?.scene, currentModel?.scene]
    let found: THREE.Object3D | null = null

    for (const root of candidates) {
      if (!root || found) continue
      found = root.getObjectByName('Cherry_tomatos') as THREE.Object3D | null
      if (!found) found = root.getObjectByName('Cherry_tomato2') as THREE.Object3D | null
      if (found) break
      root.traverse((child) => {
        if (found) return
        const n = child.name?.toLowerCase() || ''
        if (n.includes('cherry_tomato') || n.includes('tomato')) found = child
      })
    }

    tomatoRef.current = found || null
    if (tomatoRef.current) {
      originalParentRef.current = tomatoRef.current.parent ?? null
      originalLocalPosRef.current.copy(tomatoRef.current.position)
      tomatoRef.current.getWorldPosition(originalWorldPosRef.current)
    }
  }, [tomatoActive, currentModel, currentSpoonModel])

  useEffect(() => {
    const t = tomatoRef.current
    if (!t) return

    if (leftTomatoDropped || rightTomatoDropped || showTomatoWiping) {
      t.visible = false
      draggingRef.current = false
      gl.domElement.style.cursor = 'auto'
      if (originalParentRef.current && t.parent === scene) {
        originalParentRef.current.attach(t)
      }
    } else {
      t.visible = tomatoActive
      if (originalParentRef.current && t.parent !== originalParentRef.current) {
        originalParentRef.current.attach(t)
      }
      t.position.copy(originalLocalPosRef.current)
    }
  }, [leftTomatoDropped, rightTomatoDropped, showTomatoWiping, tomatoActive, gl.domElement, scene])

  const hoverCheck = useCallback(() => {
    const t = tomatoRef.current
    if (!t || !tomatoActive || leftTomatoDropped || rightTomatoDropped || showTomatoWiping) {
      if (hovered) setHovered(false)
      gl.domElement.style.cursor = 'auto'
      return
    }
    raycaster.current.setFromCamera(pointerNDC.current, camera)
    const hit = raycaster.current.intersectObject(t, true)
    const h = hit.length > 0
    if (h !== hovered) setHovered(h)
    gl.domElement.style.cursor = h ? 'grab' : 'auto'
  }, [camera, gl.domElement, hovered, tomatoActive, leftTomatoDropped, rightTomatoDropped, showTomatoWiping])

  const clampToBeakerRim = (p: THREE.Vector3, g: BeakerGeom) => {
    const minY = g.rimY - Y_PAD * 1.0
    if (p.y < minY) p.y = minY
    if (p.y <= g.rimY + 0.05) {
      const dx = p.x - g.center.x
      const dz = p.z - g.center.z
      const r = Math.hypot(dx, dz)
      const minR = g.innerR + TOMATO_R + R_PAD + 0.1
      if (r < minR) {
        if (r < 1e-4) {
          p.x = g.center.x + minR
          p.z = g.center.z
        } else {
          const nx = dx / r
          const nz = dz / r
          p.x = g.center.x + nx * minR
          p.z = g.center.z + nz * minR
        }
      }
    }
  }

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!tomatoActive || !tomatoRef.current || leftTomatoDropped || rightTomatoDropped || showTomatoWiping) return

      e.preventDefault()
      e.stopPropagation()
      updatePointerFromEvent(e)

      const t = tomatoRef.current
      raycaster.current.setFromCamera(pointerNDC.current, camera)
      const isects = raycaster.current.intersectObject(t, true)
      if (isects.length === 0) return

      draggingRef.current = true

      if (controls && 'enabled' in (controls as any)) {
        ;(controls as any).enabled = false
      }

      const beakerZ = (leftBeakerPosition[2] + rightBeakerPosition[2]) * 0.5
      dragPlaneZ.current = beakerZ
      dragPlane.current.setFromNormalAndCoplanarPoint(
        planeNormalXY.current,
        new THREE.Vector3(0, 0, dragPlaneZ.current),
      )

      if (t.parent !== scene) {
        originalParentRef.current = t.parent ?? null
        scene.attach(t)
      }

      const planeHit = new THREE.Vector3()
      raycaster.current.setFromCamera(pointerNDC.current, camera)
      if (!raycaster.current.ray.intersectPlane(dragPlane.current, planeHit)) return
      planeHit.z = dragPlaneZ.current

      const bboxCenter = getWorldBBoxCenter(t)
      const originWorld = new THREE.Vector3()
      t.getWorldPosition(originWorld)

      pivotOffsetWorld.current.copy(originWorld).sub(bboxCenter)

      if (CENTER_GRAB) {
        grabOffsetWorld.current.set(0, 0, 0)
      } else {
        grabOffsetWorld.current.copy(bboxCenter).sub(planeHit)
      }

      gl.domElement.style.cursor = 'grabbing'
    },
    [
      camera,
      controls,
      gl.domElement,
      scene,
      tomatoActive,
      leftTomatoDropped,
      rightTomatoDropped,
      showTomatoWiping,
      leftBeakerPosition,
      rightBeakerPosition,
    ],
  )

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      updatePointerFromEvent(e)

      if (!draggingRef.current) {
        hoverCheck()
        return
      }

      const t = tomatoRef.current
      if (!t) return

      raycaster.current.setFromCamera(pointerNDC.current, camera)
      const planeHit = new THREE.Vector3()
      const ok = raycaster.current.ray.intersectPlane(dragPlane.current, planeHit)
      if (!ok) return
      planeHit.z = dragPlaneZ.current

      const targetCenter = planeHit.add(grabOffsetWorld.current.clone())

      const leftGeom = getBeakerGeom(beakerARef, new THREE.Vector3(...leftBeakerPosition), leftWaterLevel)
      const rightGeom = getBeakerGeom(beakerA001Ref, new THREE.Vector3(...rightBeakerPosition), rightWaterLevel)

      clampToBeakerRim(targetCenter, leftGeom)
      clampToBeakerRim(targetCenter, rightGeom)

      const targetOrigin = targetCenter.clone().add(pivotOffsetWorld.current)
      t.position.copy(targetOrigin)
    },
    [
      camera,
      hoverCheck,
      beakerARef,
      beakerA001Ref,
      leftBeakerPosition,
      rightBeakerPosition,
      leftWaterLevel,
      rightWaterLevel,
      getBeakerGeom,
    ],
  )

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current) return
      draggingRef.current = false

      if (controls && 'enabled' in (controls as any)) {
        ;(controls as any).enabled = true
      }
      gl.domElement.style.cursor = hovered ? 'grab' : 'auto'

      const t = tomatoRef.current
      if (!t) return

      const tomatoCenter = getWorldBBoxCenter(t)

      const leftGeom = getBeakerGeom(beakerARef, new THREE.Vector3(...leftBeakerPosition), leftWaterLevel)
      const rightGeom = getBeakerGeom(beakerA001Ref, new THREE.Vector3(...rightBeakerPosition), rightWaterLevel)

      const insideCircle = (p: THREE.Vector3, g: BeakerGeom) => {
        const r = Math.hypot(p.x - g.center.x, p.z - g.center.z)
        const thresh = g.innerR - TOMATO_R + SLACK
        return r <= Math.max(0, thresh)
      }
      const insideY = (p: THREE.Vector3, g: BeakerGeom) => p.y >= g.rimY - Y_PAD && p.y <= g.rimY + Y_PAD

      let dropped: 'left' | 'right' | null = null
      if (insideCircle(tomatoCenter, leftGeom) && insideY(tomatoCenter, leftGeom)) {
        dropped = 'left'
      } else if (insideCircle(tomatoCenter, rightGeom) && insideY(tomatoCenter, rightGeom)) {
        dropped = 'right'
      }

      if (dropped) {
        onTomatoDropped(dropped, [tomatoCenter.x, tomatoCenter.y, tomatoCenter.z])
        t.visible = false
        if (originalParentRef.current && t.parent === scene) {
          originalParentRef.current.attach(t)
        }
      } else {
        if (originalParentRef.current && t.parent === scene) {
          originalParentRef.current.attach(t)
          t.position.copy(originalLocalPosRef.current)
        } else {
          t.position.copy(originalLocalPosRef.current)
        }
      }
    },
    [
      beakerARef,
      beakerA001Ref,
      controls,
      gl.domElement,
      hovered,
      leftBeakerPosition,
      rightBeakerPosition,
      leftWaterLevel,
      rightWaterLevel,
      getBeakerGeom,
      onTomatoDropped,
      scene,
    ],
  )

  useEffect(() => {
    const el = gl.domElement
    el.addEventListener('pointerdown', onPointerDown, { passive: false })
    el.addEventListener('pointermove', onPointerMove, { passive: false })
    el.addEventListener('pointerup', onPointerUp, { passive: false })

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.style.cursor = 'auto'
      draggingRef.current = false
      if (controls && 'enabled' in (controls as any)) {
        ;(controls as any).enabled = true
      }
      const t = tomatoRef.current
      if (t && originalParentRef.current && t.parent === scene) {
        originalParentRef.current.attach(t)
      }
    }
  }, [gl.domElement, onPointerDown, onPointerMove, onPointerUp, controls, scene])

  useFrame(() => {
    const t = tomatoRef.current
    if (!t) return
    if (!tomatoActive || leftTomatoDropped || rightTomatoDropped || showTomatoWiping) return

    t.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh || !mesh.material) return
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const m of materials) {
        const mat = m as any
        if ('emissive' in mat) {
          if (draggingRef.current || hovered) mat.emissive?.copy(HOVER_EMISSIVE)
          else mat.emissive?.copy(ZERO)
        }
      }
    })
  })

  return null
}
