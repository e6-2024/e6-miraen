// pages/index.tsx
import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useProgress } from '@react-three/drei'
import Experiment from '@/components/6-2-2/Experiment'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'

// 로딩 상태를 추적하는 컴포넌트
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
  const [uiText, setUiText] = useState('버튼을 클릭해서 촛불을 켜보세요!')
  const [lightCandle, setLightCandle] = useState(false)

  // Intro 관련 상태 추가
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

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

  const handleLightCandle = () => {
    setLightCandle(true)
  }

  const handleResetCandle = () => {
    setLightCandle(false)
    setUiText('촛불이 리셋되었습니다. 버튼을 클릭해서 다시 켜보세요!')
    // 페이지 새로고침으로 완전 리셋
    window.location.reload()
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background:'lightblue'}}>
      <Scene shadows camera={{ position: [0, 2, 5], fov: 50 }}>
        {/* 로딩 추적 컴포넌트 추가 */}
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        
        <ambientLight castShadow intensity={0.1} />
        <directionalLight
          castShadow
          position={[2, 4, 2]}
          intensity={3.3}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Experiment 
          setUiText={setUiText} 
          lightCandle={lightCandle}
          setLightCandle={setLightCandle}
        />
        
        <OrbitControls
          enabled={!showIntro} // Intro가 보일 때는 OrbitControls 비활성화
        />
      </Scene>
      
      {/* UI 텍스트 - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: 'white',
          fontSize: '1.2rem',
          pointerEvents: 'none'
        }}>
          {uiText}
        </div>
      )}
      
      {/* 버튼들 - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div style={{
          position: 'absolute',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={handleLightCandle}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#ff6b35',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
            disabled={lightCandle}
          >
            🕯️ 촛불 켜기
          </button>
          
          <button
            onClick={handleResetCandle}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            🔄 리셋
          </button>
        </div>
      )}

      {/* Intro 오버레이 - 로딩 완료 후 표시 */}
      {isLoaded && showIntro && (
        <Intro 
          onEnter={handleEnterExperience}
          title="물질의 연소"
          description={[
            "난로의 불을 유지하려면 장작을 계속해서 넣어야 합니다. 물질이 타려면 어떤 조건이 필요한지 알아봅시다."
          ]}
          simbolSvgPath="/img/icon/물질의연소.svg"
        />
      )}
    </div>
  )
}