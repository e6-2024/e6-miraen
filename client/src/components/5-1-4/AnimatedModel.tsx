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

  // 뼈 모델인지 확인 (URL에 'Bone'이 포함된 경우)
  const isBoneModel = url.includes('Bone')

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
    
    try {
      const action = mixer.clipAction(clip, group.current!)
      action.reset().play()
      
      if (loop) {
        action.setLoop(LoopRepeat, Infinity)
      } else {
        action.setLoop(LoopRepeat, 0)
      }
      
      console.log('Animation started:', clip.name || 'unnamed clip', 'Action index:', animIndex)
      
      return () => {
        action.stop()
      }
    } catch (error) {
      console.warn('Animation failed to start, but continuing without animation:', error)
    }
  }, [cacheKey, animIndex, animations, mixer, loop])

  useEffect(() => {
    if (!scene || !scene.children || scene.children.length === 0) return
    
    // removeMuscleLayer 로직 제거 - 각 모델 파일이 이미 적절한 상태로 제공됨
    // Bone_Pose.gltf는 이미 뼈만 있는 모델이고, Muscle_Pose.gltf는 근육이 있는 모델임
    
    // 모든 메시에 그림자 속성 설정
    scene.traverse((obj) => {
      if ((obj as any).isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
  }, [scene, url])

  useFrame((state, delta) => {
    // 모든 모델에서 애니메이션 업데이트
    if (mixer) {
      mixer.update(delta * 0.07)
    }
  })

  return (
    <group ref={group} scale={scale} position={position}>
      <primitive object={scene} />
    </group>
  )
}