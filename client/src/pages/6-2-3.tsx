import { useState, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useProgress } from '@react-three/drei'
import Light1 from '@/components/6-2-3/Light1'
import Light2 from '@/components/6-2-3/Light2'
import Buzzer1 from '@/components/6-2-3/Buzzer1'
import Buzzer2 from '@/components/6-2-3/Buzzer2'
import Fan1 from '@/components/6-2-3/Fan1'
import Fan2 from '@/components/6-2-3/Fan2'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import BG from '@/components/6-2-3/BG'
import * as THREE from 'three'

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

export default function Home() {
  const [mode, setMode] = useState<'light' | 'buzzer' | 'fan'>('light')

  // 전구 조명 세기 조절
  const [light1Intensity, setLight1Intensity] = useState(1.0)
  const [light2Intensity, setLight2Intensity] = useState(0.5)

  // Intro 관련 상태 추가
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const handleEnterExperience = () => {
    // 효과음 재생
    playClickSound()

    // 효과음이 재생될 시간을 확보한 후 Intro 숨김
    setTimeout(() => {
      setShowIntro(false)
    }, 300) // 300ms 지연
  }

  // 현재 모드에 따라 컴포넌트를 조건부 렌더링 (visible 대신 완전히 제거)
  const getCurrentComponents = () => {
    switch (mode) {
      case 'light':
        return (
          <>
            <Light1 key='light1' scale={1} position={[-5, -0.1, 0]} lightIntensity={light1Intensity} />
            <Light2 key='light2' scale={1} position={[5, -0.1, 0]} lightIntensity={light2Intensity} />
          </>
        )
      case 'buzzer':
        return (
          <>
            <Buzzer1 key='buzzer1' scale={1} position={[-5, -0.1, 0]} />
            <Buzzer2 key='buzzer2' scale={1} position={[5, -0.1, 0]} />
          </>
        )
      case 'fan':
        return (
          <>
            <Fan1 key='fan1' scale={1} position={[-5, -0.1, 0]} />
            <Fan2 key='fan2' scale={1} position={[5, -0.1, 0]} />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className='w-screen h-screen bg-white flex flex-col'>
      {!showIntro && (
        <div className='p-4 flex gap-4 justify-center bg-gray-100 border-b shadow-sm'>
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              mode === 'light'
                ? 'bg-yellow-500 text-white shadow-lg transform scale-105'
                : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
            }`}
            onClick={() => setMode('light')}>
            전구를 연결한 전기회로
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              mode === 'buzzer'
                ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
            }`}
            onClick={() => setMode('buzzer')}>
            버저를 연결한 전기회로
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              mode === 'fan'
                ? 'bg-green-500 text-white shadow-lg transform scale-105'
                : 'bg-green-200 text-green-800 hover:bg-green-300'
            }`}
            onClick={() => setMode('fan')}>
            전동기를 연결한 전기회로
          </button>
        </div>
      )}

      <div className='flex-1 relative overflow-hidden'>
        <Scene
          key={mode}
          shadows
          gl={{ shadowMap: { enabled: true, type: THREE.PCFSoftShadowMap } }}
          camera={{ position: [10, 8, 15], fov: 50 }}>
          <LoadingTracker onLoadingComplete={handleLoadingComplete} />

          <ambientLight intensity={0.5} />
          <directionalLight
            intensity={3}
            position={[2, 2, 3]}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={50}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            shadow-bias={-0.0001}
            shadow-normalBias={0.2}
          />

          <hemisphereLight args={['#ffffff', '#404040', 0.3]} />
          {getCurrentComponents()}
          <BG />
          <OrbitControls
            enabled={!showIntro}
            enablePan={true}
            enableRotate={true}
            enableZoom={true}
            minDistance={0}
            maxDistance={30}
          />
        </Scene>
      </div>

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='전기의 이용'
          description={[
            ' 전구에 불이 켜지는 전기 회로의 특징을 이야기하고, 전지의 갯수에 따라 변하는 전기 회로의특징을 비교할 수 있어요.',
          ]}
          simbolSvgPath='/img/icon/전기의이용.svg'
        />
      )}
    </div>
  )
}
