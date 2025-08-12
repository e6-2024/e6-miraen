/* ConstellationModel.tsx */
import { useGLTF } from '@react-three/drei'
import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { Billboard } from '@react-three/drei'

type Season = 'spring' | 'summer' | 'fall' | 'winter'

interface ConstellationModelProps {
  season: Season
  activeSeason: string | null
  position: [number, number, number]
  visible: boolean
  fadeInDelay?: number
  fadeSpeed?: number
  isResetting?: boolean
}

type Label = {
  id: string
  name: string
  position: [number, number, number]
  rotation?: [number, number, number]
  fontSize?: number
}

const LABELS: Record<Season, Label[]> = {
  spring: [
    { id: 'boo', name: '큰개자리', position: [-60, 20, 40], rotation: [0, Math.PI / 2, 0], fontSize: 2 },
    { id: 'vir', name: '쌍둥이자리', position: [-70, 70, -48], rotation: [0, Math.PI / 4, 0], fontSize: 2 },
    { id: 'vir', name: '오리온자리', position: [-60, 30, -28], rotation: [0, Math.PI / 4, 0], fontSize: 2 },

    {
      id: 'leo',
      name: '처녀자리',
      position: [70, 100, 70],
      rotation: [0, Math.PI / 2 + Math.PI / 3, 0],
      fontSize: 3,
    },
    {
      id: 'leo',
      name: '사자자리',
      position: [0, 150, 28],
      rotation: [0, Math.PI / 2 + Math.PI / 4, 0],
      fontSize: 3,
    },
    {
      id: 'leo',
      name: '목동자리',
      position: [100, 60, -20],
      rotation: [0, Math.PI / 4 + Math.PI, 0],
      fontSize: 3,
    },
    {
      id: 'leo',
      name: '페가수스자리',
      position: [80, 20, -80],
      rotation: [0, -Math.PI / 4, 0],
      fontSize: 3,
    },
    {
      id: 'leo',
      name: '안드로메다자리',
      position: [40, 20, -90],
      rotation: [0, -Math.PI / 4, 0],
      fontSize: 3,
    },
    {
      id: 'leo',
      name: '물고기자리',
      position: [10, 10, -110],
      rotation: [0, -Math.PI / 6, 0],
      fontSize: 3,
    },
  ],
  summer: [
    { id: 'vir', name: '오리온자리', position: [30, 100, 0], rotation: [0, Math.PI / 4, 0], fontSize: 3 },
    { id: 'vir', name: '쌍둥이자리', position: [0, 100, -50], rotation: [0, 0, 0], fontSize: 3 },

    {
      id: 'leo',
      name: '물고기자리',
      position: [-10, 50, 70],
      rotation: [0, Math.PI / 2 + Math.PI / 3, 0],
      fontSize: 3,
    },
    {
      id: 'leo',
      name: '안드로메다자리',
      position: [-50, 90, 48],
      rotation: [0, Math.PI / 2 + Math.PI / 4, 0],
      fontSize: 3,
    },
    {
      id: 'leo',
      name: '페가수스자리',
      position: [-50, 20, 60],
      rotation: [0, Math.PI / 2 + Math.PI / 4, 0],
      fontSize: 3,
    },
    {
      id: 'leo',
      name: '큰개자리',
      position: [90, 60, -20],
      rotation: [0, -Math.PI / 2 + Math.PI / 4, 0],
      fontSize: 3,
    },
    // {
    //   id: 'leo',
    //   name: '독수리자리',
    //   position: [100, 50, 20],
    //   rotation: [0, -Math.PI / 2, 0],
    //   fontSize: 3,
    // },
    {
      id: 'leo',
      name: '사자자리',
      position: [0, 40, -90],
      rotation: [0, -Math.PI / 4, 0],
      fontSize: 3,
    },
    {
      id: 'leo',
      name: '처녀자리',
      position: [10, 20, -110],
      rotation: [0, -Math.PI / 6, 0],
      fontSize: 3,
    },
    {
      id: 'leo',
      name: '목동자리',
      position: [-50, 20, -80],
      rotation: [0, -Math.PI / 6, 0],
      fontSize: 3,
    },
  ],
  fall: [
    { id: 'peg', name: '페가수스자리', position: [25, 200, 10], rotation: [0, -Math.PI / 2, 0], fontSize: 3 },
    { id: 'and', name: '안드로메다자리', position: [-35, 190, -70], rotation: [0, -Math.PI / 4, 0], fontSize: 3 },
    { id: 'psc', name: '물고기자리', position: [65, 120, 10], rotation: [0, -Math.PI / 2, 0], fontSize: 3 },

    { id: 'cyg', name: '백조자리', position: [-50, 90, 48], rotation:[0, Math.PI / 2 + Math.PI / 4, 0], fontSize: 3 },
    {
      id: 'lyr',
      name: '거문고자리',
      position: [-70, 80, 100],
      rotation: [0, -Math.PI / 2 + Math.PI / 4, 0],
      fontSize: 3,
    },
    { id: 'aql', name: '독수리자리', position: [10, 50, 160], rotation: [0, -Math.PI / 2, 0], fontSize: 3 },

    { id: 'gem', name: '쌍둥이자리', position: [-20, 30, -68], rotation: [0, Math.PI / 4, 0], fontSize: 3 },
    { id: 'ori', name: '오리온자리', position: [10, 50, -68], rotation: [0, Math.PI / 4, 0], fontSize: 3 },
  ],
  winter: [
    { id: 'aql', name: '독수리자리', position: [80, 80, -90], rotation: [0, -Math.PI / 4, 0], fontSize: 3 },
    { id: 'boo', name: '목동자리', position: [0, 90, 38], rotation: [0, Math.PI, 0], fontSize: 3 },
    { id: 'vir', name: '처녀자리', position: [-10, 50, 70], rotation: [0, Math.PI, 0], fontSize: 3 },
    { id: 'cyg', name: '백조자리', position: [20, 100, -80], rotation: [0, -Math.PI / 4, 0], fontSize: 3 },
    { id: 'and', name: '안드로메다자리', position: [-30, 70, -120], rotation: [0, 0, 0], fontSize: 3 },
    { id: 'peg', name: '페가수스자리', position: [40, 40, -90], rotation: [0, -Math.PI / 4, 0], fontSize: 3 },
    { id: 'lyr', name: '거문고자리', position: [40, 180, -80], rotation: [0, -Math.PI / 4, 0], fontSize: 3 },
    { id: 'psc', name: '물고기자리', position: [-30, 20, -110], rotation: [0, -Math.PI / 6, 0], fontSize: 3 },
    { id: 'leo', name: '사자자리', position: [-80, 40, 88], rotation: [0, Math.PI / 2 + Math.PI / 4, 0], fontSize: 3 },
  ],
}

export function ConstellationModel({
  activeSeason,
  season,
  position,
  visible,
  fadeInDelay = 1.2,
  fadeSpeed = 1,
  isResetting = false,
}: ConstellationModelProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const springGltf = useGLTF('/models/6-1-4/Spring_Whole/Spring.gltf')
  const winterGltf = useGLTF('/models/6-1-4/Summer_Whole/Summer.gltf')
  const fallGltf = useGLTF('/models/6-1-4/Fall_Whole/Fall.gltf')
  const summerGltf = useGLTF('/models/6-1-4/Winter_Whole/Winter.gltf')

  const [opacity, setOpacity] = useState(0)
  const [shouldStartFade, setShouldStartFade] = useState(false)
  const fadeStartTime = useRef<number | null>(null)
  const materialsRef = useRef<THREE.Material[]>([])
  const labels = useMemo<Label[]>(() => LABELS[season] ?? [], [season])

  console.log(season)

  const currentScene = useMemo(() => {
    switch (season) {
      case 'spring':
        return springGltf.scene
      case 'summer':
        return summerGltf.scene
      case 'fall':
        return fallGltf.scene
      case 'winter':
        return winterGltf.scene
      default:
        return springGltf.scene
    }
  }, [season, springGltf.scene, summerGltf.scene, fallGltf.scene, winterGltf.scene])

  const initialRotationY = useMemo(() => {
    switch (season) {
      case 'summer':
        return Math.PI/2
      case 'spring':
        return 0 - Math.PI / 2
      case 'fall':
        return 0
      case 'winter':
        return -Math.PI / 2 + Math.PI / 10
      default:
        return 0
    }
  }, [season])

  const initialRotationY2 = useMemo(() => {
    switch (season) {
      case 'spring':
        return 0
      case 'summer':
        return -Math.PI / 2
      case 'fall':
        return Math.PI
      case 'winter':
        return Math.PI / 2
      default:
        return 0
    }
  }, [season])

  const clonedScene = useMemo(() => {
    const cloned = currentScene.clone()
    const materials: THREE.Material[] = []

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === 'Cylinder') {
        const applyMat = (mat: THREE.Material) => {
          mat.side = THREE.FrontSide
          mat.transparent = true
          mat.opacity = 0
          materials.push(mat)
        }

        if (Array.isArray(child.material)) {
          child.material.forEach((m) => applyMat(m))
        } else {
          applyMat(child.material)
        }
      }
    })

    materialsRef.current = materials
    return cloned
  }, [currentScene])

  useEffect(() => {
    if (visible && !isResetting) {
      const timer = setTimeout(() => {
        setShouldStartFade(true)
        fadeStartTime.current = Date.now()
      }, fadeInDelay * 1000)
      return () => clearTimeout(timer)
    }

    if (!visible) {
      setOpacity(0)
      materialsRef.current.forEach((mat) => (mat.opacity = 0))
      fadeStartTime.current = null
      setShouldStartFade(false)
    }
  }, [visible, fadeInDelay, isResetting])

  // 리셋 시 무조건 fade-out 시작
  useEffect(() => {
    if (isResetting) {
      setShouldStartFade(false)
      fadeStartTime.current = Date.now()
    }
  }, [isResetting])

  useFrame(() => {
    if (!fadeStartTime.current) return
    const elapsed = (Date.now() - fadeStartTime.current) / 1000

    if (shouldStartFade && !isResetting && visible) {
      // 페이드 인
      const speed = fadeSpeed * 0.8
      const newOp = Math.min(elapsed * speed, 1)
      setOpacity(newOp)
      materialsRef.current.forEach((mat) => (mat.opacity = newOp))
    } else if (isResetting || (!visible && opacity > 0)) {
      // 페이드 아웃 (리셋이면 더 빠르게)
      const speed = fadeSpeed * (isResetting ? 5 : 2.5)
      const newOp = Math.max(1 - elapsed * speed, 0)
      setOpacity(newOp)
      materialsRef.current.forEach((mat) => (mat.opacity = newOp))
      if (newOp === 0) fadeStartTime.current = null
    }
  })

  // opacity가 0일 때만 그룹 숨김
  return (
    <group ref={groupRef} position={position} visible={opacity > 0}>
      <group scale={0.5} position={[0, -12.5, 0]} rotation={[0, initialRotationY, 0]}>
        <primitive object={clonedScene} />
        {labels.map(({ id, name, position, fontSize = 1 }) => (
          <Billboard
            key={id}
            position={position}
            follow // 카메라 따라 회전 (기본 true)
            // lockX lockY lockZ로 특정 축 회전만 막을 수도 있음
            // lockX={false} lockY={false} lockZ={false}
          >
            <Text
              fontSize={fontSize}
              color='white'
              anchorX='center'
              anchorY='middle'
              font='/fonts/Maplestory Bold.ttf'
              fillOpacity={opacity}>
              {name}
            </Text>
          </Billboard>
        ))}
      </group>
      <group scale={1} rotation={[0, initialRotationY2, 0]}>
        <Text
          position={[0, 0, 50]}
          rotation={[0, Math.PI, 0]}
          fontSize={3}
          color='white'
          anchorX='center'
          anchorY='middle'
          font='/fonts/Maplestory Bold.ttf'>
          동
        </Text>

        <Text
          position={[0, 0, -50]}
          rotation={[0, 0, 0]}
          fontSize={3}
          color='white'
          anchorX='center'
          anchorY='middle'
          font='/fonts/Maplestory Bold.ttf'>
          서
        </Text>

        <Text
          position={[50, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          fontSize={3}
          color='white'
          anchorX='center'
          anchorY='middle'
          font='/fonts/Maplestory Bold.ttf'>
          북
        </Text>

        <Text
          position={[-50, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={3}
          color='white'
          anchorX='center'
          anchorY='middle'
          font='/fonts/Maplestory Bold.ttf'>
          남
        </Text>
      </group>
    </group>
  )
}
