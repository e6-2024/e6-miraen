// components/Buzzer1.tsx
import { useGLTF } from '@react-three/drei'
import { GroupProps } from '@react-three/fiber'

export default function Buzzer1(props: GroupProps) {
  const { scene } = useGLTF('models/6-2-3/Buzzer_1.gltf')
  return <primitive object={scene} {...props} />
}


useGLTF.preload('models/6-2-3/Buzzer_1.gltf')
