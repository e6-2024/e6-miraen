import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

export default function CameraLogger() {
  const { camera } = useThree()

  useEffect(() => {
    const log = () => {
      console.log('Camera position:', camera.position)
      console.log('Camera rotation:', camera.rotation)
    }
    window.addEventListener('keydown', log)
    return () => window.removeEventListener('keydown', log)
  }, [camera])

  return null
}
