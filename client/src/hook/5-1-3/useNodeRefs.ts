// hooks/5-1-3/useNodeRefs.ts
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GLBModel {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
}

export function useNodeRefs(currentModel: GLBModel | null, currentSpoonModel: GLBModel | null) {
  const beakerARef = useRef<THREE.Object3D | null>(null)
  const beakerA001Ref = useRef<THREE.Object3D | null>(null)
  const discRef = useRef<THREE.Object3D | null>(null)
  const sphereRef = useRef<THREE.Object3D | null>(null)
  const refSearchTries = useRef(0)

  const getBase = () => currentModel?.scene || null
  const getSpoon = () => currentSpoonModel?.scene || null

  const findByName = (root: THREE.Object3D | null, name: string) =>
    (root?.getObjectByName(name) as THREE.Object3D | null) || null

  const refreshNodeRefs = () => {
    const base = getBase()
    const spoon = getSpoon()

    // 베이스 모델에서만 찾음
    const newBeakerA = findByName(base, 'Beaker_a')
    const newBeakerA001 = findByName(base, 'Beaker_a001')
    const newDisc = findByName(spoon, 'pDisc1')
    const newSphere = findByName(spoon, 'Sphere')

    if (newBeakerA !== beakerARef.current) {
      console.log('Found Beaker_a:', newBeakerA?.name)
      beakerARef.current = newBeakerA
    }
    if (newBeakerA001 !== beakerA001Ref.current) {
      console.log('Found Beaker_a001:', newBeakerA001?.name)
      beakerA001Ref.current = newBeakerA001
    }
    if (newDisc !== discRef.current) {
      console.log('Found pDisc1:', newDisc?.name)
      discRef.current = newDisc
    }
    if (newSphere !== sphereRef.current) {
      console.log('Found Sphere:', newSphere?.name)
      sphereRef.current = newSphere
    }
  }

  useEffect(() => {
    refreshNodeRefs()
    refSearchTries.current = 0
  }, [currentModel, currentSpoonModel])

  useFrame(() => {
    if (
      (!beakerARef.current || !beakerA001Ref.current || !discRef.current || !sphereRef.current) &&
      refSearchTries.current < 30
    ) {
      refSearchTries.current += 1
      refreshNodeRefs()
    }
  })

  return {
    beakerARef,
    beakerA001Ref,
    discRef,
    sphereRef,
    refreshNodeRefs
  }
}