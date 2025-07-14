import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ModelProps {
  path: string
  scale?: number
  position?: [number, number, number]
  sceneIndex?: number
  onLoaded?: () => void
  animationTrigger?: number
  animationSpeed?: number // 애니메이션 속도 조절
}

export default function Model({ 
  path, 
  scale = 4, 
  position = [0, 0, 0], 
  sceneIndex, 
  onLoaded,
  animationTrigger = 0,
  animationSpeed = 1.0 // 기본 속도
}: ModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(path) as any
  const mixer = useRef<THREE.AnimationMixer | null>(null)
  const actionsRef = useRef<THREE.AnimationAction[]>([])
  const isAnimationPlayingRef = useRef(false)
  const lastSceneIndexRef = useRef<number>(-1)

  // 씬이 변경될 때 애니메이션 상태 초기화
  useEffect(() => {
    if (lastSceneIndexRef.current !== sceneIndex) {
      console.log(`Model: Scene changed from ${lastSceneIndexRef.current} to ${sceneIndex} - resetting animation state`)
      lastSceneIndexRef.current = sceneIndex
      isAnimationPlayingRef.current = false
      
      // 모든 애니메이션 액션 정지
      if (actionsRef.current.length > 0) {
        actionsRef.current.forEach(action => {
          action.stop()
          action.reset()
        })
      }
    }
  }, [sceneIndex])

  // 애니메이션 초기화
  useEffect(() => {
    if (!scene || !animations.length || !groupRef.current) return

    // 이미 같은 씬에 대해 초기화된 경우 스킵
    if (mixer.current && lastSceneIndexRef.current === sceneIndex) {
      console.log(`Model Scene ${sceneIndex}: Already initialized, skipping`)
      return
    }

    console.log(`Model Scene ${sceneIndex}: Found ${animations.length} animations:`, animations.map(anim => anim.name))
    console.log(`Model Scene ${sceneIndex}: Animation speed set to ${animationSpeed}`)
    
    // 기존 믹서 정리
    if (mixer.current) {
      mixer.current.stopAllAction()
    }
    
    mixer.current = new THREE.AnimationMixer(groupRef.current)

    // 모든 애니메이션에 대해 액션 생성
    const actions = animations.map((animation, index) => {
      const action = mixer.current!.clipAction(animation)
      
      // 모든 스텝에서 초기에는 정지 상태로 설정
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
      action.paused = true // 초기에는 일시정지
      
      console.log(`Model Scene ${sceneIndex}: Animation ${index} (${animation.name}) initialized and paused`)
      return action
    })

    actionsRef.current = actions
    isAnimationPlayingRef.current = false

    if (onLoaded) {
      onLoaded()
    }

    return () => {
      if (actionsRef.current.length > 0) {
        actionsRef.current.forEach(action => action.stop())
      }
      if (mixer.current) {
        mixer.current.stopAllAction()
      }
    }
  }, [scene, animations, sceneIndex, animationSpeed, onLoaded])

  // animationTrigger prop에 따라 애니메이션 시작
  useEffect(() => {
    console.log(`Model Scene ${sceneIndex}: animationTrigger changed to ${animationTrigger}`)
    
    if (!mixer.current || !actionsRef.current.length) {
      console.log(`Model Scene ${sceneIndex}: Cannot start animation - mixer or actions not ready`)
      return
    }

    if (animationTrigger > 0) {
      console.log(`Model Scene ${sceneIndex}: 모든 모델 애니메이션 시작! (총 ${actionsRef.current.length}개, 속도: ${animationSpeed})`)
      
      // 모든 애니메이션을 동시에 시작
      actionsRef.current.forEach((action, index) => {
        action.reset() // 애니메이션을 처음으로 되돌림
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.paused = false // 일시정지 해제
        action.play()
        console.log(`Model Scene ${sceneIndex}: Animation ${index} started with speed ${animationSpeed}`)
      })
      
      isAnimationPlayingRef.current = true
    }
  }, [animationTrigger, sceneIndex, animationSpeed])

  // 애니메이션 업데이트 및 완료 체크
  useFrame((_, delta) => {
    if (mixer.current && isAnimationPlayingRef.current) {
      // 씬별 애니메이션 속도 적용
      mixer.current.update(delta * animationSpeed)
      
      // 모든 애니메이션이 끝났는지 확인
      if (actionsRef.current.length > 0) {
        const allFinished = actionsRef.current.every(action => 
          action.time >= action.getClip().duration
        )
        
        if (allFinished) {
          isAnimationPlayingRef.current = false
          console.log(`Model Scene ${sceneIndex}: 모든 모델 애니메이션 완료! (총 ${actionsRef.current.length}개, 속도: ${animationSpeed})`)
        }
      }
    }
  })

  // 모델 설정 (그림자 등)
  useEffect(() => {
    if (!scene) return
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.side = THREE.DoubleSide)
        } else {
          mesh.material.side = THREE.DoubleSide
        }
      }
    })
  }, [sceneIndex, scene])

  return (
    <group ref={groupRef} scale={scale} position={position}>
      <primitive object={scene} />
    </group>
  )
}