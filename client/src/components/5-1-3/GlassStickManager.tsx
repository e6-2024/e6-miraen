import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'

interface GLBModel {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
}

interface GlassStickManagerProps {
  showGlassStick: boolean
  glassStickAnimating: boolean
  setGlassStickAnimating: (animating: boolean) => void
  leftComplete: boolean
  rightComplete: boolean
  onDissolved?: (side: 'left' | 'right') => void
}

export function GlassStickManager({
  showGlassStick,
  glassStickAnimating,
  setGlassStickAnimating,
  leftComplete,
  rightComplete,
  onDissolved,
}: GlassStickManagerProps) {
  const glassStickModel = useGLTF('/models/5-1-3/Glass_Stick.glb') as GLBModel

  // 좌/우 각각 깊은 복제 (스켈레톤/바인딩 유지)
  const leftScene = useMemo(() => SkeletonUtils.clone(glassStickModel.scene), [glassStickModel.scene])
  const rightScene = useMemo(() => SkeletonUtils.clone(glassStickModel.scene), [glassStickModel.scene])

  const leftMixerRef = useRef<THREE.AnimationMixer | null>(null)
  const rightMixerRef = useRef<THREE.AnimationMixer | null>(null)
  const leftStickRef = useRef<THREE.Object3D | null>(null)
  const rightStickRef = useRef<THREE.Object3D | null>(null)

  const [showLeftStick, setShowLeftStick] = useState(false)
  const [showRightStick, setShowRightStick] = useState(false)

  // 페이드 제어
  const leftFadeActive = useRef(false)
  const rightFadeActive = useRef(false)
  const leftFadeStart = useRef<number | null>(null)
  const rightFadeStart = useRef<number | null>(null)
  const LEFT_FADE_DUR = 3.0 // 초
  const RIGHT_FADE_DUR = 5.0 // 초

  const leftReported = useRef(false)
  const rightReported = useRef(false)

  // 유틸: 씬 내 모든 mesh material에 투명도 적용
  const setOpacity = (root: THREE.Object3D | null, opacity: number) => {
    if (!root) return
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m: any) => {
          if (!m) return
          m.transparent = true
          m.opacity = opacity
        })
      }
    })
  }

  // 외부 플래그 → 표시 상태 동기화
  useEffect(() => {
    if (!showGlassStick) {
      setShowLeftStick(false)
      setShowRightStick(false)
      leftFadeActive.current = false
      rightFadeActive.current = false
      return
    }
    setShowLeftStick(!!leftComplete)
    setShowRightStick(!!rightComplete)
    // 초기 불투명
    if (leftComplete) setOpacity(leftScene, 1)
    if (rightComplete) setOpacity(rightScene, 1)
  }, [showGlassStick, leftComplete, rightComplete, leftScene, rightScene])

  // 믹서/액션 초기화
  useEffect(() => {
    if (!glassStickAnimating || !showGlassStick) return

    if (leftComplete && showLeftStick && leftStickRef.current) {
      leftMixerRef.current?.stopAllAction()
      leftMixerRef.current = new THREE.AnimationMixer(leftStickRef.current)
      glassStickModel.animations.forEach((clip) => {
        leftMixerRef.current!.clipAction(clip, leftStickRef.current!).reset().setLoop(THREE.LoopRepeat, Infinity).play()
      })
    }
    if (rightComplete && showRightStick && rightStickRef.current) {
      rightMixerRef.current?.stopAllAction()
      rightMixerRef.current = new THREE.AnimationMixer(rightStickRef.current)
      glassStickModel.animations.forEach((clip) => {
        rightMixerRef
          .current!.clipAction(clip, rightStickRef.current!)
          .reset()
          .setLoop(THREE.LoopRepeat, Infinity)
          .play()
      })
    }

    // ✅ 페이드 시작 트리거 (왼쪽 1초, 오른쪽 3초 동안 감소)
    const now = performance.now() / 1000
    if (leftComplete && showLeftStick) {
      leftFadeActive.current = true
      leftFadeStart.current = now
    }
    if (rightComplete && showRightStick) {
      rightFadeActive.current = true
      rightFadeStart.current = now
    }

    return () => {
      leftMixerRef.current?.stopAllAction()
      rightMixerRef.current?.stopAllAction()
      leftMixerRef.current = null
      rightMixerRef.current = null
      leftFadeActive.current = false
      rightFadeActive.current = false
    }
  }, [
    glassStickAnimating,
    showGlassStick,
    showLeftStick,
    showRightStick,
    leftComplete,
    rightComplete,
    glassStickModel.animations,
  ])

  // 프레임 업데이트: 믹서 진행 + 페이드
  useFrame((_, delta) => {
    leftMixerRef.current?.update(delta)
    rightMixerRef.current?.update(delta)

    const now = performance.now() / 1000

    // LEFT fade
    if (leftFadeActive.current && leftStickRef.current && leftFadeStart.current !== null) {
      const t = (now - leftFadeStart.current) / LEFT_FADE_DUR
      const opacity = Math.max(0, 1 - t)
      setOpacity(leftStickRef.current, opacity)
      if (t >= 1) {
        leftFadeActive.current = false
        leftMixerRef.current?.stopAllAction()
        setShowLeftStick(false)
        if (!leftReported.current) {
          leftReported.current = true
          onDissolved?.('left')
        }
      }
    }

    // RIGHT fade
    if (rightFadeActive.current && rightStickRef.current && rightFadeStart.current !== null) {
      const t = (now - rightFadeStart.current) / RIGHT_FADE_DUR
      const opacity = Math.max(0, 1 - t)
      setOpacity(rightStickRef.current, opacity)
      if (t >= 1) {
        rightFadeActive.current = false
        rightMixerRef.current?.stopAllAction()
        setShowRightStick(false)
        if (!rightReported.current) {
          rightReported.current = true
          onDissolved?.('right')
        }
      }
    }
  })

  if (!showGlassStick) return null

  return (
    <>
      {showLeftStick && <primitive ref={leftStickRef} object={leftScene} scale={0.5} position={[-2.15, -1.0, -0.2]} />}
      {showRightStick && (
        <primitive ref={rightStickRef} object={rightScene} scale={0.5} position={[2.34, -1.0, -0.2]} />
      )}
    </>
  )
}

useGLTF.preload('/models/5-1-3/Glass_Stick.glb')
