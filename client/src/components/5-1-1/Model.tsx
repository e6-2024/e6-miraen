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
  customAnimation?: 'fadeAndMove' | null // 커스텀 애니메이션 타입 추가
}

export default function Model({ 
  path, 
  scale = 4, 
  position = [0, 0, 0], 
  sceneIndex, 
  onLoaded,
  animationTrigger = 0,
  animationSpeed = 1.0, // 기본 속도
  customAnimation = null // 커스텀 애니메이션 prop 추가
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
    
    if (animationTrigger <= 0) return

    // 커스텀 애니메이션이 있는 경우 (mixer나 actions가 필요없음)
    if (customAnimation === 'fadeAndMove') {
      if (!groupRef.current) {
        console.log(`Model Scene ${sceneIndex}: Cannot start fadeAndMove - groupRef not ready`)
        return
      }
      console.log(`Model Scene ${sceneIndex}: Starting fadeAndMove custom animation`)
      startFadeAndMoveAnimation()
      return
    }

    // 기본 GLTF 애니메이션의 경우 mixer와 actions가 필요
    if (!mixer.current || !actionsRef.current.length) {
      console.log(`Model Scene ${sceneIndex}: Cannot start GLTF animation - mixer or actions not ready`)
      return
    }

    // 기본 GLTF 애니메이션 실행
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
  }, [animationTrigger, sceneIndex, animationSpeed, customAnimation])

  // 커스텀 fadeAndMove 애니메이션 함수
    const startFadeAndMoveAnimation = () => {
    if (!scene || !scene.children[0]) return

    const targetObject = scene.children[3]
    const duration = 5000
    const startTime = Date.now()

    targetObject.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => {
            material.transparent = true
            material.opacity = 1
          })
        } else {
          mesh.material.transparent = true
          mesh.material.opacity = 1
        }
      }
    })

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress


      const opacity = 1 - eased
      targetObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(material => {
              material.opacity = opacity
            })
          } else {
            mesh.material.opacity = opacity
          }
        }
      })

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        console.log(`Model Scene ${sceneIndex}: FadeAndMove animation completed`)
      }
    }

    animate()
  }


  // 애니메이션 업데이트 및 완료 체크 (GLTF 애니메이션용)
  useFrame((_, delta) => {
    if (mixer.current && isAnimationPlayingRef.current && customAnimation !== 'fadeAndMove') {
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