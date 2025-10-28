import { useSphere } from '@react-three/cannon'
import { useRef, useEffect } from 'react'
import { Mesh } from 'three'
import { PARTICLE_CONFIG, PHYSICS_CONFIG } from '@/utils/5-2-1/sieveConfig'

interface Props {
  position: [number, number, number]
  radius: number
}

export default function Particle({ position, radius }: Props) {
  const ref = useRef<Mesh>(null)

  const isLarge = radius > 0.3
  const config = isLarge ? PARTICLE_CONFIG.LARGE : PARTICLE_CONFIG.SMALL

  const [, api] = useSphere(
    () => ({
      mass: config.mass,
      position,
      args: [radius],
      material: {
        friction: PHYSICS_CONFIG.friction,
        restitution: PHYSICS_CONFIG.restitution,
      },
      allowSleep: true,
      sleepSpeedLimit: 0.1, 
      sleepTimeLimit: 1,
    }),
    ref,
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (api) {
        api.velocity.set((Math.random() - 0.5) * 0.01, -0.1, (Math.random() - 0.5) * 0.01)
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [api])

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[radius, 12, 8]} />
      <meshStandardMaterial color={config.color} />
    </mesh>
  )
}
