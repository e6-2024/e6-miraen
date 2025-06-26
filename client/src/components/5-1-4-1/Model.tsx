// components/Model.tsx
import { useGLTF } from '@react-three/drei'
import { GroupProps } from '@react-three/fiber'

export default function Model(props: GroupProps) {
  const { scene } = useGLTF('models/Anatomy/plane.glb')
  return <primitive object={scene} {...props} />
}