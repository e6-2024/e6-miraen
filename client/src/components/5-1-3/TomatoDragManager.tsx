import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { DirectTomato } from './DirectTomato'

interface TomatoDragManagerProps {
  showTomatoDrag: boolean
  leftDissolved: boolean
  rightDissolved: boolean
  onTomatoDropped: (beaker: 'left' | 'right') => void
  onTomatoRemoved: () => void
  onBothExperimentsComplete: () => void
  currentModel: any // 기존 모델 참조
}

interface WipingModel {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
}

export function TomatoDragManager({ 
  showTomatoDrag, 
  leftDissolved, 
  rightDissolved,
  onTomatoDropped,
  onTomatoRemoved,
  onBothExperimentsComplete,
  currentModel
}: TomatoDragManagerProps) {
  const { camera, gl } = useThree()
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(new THREE.Vector3())
  const [objectsOpacity, setObjectsOpacity] = useState(0)
  const [currentTomatoState, setCurrentTomatoState] = useState<'none' | 'left' | 'right'>('none')
  const [leftTested, setLeftTested] = useState(false)
  const [rightTested, setRightTested] = useState(false)
  const [showDirectTomato, setShowDirectTomato] = useState(false)
  const [showWiping, setShowWiping] = useState(false)
  const [objectsVisible, setObjectsVisible] = useState(false)
  const [groupOffset, setGroupOffset] = useState(new THREE.Vector3(0, 0, 0))

  // 닦기 모델 로드
  const wipingModel = useGLTF('/models/5-1-3/Tomato_wiping.glb') as WipingModel
  const wipingMixerRef = useRef<THREE.AnimationMixer | null>(null)

  // 레이캐스터
  const raycaster = useRef(new THREE.Raycaster())
  const pointer = useRef(new THREE.Vector2())
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0))

  // 타겟 오브젝트들 찾기
  const findTargetObjects = useCallback(() => {
    if (!currentModel?.scene) return { cherry: null, dish: null, sketchfab: null }

    let cherry = null
    let dish = null
    let sketchfab = null

    currentModel.scene.traverse((child: THREE.Object3D) => {
      if (child.name === 'Cherry_tomatos') cherry = child
      else if (child.name === 'Dish') dish = child
      else if (child.name === 'Sketchfab_model') sketchfab = child
    })

    return { cherry, dish, sketchfab }
  }, [currentModel])

  // 오브젝트 투명도 설정
  const setObjectOpacity = useCallback((obj: THREE.Object3D | null, opacity: number) => {
    if (!obj) return
    
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((material: any) => {
          if (material) {
            material.transparent = true
            material.opacity = opacity
            material.needsUpdate = true
          }
        })
      }
    })
  }, [])

  // 오브젝트들 표시/숨김 제어
  const setObjectsVisibility = useCallback((visible: boolean) => {
    const { cherry, dish, sketchfab } = findTargetObjects()
    
    if (cherry) cherry.visible = visible
    if (dish) dish.visible = visible
    if (sketchfab) sketchfab.visible = visible

    return { cherry, dish, sketchfab }
  }, [findTargetObjects])

  // 오브젝트들 위치 업데이트
  const updateObjectsPosition = useCallback((offset: THREE.Vector3) => {
    const { cherry, dish, sketchfab } = findTargetObjects()
    
    // 스케일을 고려한 오프셋 계산 (모델이 0.5 스케일이므로)
    const scaledOffset = offset.clone().multiplyScalar(2) // 스케일 0.5의 역수
    
    if (cherry) {
      cherry.position.copy(cherry.position.clone().add(scaledOffset))
    }
    if (dish) {
      dish.position.copy(dish.position.clone().add(scaledOffset))
    }
    if (sketchfab) {
      sketchfab.position.copy(sketchfab.position.clone().add(scaledOffset))
    }
  }, [findTargetObjects])

  // 오브젝트들 위치 리셋
  const resetObjectsPosition = useCallback(() => {
    const { cherry, dish, sketchfab } = findTargetObjects()
    
    // 스케일을 고려한 오프셋 계산
    const scaledOffset = groupOffset.clone().multiplyScalar(2)
    
    if (cherry) {
      cherry.position.copy(cherry.position.clone().sub(scaledOffset))
    }
    if (dish) {
      dish.position.copy(dish.position.clone().sub(scaledOffset))
    }
    if (sketchfab) {
      sketchfab.position.copy(sketchfab.position.clone().sub(scaledOffset))
    }
    
    setGroupOffset(new THREE.Vector3(0, 0, 0))
  }, [findTargetObjects, groupOffset])

  // 양쪽 용해 완료 시 오브젝트들 나타내기
  useEffect(() => {
    if (!showTomatoDrag || !(leftDissolved && rightDissolved) || currentTomatoState !== 'none') {
      setObjectsVisibility(false)
      setObjectsVisible(false)
      return
    }

    setObjectsVisible(true)
    const objects = setObjectsVisibility(true)
    
    let startTime = performance.now()
    const fadeIn = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / 1500, 1) // 1.5초 동안 페이드인
      setObjectsOpacity(progress)
      
      // 각 오브젝트에 투명도 적용
      setObjectOpacity(objects.cherry, progress)
      setObjectOpacity(objects.dish, progress)
      setObjectOpacity(objects.sketchfab, progress)
      
      if (progress < 1) {
        requestAnimationFrame(fadeIn)
      }
    }
    fadeIn()
  }, [showTomatoDrag, leftDissolved, rightDissolved, currentTomatoState, setObjectsVisibility, setObjectOpacity])

  // 마우스 이벤트 처리
  const getPointer = useCallback((event: PointerEvent) => {
    const rect = gl.domElement.getBoundingClientRect()
    pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.current.setFromCamera(pointer.current, camera)
  }, [camera, gl])

  const onPointerDown = useCallback((event: PointerEvent) => {
    if (!objectsVisible || objectsOpacity < 0.8 || currentTomatoState !== 'none') return
    
    getPointer(event)
    
    // Cherry_tomatos만 확인
    const { cherry } = findTargetObjects()
    if (!cherry) return

    const intersects = raycaster.current.intersectObject(cherry, true)
    
    if (intersects.length > 0) {
      setIsDragging(true)
      
      // 월드 좌표에서 클릭된 지점과 현재 그룹 오프셋의 차이 계산
      const intersection = raycaster.current.ray.intersectPlane(plane.current, new THREE.Vector3())
      if (intersection) {
        setDragOffset(groupOffset.clone().sub(intersection))
      }
      
      gl.domElement.style.cursor = 'grabbing'
      
      // OrbitControls 비활성화
      ;(window as any).setDragging?.(true)
      
      event.preventDefault()
      event.stopPropagation()
      
      console.log('드래그 시작:', groupOffset) // 디버깅용
    }
  }, [getPointer, objectsVisible, objectsOpacity, currentTomatoState, findTargetObjects, groupOffset, gl])

  const onPointerMove = useCallback((event: PointerEvent) => {
    if (!isDragging) {
      // 호버 효과 - Cherry_tomatos에만
      if (objectsVisible && objectsOpacity > 0.8 && currentTomatoState === 'none') {
        getPointer(event)
        const { cherry } = findTargetObjects()
        if (cherry) {
          const intersects = raycaster.current.intersectObject(cherry, true)
          gl.domElement.style.cursor = intersects.length > 0 ? 'grab' : 'auto'
        }
      }
      return
    }

    getPointer(event)
    const intersection = raycaster.current.ray.intersectPlane(plane.current, new THREE.Vector3())
    if (intersection) {
      const newOffset = intersection.add(dragOffset)
      // Y축 제한
      newOffset.y = Math.max(-1, Math.min(3, newOffset.y))
      newOffset.x = Math.max(-5, Math.min(5, newOffset.x))
      newOffset.z = Math.max(-3, Math.min(3, newOffset.z))
      
      // 이전 오프셋 제거하고 새 오프셋 적용
      const offsetDiff = newOffset.clone().sub(groupOffset)
      updateObjectsPosition(offsetDiff)
      setGroupOffset(newOffset)
      
      console.log('드래그 중:', newOffset) // 디버깅용
    }
  }, [isDragging, getPointer, dragOffset, objectsVisible, objectsOpacity, currentTomatoState, findTargetObjects, groupOffset, updateObjectsPosition, gl])

  const onPointerUp = useCallback((event: PointerEvent) => {
    if (!isDragging) return
    
    setIsDragging(false)
    gl.domElement.style.cursor = 'auto'

    // OrbitControls 다시 활성화
    ;(window as any).setDragging?.(false)

    // 비커 충돌 검사
    const leftBeakerCenter = new THREE.Vector3(-2.15, -0.5, -0.2)
    const rightBeakerCenter = new THREE.Vector3(2.34, -0.5, -0.2)
    const beakerRadius = 0.6

    const currentPos = groupOffset.clone()
    const leftDistance = currentPos.distanceTo(leftBeakerCenter)
    const rightDistance = currentPos.distanceTo(rightBeakerCenter)

    if (leftDistance < beakerRadius && leftDissolved) {
      // 왼쪽 비커에 드롭
      setCurrentTomatoState('left')
      setShowDirectTomato(true)
      setLeftTested(true)
      setObjectsVisibility(false)
      onTomatoDropped('left')
    } else if (rightDistance < beakerRadius && rightDissolved) {
      // 오른쪽 비커에 드롭
      setCurrentTomatoState('right')
      setShowDirectTomato(true)
      setRightTested(true)
      setObjectsVisibility(false)
      onTomatoDropped('right')
    } else {
      // 원래 위치로 복귀
      resetObjectsPosition()
    }
  }, [isDragging, groupOffset, leftDissolved, rightDissolved, onTomatoDropped, setObjectsVisibility, resetObjectsPosition, gl])

  // 토마토 제거 핸들러
  const handleRemoveTomato = useCallback(() => {
    setShowDirectTomato(false)
    setCurrentTomatoState('none')
    
    // 닦기 애니메이션 시작
    setShowWiping(true)
    
    onTomatoRemoved()
  }, [onTomatoRemoved])

  // 닦기 애니메이션 처리
  useEffect(() => {
    if (!showWiping) {
      if (wipingMixerRef.current) {
        wipingMixerRef.current.stopAllAction()
        wipingMixerRef.current = null
      }
      return
    }

    // 애니메이션 설정
    if (wipingModel.animations.length > 0) {
      wipingMixerRef.current?.stopAllAction()
      wipingMixerRef.current = new THREE.AnimationMixer(wipingModel.scene)

      wipingModel.animations.forEach((clip) => {
        const action = wipingMixerRef.current!.clipAction(clip)
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.play()
      })

      const onFinished = () => {
        setTimeout(() => {
          setShowWiping(false)
          resetObjectsPosition()
          const objects = setObjectsVisibility(true)
          setObjectsVisible(true)
          setObjectsOpacity(1)
          
          // 투명도 복구
          setObjectOpacity(objects.cherry, 1)
          setObjectOpacity(objects.dish, 1)
          setObjectOpacity(objects.sketchfab, 1)
          
          // 양쪽 모두 테스트했는지 확인
          if (leftTested && rightTested) {
            setTimeout(() => {
              onBothExperimentsComplete()
            }, 1000)
          }
        }, 500)
      }

      wipingMixerRef.current.addEventListener('finished', onFinished)

      return () => {
        wipingMixerRef.current?.removeEventListener('finished', onFinished)
        wipingMixerRef.current?.stopAllAction()
        wipingMixerRef.current = null
      }
    }
  }, [showWiping, wipingModel.animations, leftTested, rightTested, onBothExperimentsComplete, resetObjectsPosition, setObjectsVisibility, setObjectOpacity])

  // 이벤트 리스너 등록
  useEffect(() => {
    const element = gl.domElement
    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', onPointerUp)

    return () => {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', onPointerUp)
    }
  }, [onPointerDown, onPointerMove, onPointerUp, gl])

  // 프레임 업데이트
  useFrame((state, delta) => {
    // 닦기 애니메이션 업데이트
    if (wipingMixerRef.current) {
      wipingMixerRef.current.update(delta)
    }
  })

  // 토마토 제거 전역 함수 등록
  useEffect(() => {
    (window as any).removeTomato = handleRemoveTomato
    return () => {
      delete (window as any).removeTomato
    }
  }, [handleRemoveTomato])

  if (!showTomatoDrag || !(leftDissolved && rightDissolved)) return null

  return (
    <>
      {/* 실제 물리 시뮬레이션 토마토 */}
      {showDirectTomato && currentTomatoState === 'left' && (
        <DirectTomato
          startPosition={[-2.15, 1, -0.2]}
          sugarConcentration={4.2} // 1스푼
          beakerRadius={0.57}
          waterLevel={0.9}
          beakerPosition={[-2.15, -0.5, -0.2]}
          isDropped={true}
          maxRiseHeight={-0.3} // 가라앉음
          riseSpringStiffness={15}
          riseSpringDamping={8}
        />
      )}

      {showDirectTomato && currentTomatoState === 'right' && (
        <DirectTomato
          startPosition={[2.34, 1, -0.2]}
          sugarConcentration={21} // 5스푼
          beakerRadius={0.57}
          waterLevel={0.95}
          beakerPosition={[2.34, -0.47, -0.2]}
          isDropped={true}
          maxRiseHeight={0.2} // 떠오름
          riseSpringStiffness={20}
          riseSpringDamping={5}
        />
      )}

      {/* 닦기 애니메이션 */}
      {showWiping && (
        <primitive 
          object={wipingModel.scene} 
          scale={0.5} 
          position={[0, -0.5, 1]} 
        />
      )}
    </>
  )
}

// 모델 프리로드
useGLTF.preload('/models/5-1-3/Tomato_wiping.glb')