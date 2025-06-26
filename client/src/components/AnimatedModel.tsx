import { useGLTF, useAnimations } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import { Group, LoopRepeat } from 'three'
import { useFrame } from '@react-three/fiber'

interface AnimatedModelProps {
  url: string
  animIndex?: number
  scale?: number
  position?: [number, number, number]
  loop?: boolean
  removeMuscleLayer?: boolean
}

export default function AnimatedModel({
  url,
  animIndex = 0,
  scale = 1,
  position = [0, 0, 0],
  loop = true,
  removeMuscleLayer = false,
}: AnimatedModelProps) {
  const group = useRef<Group>(null)
  
  // 모델 URL에 따라 적절한 캐시 키 생성
  let cacheKey = url
  
  // bone 모델일 경우에만 특별한 처리
  if (removeMuscleLayer) {
    cacheKey = `${url}#bone`
  }
  
  const { scene, animations } = useGLTF(cacheKey)
  const { actions, mixer } = useAnimations(animations, group)

  useEffect(() => {
    // 컴포넌트 언마운트 시 캐시 정리
    return () => {
      useGLTF.clear(cacheKey)
    }
  }, [cacheKey])

  useEffect(() => {
    if (!animations || animations.length === 0) return

    // 애니메이션 클립 가져오기
    const clip = animations[animIndex] || animations[0]
    if (!clip) {
      console.warn('No animation clip found at index', animIndex)
      return
    }

    // 이전 액션 중지 및 새 액션 시작
    mixer.stopAllAction()
    const action = mixer.clipAction(clip, group.current!)
    action.reset().play()
    
    if (loop) {
      action.setLoop(LoopRepeat, Infinity)
    } else {
      action.setLoop(LoopRepeat, 0)
    }
    
    console.log('Animation started:', clip.name || 'unnamed clip', 'index:', animIndex)
    
    return () => {
      action.stop()
    }
  }, [cacheKey, animIndex, animations, mixer, loop])

  useEffect(() => {
    if (!scene || !scene.children || scene.children.length === 0) return
    
    const modelRoot = scene.children[0]
    if (!modelRoot || !modelRoot.children) return

    // bone 모델일 경우에 muscle 레이어 제거
    if (removeMuscleLayer) {
      const muscleLayer = modelRoot.children[0]
      
      if (muscleLayer && modelRoot.children.includes(muscleLayer)) {
        console.log('Removing muscle layer:', muscleLayer)
        modelRoot.remove(muscleLayer)
      }
    }

    // 모든 메시에 그림자 속성 설정
    scene.traverse((obj) => {
      if ((obj as any).isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
  }, [scene, removeMuscleLayer, url])

  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta)
    }
  })

  return (
    <group ref={group} scale={scale} position={position}>
      <primitive object={scene} />
    </group>
  )
}