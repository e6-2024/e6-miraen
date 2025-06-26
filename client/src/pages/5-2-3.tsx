import { useState, useEffect } from 'react'
import { OrbitControls, useProgress } from '@react-three/drei'
import Model from '../components/5-2-3/Model'
import Scene from '@/components/canvas/Scene'
import CameraLogger from '@/components/CameraLogger'
import Intro from '@/components/intro/Intro'
import { Environment } from '@react-three/drei'

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()
  
  useEffect(() => {
      onLoadingComplete()
  }, [active, progress, onLoadingComplete])
  
  return null
}

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch(error => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  
  const handleEnterExperience = () => {
    // 효과음 재생
    playClickSound()
    
    // 효과음이 재생될 시간을 확보한 후 Intro 숨김
    setTimeout(() => {
      setShowIntro(false)
    }, 300) // 300ms 지연
  }

  return (
    <div className="w-screen h-screen bg-red flex flex-col relative">
      {/* 3D Scene */}
      <Scene
        camera={{ position: [30, 20, 80], fov: 50, far: 1000 }}
        shadows 
      >
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        <ambientLight intensity={1.0} />  
        <Model scale={1.0} rotation={[0,-Math.PI/2,0]} position={[-0, -20, 50]} />
        <OrbitControls enabled={!showIntro} />
        <CameraLogger/>
        <Environment
          preset="sunset"
          blur={0.8}
          resolution={512}
        />
      </Scene>

      {/* Intro Overlay - 로딩 완료 후 즉시 표시 */}
      {isLoaded && showIntro && (
        <Intro 
          onEnter={handleEnterExperience}
          title="날씨와 우리 생활"
          description={[
            "바람은 왜 불까요? 그리고 어떤 방향으로 불까요?",
            "바닷가에서 바람이 부는 까닭과 바람이 부는 방향에 대해",
            "알아봅시다."
          ]}
        />
      )}
    </div>
  )
}
