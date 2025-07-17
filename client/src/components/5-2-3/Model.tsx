// components/Model.tsx - 기존 애니메이션 방식 적용
import { useGLTF } from '@react-three/drei'
import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface ModelProps extends GroupProps {
  windEnabled?: boolean
  windDirection?: 'sea-to-land' | 'land-to-sea'
  windSpeed?: number
  isDay?: boolean
}

export default function Model({
  windEnabled = false,
  windDirection = 'sea-to-land',
  windSpeed = 0.2,
  isDay = true,
  ...props
}: ModelProps) {
  const [currentModel, setCurrentModel] = useState<'day' | 'night'>(isDay ? 'day' : 'night')
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const animationEnabledRef = useRef(true)
  const sceneRef = useRef<THREE.Group | null>(null)

  // 두 모델 모두 미리 로드
  const dayModel = useGLTF('models/5-2-3/Weather.glb')
  const nightModel = useGLTF('models/5-2-3/Weather_Night.glb')

  // 현재 사용할 모델 선택
  const activeModel = currentModel === 'day' ? dayModel : nightModel

  // 애니메이션 관련 ref들
  const groupRef = useRef<THREE.Group>(null)
  const mixer = useRef<THREE.AnimationMixer | null>(null)
  const actionsRef = useRef<THREE.AnimationAction[]>([])
  const isAnimationPlayingRef = useRef(false)
  const lastModelRef = useRef<string>('')

  console.log('Current model:', currentModel, 'isDay:', isDay)
  console.log('Available animations:', activeModel.animations?.length || 0)

  // 초기 로드 시 애니메이션 시작을 위한 effect
  useEffect(() => {
    // 컴포넌트 마운트 시 애니메이션 트리거
    const timer = setTimeout(() => {
      setAnimationTrigger(1)
    }, 100)

    return () => clearTimeout(timer)
  }, []) // 빈 dependency array로 한 번만 실행

  // isDay가 변경될 때 모델 전환
  useEffect(() => {
    const newModel = isDay ? 'day' : 'night'
    if (newModel !== currentModel) {
      console.log('Switching model from', currentModel, 'to', newModel)

      // 이전 애니메이션 정리
      if (actionsRef.current.length > 0) {
        actionsRef.current.forEach(action => {
          action.stop()
          action.reset()
        })
      }
      if (mixer.current) {
        mixer.current.stopAllAction()
      }

      setCurrentModel(newModel)
      setAnimationTrigger(prev => prev + 1) // 새 모델의 애니메이션 트리거

      // 바람 애니메이션 잠시 비활성화 후 재활성화
      animationEnabledRef.current = false
      setTimeout(() => {
        animationEnabledRef.current = true
        console.log('Wind animation re-enabled for', newModel, 'model')
      }, 100)
    }
  }, [isDay, currentModel])

  // 애니메이션 초기화 (기존 방식 적용)
  useEffect(() => {
    if (!activeModel.scene || !activeModel.animations?.length || !groupRef.current) return

    console.log(`Model ${currentModel}: Found ${activeModel.animations.length} animations:`, 
      activeModel.animations.map(anim => anim.name))
    
    // 기존 믹서 정리
    if (mixer.current) {
      mixer.current.stopAllAction()
    }
    
    mixer.current = new THREE.AnimationMixer(groupRef.current)

    // 모든 애니메이션에 대해 액션 생성
    const actions = activeModel.animations.map((animation, index) => {
      const action = mixer.current!.clipAction(animation)
      
      // 애니메이션 설정
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.clampWhenFinished = false
      action.reset()
      action.play()
      
      console.log(`Model ${currentModel}: Animation ${index} (${animation.name}) initialized and started`)
      return action
    })

    actionsRef.current = actions
    isAnimationPlayingRef.current = true
    lastModelRef.current = currentModel

    return () => {
      if (actionsRef.current.length > 0) {
        actionsRef.current.forEach(action => action.stop())
      }
      if (mixer.current) {
        mixer.current.stopAllAction()
      }
    }
  }, [activeModel.scene, activeModel.animations, currentModel])

  // animationTrigger에 따라 애니메이션 시작
  useEffect(() => {
    console.log(`Model ${currentModel}: animationTrigger changed to ${animationTrigger}`)
    
    if (!mixer.current || !actionsRef.current.length) {
      console.log(`Model ${currentModel}: Cannot start animation - mixer or actions not ready`)
      return
    }

    if (animationTrigger > 0) {
      console.log(`Model ${currentModel}: 모든 모델 애니메이션 시작! (총 ${actionsRef.current.length}개)`)
      
      // 모든 애니메이션을 동시에 시작
      actionsRef.current.forEach((action, index) => {
        action.reset() // 애니메이션을 처음으로 되돌림
        action.setLoop(THREE.LoopRepeat, Infinity) // 무한 반복으로 설정
        action.clampWhenFinished = false
        action.paused = false // 일시정지 해제
        action.play()
        console.log(`Model ${currentModel}: Animation ${index} started`)
      })
      
      isAnimationPlayingRef.current = true
    }
  }, [animationTrigger, currentModel, activeModel.animations]) // activeModel.animations 추가

  // 모델 설정 (그림자 등)
  useEffect(() => {
    if (activeModel.scene) {
      activeModel.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true

          if (child.material) {
            child.material.shadowSide = THREE.FrontSide
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.side = THREE.DoubleSide)
            } else {
              child.material.side = THREE.DoubleSide
            }
          }
        }
      })
    }
  }, [activeModel.scene, currentModel])

  // 바람 애니메이션과 GLB 애니메이션 업데이트
  useFrame((state, delta) => {
    // GLB 애니메이션 업데이트
    if (mixer.current && isAnimationPlayingRef.current) {
      mixer.current.update(delta)
    }

    // 바람 애니메이션 (windEnabled 조건 제거하여 항상 동작)
    if (!animationEnabledRef.current || !activeModel.scene) return

    const time = state.clock.getElapsedTime()

    // 바람 오브젝트 찾기 - 낮과 밤 모델의 구조가 다름
    let windObject
    let directionMultiplier
    
    if (currentModel === 'day') {
      // 낮 모델: scene.children[1].children[0]
      windObject = activeModel.scene.children[1]?.children[0]
      directionMultiplier = windDirection === 'sea-to-land' ? 1 : -1
    } else {
      // 밤 모델: scene.children[0], 방향 반대
      windObject = activeModel.scene.children[0]
      directionMultiplier = windDirection === 'sea-to-land' ? -1 : 1
    }

    if (windObject) {
      windObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]

          materials.forEach((material) => {
            const textures = [
              material.map,
              material.normalMap,
              material.roughnessMap,
              material.metalnessMap,
              material.emissiveMap,
              material.aoMap,
            ].filter(Boolean)

            textures.forEach((texture) => {
              if (texture) {
                texture.wrapS = THREE.RepeatWrapping
                texture.wrapT = THREE.RepeatWrapping

                const finalSpeed = windSpeed * directionMultiplier

                texture.offset.y = (time * finalSpeed) % 1
                texture.needsUpdate = true
              }
            })
          })
        }
      })
    }
  })

  return (
    <group ref={sceneRef} {...props}>
      <group ref={groupRef} scale={1.0} position={[0, 0, 0]}>
        <primitive object={activeModel.scene} />
      </group>
    </group>
  )
}

// 두 GLB 파일 모두 미리 로드
useGLTF.preload('models/5-2-3/Weather.glb')
useGLTF.preload('models/5-2-3/Weather_Night.glb')