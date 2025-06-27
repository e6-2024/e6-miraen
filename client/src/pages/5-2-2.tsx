import {useState, useRef} from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Lightformer, PerformanceMonitor, AccumulativeShadows, RandomizedLight, useProgress} from '@react-three/drei'
import { useEffect } from 'react'
import Fish from '@/components/5-2-2/models/Fish'
import Meat from '@/components/5-2-2/models/Meat'
import Stove from '@/components/5-2-2/models/Stove'
import Model from '@/components/5-1-4-1/Model'
import Scene from '@/components/canvas/Scene'
import Flame from '@/components/5-2-2/Flame'
import Intro from '@/components/intro/Intro'
import PanFish from '@/components/5-2-2/models/PanFish'
import PanMeat from '@/components/5-2-2/models/PanMeat'

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
  const [perfSucks, degrade] = useState(false)
  const [isThermalMode, setIsThermalMode] = useState(false)
  const [isHeating, setIsHeating] = useState(false)
  const [heatingTime, setHeatingTime] = useState(0)
  const heatingIntervalRef = useRef(null)

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

  const handleHeatingToggle = () => {
    if (isHeating) {
      // 가열 중지
      setIsHeating(false)
      if (heatingIntervalRef.current) {
        clearInterval(heatingIntervalRef.current)
        heatingIntervalRef.current = null
      }
    } else {
      // 가열 시작
      setIsHeating(true)
      setHeatingTime(0)
      heatingIntervalRef.current = setInterval(() => {
        setHeatingTime(prev => prev + 0.1) // 0.1초마다 업데이트
      }, 100)
    }
  }

  // 가열 리셋
  const handleResetHeating = () => {
    setIsHeating(false)
    setHeatingTime(0)
    if (heatingIntervalRef.current) {
      clearInterval(heatingIntervalRef.current)
      heatingIntervalRef.current = null
    }
  }

  const createCircularFlames = () => {
    const flames = [];
    const flameCount = 20;
    const radius = 0.13;
    
    for (let i = 0; i < flameCount; i++) {
      const angle = (i / flameCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      flames.push(
        <Flame 
          key={i}
          position={[x+0.35, 0.2, z-0.1]} 
          scale={isHeating ? 0.3 : 0} // 가열 중일 때 불꽃 크기 증가
          opacity={isThermalMode ? 0.3 : 1}
        />
      );
    }
    
    return flames;
  };

  const createCircularFlames2 = () => {
    const flames = [];
    const flameCount = 20;
    const radius = 0.13;
    
    for (let i = 0; i < flameCount; i++) {
      const angle = (i / flameCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      flames.push(
        <Flame 
          key={i}
          position={[x-0.35, 0.2, z-0.1]} 
          scale={isHeating ? 0.3 : 0} // 가열 중일 때 불꽃 크기 증가
          opacity={isThermalMode ? 0.3 : 1}
        />
      );
    }
    
    return flames;
  };

  return (
     <div className="w-screen h-screen bg-white flex flex-col relative overflow-hidden">
        {/* Control Panel - Intro가 보일 때는 숨김 */}
        {!showIntro && (
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-3">
            {/* Thermal Mode Toggle */}
            <button
              onClick={() => setIsThermalMode(!isThermalMode)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                isThermalMode 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-red-600 text-white shadow-lg shadow-red-500/25'
              } hover:scale-105 active:scale-95`}
            >
              {isThermalMode ? '3D로 보기' : '열화상 카메라로 보기'}
            </button>
            <button
              onClick={handleHeatingToggle}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                isHeating 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25 animate-pulse' 
                  : 'bg-green-600 text-white shadow-lg shadow-green-500/25'
              } hover:scale-105 active:scale-95`}
            >
              {isHeating ? '가열 중...' : '가열하기'}
            </button>
            
            {isThermalMode && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleResetHeating}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  처음으로
                </button>
              </div>
            )}
          </div>
        )}

        <Scene camera={{ position: [1, 1, 1], fov: 50 }}>
        {/* 로딩 추적 컴포넌트 추가 */}
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        
        <ambientLight intensity={isThermalMode ? 0.1 : 2}/>
        <PerformanceMonitor onDecline={() => degrade(true)} />
        
        {!isThermalMode && (
          <Environment frames={perfSucks ? 1 : Infinity} preset="studio" resolution={256} background={false} blur={1}>
            <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
            <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
            <group rotation={[Math.PI / 2, 1, 0]}>
              <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
              <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[50, 2, 1]} />
            </group>
            <Lightformer intensity={5} form="ring" color="white" rotation-y={Math.PI / 2} position={[1, 1, 1]} scale={[4, 4, 1]} />
          </Environment>
        )}
        
        <ContactShadows position={[0, 0, 0]} opacity={isThermalMode ? 0.1 : 0.9} scale={30} blur={1.5} far={2} color='black' frames={2} />
        <AccumulativeShadows frames={20} alphaTest={0.15} opacity={isThermalMode ? 0.05 : 0.1} scale={20} position={[0, 0, 0]}>
          <RandomizedLight amount={4} radius={3} ambient={0.3} intensity={isThermalMode ? 0.1 : 0.5} position={[0, 2, 0]} bias={0.001} />
        </AccumulativeShadows>
                
        <directionalLight position={[2, 2, 2]} intensity={isThermalMode ? 0.1 : 1} />
        
        {/* Fish와 Meat는 각자의 1/3 지점에서 가열 */}
        <Fish 
          scale={2} 
          position={[0, 0, 0]} 
          thermalMode={isThermalMode}
          isHeating={isHeating}
          heatingTime={heatingTime}
        />
        <Meat 
          scale={2} 
          position={[0, 0, 0]} 
          thermalMode={isThermalMode}
          isHeating={isHeating}
          heatingTime={heatingTime}
        />
        <Stove 
          scale={2} 
          position={[0, 0, 0]} 
          thermalMode={isThermalMode}
          isHeating={isHeating}
          heatingTime={heatingTime}
        />
        <PanFish
          scale={2} 
          position={[0, 0, 0]} 
          thermalMode={isThermalMode}
          isHeating={isHeating}
          heatingTime={heatingTime}
        />
        <PanMeat
          scale={2} 
          position={[0, 0, 0]} 
          thermalMode={isThermalMode}
          isHeating={isHeating}
          heatingTime={heatingTime}
        />
        <Model/>
        {createCircularFlames()}
        {createCircularFlames2()}
        
        <OrbitControls 
          enableRotate={!showIntro} // Intro가 보일 때는 OrbitControls 비활성화
          enableZoom={!showIntro}
          enablePan={!showIntro}
        />
        </Scene>
        
        {isThermalMode && !showIntro && (
          <div className="absolute inset-0 bg-black opacity-30 pointer-events-none" />
        )}

        {/* Intro 오버레이 - 로딩 완료 후 표시 */}
        {isLoaded && showIntro && (
          <Intro 
            onEnter={handleEnterExperience}
            title="열과 우리 생활"
            description={[
              "온도가 다른 두 물체가 접촉했을 때 두 물체의 온도 변화를 관찰하고, 온도가 변하는 까닭을 추리해 봅시다.",
            ]}
            simbolSvgPath="/img/icon/열과우리생활.svg"
          />
        )}
     </div>
  )
}