// pages/5-1-2.tsx
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react'
import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { OrbitControls, Environment, useProgress, AccumulativeShadows, RandomizedLight } from '@react-three/drei';
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
  const [activeMode, setActiveMode] = useState<'direct' | 'reflection' | 'refraction'>('direct');
  const [lensType, setLensType] = useState<'convex' | 'concave'>('convex'); 
  const [laserAngle, setLaserAngle] = useState<number>(45); // 레이저 각도 상태 추가
  
  // 3개의 Ray 상태를 각각 관리
  const [rayStates, setRayStates] = useState<[boolean, boolean, boolean]>([false, false, false]);

  // Intro 관련 상태 추가
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  // 모드가 변경될 때마다 모든 Ray를 false로 리셋하고 각도 초기화
  useEffect(() => {
    setRayStates([false, false, false]);
    setLaserAngle(45); // 각도도 초기화
  }, [activeMode]);

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
    }, 300)
  }

  // 개별 Ray 토글 핸들러
  const handleRayToggle = (buttonIndex: number) => {
    setRayStates(prevStates => {
      const newStates = [...prevStates] as [boolean, boolean, boolean];
      newStates[buttonIndex] = !newStates[buttonIndex];
      return newStates;
    });
    
    playClickSound('/sounds/Click_Simple.mp3');
  }

  // 레이저 각도 변경 핸들러
  const handleAngleChange = (newAngle: number) => {
    setLaserAngle(newAngle);
  }

  return (
    <div className='w-screen h-screen flex flex-col overflow-hidden'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />
      <div className='flex-1'>
        <Scene shadows camera={{ position: [0, 0, 20], fov: 50 }}>
          <Environment preset='warehouse' environmentIntensity={0.2}/>
          <directionalLight
            color='white'
            intensity={2}
            position={[30, 20, 30]}
            castShadow
          />
          <OpticalLab 
            mode={activeMode} 
            lensType={lensType} 
            rayStates={rayStates}
            laserAngle={laserAngle}
          />
          
          <Model 
            mode={activeMode} 
            onToggle={handleRayToggle}
            rayStates={rayStates}
            laserAngle={laserAngle}
            onAngleChange={handleAngleChange}
          />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={true} 
            enableRotate={true}
            // minDistance={3}
            // maxDistance={15}
            // maxPolarAngle={Math.PI / 2}
          />
          
          <SafePostEffects />
        </Scene>

      </div>
        
      {!showIntro && isLoaded && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '20px',
          borderRadius: '10px',
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['direct', 'reflection', 'refraction'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: activeMode === mode ? '#4CAF50' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {mode === 'direct' ? '직진' : mode === 'reflection' ? '반사' : '굴절'}
              </button>
            ))}
          </div>

          {activeMode === 'refraction' && (
            <>
              <h4 style={{ margin: '10px 0 5px 0', fontSize: '16px' }}>렌즈 타입</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                {(['convex', 'concave'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setLensType(type)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: lensType === type ? '#2196F3' : '#333',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {type === 'convex' ? '볼록렌즈' : '오목렌즈'}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeMode === 'reflection' && (
            <>
              <h4 style={{ margin: '10px 0 5px 0', fontSize: '16px' }}>레이저 각도</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="range"
                  min="1"
                  max="65"
                  value={laserAngle}
                  onChange={(e) => setLaserAngle(Number(e.target.value))}
                  style={{
                    width: '150px',
                    accentColor: '#4CAF50'
                  }}
                />
                <span style={{ fontSize: '14px', minWidth: '40px' }}>
                  {Math.round(laserAngle)}°
                </span>
              </div>
            </>
          )}

          <div style={{ marginTop: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Ray 상태</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {rayStates.map((isActive, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div 
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: isActive ? '#4CAF50' : '#666',
                    }}
                  />
                  <span style={{ fontSize: '14px' }}>
                    Ray {index + 1}: {isActive ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title={`빛의 직진, 반사, 굴절 관찰하기`}
          description={['빛이 공기 중에서 나아갈 때, 거울과 같은 물체에 부딪쳤을 때, 렌즈를 통과할 때 어떻게 나아가는지 알아봅시다.']}
          backgroundSvg='/img/cover/5-1-2.svg'
        />
      )}
    </div>
  )
}