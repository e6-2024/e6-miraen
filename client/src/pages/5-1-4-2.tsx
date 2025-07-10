import { Canvas } from '@react-three/fiber'
import { OrbitControls, AccumulativeShadows, RandomizedLight, Environment, PerformanceMonitor } from '@react-three/drei'
import AnimatedModel2 from '../components/AnimatedModel2'
import { useState } from 'react'
import { Model } from '@/components/5-1-4-2/Model'
import Link from 'next/link'

export default function Home() {
  const [action, setAction] = useState<'extend' | 'fold'>('fold')

  const [lineTargetPosA, setLineTargetPosA] = useState<[number, number, number]>([-0.035, 0.001, -0.015])
  const [lineTargetPosB, setLineTargetPosB] = useState<[number, number, number]>([-0.035, 0.001, -0.015])
  const [hasExtended, setHasExtended] = useState(false)
  const [perfSucks, degrade] = useState(false)

  const handleExtend = () => {
    setAction('extend')

    if (!hasExtended) {
      setLineTargetPosA(([x, y, z]) => [x, y, z+0.001] as [number, number, number])
      setLineTargetPosB(([x, y, z]) => [x, y, z+0.005] as [number, number, number])
      setHasExtended(true)
    }
  }

  const handleFold = () => {
    setAction('fold')
    setLineTargetPosA([-0.035, 0.001, -0.015])
    setLineTargetPosB([-0.035, 0.001, -0.015])
    setHasExtended(false)
  }

  return (
    <>
      <Canvas 
        shadows 
        camera={{ position: [-0.1, 0.1, 0.3], fov: 50 }} 
        style={{ width: '100vw', height: '100vh' }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={1.0 * Math.PI} />
        <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr" />

        <PerformanceMonitor onDecline={() => degrade(true)} />

        <AnimatedModel2
          url="/models/Anatomy/Arm/Flexing.glb"
          actionName={action}
          scale={1.5}
          position={[0, -0.375, 0]}
        />

        <OrbitControls 
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          minPolarAngle={Math.PI / 3 + Math.PI / 10}
          maxPolarAngle={Math.PI / 2}
          minDistance={0.1} 
          maxDistance={0.7}
        />
        
      </Canvas>
      <div className='absolute top-2 left-2'>
        <Link href="/5-1-4">
          <button className="px-4 py-2 bg-white-500 text-black rounded hover:bg-black hover:text-white">
            되돌아가기
          </button>
        </Link>
      </div>

      <div style={{
        position: 'absolute',
        display: 'flex',
        top: '2%',
        right: '2%',
        gap: '5px',
        flexDirection: 'column'
      }}>
        <button
          onClick={handleFold}
          style={{
            backgroundColor: 'black',
            color: 'white',
            fontSize: '16px',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '10px',
          }}>
          팔을 펼 때
        </button>
        <button
          onClick={handleExtend}
          style={{
            backgroundColor: 'black',
            color: 'white',
            fontSize: '16px',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '10px',
          }}>
          팔을 구부릴 때
        </button>
      </div>
    </>
  )
}