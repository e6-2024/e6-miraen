import React, { useRef, useEffect, useState } from 'react'
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

  const leftMixerRef = useRef<THREE.AnimationMixer | null>(null)
  const rightMixerRef = useRef<THREE.AnimationMixer | null>(null)
  const leftStickRef = useRef<THREE.Object3D | null>(null)
  const rightStickRef = useRef<THREE.Object3D | null>(null)

  // 복제된 씬들을 저장할 ref
  const leftSceneRef = useRef<THREE.Object3D | null>(null)
  const rightSceneRef = useRef<THREE.Object3D | null>(null)

  const [showLeftStick, setShowLeftStick] = useState(false)
  const [showRightStick, setShowRightStick] = useState(false)

  // 페이드 제어
  const leftFadeActive = useRef(false)
  const rightFadeActive = useRef(false)
  const leftFadeStart = useRef<number | null>(null)
  const rightFadeStart = useRef<number | null>(null)
  const LEFT_FADE_DUR = 3.0
  const RIGHT_FADE_DUR = 5.0

  const leftReported = useRef(false)
  const rightReported = useRef(false)

  // 깊은 복사 함수 - 완전히 독립적인 복사본 생성
  const createDeepClone = (originalScene: THREE.Object3D): THREE.Object3D => {
    const cloned = SkeletonUtils.clone(originalScene)
    
    // 모든 자식 객체들을 순회하면서 완전히 독립적으로 만들기
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        
        // Geometry 복제
        if (mesh.geometry) {
          mesh.geometry = mesh.geometry.clone()
        }
        
        // Material 복제
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(mat => mat.clone())
          } else {
            mesh.material = mesh.material.clone()
          }
        }
      }
    })
    
    return cloned
  }

  // 씬 복제 함수
  const createLeftScene = () => {
    if (leftSceneRef.current) {
      leftSceneRef.current.removeFromParent()
      leftSceneRef.current = null
    }
    leftSceneRef.current = createDeepClone(glassStickModel.scene)
    return leftSceneRef.current
  }

  const createRightScene = () => {
    if (rightSceneRef.current) {
      rightSceneRef.current.removeFromParent()
      rightSceneRef.current = null
    }
    rightSceneRef.current = createDeepClone(glassStickModel.scene)
    return rightSceneRef.current
  }

  // 유틸: 씬 내 모든 mesh material에 투명도 적용
  const setOpacity = (root: THREE.Object3D | null, opacity: number) => {
    if (!root) return
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m: any) => {
          if (!m) return
          m.transparent = true
          m.opacity = opacity
          m.needsUpdate = true
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
      // 기존 씬들 정리
      if (leftSceneRef.current) {
        leftSceneRef.current.removeFromParent()
        leftSceneRef.current = null
      }
      if (rightSceneRef.current) {
        rightSceneRef.current.removeFromParent()
        rightSceneRef.current = null
      }
      return
    }

    // 왼쪽 완료 시 - 아직 생성되지 않았을 때만 생성
    if (leftComplete && !showLeftStick && !leftSceneRef.current) {
      const newLeftScene = createLeftScene()
      setOpacity(newLeftScene, 1)
      setShowLeftStick(true)
    }
    
    // 오른쪽 완료 시 - 아직 생성되지 않았을 때만 생성
    if (rightComplete && !showRightStick && !rightSceneRef.current) {
      const newRightScene = createRightScene()
      setOpacity(newRightScene, 1)
      setShowRightStick(true)
    }
  }, [showGlassStick, leftComplete, rightComplete])

  // 믹서/액션 초기화
  useEffect(() => {
    if (!glassStickAnimating || !showGlassStick) return

    // 왼쪽 스틱 애니메이션 설정
    if (leftComplete && showLeftStick && leftStickRef.current) {
      leftMixerRef.current?.stopAllAction()
      leftMixerRef.current = new THREE.AnimationMixer(leftStickRef.current)
      
      // 애니메이션 클립도 복제해서 사용
      glassStickModel.animations.forEach((clip) => {
        const clonedClip = clip.clone()
        const action = leftMixerRef.current!.clipAction(clonedClip, leftStickRef.current!)
        action.reset().setLoop(THREE.LoopRepeat, Infinity).play()
      })
    }

    // 오른쪽 스틱 애니메이션 설정
    if (rightComplete && showRightStick && rightStickRef.current) {
      rightMixerRef.current?.stopAllAction()
      rightMixerRef.current = new THREE.AnimationMixer(rightStickRef.current)
      
      // 애니메이션 클립도 복제해서 사용
      glassStickModel.animations.forEach((clip) => {
        const clonedClip = clip.clone()
        const action = rightMixerRef.current!.clipAction(clonedClip, rightStickRef.current!)
        action.reset().setLoop(THREE.LoopRepeat, Infinity).play()
      })
    }

    // 페이드 시작 트리거
    const now = performance.now() / 1000
    if (leftComplete && showLeftStick) {
      leftFadeActive.current = true
      leftFadeStart.current = now
      leftReported.current = false // 리포트 상태 리셋
    }
    if (rightComplete && showRightStick) {
      rightFadeActive.current = true
      rightFadeStart.current = now
      rightReported.current = false // 리포트 상태 리셋
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
    // 독립적으로 믹서 업데이트
    if (leftMixerRef.current && showLeftStick) {
      leftMixerRef.current.update(delta)
    }
    if (rightMixerRef.current && showRightStick) {
      rightMixerRef.current.update(delta)
    }

    const now = performance.now() / 1000

    // LEFT fade - 독립적으로 처리
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

    // RIGHT fade - 독립적으로 처리
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

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (leftSceneRef.current) {
        leftSceneRef.current.removeFromParent()
        leftSceneRef.current = null
      }
      if (rightSceneRef.current) {
        rightSceneRef.current.removeFromParent()
        rightSceneRef.current = null
      }
    }
  }, [])

  if (!showGlassStick) return null

  return (
    <>
      {showLeftStick && leftSceneRef.current && (
        <primitive 
          ref={leftStickRef} 
          object={leftSceneRef.current} 
          scale={0.5} 
          position={[-2.15, -1.0, -0.2]} 
        />
      )}
      {showRightStick && rightSceneRef.current && (
        <primitive 
          ref={rightStickRef} 
          object={rightSceneRef.current} 
          scale={0.5} 
          position={[2.34, -1.0, -0.2]} 
        />
      )}
    </>
  )
}

useGLTF.preload('/models/5-1-3/Glass_Stick.glb')