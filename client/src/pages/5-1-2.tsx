import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react'
import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { OrbitControls, Environment, useProgress } from '@react-three/drei';
import { OpticalLab } from '../scenes/OpticalLab';
import { RayToggleButton } from '@/components/5-1-2/buttonToggle';
import Scene from '@/components/canvas/Scene';
import Model from '@/components/5-1-2/Model'
import Intro from '@/components/intro/Intro'

const PostEffects = dynamic(() => import('../components/5-1-2/PostEffects'), { ssr: false });

function SafePostEffects() {
  const { gl, scene, camera } = useThree();
  const isReady = gl && scene && camera;
  return isReady ? <PostEffects /> : null;
}

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
  const [activeMode, setActiveMode] = useState<'direct' | 'reflection' | 'refraction'>('reflection');
  const [lensType, setLensType] = useState<'convex' | 'concave'>('convex'); 
  const [rayVisible, setRayVisible] = useState(true);

  // Intro 관련 상태 추가
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


  const cameraSettings = useMemo(() => {
    switch (activeMode) {
      case 'direct':
        return {
          position: [0, 0, 13],
          target: [0, 0, 0],
          maxPolarAngle: Math.PI / 2.5,
          minPolarAngle: Math.PI / 8
        };
      case 'reflection':
        return {
          position: [-2, 13, 0],
          target: [0, 0, 0],
          maxPolarAngle: Math.PI / 2.2,
          minPolarAngle: 0
        };
      case 'refraction':
        return {
          position: [0, 0, 13],
          target: [0, 0, 0],
          maxPolarAngle: Math.PI / 2,
          minPolarAngle: Math.PI / 6
        };
      default:
        return {
           position: [0, 0, 13],
          target: [0, 0, 0],
          maxPolarAngle: Math.PI,
          minPolarAngle: 0
        };
    }
  }, [activeMode]);

  return (
    <div className="w-screen h-screen bg-black flex flex-col relative overflow-hidden">
      
      <div className="flex-grow">
        <Scene 
          camera={{ 
            position: cameraSettings.position as [number, number, number], 
            fov: 50 
          }}
          key={activeMode}
        >
          {/* 로딩 추적 컴포넌트 추가 */}
          <LoadingTracker onLoadingComplete={handleLoadingComplete} />
          
          <ambientLight intensity={1.0} />
          <Environment
            preset="warehouse"
            environmentIntensity={0.6}
            backgroundBlurriness={0.3}
            environmentRotation={[0, Math.PI / 4, 0]}
          />
          <OpticalLab mode={activeMode} lensType={lensType} rayVisible={rayVisible} />
          <Model 
            onToggle={() => setRayVisible(prev => !prev)} 
            position={[0, -1, 0]} 
            rotation={[0, -Math.PI/2, 0]}
            mode={activeMode} 
          />

          <OrbitControls
            target={cameraSettings.target as [number, number, number]}
            maxPolarAngle={cameraSettings.maxPolarAngle}
            minPolarAngle={cameraSettings.minPolarAngle}
            enableRotate={!showIntro} // Intro가 보일 때는 OrbitControls 비활성화
            enableZoom={!showIntro}
            enablePan={!showIntro}
          />
          <SafePostEffects />
        </Scene>
      </div>

      {/* 하단 컨트롤 패널 - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div className="absolute h-16 bg-gray-900 flex justify-center items-center space-x-4 px-4">
          <div className="flex space-x-4">
            <button 
              className={`px-4 py-2 rounded font-medium transition-colors ${
                activeMode === 'direct' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
              onClick={() => setActiveMode('direct')}
            >
              빛의 직진
            </button>
            <button 
              className={`px-4 py-2 rounded font-medium transition-colors ${
                activeMode === 'reflection' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
              onClick={() => setActiveMode('reflection')}
            >
              빛의 반사
            </button>
            <button 
              className={`px-4 py-2 rounded font-medium transition-colors ${
                activeMode === 'refraction' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
              onClick={() => setActiveMode('refraction')}
            >
              빛의 굴절
            </button>
          </div>
          
          {activeMode === 'refraction' && (
            <div className="border-l border-gray-600 pl-4 ml-2 flex space-x-4">
              <button 
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  lensType === 'convex' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
                onClick={() => setLensType('convex')}
              >
                볼록 렌즈
              </button>
              <button 
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  lensType === 'concave' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
                onClick={() => setLensType('concave')}
              >
                오목 렌즈
              </button>
            </div>
          )}
        </div>
      )}

      {/* Intro 오버레이 - 로딩 완료 후 표시 */}
      {isLoaded && showIntro && (
        <Intro 
          onEnter={handleEnterExperience}
          title="빛의 성질"
          description={[
            "빛이 나아가는 현상을 관찰하여 빛이 직진, 반사, 굴절 하는 모습을 알아봅시다.",
          ]}
          simbolSvgPath="/img/icon/빛의 성질.svg"
        />
      )}
    </div>
  );
}