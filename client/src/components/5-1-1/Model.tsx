import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

interface ModelProps {
  path: string
  scale?: number
  position?: [number, number, number]
  sceneIndex: number
  shouldAnimate: boolean
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
  const isPlayingRef = useRef(false)
  const isInitializedRef = useRef(false)

  console.log(`Model Scene ${sceneIndex}: Loaded with ${animations?.length || 0} animations`)

  // 씬 변경 시 초기화
  useEffect(() => {
    console.log(`Model Scene ${sceneIndex}: Scene changed, resetting state`)
    
    // 상태 초기화
    isPlayingRef.current = false
    isInitializedRef.current = false
    
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

    // Scene 3의 경우 fadeAndMove 투명도 초기화
    if (sceneIndex === 3 && scene && scene.children[3]) {
      const targetObject = scene.children[3]
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
      console.log(`Model Scene ${sceneIndex}: Reset fadeAndMove opacity to 1`)
    }
  }, [sceneIndex, scene])

  // GLTF 애니메이션 초기화 (Scene 3 제외)
  useEffect(() => {
    if (sceneIndex === 3) {
      console.log(`Model Scene ${sceneIndex}: Scene 3 - skipping GLTF initialization`)
      isInitializedRef.current = true
      return
    }

    if (!scene || !animations?.length || !groupRef.current) {
      console.log(`Model Scene ${sceneIndex}: Missing requirements for GLTF initialization`)
      return
    }

    if (isInitializedRef.current) {
      console.log(`Model Scene ${sceneIndex}: Already initialized`)
      return
    }

    console.log(`Model Scene ${sceneIndex}: Initializing GLTF animations`)

    // 믹서 생성
    mixer.current = new THREE.AnimationMixer(groupRef.current)
    
    // 애니메이션 액션 생성
    const actions = animations.map((animation: THREE.AnimationClip, index: number) => {
      const action = mixer.current!.clipAction(animation)
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.reset()
      
      console.log(`Model Scene ${sceneIndex}: Animation ${index} (${animation.name}) ready - duration: ${animation.duration}s`)
      return action
    })
    
    actionsRef.current = actions
    isInitializedRef.current = true
    
    console.log(`Model Scene ${sceneIndex}: GLTF initialization complete`)
  }, [scene, animations, sceneIndex])

  // fadeAndMove 커스텀 애니메이션
  const startFadeAndMoveAnimation = useCallback(() => {
    if (!scene || !scene.children[3]) {
      console.log(`Model Scene ${sceneIndex}: fadeAndMove - target not found`)
      return
    }

    console.log(`Model Scene ${sceneIndex}: Starting fadeAndMove animation`)
    isPlayingRef.current = true

    const targetObject = scene.children[3]
    const duration = 5000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress

      const opacity = 1 - eased

      // 투명도 적용
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
        isPlayingRef.current = false
        console.log(`Model Scene ${sceneIndex}: fadeAndMove animation completed`)
        onAnimationComplete?.()
      }
    }

    animate()
  }, [scene, sceneIndex, onAnimationComplete])

  // GLTF 애니메이션 시작
  const startGLTFAnimation = useCallback(() => {
    if (!mixer.current || !actionsRef.current.length) {
      console.log(`Model Scene ${sceneIndex}: No mixer or actions available`)
      return
    }

    console.log(`Model Scene ${sceneIndex}: Starting GLTF animations`)
    isPlayingRef.current = true
    
    actionsRef.current.forEach((action, index) => {
      action.reset()
      action.timeScale = animationSpeed
      action.play()
      console.log(`Model Scene ${sceneIndex}: Animation ${index} started (speed: ${animationSpeed})`)
    })
  }, [sceneIndex, animationSpeed])

  // 애니메이션 실행 트리거
  useEffect(() => {
    if (!shouldAnimate) {
      console.log(`Model Scene ${sceneIndex}: shouldAnimate is false`)
      return
    }

    if (isPlayingRef.current) {
      console.log(`Model Scene ${sceneIndex}: Animation already playing`)
      return
    }

    console.log(`Model Scene ${sceneIndex}: Attempting to start animation`)

    // Scene 3: fadeAndMove 애니메이션
    if (customAnimation === 'fadeAndMove') {
      startFadeAndMoveAnimation()
      return
    }

    // 다른 씬: GLTF 애니메이션
    if (!isInitializedRef.current) {
      console.log(`Model Scene ${sceneIndex}: Not initialized yet, waiting...`)
      // 초기화를 기다린 후 재시도
      const checkInitialization = () => {
        if (isInitializedRef.current && shouldAnimate && !isPlayingRef.current) {
          console.log(`Model Scene ${sceneIndex}: Initialization complete, starting animation`)
          startGLTFAnimation()
        }
      }
      
      setTimeout(checkInitialization, 100)
      return
    }

    startGLTFAnimation()
  }, [shouldAnimate, sceneIndex, customAnimation, startFadeAndMoveAnimation, startGLTFAnimation])

  // GLTF 애니메이션 업데이트
  useFrame((_, delta) => {
    // Scene 3이거나 fadeAndMove 중이면 GLTF 업데이트 건너뛰기
    if (sceneIndex === 3 || customAnimation === 'fadeAndMove') return
    
    if (!mixer.current || !isPlayingRef.current) return

    // 애니메이션 업데이트
    mixer.current.update(delta)
    
    // 완료 체크
    if (actionsRef.current.length > 0) {
      const allFinished = actionsRef.current.every(action => 
        action.time >= action.getClip().duration
      )
      
      if (allFinished) {
        isPlayingRef.current = false
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