import { Ray } from '@/components/5-1-2/Ray'
import { Lens } from '@/components/5-1-2/Lens'
import * as THREE from 'three'
import { useMemo } from 'react'
import { Reflector } from '@react-three/drei'
import { OpticalMode, LensType, RayStates, OpticalSurface } from '@/types/5-1-2/types'
import { getRayOrigins } from '@/utils/5-1-2/utils'

interface OpticalLabProps {
  mode: OpticalMode
  lensType?: LensType
  rayStates: RayStates
  laserAngle?: number
}

export function OpticalLab({ mode, lensType = 'convex', rayStates, laserAngle = 45 }: OpticalLabProps) {
  const MIRROR_CENTERS = useMemo(
    () => [new THREE.Vector3(0, 6.45, 0), new THREE.Vector3(0, 5.65, 0), new THREE.Vector3(0, 4.95, 0)],
    [],
  )

  const rayOrigins = useMemo(() => getRayOrigins(mode, laserAngle), [mode, laserAngle])

  const rayDirections = useMemo(() => {
    if (mode === 'reflection') {
      return rayOrigins.map((origin, index) => {
        return MIRROR_CENTERS[index].clone().sub(origin).normalize()
      })
    } else {
      return [new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0)]
    }
  }, [rayOrigins, mode, MIRROR_CENTERS])

  const reflectSurfaces = useMemo<OpticalSurface[]>(() => {
    if (mode === 'reflection') {
      return [
        {
          position: new THREE.Vector3(0, 0, 0),
          normal: new THREE.Vector3(-1, 0, 0),
          type: 'mirror',
        },
      ]
    }

    if (mode === 'refraction') {
      return [
        {
          position: new THREE.Vector3(-3.4, 1, 2),
          normal: new THREE.Vector3(-1, 0, 0),
          type: 'lens',
          refractiveIndex: 1.5,
          lensType,
          surface: 'entrance',
        },
        {
          position: new THREE.Vector3(-3 + 0.3, 1, 2),
          normal: new THREE.Vector3(1, 0, 0),
          type: 'lens',
          refractiveIndex: 1.0,
          lensType,
          surface: 'exit',
        },
      ]
    }

    return []
  }, [mode, lensType])

  const renderRays = () => {
    return rayOrigins.map(
      (origin, index) =>
        rayStates[index] && (
          <Ray
            key={`${mode}-${index}-${laserAngle}`}
            origin={origin}
            direction={rayDirections[index]}
            reflectSurfaces={reflectSurfaces}
            color='red'
          />
        ),
    )
  }

  return (
    <>
      {renderRays()}
      {mode === 'reflection' && (
        <>
          <Reflector
            resolution={2048}
            args={[10, 10]}
            mirror={0.9}
            mixStrength={0.5}
            rotation={[Math.PI / 2, (3 * Math.PI) / 2, 0]}
            position={[0, 5, 0]}>
            {(Material: React.ElementType, props) => (
              <Material color='white' metalness={0.8} roughness={0.2} side={THREE.DoubleSide} {...props} />
            )}
          </Reflector>
          <mesh position={[0.13, 5, 0]}>
            <boxGeometry args={[0.2, 10, 10]} />
            <meshStandardMaterial color='gray' />
          </mesh>
        </>
      )}

      {mode === 'refraction' && <Lens position={new THREE.Vector3(-3.2, 1.05, -0.5)} type={lensType} scale={1.035} />}
    </>
  )
}
