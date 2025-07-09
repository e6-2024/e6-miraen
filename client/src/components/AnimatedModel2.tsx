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