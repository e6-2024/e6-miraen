import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ModelProps {
  path: string
  scale?: number
  position?: [number, number, number]
  sceneIndex: number
  shouldAnimate: boolean // 단순화된 애니메이션 트리거
  animationSpeed?: number
  customAnimation?: 'fadeAndMove' | null
  onAnimationComplete?: () => void
}

export default function Model({ 
  path, 
  scale = 4, 
  position = [0, 0, 0], 
  sceneIndex,
  shouldAnimate,
  animationSpeed = 1.0,
  customAnimation = null,
  onAnimationComplete
}: ModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(path) as any
  const mixer = useRef<THREE.AnimationMixer | null>(null)
  const actionsRef = useRef<THREE.AnimationAction[]>([])
  const animationStateRef = useRef({
    isInitialized: false,
    isPlaying: false,
    isComplete: false,
    currentSceneIndex: -1
  })

  // 씬이 변경될 때마다 완전히 초기화
  useEffect(() => {
    const state = animationStateRef.current
    
    console.log(`Model: Scene changed to ${sceneIndex}, reinitializing...`)
    
    // 기존 상태 완전 초기화
    state.isInitialized = false
    state.isPlaying = false
    state.isComplete = false
    state.currentSceneIndex = sceneIndex
    
    // fadeAndMove 애니메이션 초기화 (투명도 복원)
    if (scene && scene.children[3]) {
      const targetObject = scene.children[3]
      targetObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(material => {
              material.transparent = true
              material.opacity = 1 // 투명도를 1로 복원
            })
          } else {
            mesh.material.transparent = true
            mesh.material.opacity = 1 // 투명도를 1로 복원
          }
        }
      })
      console.log(`Model Scene ${sceneIndex}: FadeAndMove materials reset to opacity 1`)
    }
    
    // 기존 애니메이션 정리
    if (actionsRef.current.length > 0) {
      actionsRef.current.forEach(action => {
        action.stop()
        action.reset()
      })
      actionsRef.current = []
    }
    
    if (mixer.current) {
      mixer.current.stopAllAction()
      mixer.current = null
    }
  }, [sceneIndex, scene])

  // 애니메이션 초기화 (씬별로 한 번만)
  useEffect(() => {
    if (!scene || !animations.length || !groupRef.current) {
      console.log(`Model Scene ${sceneIndex}: Missing requirements - scene: ${!!scene}, animations: ${animations.length}, groupRef: ${!!groupRef.current}`)
      return
    }
    
    const state = animationStateRef.current
    if (state.isInitialized && state.currentSceneIndex === sceneIndex) {
      console.log(`Model Scene ${sceneIndex}: Already initialized, skipping`)
      return
    }

    console.log(`Model Scene ${sceneIndex}: Initializing ${animations.length} animations`)
    
    // 믹서 생성
    mixer.current = new THREE.AnimationMixer(groupRef.current)
    
    // 애니메이션 액션 생성
    const actions = animations.map((animation, index) => {
      const action = mixer.current!.clipAction(animation)
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.reset()
      
      console.log(`Model Scene ${sceneIndex}: Animation ${index} (${animation.name}) prepared - duration: ${animation.duration}s`)
      return action
    })
    
    actionsRef.current = actions
    state.isInitialized = true
    
    console.log(`Model Scene ${sceneIndex}: Initialization complete`)

    return () => {
      // 컴포넌트 언마운트 시에만 정리
      if (actionsRef.current.length > 0) {
        actionsRef.current.forEach(action => action.stop())
        actionsRef.current = []
      }
      if (mixer.current) {
        mixer.current.stopAllAction()
        mixer.current = null
      }
    }
  }, [scene, animations, sceneIndex, groupRef.current])

  // 커스텀 fadeAndMove 애니메이션 함수를 먼저 선언
  const startFadeAndMoveAnimation = () => {
    if (!scene || !scene.children[3]) {
      console.log(`Model Scene ${sceneIndex}: FadeAndMove - scene or children[3] not found`)
      return
    }

    const state = animationStateRef.current
    state.isPlaying = true

    const targetObject = scene.children[3]
    const duration = 5000
    const startTime = Date.now()

    console.log(`Model Scene ${sceneIndex}: Starting FadeAndMove animation`)

    // 초기 투명도 설정
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
      if (state.currentSceneIndex !== sceneIndex) {
        console.log(`Model Scene ${sceneIndex}: FadeAndMove animation interrupted by scene change`)
        return
      }

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
        state.isPlaying = false
        state.isComplete = true
        console.log(`Model Scene ${sceneIndex}: FadeAndMove animation completed`)
        onAnimationComplete?.()
      }
    }

    animate()
  }

  // 애니메이션 실행
  useEffect(() => {
    console.log(`Model Scene ${sceneIndex}: shouldAnimate changed to ${shouldAnimate}`)
    
    if (!shouldAnimate) return
    
    const state = animationStateRef.current
    if (!state.isInitialized && customAnimation !== 'fadeAndMove') {
      console.log(`Model Scene ${sceneIndex}: Not initialized yet, skipping animation`)
      return
    }
    
    if (state.isPlaying) {
      console.log(`Model Scene ${sceneIndex}: Already playing, skipping`)
      return
    }

    console.log(`Model Scene ${sceneIndex}: Starting animation (shouldAnimate: ${shouldAnimate})`)

    // 커스텀 애니메이션 처리
    if (customAnimation === 'fadeAndMove') {
      startFadeAndMoveAnimation()
      return
    }

    // GLTF 애니메이션 처리
    if (mixer.current && actionsRef.current.length > 0) {
      state.isPlaying = true
      
      actionsRef.current.forEach((action, index) => {
        action.reset()
        action.timeScale = animationSpeed
        action.play()
        console.log(`Model Scene ${sceneIndex}: Animation ${index} started with speed ${animationSpeed}`)
      })
    } else {
      console.log(`Model Scene ${sceneIndex}: No mixer or actions available for GLTF animation`)
    }
  }, [shouldAnimate, sceneIndex, animationSpeed, customAnimation])

  // GLTF 애니메이션 업데이트
  useFrame((_, delta) => {
    const state = animationStateRef.current
    
    if (!mixer.current || !state.isPlaying || customAnimation === 'fadeAndMove') return

    // 애니메이션 업데이트
    mixer.current.update(delta)
    
    // 완료 체크
    if (actionsRef.current.length > 0) {
      const allFinished = actionsRef.current.every(action => 
        action.time >= action.getClip().duration
      )
      
      if (allFinished && !state.isComplete) {
        state.isPlaying = false
        state.isComplete = true
        console.log(`Model Scene ${sceneIndex}: All GLTF animations completed`)
        onAnimationComplete?.()
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
  }, [scene])

  return (
    <group ref={groupRef} scale={scale} position={position}>
      <primitive object={scene} />
    </group>
  )
}