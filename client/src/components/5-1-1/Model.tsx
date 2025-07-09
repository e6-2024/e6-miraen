import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

interface ModelProps {
  path: string
  scale?: number
  position?: [number, number, number]
  sceneIndex?: number
  onLoaded?: () => void
  animationTrigger?: number // boolean에서 number로 변경
}

export default function Model({ 
  path, 
  scale = 4, 
  position = [0, 0, 0], 
  sceneIndex, 
  onLoaded,
  animationTrigger = 0 // 기본값 0
}: ModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(path) as any
  const mixer = useRef<THREE.AnimationMixer | null>(null)
  const actionsRef = useRef<THREE.AnimationAction[]>([])
  const isAnimationPlayingRef = useRef(false)

  // 애니메이션 초기화
  useEffect(() => {
    if (!scene || !animations.length || !groupRef.current) return

    mixer.current = new THREE.AnimationMixer(groupRef.current)

    const action = mixer.current.clipAction(animations[0])
    
    // 모든 씬에서 애니메이션을 일시정지 상태로 초기화
    action.setLoop(THREE.LoopRepeat, Infinity) // step 0에서는 반복 재생
    action.clampWhenFinished = false
    action.play()
    action.paused = true // 처음엔 항상 일시정지
    
    // step 0이 아닌 경우 한번만 재생되도록 설정
    if (sceneIndex !== 0) {
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
    }

    actionsRef.current = [action]
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
  }, [scene, animations, sceneIndex])

  // animationTrigger prop에 따라 애니메이션 시작/정지
  useEffect(() => {
    if (!mixer.current || !actionsRef.current.length) return

    const action = actionsRef.current[0]
    
    if (animationTrigger > 0 && sceneIndex === 0) {
      // Step 1에서 Play 버튼을 눌렀을 때 애니메이션을 처음부터 재생
      console.log('공룡 애니메이션 시작!')
      action.reset() // 애니메이션을 처음으로 되돌림
      action.setLoop(THREE.LoopOnce, 1) // 한 번만 재생
      action.clampWhenFinished = true // 애니메이션 끝에서 정지
      action.play()
      isAnimationPlayingRef.current = true
      
    } else if (animationTrigger > 0 && sceneIndex !== 0) {
      // 다른 Step에서도 애니메이션이 있다면 여기서 처리
      action.reset()
      action.play()
      isAnimationPlayingRef.current = true
    }
  }, [animationTrigger, sceneIndex])

  // 애니메이션 업데이트 및 완료 체크
  useFrame((_, delta) => {
    if (mixer.current && isAnimationPlayingRef.current) {
      mixer.current.update(delta * 1.5)
      
      // Step 1에서 애니메이션이 끝났는지 확인
      if (sceneIndex === 0 && actionsRef.current.length > 0) {
        const action = actionsRef.current[0]
        if (action.time >= action.getClip().duration) {
          isAnimationPlayingRef.current = false
          console.log('공룡 애니메이션 완료!')
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