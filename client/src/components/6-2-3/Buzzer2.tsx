// components/Buzzer2.tsx
import { useGLTF } from '@react-three/drei'
import { GroupProps } from '@react-three/fiber'

export default function Buzzer2(props: GroupProps) {
  const { scene } = useGLTF('models/6-2-3/Buzzer_2.gltf')
  return <primitive object={scene} {...props} />
}

useGLTF.preload('models/6-2-3/Buzzer_2.gltf')