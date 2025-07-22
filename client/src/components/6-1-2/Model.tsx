import { useGLTF, useAnimations } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { Group, Mesh, AnimationAction } from 'three'

interface ModelProps extends GroupProps {
  animationSpeed?: number
  castShadow?: boolean
  receiveShadow?: boolean
  onAnimationComplete?: () => void
  resetTrigger?: boolean
}

export default function Model({
  animationSpeed = 1,
  castShadow = true,
  receiveShadow = true,
  onAnimationComplete,
  resetTrigger = false,
  ...props
}: ModelProps) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF('models/6-1-2/Objects_Movement3.gltf')
  const { actions } = useAnimations(animations, group)
  const animationTimeRef = useRef(0)
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // 리셋 트리거 감지 - 모든 상태를 초기화
  useEffect(() => {
    if (resetTrigger) {
      console.log('Reset triggered - initializing animation')
      setHasCompletedOnce(false)
      setIsInitialized(false)
      animationTimeRef.current = 0

      if (actions) {
        Object.values(actions).forEach((action) => {
          if (action) {
            action.reset()
            action.time = 0
            action.paused = true
            action.timeScale = 1
          }
        })
      }
    }
  }, [resetTrigger, actions])

  // 초기 애니메이션 설정
  useEffect(() => {
    if (actions && !isInitialized) {
      console.log('Initializing animations')
      Object.values(actions).forEach((action) => {
        if (action) {
          action.reset()
          action.time = 0
          action.setLoop(2201, 1) // LoopOnce
          action.clampWhenFinished = true
          action.paused = true
          action.play()
          action.paused = true
        }
      })
      setIsInitialized(true)
    }
  }, [actions, isInitialized])

  // 애니메이션 속도 제어
  useEffect(() => {
    if (actions && isInitialized) {
      Object.values(actions).forEach((action) => {
        if (action) {
          if (animationSpeed === 0) {
            // 일시정지
            action.paused = true
          } else if (animationSpeed > 0 && !hasCompletedOnce) {
            // 재생
            console.log('Starting animation with speed:', animationSpeed)
            action.paused = false
            action.timeScale = animationSpeed
            action.play()
          }
        }
      })
    }
  }, [actions, animationSpeed, isInitialized, hasCompletedOnce])

  // 애니메이션 진행 상황 추적
  useFrame((state, delta) => {
    if (animationSpeed > 0 && actions && isInitialized && !hasCompletedOnce) {
      animationTimeRef.current += delta * animationSpeed

      Object.values(actions).forEach((action) => {
        if (action && action.getClip()) {
          const clipDuration = action.getClip().duration

          // 애니메이션이 완료되면
          if (animationTimeRef.current >= clipDuration && !hasCompletedOnce) {
            console.log('Animation completed')
            setHasCompletedOnce(true)
            action.time = clipDuration
            action.paused = true
            if (onAnimationComplete) {
              onAnimationComplete()
            }
          }
        }
      })
    }
  })

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = castShadow
          child.receiveShadow = receiveShadow

          // 디버깅: 기차만 확인
          if (child.name === 'cap1') {
            console.log('Train mesh found:', child.name)
            // 임시로 기차는 그림자 받지 않기
            child.receiveShadow = false
          }

          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshLambertMaterial) {
                  // 임시로 double side 설정
                  mat.side = 1 // DoubleSide
                  mat.needsUpdate = true
                }
              })
            } else {
              if (
                child.material.isMeshStandardMaterial ||
                child.material.isMeshPhongMaterial ||
                child.material.isMeshLambertMaterial
              ) {
                child.material.side = 2 // DoubleSide
                child.material.needsUpdate = true
              }
            }
          }
        }
      })
    }
  }, [scene, castShadow, receiveShadow])
  return (
    <group ref={group} {...props}>
      <primitive object={scene} />
    </group>
  )
}
