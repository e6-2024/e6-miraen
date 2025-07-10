// src/pages/5-2-1.tsx
import { useState, useRef, useEffect } from 'react';
import { Physics } from '@react-three/cannon';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';
import Scene from '@/components/canvas/Scene';
import SieveSimulation from '@/scenes/SieveSimulation';
import Intro from '@/components/intro/Intro';
import { Environment } from '@react-three/drei';

// 로딩 상태를 추적하는 컴포넌트
function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress();
  
  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete();
    }
  }, [active, progress, onLoadingComplete]);
  
  return null;
}

// 그림자용 조명 컴포넌트
function ShadowLighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
    </>
  );
}

export default function Home() {
  const [triggerSpawn, setTriggerSpawn] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [gravity, setGravity] = useState<[number, number, number]>([0, -9.81, 0]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const handleSpawn = () => {
    setTriggerSpawn(true);
  };

  const handleSpawnHandled = () => {
    setTriggerSpawn(false);
  };

  const handleLoadingComplete = () => {
    setIsLoaded(true);
  };

  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath);
      audio.volume = 0.7;
      audio.play().catch(error => {
        console.log('효과음 재생 실패:', error.name);
      });
    } catch (error) {
      console.log('효과음 생성 실패:', error);
    }
  };

  const handleEnterExperience = () => {
    playClickSound();
    setTimeout(() => {
      setShowIntro(false);
    }, 300);
  };

  const handleReset = () => {
    // 중력을 초기값으로 리셋
    setGravity([0, -9.81, 0]);
    // 선택된 레벨을 초기값으로 리셋
    setSelectedLevel(0);
    // 기존 파티클 모두 제거
    // 파티클 재생성을 위해 트리거
    setTimeout(() => {
      setTriggerSpawn(true);
    }, 100);
  };

  return (
    <div className='w-screen h-screen relative'>
      {/* 버튼 UI - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div className='absolute bottom-5 right-5 flex flex-col gap-2 z-10'>
          <div className='flex gap-2'>
            {[0, 1, 2].map((level) => (
              <button
                key={level}
                className={`px-4 py-2 rounded text-white transition-colors ${
                  selectedLevel === level
                    ? 'bg-blue-700 font-bold'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                onClick={() => setSelectedLevel(level)}
              >
                {level === 0 ? '큰 체 (모든 입자 통과)' : 
                 level === 1 ? '작은 체 (입자 통과 안됨)' : 
                 '중간 체 (초록색만 통과)'}
              </button>
            ))}
          </div> 

          <button 
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded" 
            onClick={handleSpawn}
          >
            구슬 혼합물 넣기
          </button>

          <button 
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded" 
            onClick={handleReset}
          >
            다시하기 (리셋)
          </button>
        </div>
      )}

      {/* 3D Canvas - 그림자 활성화 */}
      <Scene 
        shadows
        camera={{ position: [0, 10, 10], fov: 50 }}
        gl={{ 
          shadowMap: { 
            enabled: true, 
            type: THREE.PCFSoftShadowMap // 부드러운 그림자
          } 
        }}
      >
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        
        {/* 그림자용 조명 설정 */}
        <ShadowLighting />

        <Physics 
          gravity={gravity} 
          allowSleep={false}
          iterations={10}
          defaultContactMaterial={{
            friction: 0.4,
            restitution: 0.3,
          }}
        >
          <SieveSimulation
            triggerSpawn={triggerSpawn}
            onSpawnHandled={handleSpawnHandled}
            selectedLevel={selectedLevel}
            setGravity={setGravity}
          />
        </Physics>
        <Environment preset='sunset' />
      </Scene>

      {isLoaded && showIntro && (
        <Intro 
          onEnter={handleEnterExperience}
          title="혼합물의 분리"
          description={[
            "모래와 자갈이 섞여 있는 모습은 공사장 등 우리 생활의 다양한 곳에서 볼 수 있습니다. 모래와 자갈의 혼합물은 어떤 성질을 이용해 분리할 수 있는지 알아봅시다."
          ]}
          simbolSvgPath="/img/icon/혼합물의분리.svg"
        />
      )}
    </div>
  );
}