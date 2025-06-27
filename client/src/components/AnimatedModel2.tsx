import { useRef, useEffect, useState } from 'react'
import { useGLTF, useAnimations, Billboard, Html } from '@react-three/drei'
import { Group, Object3D, Vector3, Mesh, Material, MeshStandardMaterial, LineSegments, Box3 } from 'three'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

type Props = {
  url: string
  scale?: number
  actionName: 'extend' | 'fold'
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export default function AnimatedModel2({
  url,
  scale = 0.1,
  actionName,
  position = [0, 0, 0],
  rotation = [0, Math.PI/2, 0],
}: Props) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(url)
  const { actions } = useAnimations(animations, group)

  const textRefA = useRef<Group>(null)
  const textRefB = useRef<Group>(null)

  const textOffsetA = new THREE.Vector3(-0.09, 0.00, 0.00)
  const textOffsetB = new THREE.Vector3(0.09, 0.00, 0.00)

  const prevTextPosA = useRef(new THREE.Vector3())
  const prevTextPosB = useRef(new THREE.Vector3())

  const [armReady, setArmReady] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const muscle001Ref = useRef<Mesh>(null)
  const muscle002Ref = useRef<Mesh>(null)

  // 애니메이션용 상태
  const pulseTimeA = useRef(0)
  const pulseTimeB = useRef(0)

  // SkinnedMesh의 실시간 중심점을 계산하는 함수 (본 기반)
  const getSkinnedMeshCenter = (mesh: Mesh): THREE.Vector3 => {
    mesh.updateMatrixWorld(true)
    
    // SkinnedMesh인 경우 skeleton의 본들을 확인
    if (mesh.type === 'SkinnedMesh' && (mesh as any).skeleton) {
      const skeleton = (mesh as any).skeleton
      const bones = skeleton.bones
      
      if (bones && bones.length > 0) {
        // 모든 본의 평균 위치 계산
        const avgPos = new THREE.Vector3()
        let boneCount = 0
        
        bones.forEach((bone: any) => {
          bone.updateMatrixWorld(true)
          const bonePos = new THREE.Vector3()
          bone.getWorldPosition(bonePos)
          avgPos.add(bonePos)
          boneCount++
        })
        
        if (boneCount > 0) {
          avgPos.divideScalar(boneCount)
          return avgPos
        }
      }
    }
    
    // 본이 없거나 실패한 경우 기존 방법 사용
    const box = new Box3()
    mesh.geometry.computeBoundingBox()
    if (mesh.geometry.boundingBox) {
      box.copy(mesh.geometry.boundingBox)
      box.applyMatrix4(mesh.matrixWorld)
      const boxCenter = new THREE.Vector3()
      box.getCenter(boxCenter)
      return boxCenter
    }
    
    // 마지막 수단으로 월드 위치 사용
    const worldPos = new THREE.Vector3()
    mesh.getWorldPosition(worldPos)
    return worldPos
  }

  const forceHighlightColor = (mesh: Mesh, color: string, isActive: boolean = false, pulseIntensity: number = 0) => {    
    const apply = (mat: Material | null | undefined) => {
      if (!mat) return mat;
      if (mat instanceof MeshStandardMaterial) {
        mat.emissive.set(color);
        
        // 활성 상태일 때 펄스 효과
        if (isActive) {
          const baseIntensity = 0.8;
          const pulseAmount = Math.sin(pulseIntensity) * 0.8; // 0.4 ~ 1.2 사이로 펄스
          mat.emissiveIntensity = baseIntensity + pulseAmount;
          mat.opacity = 0.6 + pulseAmount * 0.3;
        } else {
          mat.emissiveIntensity = 0.3;
          mat.opacity = 0.4;
        }
        
        mat.transparent = true;
        mat.color.set(color);
        mat.needsUpdate = true;
        return mat;
      }
      return mat;
    }

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(apply);
    } else {
      mesh.material = apply(mesh.material);
    }
    
    mesh.geometry.attributes.position.needsUpdate = true;
  }

  useEffect(() => {
    if (!actions || animations.length === 0) return

    const clip = animations[0]
    const action = actions[clip.name]
    if (!action) return

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    action.stop()
    action.reset()
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true

    const halfDuration = clip.duration / 2

    if (actionName === 'extend') {
      action.time = 0
      action.play()
      intervalRef.current = setInterval(() => {
        if (action.time >= halfDuration) {
          action.paused = true
          clearInterval(intervalRef.current!)
        }
      }, 16)
    }

    if (actionName === 'fold') {
      action.time = halfDuration
      action.play()
      intervalRef.current = setInterval(() => {
        if (action.time >= clip.duration) {
          action.paused = true
          clearInterval(intervalRef.current!)
        }
      }, 16)
    }

    return () => {
      action.stop()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [actions, animations, actionName])

  useEffect(() => {
    if (!scene || !group.current) return
    
    // GLTF 구조에 맞게 메시 찾기
    scene.traverse((obj) => {
      if (obj.name === 'Muscle001' && obj.type === 'SkinnedMesh') {
        muscle001Ref.current = obj as Mesh;
        console.log('Found Muscle001:', obj);
      }
      if (obj.name === 'Muscle002' && obj.type === 'SkinnedMesh') {
        muscle002Ref.current = obj as Mesh;
        console.log('Found Muscle002:', obj);
      }
    });

    if (muscle001Ref.current && muscle002Ref.current) {
      setArmReady(true);
      console.log('Both muscles found and ready');
    }
  }, [scene, group])
  
  useEffect(() => {
    if (!muscle001Ref.current || !muscle002Ref.current) return;

    // 색상과 효과 업데이트
    if (actionName === 'fold') {
      forceHighlightColor(muscle001Ref.current, '#ff3333', true, pulseTimeA.current) // 빨간색 활성
      forceHighlightColor(muscle002Ref.current, '#3333ff', false, pulseTimeB.current) // 파란색 비활성
    } else {
      forceHighlightColor(muscle001Ref.current, '#3333ff', false, pulseTimeA.current) // 파란색 비활성
      forceHighlightColor(muscle002Ref.current, '#ff3333', true, pulseTimeB.current) // 빨간색 활성
    }
  }, [actionName, armReady])
  
  useEffect(() => {
    // 그림자 설정
    scene.traverse((obj) => {
      obj.frustumCulled = false;
      if ((obj as Mesh).isMesh || obj.type === 'SkinnedMesh') {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene])

  useFrame(({ camera }, delta) => {
    if (!armReady || !muscle001Ref.current || !muscle002Ref.current) return

    // 펄스 애니메이션 업데이트
    pulseTimeA.current += delta * 4; // 펄스 속도
    pulseTimeB.current += delta * 4;

    // 재질 업데이트 (펄스 효과)
    if (actionName === 'fold') {
      forceHighlightColor(muscle001Ref.current, '#ff3333', true, pulseTimeA.current)
      forceHighlightColor(muscle002Ref.current, '#3333ff', false, pulseTimeB.current)
    } else {
      forceHighlightColor(muscle001Ref.current, '#3333ff', false, pulseTimeA.current)
      forceHighlightColor(muscle002Ref.current, '#ff3333', true, pulseTimeB.current)
    }
  
    const updateText = (
      meshRef: Mesh,
      textRef: Group | null,
      textOffset: THREE.Vector3,
      prevPosRef: React.MutableRefObject<THREE.Vector3>
    ) => {
      if (!textRef || !meshRef) return
  
      // SkinnedMesh의 실시간 중심점 계산
      const meshCenter = getSkinnedMeshCenter(meshRef)
      
      // 텍스트 위치 계산
      const targetTextPos = new THREE.Vector3().copy(meshCenter).add(textOffset)
      prevPosRef.current.lerp(targetTextPos, 0.1)
      textRef.position.copy(prevPosRef.current)
  
      // 텍스트가 카메라를 향하도록
      textRef.quaternion.copy(camera.quaternion)
    }
  
    updateText(
      muscle001Ref.current, 
      textRefA.current,
      textOffsetA,
      prevTextPosA
    )
  
    updateText(
      muscle002Ref.current, 
      textRefB.current,
      textOffsetB,
      prevTextPosB
    )
  })

  const getBalloonText = (isA: boolean) => {
    if (actionName === 'extend') {
      return isA ? '근육이 늘어나요' : '근육이 줄어들어요'
    } else {
      return isA ? '근육이 줄어들어요' : '근육이 늘어나요'
    }
  }

  const getTextStyle = (isA: boolean) => {
    const isActive = actionName === 'extend' ? isA : !isA;
    
    return {
      color: isActive ? 'rgba(255, 100, 100, 0.95)' : 'rgba(100, 100, 255, 0.95)',
      background : 'white',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '32px',
      whiteSpace: 'nowrap' as const,
      fontWeight: isActive ? 'bold' : 'normal',
    }
  }

  return (
    <>
    <group ref={group} scale={scale} position={position} rotation={rotation}>
      <primitive object={scene} />
    </group>

      {armReady && (
        <>
          <group>
            <Billboard ref={textRefA}>
              <Html
                center
                style={getTextStyle(true)}
              >
                {getBalloonText(true)}
              </Html>
            </Billboard>
          </group>

          <group>
            <Billboard ref={textRefB}>
              <Html
                center
                style={getTextStyle(false)}
              >
                {getBalloonText(false)}
              </Html>
            </Billboard>
          </group>
        </>
      )}
    </>
  )
}