import * as THREE from 'three'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import { useFrame, useThree } from '@react-three/fiber'

type GLTFResult = GLTF & {
  nodes: {
    Cherry_tomato2: THREE.Mesh
  }
  materials: {
    DefaultMaterial: THREE.MeshPhysicalMaterial
  }
}

interface DirectTomatoProps {
  startPosition?: [number, number, number]
  sugarConcentration?: number
  beakerRadius?: number
  waterLevel?: number
  beakerPosition?: [number, number, number]
  isDropped?: boolean
  maxRiseHeight?: number
  riseSpeed?: number
  riseSpringStiffness?: number
  riseSpringDamping?: number
  isDraggable?: boolean
  onDrop?: () => void
  onPickedUp?: () => void
}

export const DirectTomato: React.FC<DirectTomatoProps> = ({
  startPosition = [0, 2, 0],
  sugarConcentration = 0,
  beakerRadius = 0.32,
  waterLevel = 0.56,
  beakerPosition = [0, -0.6, 0],
  isDropped = false,
  maxRiseHeight,
  riseSpeed = 0.7,
  riseSpringStiffness = 10,
  riseSpringDamping = 5,
  isDraggable = false,
  onDrop,
  onPickedUp,
}) => {
  const { nodes, materials } = useGLTF('models/Sugar/tomato1.glb') as GLTFResult
  const { camera, gl, controls } = useThree()
  const meshRef = useRef<THREE.Mesh>(null!)

  const CENTER_GRAB = true
  const grabOffsetWorld = useRef(new THREE.Vector3())
  const pivotOffsetWorld = useRef(new THREE.Vector3())
  const dragPlane = useRef(new THREE.Plane())
  const dragPlaneZ = useRef<number>(0)
  const planeNormalXY = useRef(new THREE.Vector3(0, 0, 1))
  const raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const pointer = useRef<THREE.Vector2>(new THREE.Vector2())

  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const apexY = maxRiseHeight ?? startPosition[1]

  const position = useRef(new THREE.Vector3(...startPosition))
  const velocity = useRef(new THREE.Vector3(0, 0, 0))
  const isInWater = useRef(false)
  const hasDropped = useRef(false)
  const hasBouncedUp = useRef(false)

  const lastTime = useRef<number | null>(null)
  const isPageVisible = useRef(true)

  const GRAVITY = -5.0
  const WATER_DRAG = 0.94
  const AIR_DRAG = 1.0
  const BOUNCE_FACTOR = 0.3
  const MAX_DELTA = 1 / 60

  const tomatoRadius = 0.12
  const tomatoDensity = 0.95
  const waterDensity = 1.0 + sugarConcentration * 0.004
  const densityDifference = waterDensity - tomatoDensity
  const buoyancyForce = densityDifference * 3.5

  const getWorldBBoxCenter = (obj: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(obj)
    const c = new THREE.Vector3()
    box.getCenter(c)
    return c
  }

  const updatePointer = (event: PointerEvent) => {
    const rect = gl.domElement.getBoundingClientRect()
    pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (!isDraggable || isDragging || !meshRef.current) return

    event.preventDefault()
    event.stopPropagation()

    updatePointer(event)
    raycaster.current.setFromCamera(pointer.current, camera)
    const intersects = raycaster.current.intersectObject(meshRef.current, true)
    if (intersects.length === 0) return

    setIsDragging(true)

    if (controls) {
      ;(controls as any).enabled = false
    }

    const beakerZ = beakerPosition[2]
    dragPlaneZ.current = beakerZ
    dragPlane.current.setFromNormalAndCoplanarPoint(
      planeNormalXY.current,
      new THREE.Vector3(0, 0, dragPlaneZ.current)
    )

    const planeHit = new THREE.Vector3()
    raycaster.current.setFromCamera(pointer.current, camera)
    if (!raycaster.current.ray.intersectPlane(dragPlane.current, planeHit)) return
    planeHit.z = dragPlaneZ.current

    const t = meshRef.current
    const bboxCenter = getWorldBBoxCenter(t)
    const originWorld = new THREE.Vector3()
    t.getWorldPosition(originWorld)

    pivotOffsetWorld.current.copy(originWorld).sub(bboxCenter)

    if (CENTER_GRAB) {
      grabOffsetWorld.current.set(0, 0, 0)
    } else {
      grabOffsetWorld.current.copy(bboxCenter).sub(planeHit)
    }

    gl.domElement.style.cursor = 'grab'
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (!isDraggable || !meshRef.current) return

    updatePointer(event)
    raycaster.current.setFromCamera(pointer.current, camera)

    if (!isDragging) {
      const intersects = raycaster.current.intersectObject(meshRef.current, true)
      const newHovered = intersects.length > 0
      if (newHovered !== isHovered) {
        setIsHovered(newHovered)
      }
      gl.domElement.style.cursor = newHovered ? 'grab' : 'auto'
      return
    }

    const planeHit = new THREE.Vector3()
    const ok = raycaster.current.ray.intersectPlane(dragPlane.current, planeHit)
    if (!ok) return
    planeHit.z = dragPlaneZ.current

    const targetCenter = planeHit.add(grabOffsetWorld.current.clone())

    const dx = targetCenter.x - beakerPosition[0]
    const dz = targetCenter.z - beakerPosition[2]
    const r = Math.hypot(dx, dz)
    const maxCenterR = Math.max(0.0, beakerRadius - tomatoRadius)
    if (r > maxCenterR) {
      const nx = dx / r
      const nz = dz / r
      targetCenter.x = beakerPosition[0] + nx * maxCenterR
      targetCenter.z = beakerPosition[2] + nz * maxCenterR
    }

    const targetOrigin = targetCenter.clone().add(pivotOffsetWorld.current)
    position.current.copy(targetOrigin)
    velocity.current.set(0, 0, 0)
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (!isDragging) return

    setIsDragging(false)

    if (controls) {
      ;(controls as any).enabled = true
    }

    gl.domElement.style.cursor = isHovered ? 'grab' : 'auto'

    const currentPos = position.current
    const waterTop = beakerPosition[1] + waterLevel

    if (currentPos.y > waterTop + 0.5) {
      onPickedUp?.()
    } else {
      velocity.current.set(0, -0.5, 0)
    }
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden
      if (!document.hidden) {
        lastTime.current = null
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (isDropped && !hasDropped.current) {
      hasDropped.current = true
      position.current.set(...startPosition)
      velocity.current.set((Math.random() - 0.5) * 0.3, -0.5, 0.03)
      lastTime.current = null
      onDrop?.()
    } else if (!isDropped && hasDropped.current) {
      hasDropped.current = false
      isInWater.current = false
      hasBouncedUp.current = false
      position.current.set(...startPosition)
      velocity.current.set(0, 0, 0)
      lastTime.current = null
    }
  }, [isDropped, startPosition, onDrop])

  useEffect(() => {
    if (!isDraggable || !gl.domElement) return
    const element = gl.domElement

    element.addEventListener('pointerdown', handlePointerDown, { passive: false })
    element.addEventListener('pointermove', handlePointerMove, { passive: false })
    element.addEventListener('pointerup', handlePointerUp, { passive: false })

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.style.cursor = 'auto'
      if (controls) {
        ;(controls as any).enabled = true
      }
    }
  }, [isDraggable, isDragging, isHovered])

  useFrame((_, delta) => {
    if (!meshRef.current) return

    if (isDraggable) {
      const material = meshRef.current.material as THREE.MeshPhysicalMaterial
      if (material && (material as any).emissive) {
        if (isHovered || isDragging) {
          material.emissive.setRGB(0.25, 0.12, 0.12)
        } else {
          material.emissive.setRGB(0, 0, 0)
        }
      }
    }

    if (isDragging) {
      meshRef.current.position.copy(position.current)
      return
    }

    const clampedDelta = Math.min(delta, MAX_DELTA)
    const pos = position.current
    const vel = velocity.current

    if (!hasDropped.current) {
      meshRef.current.position.set(...startPosition)
      return
    }

    if (hasBouncedUp.current) {
      const displacement = apexY - pos.y
      const springForce = riseSpringStiffness * displacement
      const dampingForce = -riseSpringDamping * vel.y
      vel.y += (springForce + dampingForce) * clampedDelta
      pos.y += vel.y * clampedDelta
      if (Math.abs(displacement) < 0.01 && Math.abs(vel.y) < 0.01) {
        pos.y = apexY
        vel.y = 0
      }
      meshRef.current.position.copy(pos)
      return
    }

    const dx = pos.x - beakerPosition[0]
    const dz = pos.z - beakerPosition[2]
    const distanceFromCenter = Math.hypot(dx, dz)
    const insideBeaker = distanceFromCenter < beakerRadius - tomatoRadius * 0.5
    const atWaterLevel = pos.y <= beakerPosition[1] + waterLevel - tomatoRadius * 0.5
    const currentlyInWater = insideBeaker && atWaterLevel

    if (currentlyInWater) {
      vel.y += (GRAVITY + buoyancyForce) * clampedDelta
      vel.multiplyScalar(WATER_DRAG)
    } else {
      vel.y += GRAVITY * clampedDelta
      vel.multiplyScalar(AIR_DRAG)
    }

    pos.addScaledVector(vel, clampedDelta)

    const effectiveRadius = beakerRadius - tomatoRadius
    if (distanceFromCenter > effectiveRadius) {
      const n = new THREE.Vector3(dx, 0, dz).normalize()
      pos.x = beakerPosition[0] + n.x * effectiveRadius * 0.9
      pos.z = beakerPosition[2] + n.z * effectiveRadius * 0.9
      const radialVel = vel.x * n.x + vel.z * n.z
      if (radialVel > 0) {
        vel.x -= n.x * radialVel * (1 + BOUNCE_FACTOR)
        vel.z -= n.z * radialVel * (1 + BOUNCE_FACTOR)
      }
    }

    if (distanceFromCenter < beakerRadius) {
      const bottomY = beakerPosition[1] - 0.25 + tomatoRadius
      if (pos.y < bottomY) {
        pos.y = bottomY
        vel.y = Math.abs(vel.y) * BOUNCE_FACTOR
        if (sugarConcentration! > 20 && !hasBouncedUp.current) {
          hasBouncedUp.current = true
          vel.y = riseSpeed
        }
      }
    }

    if (pos.y < beakerPosition[1] - 1.0) {
      if (hasBouncedUp.current) {
        pos.y = apexY
        vel.set(0, 0, 0)
      } else {
        pos.y = beakerPosition[1] - 0.25 + tomatoRadius
        vel.y = 0
      }
    }

    if (pos.length() > 3) {
      pos.normalize().multiplyScalar(3)
      vel.set(0, 0, 0)
    }
    if (pos.y > startPosition[1] + 0.5) {
      pos.y = startPosition[1] + 0.5
      vel.y = Math.min(0, vel.y)
    }

    meshRef.current.position.copy(pos)
    meshRef.current.rotation.x += vel.y * clampedDelta * 0.5
    meshRef.current.rotation.z += vel.x * clampedDelta * 0.5
  })

  return (
    <mesh
      ref={meshRef}
      castShadow
      receiveShadow
      geometry={nodes.Cherry_tomato2.geometry}
      rotation={[Math.PI/2, 0, Math.PI/2]}
      material={materials.DefaultMaterial}
      scale={0.09}
    />
  )
}

