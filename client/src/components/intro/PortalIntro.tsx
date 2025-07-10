import * as THREE from 'three'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, useCursor, MeshPortalMaterial } from '@react-three/drei'
import { suspend } from 'suspend-react'
import { easing } from 'maath'
import { useRouter } from 'next/router'

export default function Frame({
  id,
  name,
  author,
  bg = '#ffffff',
  link = '/5-1-1',
  width = 1,
  height = 1.61803398875,
  children,
  ...props
}: {
  id: string
  name: string
  author?: string
  bg?: string
  link?: string
  width?: number
  height?: number
  children: React.ReactNode
  [key: string]: any
}) {
  const portal = useRef<any>()
  const [hovered, hover] = useState(false)
  const router = useRouter()
  useCursor(hovered)

  // 포탈 blend 효과 (항상 열려있게 유지하거나 제거해도 무방)
  useFrame((state, dt) => {
    if (portal.current) {
      easing.damp(portal.current, 'blend', 1, 0.15, dt)
    }
  })

  return (
    <group {...props}>
      {/* 포탈 메쉬 */}
      <mesh
        name={id}
        onClick={(e) => {
          e.stopPropagation()
          router.push('/5-1-1')
        }}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}
      >
        <planeGeometry args={[width, height, 0.1]} />
        <MeshPortalMaterial
          ref={portal}
          side={THREE.DoubleSide}
        >
          <color attach="background" args={[bg]} />
          {children}
        </MeshPortalMaterial>
      </mesh>
    </group>
  )
}
