import { useRef, useEffect, useState } from 'react'
import { useGLTF, useAnimations, Billboard, Html } from '@react-three/drei'
import { Group, Object3D, Vector3, Mesh, Material, MeshStandardMaterial, LineSegments } from 'three'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

type Props = {
  url: string
  scale?: number
  actionName: 'extend' | 'fold'
  position?: [number, number, number]
  lineTargetPosA?: [number, number, number]
  lineTargetPosB?: [number, number, number]
  lineStartPosA?: [number, number, number]
  lineStartPosB?: [number, number, number]
  rotation?: [number, number, number]
}

export default function AnimatedModel2({
  url,
  scale = 0.1,
  actionName,
  position = [0, 0, 0],
  rotation = [0, Math.PI/2, 0],
  lineTargetPosA = [-0.03, 0.00, -0.02],
  lineTargetPosB = [0.03, -0.05, 0.01],
  lineStartPosA = [-0.04, 0.073, 0.08],
  lineStartPosB = [-0.04, 0.073, 0.08],
}: Props) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(url)
  const { actions } = useAnimations(animations, group)

  const armRefA = useRef<Object3D>(null)
  const armRefB = useRef<Object3D>(null)
  const textRefA = useRef<Group>(null)
  const textRefB = useRef<Group>(null)
  const lineRefA = useRef<LineSegments>(null)
  const lineRefB = useRef<LineSegments>(null)

  const textOffsetA = new THREE.Vector3(-0.06, 0.06, 0.08)
  const textOffsetB = new THREE.Vector3(0.06, 0.06, 0.08)

  const prevTextPosA = useRef(new THREE.Vector3())
  const prevTextPosB = useRef(new THREE.Vector3())

  const [armReady, setArmReady] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const redTargetRef = useRef<Mesh>(null)
  const blueTargetRef = useRef<Mesh>(null)

  const forceHighlightColor = (mesh: Mesh, color: string) => {    
    const apply = (mat: Material | null | undefined) => {
      if (!mat) return mat;
      if (mat instanceof MeshStandardMaterial) {
        mat.emissive.set(color);
        mat.emissiveIntensity = 1.0;
        mat.opacity =0.3;
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
    
    // Muscle 그룹에서 메시 찾기
    let meshA, meshB;
    
    scene.traverse((obj) => {
      if (obj.name === 'Mesh002' && obj.type === 'SkinnedMesh') {
        meshA = obj as Mesh;
      }
      if (obj.name === 'Mesh002_1' && obj.type === 'SkinnedMesh') {
        meshB = obj as Mesh;
      }
    });
    
    if (meshA && meshB) {
      redTargetRef.current = meshA;
      blueTargetRef.current = meshB;
    } else {

      const muscleGroup = scene.getObjectByName('Muscle');
      if (muscleGroup) {
        const meshes: Mesh[] = [];
        muscleGroup.traverse((obj) => {
          if (obj.type === 'SkinnedMesh') {
            meshes.push(obj as Mesh);
          }
        });
        
        if (meshes.length >= 2) {
          redTargetRef.current = meshes[0];
          blueTargetRef.current = meshes[1];
        }
      }
    }
  }, [scene, group])
  

  useEffect(() => {
    const meshA = redTargetRef.current
    const meshB = blueTargetRef.current
  
  
    if (actionName === 'fold') {
      forceHighlightColor(meshA, 'red')
      forceHighlightColor(meshB, 'blue')
    } else {
      forceHighlightColor(meshA, 'blue')
      forceHighlightColor(meshB, 'red')
    }
  }, [actionName])
  

  useEffect(() => {
    if (redTargetRef.current && blueTargetRef.current) {
      armRefA.current = redTargetRef.current;
      armRefB.current = blueTargetRef.current;
      setArmReady(true);
    } else {
      const bicep = scene.getObjectByName('Bicep');
      const tricep = scene.getObjectByName('Tricep');
      
      if (bicep && tricep) {
        armRefA.current = bicep;
        armRefB.current = tricep;
        setArmReady(true);
      }
    }
    
    // 그림자 설정
    scene.traverse((obj) => {
      obj.frustumCulled = false;
      if ((obj as Mesh).isMesh || obj.type === 'SkinnedMesh') {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene])

  useFrame(({ camera }) => {
    if (!armReady) return
  
    const updateTextAndLine = (
      armRef: Object3D | null,
      textRef: Group | null,
      lineRef: THREE.LineSegments | null,
      offset: THREE.Vector3,
      prevPosRef: React.MutableRefObject<THREE.Vector3>,
      startPosition: [number, number, number]
    ) => {
      if (!textRef || !lineRef) return
  
      const targetTextPos = new THREE.Vector3()
      const startWorldPos = new THREE.Vector3(...startPosition)
      
      if (armRef) {
        const armWorldPos = new THREE.Vector3()
        armRef.updateMatrixWorld(true)
        armRef.getWorldPosition(armWorldPos)
        targetTextPos.copy(armWorldPos).add(offset)
      } else {
        targetTextPos.copy(startWorldPos).add(offset)
      }
  
      prevPosRef.current.lerp(targetTextPos, 0.1)
      textRef.position.copy(prevPosRef.current)
  
      textRef.quaternion.copy(camera.quaternion)
  
      lineRef.geometry.setFromPoints([startWorldPos, prevPosRef.current])
      lineRef.geometry.attributes.position.needsUpdate = true
    }
  
    updateTextAndLine(
      null, 
      textRefA.current,
      lineRefA.current,
      textOffsetA,
      prevTextPosA,
      lineStartPosA
    )
  
    updateTextAndLine(
      null, 
      textRefB.current,
      lineRefB.current,
      textOffsetB,
      prevTextPosB,
      lineStartPosB
    )
  })
  
  

  const getBalloonText = (isA: boolean) => {
    if (actionName === 'extend') {
      return isA ? '근육이 늘어나요' : '근육이 줄어들어요'
    } else {
      return isA ? '근육이 줄어들어요' : '근육이 늘어나요'
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
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'Arial, sans-serif',
                  color: 'black',
                  border: '1px solid #ccc',
                  whiteSpace: 'nowrap'
                }}
              >
                {getBalloonText(true)}
              </Html>
            </Billboard>
          </group>
          <lineSegments ref={lineRefA}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([0, 0, 0, 0, 0, 0])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="black" linewidth={2} />
          </lineSegments>

          <group>
            <Billboard ref={textRefB}>
              <Html
                center
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'Arial, sans-serif',
                  color: 'black',
                  border: '1px solid #ccc',
                  whiteSpace: 'nowrap'
                }}
              >
                {getBalloonText(false)}
              </Html>
            </Billboard>
          </group>
          <lineSegments ref={lineRefB}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([0, 0, 0, 0, 0, 0])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="black" linewidth={2} />
          </lineSegments>
        </>
      )}
    </>
  )
}