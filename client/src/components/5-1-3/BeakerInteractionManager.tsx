// components/5-1-3/BeakerInteractionManager.tsx
import React, { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface GLBModel {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
}

interface BeakerInteractionManagerProps {
  beakersActive: boolean
  beakerARef: React.MutableRefObject<THREE.Object3D | null>
  beakerA001Ref: React.MutableRefObject<THREE.Object3D | null>
  hoveredBeaker: 'a' | 'a001' | null
  setHoveredBeaker: (beaker: 'a' | 'a001' | null) => void
  selectedBeaker: 'left' | 'right' | null
  lastSelectedSideRef: React.MutableRefObject<'left' | 'right' | null>
  spoonLeftModel: GLBModel
  spoonRightModel: GLBModel
  selectingRef: React.MutableRefObject<boolean>
  onBeakerSelected: (beaker: 'left' | 'right') => void
  setSelectedBeaker: (beaker: 'left' | 'right' | null) => void
  setCurrentSpoonModel: (model: GLBModel) => void
}

export function BeakerInteractionManager({
  beakersActive,
  beakerARef,
  beakerA001Ref,
  hoveredBeaker,
  setHoveredBeaker,
  selectedBeaker,
  lastSelectedSideRef,
  spoonLeftModel,
  spoonRightModel,
  selectingRef,
  onBeakerSelected,
  setSelectedBeaker,
  setCurrentSpoonModel
}: BeakerInteractionManagerProps) {
  const { camera, gl } = useThree()
  const isDraggingRef = useRef(false)

  // 레이캐스트로 비커 hover/선택
  useEffect(() => {
    const el = gl.domElement
    if (!el) return

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const getPointer = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
    }

    const onMove = (e: PointerEvent) => {
      if (!beakersActive || isDraggingRef.current) return
      getPointer(e)

      let next: 'a' | 'a001' | null = null
      let hasHit = false

      // 비커 충돌 체크
      if (beakerARef.current) {
        const hitA = raycaster.intersectObject(beakerARef.current, true)
        if (hitA.length > 0) {
          next = 'a'
          hasHit = true
        }
      }
      if (!next && beakerA001Ref.current) {
        const hitA001 = raycaster.intersectObject(beakerA001Ref.current, true)
        if (hitA001.length > 0) {
          next = 'a001'
          hasHit = true
        }
      }

      // 호버 상태 업데이트
      if (next !== hoveredBeaker) {
        setHoveredBeaker(next)
      }

      // 마우스 커서 변경
      if (hasHit) {
        el.style.cursor = 'pointer'
      } else {
        el.style.cursor = 'auto'
      }
    }

    const onDown = (e: PointerEvent) => {
      if (!beakersActive || isDraggingRef.current || selectingRef.current) return
      getPointer(e)

      if (beakerARef.current) {
        const hitA = raycaster.intersectObject(beakerARef.current, true).length > 0
        if (hitA) {
          setSelectedBeaker('left')
          lastSelectedSideRef.current = 'left'
          setCurrentSpoonModel(spoonLeftModel)
          onBeakerSelected('left')
          return
        }
      }
      if (beakerA001Ref.current) {
        const hitA001 = raycaster.intersectObject(beakerA001Ref.current, true).length > 0
        if (hitA001) {
          setSelectedBeaker('right')
          lastSelectedSideRef.current = 'right'
          setCurrentSpoonModel(spoonRightModel)
          onBeakerSelected('right')
          return
        }
      }
    }

    // OrbitControls 상태 추적
    const onControlsStart = () => {
      isDraggingRef.current = true
      el.style.cursor = 'grabbing'
    }

    const onControlsEnd = () => {
      isDraggingRef.current = false
      el.style.cursor = 'auto'
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerdown', onDown)

    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onDown)
      el.style.cursor = 'auto'
    }
  }, [
    beakersActive,
    camera,
    gl,
    onBeakerSelected,
    spoonLeftModel,
    spoonRightModel,
    beakerARef,
    beakerA001Ref,
    selectingRef,
    setHoveredBeaker,
    setSelectedBeaker,
    setCurrentSpoonModel,
    lastSelectedSideRef
  ])

  // OrbitControls 상태 추적을 위한 함수들 노출
  useEffect(() => {
    (window as any).setDragging = (dragging: boolean) => {
      isDraggingRef.current = dragging
    }
    return () => {
      delete (window as any).setDragging
    }
  }, [])

  return (
    <></>
  )
}