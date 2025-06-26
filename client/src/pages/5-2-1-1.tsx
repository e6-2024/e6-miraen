import { useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import { OrbitControls } from '@react-three/drei'
import SieveSimulationButton from '@/scenes/SieveSimulationButton'

export default function Home() {
  const [triggerSpawn, setTriggerSpawn] = useState(false)
  const [triggerShake, setTriggerShake] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState(0) // 기본값을 0(큰 구멍)으로 변경
  const [gravity, setGravity] = useState<[number, number, number]>([0, -9.81, 0])

  const handleSpawn = () => {
    setTriggerSpawn(true)
  }

  const handleSpawnHandled = () => {
    setTriggerSpawn(false)
  }

  const handleShake = () => {
    setTriggerShake(true)
  }

  const handleShakeHandled = () => {
    setTriggerShake(false)
  }

  return (
    <div className='w-screen h-screen relative'>
      {/* 버튼 UI */}
      <div className='absolute bottom-5 right-5 flex flex-col gap-2 z-10'>
        <div className='flex gap-2'>
          {[0, 1, 2].map((level) => (
            <button
              key={level}
              className={`px-4 py-2 rounded text-white transition-colors ${
                selectedLevel === level ? 'bg-blue-700 font-bold' : 'bg-blue-500 hover:bg-blue-600'
              }`}
              onClick={() => setSelectedLevel(level)}>
              {level === 0 ? '큰 구멍' : level === 1 ? '막힌 체' : '작은 구멍'}
            </button>
          ))}
        </div>

        <button className='px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded' onClick={handleSpawn}>
          혼합물 넣기
        </button>

        <button
          className='px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-bold'
          onClick={handleShake}>
          체 흔들기
        </button>
      </div>

      {/* 안내 메시지 */}
      <div className='absolute top-5 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white py-2 px-4 rounded'>
        혼합물을 넣고 &quot;체 흔들기&quot; 버튼을 눌러 분리해보세요
      </div>

      {/* 3D Canvas */}
      <Canvas shadows camera={{ position: [0, 10, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />

        <Physics
          gravity={gravity}
          allowSleep={false}
          defaultContactMaterial={{
            friction: 0.2,
            restitution: 0.3,
          }}>
          <SieveSimulationButton
            triggerSpawn={triggerSpawn}
            onSpawnHandled={handleSpawnHandled}
            triggerShake={triggerShake}
            onShakeHandled={handleShakeHandled}
            selectedLevel={selectedLevel}
            setGravity={setGravity}
          />
        </Physics>
      </Canvas>
    </div>
  )
}
