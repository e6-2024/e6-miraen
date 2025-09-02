import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function TiltOnMouse({
  enabled,
  maxDeg = 10,
  position = [0, 0, 0],
  children,
}: {
  enabled: boolean
  maxDeg?: number
  position?: [number, number, number]
  children: React.ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  const targetRad = useRef(0)

  useEffect(() => {
    if (!enabled && ref.current) ref.current.rotation.y = 0
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const deg = THREE.MathUtils.clamp(nx * maxDeg, -maxDeg, maxDeg)
      targetRad.current = THREE.MathUtils.degToRad(deg)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [enabled, maxDeg])

  useFrame((_, dt) => {
    if (!ref.current) return
    const target = enabled ? targetRad.current : 0
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, target, 3, dt)
  })

  return (
    <group ref={ref} position={position as any}>
      {children}
    </group>
  )
}
