import { useRef, useEffect, useState } from 'react'
import { useGLTF, useAnimations, Billboard, Html } from '@react-three/drei'
import { Group, Object3D, Vector3, Mesh, Material, MeshStandardMaterial, LineSegments, Box3 } from 'three'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CrayonTextBox } from '@/components/CrayonTextBox'

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
  rotation = [0, Math.PI / 2, 0],
}: Props) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(url)
  const { actions } = useAnimations(animations, group)

  const textRefA = useRef<Group>(null)
  const textRefB = useRef<Group>(null)

  const textOffsetA = new THREE.Vector3(0, 0, 0)
  const textOffsetB = new THREE.Vector3(0, 0, 0)

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
      if (obj.name === 'Tricep_Here') {
        muscle001Ref.current = obj as Mesh
        if (muscle001Ref.current.material) {
          const mat = muscle001Ref.current.material as THREE.Material
          if ('transparent' in mat) {
            mat.transparent = true
            mat.opacity = 0 // 원하는 투명도 값
          }
        }
      }
      if (obj.name === 'Bicep_Here') {
        muscle002Ref.current = obj as Mesh
        if (muscle002Ref.current.material) {
          const mat = muscle002Ref.current.material as THREE.Material
          if ('transparent' in mat) {
            mat.transparent = true
            mat.opacity = 0
          }
        }
      }
    })

    if (muscle001Ref.current && muscle002Ref.current) {
      setArmReady(true)
    }
  }, [scene, group])

  // 그림자 설정을 위한 useEffect - 모든 children에 대해 castShadow와 receiveShadow 적용
  useEffect(() => {
    if (!scene) return

    scene.traverse((obj) => {
      obj.castShadow = true
      obj.receiveShadow = true
    })
  }, [scene])

  useFrame(({ camera }, delta) => {
    if (!armReady || !muscle001Ref.current || !muscle002Ref.current) return

    const updateText = (
      meshRef: Mesh,
      textRef: Group | null,
      textOffset: THREE.Vector3,
      prevPosRef: React.MutableRefObject<THREE.Vector3>,
    ) => {
      if (!textRef || !meshRef) return

      const meshCenter = getSkinnedMeshCenter(meshRef)

      const targetTextPos = new THREE.Vector3().copy(meshCenter).add(textOffset)
      prevPosRef.current.lerp(targetTextPos, 1)
      textRef.position.copy(prevPosRef.current)

      textRef.quaternion.copy(camera.quaternion)
    }

    updateText(muscle001Ref.current, textRefA.current, textOffsetA, prevTextPosA)

    updateText(muscle002Ref.current, textRefB.current, textOffsetB, prevTextPosB)
  })

  const getBalloonText = (isA: boolean) => {
    if (actionName === 'extend') {
      return isA ? '팔을 구부릴 때 팔 바깥쪽 근육이 늘어납니다.' : '팔을 구부릴 때 팔 안쪽 근육이 줄어듭니다.'
    } else {
      return isA ? '팔을 펼 때 팔 바깥쪽 근육이 줄어듭니다.' : '팔을 펼 때 팔 안쪽 근육이 늘어납니다.'
    }
  }

  const getPointColor = (isA: boolean) => {
    return '#333'
  }

  const getBubbleBgColor = (isA: boolean) => {
    return '#fff'
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
                  onClick={handleToggleBubbleA}>
                  {/* CrayonTextBox 말풍선 */}
                  {showBubbleA && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '35px',
                        right: '10px',
                        zIndex: 1000,
                        width: '400px',
                        transform: 'scale(0.8)',
                        transformOrigin: 'bottom right',
                      }}>
                      <CrayonTextBox
                        text={getBalloonText(true)}
                        color={getPointColor(true)}
                        bg={getBubbleBgColor(true)}
                        textcolor='#333'
                        fontSize='20px'
                        fontWeight='500'
                        textAlign='right'
                        padding={12}
                        animated={true}
                      />
                    </div>
                  )}

                  {/* 클릭 포인트 - CrayonTextBox 스타일 */}
                  <div
                    style={{
                      position: 'relative',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}>
                    {/* SVG 필터 정의 */}
                    <svg width='0' height='0' style={{ position: 'absolute' }}>
                      <defs>
                        <filter id='crayonPointA' x='-15%' y='-15%' width='130%' height='130%'>
                          <feTurbulence baseFrequency='0.4' numOctaves='2' result='crayonNoise' seed='5' />
                          <feDisplacementMap in='SourceGraphic' in2='crayonNoise' scale='1.2' />
                        </filter>
                      </defs>
                    </svg>

                    {/* 배경 원 */}
                    <div
                      style={{
                        width: '70%',
                        height: '70%',
                        opacity: '75%',
                        borderRadius: '50%',
                        backgroundColor: getBubbleBgColor(true),
                        border: `3px solid ${getPointColor(true)}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        filter: 'url(#crayonPointA)',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                    />
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
                  onClick={handleToggleBubbleB}>
                  {/* CrayonTextBox 말풍선 */}
                  {showBubbleB && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '35px',
                        left: '35px',
                        zIndex: 1000,
                        width: '400px',
                        transform: 'scale(0.8)',
                        transformOrigin: 'bottom left',
                      }}>
                      <CrayonTextBox
                        text={getBalloonText(false)}
                        color={getPointColor(false)}
                        bg={getBubbleBgColor(false)}
                        textcolor='#333'
                        fontSize='20px'
                        fontWeight='500'
                        textAlign='right'
                        padding={12}
                        animated={true}
                      />
                    </div>
                  )}

                  {/* 클릭 포인트 - CrayonTextBox 스타일 */}
                  <div
                    style={{
                      position: 'relative',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}>
                    {/* SVG 필터 정의 */}
                    <svg width='0' height='0' style={{ position: 'absolute' }}>
                      <defs>
                        <filter id='crayonPointB' x='-15%' y='-15%' width='130%' height='130%'>
                          <feTurbulence baseFrequency='0.4' numOctaves='2' result='crayonNoise' seed='8' />
                          <feDisplacementMap in='SourceGraphic' in2='crayonNoise' scale='1.2' />
                        </filter>
                      </defs>
                    </svg>

                    {/* 배경 원 */}
                    <div
                      style={{
                        width: '70%',
                        height: '70%',
                        borderRadius: '50%',
                        opacity: '75%',
                        backgroundColor: getBubbleBgColor(false),
                        border: `3px solid ${getPointColor(false)}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        filter: 'url(#crayonPointB)',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                    />
                  </div>
                </div>
              </Html>
            </Billboard>
          </group>
        </>
      )}
    </>
  )
}
