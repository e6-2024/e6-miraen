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
}

export default function Model({ path, scale = 4, position = [0, 0, 0], sceneIndex, onLoaded}: ModelProps) {
  const { scene: originalScene, animations } = useGLTF(path)
  const mixer = useRef<THREE.AnimationMixer | null>(null)
  const hasCalledOnLoaded = useRef(false)
  const sceneRef = useRef<number>(-1)
  const isLoadedRef = useRef(false)
  const actionsRef = useRef<THREE.AnimationAction[]>([])

  const clonedScene = useMemo(() => {
    console.log(`Creating cloned scene for scene ${sceneIndex} with path: ${path}`)
    
    // 일관성을 위해 항상 clone 사용 (씬 0일 때만 예외)
    const sceneToUse = sceneIndex === 0 ? originalScene : originalScene.clone(true)
    
    sceneToUse.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        
        // Scene 1(물 속 씬)에서 DoubleSide 설정
        if (sceneIndex === 0) {
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              // 여러 머티리얼이 있는 경우
              mesh.material.forEach((material) => {
                if (material instanceof THREE.Material) {
                  material.side = THREE.DoubleSide
                }
              })
            } else {
              // 단일 머티리얼인 경우
              if (mesh.material instanceof THREE.Material) {
                mesh.material.side = THREE.DoubleSide
              }
            }
          }
        } else {
          // 다른 씬에서는 기본값(FrontSide) 사용
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((material) => {
                if (material instanceof THREE.Material) {
                  material.side = THREE.FrontSide
                }
              })
            } else {
              if (mesh.material instanceof THREE.Material) {
                mesh.material.side = THREE.FrontSide
              }
            }
          }
        }
        
        if (!isLoadedRef.current) {
          isLoadedRef.current = true
          console.log(`Mesh loaded for scene ${sceneIndex}`)
        }
      }
    })

    return sceneToUse
  }, [originalScene, sceneIndex, path])

  // 씬이 변경되었을 때 상태 리셋
  useEffect(() => {
    if (sceneRef.current !== sceneIndex) {
      console.log(`Scene changed from ${sceneRef.current} to ${sceneIndex}`)
      sceneRef.current = sceneIndex || -1
      hasCalledOnLoaded.current = false
      isLoadedRef.current = false
      
      // 이전 애니메이션 정리
      if (mixer.current) {
        actionsRef.current.forEach(action => action.stop())
        actionsRef.current = []
        mixer.current.stopAllAction()
        mixer.current.uncacheRoot(mixer.current.getRoot())
        mixer.current = null
      }
    }
  }, [sceneIndex])

  // 애니메이션 설정을 위한 별도 useEffect
  useEffect(() => {
    if (!animations || animations.length === 0 || !clonedScene) {
      console.log('No animations or scene available')
      return
    }
    
    console.log(`Setting up animations for scene ${sceneIndex}`)
    
    // 기존 애니메이션 완전히 정리
    if (mixer.current) {
      mixer.current.stopAllAction()
      mixer.current.uncacheRoot(mixer.current.getRoot())
      mixer.current = null
    }
    actionsRef.current = []
    
    // 수정: 일관되게 clonedScene으로 믹서 생성
    mixer.current = new THREE.AnimationMixer(clonedScene)
    
    // 0번 애니메이션 가져오기
    const targetClip = animations[0]
    console.log(`Using animation 0: ${targetClip.name}`)
    
    // 수정: 타겟 씬 일관성 유지
    const action = mixer.current.clipAction(targetClip)
    
    // 씬별 애니메이션 처리
    if (sceneIndex === 0) {
      action.reset()
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.clampWhenFinished = false
      action.enabled = true
      action.setEffectiveTimeScale(2.0)
      action.setEffectiveWeight(1.0)
      action.play()
    } else {
      action.reset()
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.enabled = true
      action.setEffectiveTimeScale(0) 
      action.setEffectiveWeight(1.0)
      action.time = 0
      action.paused = true
      action.play()
    }
    
    actionsRef.current = [action]

  }, [animations, clonedScene, sceneIndex])

  // 모델 로드 완료 처리
  useEffect(() => {
    if (onLoaded && !hasCalledOnLoaded.current && clonedScene && isLoadedRef.current) {
      hasCalledOnLoaded.current = true
      
      const timeoutId = setTimeout(() => {
        onLoaded()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [onLoaded, sceneIndex, clonedScene, isLoadedRef.current])

  useFrame((_, delta) => {
    if (mixer.current) {
      // STEP 0에서만 애니메이션 업데이트
      if (sceneIndex === 0) {
        mixer.current.update(delta * 0.8)
        
        // 애니메이션이 멈춘 경우 다시 시작
        if (actionsRef.current.length > 0) {
          const action = actionsRef.current[0]
          if (!action.isRunning() && !action.paused) {
            console.log('🔄 Animation stopped, restarting...')
            action.reset()
            action.play()
          }
        }
      }
    }
  })

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (mixer.current) {
        actionsRef.current.forEach(action => action.stop())
        actionsRef.current = []
        mixer.current.stopAllAction()
        mixer.current.uncacheRoot(mixer.current.getRoot())
        mixer.current = null
      }
    }
  }, [])

  if (!clonedScene) {
    return null
  }

  return <primitive object={clonedScene} scale={scale} position={position} />
}