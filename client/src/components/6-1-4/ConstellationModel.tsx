/* ConstellationModel.tsx */
import { useGLTF } from '@react-three/drei'
import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { Billboard } from '@react-three/drei'

type Season = 'spring' | 'summer' | 'fall' | 'winter'

interface ConstellationModelProps {
  season: Season
  activeSeason: string | null
  position: [number, number, number]
  visible: boolean
  fadeInDelay?: number
  fadeSpeed?: number
  isResetting?: boolean
}

export function ConstellationModel({
  activeSeason,
  season,
  position,
  visible,
  fadeInDelay = 1.2,
  fadeSpeed = 1,
  isResetting = false,
}: ConstellationModelProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const { scene } = useGLTF('/models/6-1-4/Fall.glb')
  const [opacity, setOpacity] = useState(0)
  const [shouldStartFade, setShouldStartFade] = useState(false)
  const fadeStartTime = useRef<number | null>(null)
  const materialsRef = useRef<THREE.Material[]>([])

  console.log(season)

  const initialRotationY = useMemo(() => {
    switch (season) {
      case 'spring':
        return Math.PI
      case 'summer':
        return Math.PI
      case 'fall':
        return Math.PI + Math.PI / 2
      case 'winter':
        return Math.PI / 2
      default:
        return 0
    }
  }, [season])

  const clonedScene = useMemo(() => {
    const cloned = scene.clone()
    const materials: THREE.Material[] = []

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === 'Cylinder') {
        const applyMat = (mat: THREE.Material) => {
          mat.side = THREE.FrontSide
          mat.transparent = true
          mat.opacity = 0
          materials.push(mat)
        }

        if (Array.isArray(child.material)) {
          child.material.forEach((m) => applyMat(m))
        } else {
          applyMat(child.material)
        }
      }
    })

    materialsRef.current = materials
    return cloned
  }, [scene])

  // 시작 or reset 트리거에 맞춰 fade 시작
  useEffect(() => {
    if (visible && !isResetting) {
      const timer = setTimeout(() => {
        setShouldStartFade(true)
        fadeStartTime.current = Date.now()
      }, fadeInDelay * 1000)
      return () => clearTimeout(timer)
    }

    // visible이 false로 바뀔 때 즉시 종료
    if (!visible) {
      setOpacity(0)
      materialsRef.current.forEach((mat) => (mat.opacity = 0))
      fadeStartTime.current = null
      setShouldStartFade(false)
    }
  }, [visible, fadeInDelay, isResetting])

  // 리셋 시 무조건 fade-out 시작
  useEffect(() => {
    if (isResetting) {
      setShouldStartFade(false)
      fadeStartTime.current = Date.now()
    }
  }, [isResetting])

  useFrame(() => {
    if (!fadeStartTime.current) return
    const elapsed = (Date.now() - fadeStartTime.current) / 1000

    if (shouldStartFade && !isResetting && visible) {
      // 페이드 인
      const speed = fadeSpeed * 0.8
      const newOp = Math.min(elapsed * speed, 1)
      setOpacity(newOp)
      materialsRef.current.forEach((mat) => (mat.opacity = newOp))
    } else if (isResetting || (!visible && opacity > 0)) {
      // 페이드 아웃 (리셋이면 더 빠르게)
      const speed = fadeSpeed * (isResetting ? 5 : 2.5)
      const newOp = Math.max(1 - elapsed * speed, 0)
      setOpacity(newOp)
      materialsRef.current.forEach((mat) => (mat.opacity = newOp))
      if (newOp === 0) fadeStartTime.current = null
    }
  })

  // opacity가 0일 때만 그룹 숨김
  return (
    <group ref={groupRef} position={position} visible={opacity > 0}>
      <group scale={0.5} position={[0, -12.5, 0]} rotation={[0, initialRotationY, 0]}>
        <primitive object={clonedScene} />
      </group>
      <>
        <Text
          position={[18, -8, 0]}
          rotation={[0,-Math.PI/2,0]}
          fontSize={1}
          color='white'
          anchorX='center'
          anchorY='middle'
          font='/fonts/Maplestory Bold.ttf'>
          동
        </Text>

        <Text
          position={[-18, -8, 0]}
          rotation={[0,Math.PI/2,0]}
          fontSize={0.8}
          color='white'
          anchorX='center'
          anchorY='middle'
          font='/fonts/Maplestory Bold.ttf'>
          서
        </Text>

        <Text
          position={[0, -8, -18]}
          rotation={[0,0,0]}
          fontSize={1}
          color='white'
          anchorX='center'
          anchorY='middle'
          font='/fonts/Maplestory Bold.ttf'>
          북
        </Text>

        <Text
          position={[0, -8, 18]}
          rotation={[0,Math.PI,0]}
          fontSize={1}
          color='white'
          anchorX='center'
          anchorY='middle'
          font='/fonts/Maplestory Bold.ttf'>
          남
        </Text>
      </>
    </group>
  )
}
