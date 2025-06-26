// components/Model.tsx
import { useGLTF } from '@react-three/drei'
import { GroupProps } from '@react-three/fiber'

export default function Model(props: GroupProps) {
  const { scene } = useGLTF('models/6-2-1/Seasonal_change.gltf')
  return <primitive object={scene} {...props} />
}