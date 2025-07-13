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

  const textOffsetA = new THREE.Vector3(-0.02, -0.01, 0.00)
  const textOffsetB = new THREE.Vector3(0.02, -0.02, 0.00)

  const prevTextPosA = useRef(new THREE.Vector3())
  const prevTextPosB = useRef(new THREE.Vector3())

  const [armReady, setArmReady] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const muscle001Ref = useRef<Mesh>(null)
  const muscle002Ref = useRef<Mesh>(null)

  // 말풍선 상태 관리 (개별 토글)
  const [showBubbleA, setShowBubbleA] = useState(false)
  const [showBubbleB, setShowBubbleB] = useState(false)

  const getSkinnedMeshCenter = (mesh: Mesh): THREE.Vector3 => {
    mesh.updateMatrixWorld(true)
    
    if (mesh.type === 'SkinnedMesh' && (mesh as any).skeleton) {
      const skeleton = (mesh as any).skeleton
      const bones = skeleton.bones
      
      if (bones && bones.length > 0) {
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
    
    const box = new Box3()
    mesh.geometry.computeBoundingBox()
    if (mesh.geometry.boundingBox) {
      box.copy(mesh.geometry.boundingBox)
      box.applyMatrix4(mesh.matrixWorld)
      const boxCenter = new THREE.Vector3()
      box.getCenter(boxCenter)
      return boxCenter
    }
    
    const worldPos = new THREE.Vector3()
    mesh.getWorldPosition(worldPos)
    return worldPos
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
    
    scene.traverse((obj) => {
      if (obj.name === 'Muscle001' && obj.type === 'SkinnedMesh') {
        muscle001Ref.current = obj as Mesh;
      }
      if (obj.name === 'Muscle002' && obj.type === 'SkinnedMesh') {
        muscle002Ref.current = obj as Mesh;
      }
    });

    if (muscle001Ref.current && muscle002Ref.current) {
      setArmReady(true);
    }
  }, [scene, group])
  
  useEffect(() => {
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

    const updateText = (
      meshRef: Mesh,
      textRef: Group | null,
      textOffset: THREE.Vector3,
      prevPosRef: React.MutableRefObject<THREE.Vector3>
    ) => {
      if (!textRef || !meshRef) return
  
      const meshCenter = getSkinnedMeshCenter(meshRef)
      
      const targetTextPos = new THREE.Vector3().copy(meshCenter).add(textOffset)
      prevPosRef.current.lerp(targetTextPos, 0.1)
      textRef.position.copy(prevPosRef.current)
  
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
      return isA ? '팔을 구부릴 때 팔 바깥쪽 근육이 늘어납니다' : '팔을 구부릴 때 팔 안쪽 근육이 줄어듭니다'
    } else {
      return isA ? '팔을 펼 때 팔 바깥쪽 근육이 줄어듭니다' : '팔을 펼 때 팔 안쪽 근육이 늘어납니다'
    }
  }

  const getTextColor = (isA: boolean) => {
    return '#000000'; // 모든 포인트를 검정색으로 통일
  }

  const handleToggleBubbleA = () => {
    setShowBubbleA(!showBubbleA)
  }

  const handleToggleBubbleB = () => {
    setShowBubbleB(!showBubbleB)
  }

  return (
    <>
      <group ref={group} scale={scale} position={position} rotation={rotation}>
        <primitive object={scene} />
      </group>

      {armReady && (
        <>
          {/* 포인트 A (바깥쪽 근육) - 왼쪽 */}
          <group>
            <Billboard ref={textRefA}>
              <Html center>
                <div
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                  }}
                  onClick={handleToggleBubbleA}
                >
                  {/* 말풍선 */}
                  {showBubbleA && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '25px',
                        right: '25px', // 동그라미 왼쪽에 말풍선 배치
                        backgroundColor: 'white',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        border: `2px solid ${getTextColor(true)}`,
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        color: '#333',
                        zIndex: 1000
                      }}
                    >
                      {getBalloonText(true)}
                    </div>
                  )}
                  
                  {/* 클릭 포인트 (동그라미) */}
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: getTextColor(true),
                      border: '3px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'pulse 2s infinite',
                      fontSize: '12px',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  >
                  </div>
                </div>
              </Html>
            </Billboard>
          </group>

          {/* 포인트 B (안쪽 근육) - 오른쪽 */}
          <group>
            <Billboard ref={textRefB}>
              <Html center>
                <div
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                  }}
                  onClick={handleToggleBubbleB}
                >
                  {/* 말풍선 */}
                  {showBubbleB && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '25px',
                        left: '25px', // 동그라미 오른쪽에 말풍선 배치
                        backgroundColor: 'white',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        border: `2px solid ${getTextColor(false)}`,
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        color: '#333',
                        zIndex: 1000
                      }}
                    >
                      {getBalloonText(false)}
                    </div>
                  )}
                  
                  {/* 클릭 포인트 (동그라미) */}
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: getTextColor(false),
                      border: '3px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'pulse 2s infinite',
                      fontSize: '12px',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  >
                  </div>
                </div>
              </Html>
            </Billboard>
          </group>
        </>
      )}

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}