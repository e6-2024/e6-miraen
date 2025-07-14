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

  // 애니메이션 초기화
  useEffect(() => {
    if (!scene || !animations.length || !groupRef.current) return

    console.log(`Scene ${sceneIndex}: Found ${animations.length} animations:`, animations.map(anim => anim.name))
    console.log(`Scene ${sceneIndex}: Animation speed set to ${animationSpeed}`)
    
    mixer.current = new THREE.AnimationMixer(groupRef.current)

    // 모든 애니메이션에 대해 액션 생성
    const actions = animations.map((animation, index) => {
      const action = mixer.current!.clipAction(animation)
      
      // Step 3, 4에서는 플레이 버튼을 눌러야만 시작되도록 설정
      if (sceneIndex === 2 || sceneIndex === 3) {
        // Step 3, 4: 한번만 재생, 초기에는 정지 상태
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.play()
        action.paused = true // 초기에는 일시정지
      } else if (sceneIndex === 0) {
        // Step 1: 처음엔 반복, 트리거 시 한번만 재생으로 변경
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.clampWhenFinished = false
        action.play()
        action.paused = true
      } else {
        // Step 2: 한번만 재생
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.play()
        action.paused = true
      }
      
      console.log(`Scene ${sceneIndex}: Animation ${index} (${animation.name}) initialized`)
      return action
    })

    actionsRef.current = actions
    isAnimationPlayingRef.current = false

    if (onLoaded) {
      onLoaded()
    }

    return () => {
      actionsRef.current.forEach(action => action.stop())
      mixer.current?.stopAllAction()
      mixer.current = null
      isAnimationPlayingRef.current = false
    }
  }, [scene, animations, sceneIndex, animationSpeed])

  // animationTrigger prop에 따라 애니메이션 시작
  useEffect(() => {
    if (!mixer.current || !actionsRef.current.length) return

    if (animationTrigger > 0) {
      console.log(`Scene ${sceneIndex}: 모든 모델 애니메이션 시작! (총 ${actionsRef.current.length}개, 속도: ${animationSpeed})`)
      
      // 모든 애니메이션을 동시에 시작
      actionsRef.current.forEach((action, index) => {
        action.reset() // 애니메이션을 처음으로 되돌림
        
        // Step 1에서는 트리거 시 한 번만 재생하도록 설정 변경
        if (sceneIndex === 0 ) {
          action.setLoop(THREE.LoopOnce, 1)
          action.clampWhenFinished = true
        }
        
        // Step 3, 4에서는 플레이 버튼 클릭 시에만 애니메이션 시작
        if (sceneIndex === 2 || sceneIndex === 3) {
          console.log(`Scene ${sceneIndex}: Play button triggered - starting animation ${index}`)
        }
        
        action.paused = false // 일시정지 해제
        action.play()
        console.log(`Scene ${sceneIndex}: Animation ${index} started with speed ${animationSpeed}`)
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
          console.log(`Scene ${sceneIndex}: 모든 모델 애니메이션 완료! (총 ${actionsRef.current.length}개, 속도: ${animationSpeed})`)
        }
      }
    }
  })

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