import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Environment, useProgress } from '@react-three/drei';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import Scene from '@/components/canvas/Scene';
import Intro from '@/components/intro/Intro';

const SieveSimulation = dynamic(() => import('../scenes/SieveSimulation'), { ssr: false });

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress();
  
  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete();
    }
  }, [active, progress, onLoadingComplete]);
  
  return null;
}

function ShadowLighting() {
  return (
    <>
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-bias={-0.0001}
      />
      <ambientLight intensity={0.1} />
    </>
  );
}

export default function Home() {
  const [triggerSpawn, setTriggerSpawn] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [enableTilt, setEnableTilt] = useState(true);
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

  return (
    <div className="w-screen h-screen relative">
      {!showIntro && (
        <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-10">
          <div className="flex gap-2">
            {[0, 2, 1].map((level) => (
              <button
                key={level}
                className={`px-4 py-2 rounded text-white transition-colors ${
                  selectedLevel === level
                    ? 'bg-blue-700 font-bold'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                onClick={() => setSelectedLevel(level)}
              >
                {level === 0 ? '눈의 크기가 큰 구슬보다 큰 체' : level === 1 ? '눈의 크기가 작은 구슬보다 작은 체' : '눈의 크기가 큰 구슬보다 작고 작은 구슬보다 큰 체'}
              </button>
            ))}
          </div> 

          <button 
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded" 
            onClick={handleSpawn}
          >
          구슬 혼합물 넣기
          </button>
        </div>
      )}

      {/* 기울이기 안내 */}
      {!showIntro && (
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white py-2 px-4 rounded">
          체를 마우스로 드래그하여 기울일 수 있습니다.
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
          defaultContactMaterial={{
            friction: 0.2,
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