// src/pages/5-2-1.tsx - Physics 전체 리셋 버전 + 정리하기 기능 추가
import { useState, useRef, useEffect } from 'react';
import { Physics } from '@react-three/cannon';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';
import Scene from '@/components/canvas/Scene';
import SieveSimulation from '@/scenes/SieveSimulation';
import Intro from '@/components/intro/Intro';
import { Environment } from '@react-three/drei';

// 정리하기 팝업 컴포넌트
function SummaryPopup({ onClose }: { onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 팝업 애니메이션을 위한 지연
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 나레이션 재생
  useEffect(() => {
    const playNarration = () => {
      try {
        const audio = new Audio('/sounds/5-2-1/5-2-1-D.MP3'); // 나레이션 파일 경로
        audio.volume = 0.5;
        audio.play().catch(error => {
          console.log('나레이션 재생 실패:', error.name);
        });
      } catch (error) {
        console.log('나레이션 생성 실패:', error);
      }
    };

    playNarration();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // 애니메이션 완료 후 닫기
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className={`bg-white rounded-lg p-8 max-w-md mx-4 transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
          실험 정리
        </h2>
        
        <div className="space-y-4 text-gray-700">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 font-bold">•</span>
            <p className="text-s">
              알갱이의 크기가 다른 고체 혼합물은 알갱이의 크기 차이를 이용해 체로 분리할 수 있습니다.
            </p>
          </div>
          
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 font-bold">•</span>
            <p className="text-s">
              체를 사용할 때에는 알갱이의 크기와 체의 눈 크기를 비교해 알맞은 것을 골라야 합니다.
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [physicsKey, setPhysicsKey] = useState(0); // Physics 리셋용 키
  const [showSummaryButton, setShowSummaryButton] = useState(false);
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);

  const handleSpawn = () => {
  setTriggerSpawn(true);

  if (selectedLevel === 0) {
    setTimeout(() => {
      playBallSound();
    }, 1000);
    setTimeout(() => {
      playNarration2();
    }, 5000); // 5초 후 재생 시작
  }

  if (selectedLevel === 1) {
    setTimeout(() => {
      playBallSound();
    }, 1000);
    setTimeout(() => {
      playNarration2();
      playBallSound();
    }, 5000); // 5초 후 재생 시작
  }
  if (selectedLevel === 2) {
    setTimeout(() => {
      playBallSound();
    }, 1000);
  }
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

  const playGeneralButton = (audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3') => {
    try {
      const audio = new Audio(audioPath);
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.log('효과음 재생 실패:', error.name);
      });
    } catch (error) {
      console.log('효과음 생성 실패:', error);
    }
  };

  const playNarration1 = (audioPath: string = '/sounds/5-2-1/5-2-1-A.MP3') => {
    try {
      const audio = new Audio(audioPath);
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.log('효과음 재생 실패:', error.name);
      });
    } catch (error) {
      console.log('효과음 생성 실패:', error);
    }
  };

  const playNarration2 = (audioPath: string = '/sounds/5-2-1/5-2-1-B.MP3') => {
    try {
      const audio = new Audio(audioPath);
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.log('효과음 재생 실패:', error.name);
      });
    } catch (error) {
      console.log('효과음 생성 실패:', error);
    }
  };

  const playNarration3 = (audioPath: string = '/sounds/5-2-1/5-2-1-C.MP3') => {
    try {
      const audio = new Audio(audioPath);
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.log('효과음 재생 실패:', error.name);
      });
    } catch (error) {
      console.log('효과음 생성 실패:', error);
    }
  };
  
  const playBallSound = (audioPath: string = '/sounds/5-2-1/5-2-1-2_ball-drop-and-sniff-85127.mp3') => {
    try {
      const audio = new Audio(audioPath);
      audio.volume = 0.5;
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
      playNarration1();
    }, 300);
  };

  const handleReset = () => {
    setGravity([0, -9.81, 0]);
    setPhysicsKey(prev => prev + 1);
    setShowSummaryButton(false); // 정리하기 버튼 숨기기
  };

  // 레벨 변경 시 Physics 리셋
  const handleLevelChange = (level: number) => {
    console.log(`Changing level to ${level} and resetting physics`);
    setSelectedLevel(level);
    setPhysicsKey(prev => prev + 1);
    setShowSummaryButton(false); // 레벨 변경 시 정리하기 버튼 숨기기
  };

  // 분리 완료 콜백 (SieveSimulation에서 호출)
  const handleSeparationComplete = () => {
    if (selectedLevel === 2) { // level 2에서만 정리하기 버튼 표시
      setShowSummaryButton(true);
      playNarration3();
    }
  };

  // 정리하기 버튼 클릭
  const handleSummaryClick = () => {
    playClickSound();
    setShowSummaryPopup(true);
  };

  const handleCloseSummaryPopup = () => {
    setShowSummaryPopup(false);
  };

  return (
    <div className='w-screen h-screen relative'>
      {!showIntro && (
        <>
        <div className='absolute top-5 right-5 flex flex-col gap-2 z-10'>
          <div className='flex gap-2'>
            {[0, 2, 1].map((level) => (
              <button
                key={level}
                className={`px-4 py-2 border-2 border-black text-white transition-colors ${
                  selectedLevel === level
                    ? 'bg-white text-black hover:bg-black hover:text-white'
                    : 'bg-white text-black hover:bg-black hover:text-white'
                }`}
                onClick={() => {
                  handleLevelChange(level)
                  playGeneralButton()}
                }
              >
                {level === 0 ? '눈의 크기가 큰 구슬보다 큰 체' : 
                 level === 1 ? '눈의 크기가 작은 구슬보다 작은 체' : 
                 '눈의 크기가 큰 구슬보다 작고 작은 구슬보다 큰 체'}
              </button>
            ))}
          </div> 
        </div>
        
        <div className='flex absolute bottom-5 right-5 z-10 gap-2'>
          <button 
            className="px-4 py-2 bg-white border-2 border-black text-black hover:bg-black hover:text-white" 
            onClick={() => {
              handleSpawn()
              playGeneralButton()}
            }
          >
            구슬 혼합물 넣기
          </button>

          {/* 정리하기 버튼 - level 2에서 분리 완료 시에만 표시 */}
          {showSummaryButton && (
            <button 
              className="px-4 py-2 bg-green-600 border-2 border-green-600 text-white hover:bg-green-700 hover:border-green-700 transition-colors" 
              onClick={handleSummaryClick}
            >
              정리하기
            </button>
          )}

          <button 
            className="px-4 py-2 bg-white text-black hover:bg-black hover:text-white border-2 border-black" 
            onClick={() => {
              handleReset()
              playGeneralButton()}
            }
          >
            다시하기
          </button>
        </div>
        </>
      )}

      <Scene 
        shadows
        camera={{ position: [0, 10, 10], fov: 50 }}
        gl={{ 
          shadowMap: { 
            enabled: true, 
            type: THREE.PCFSoftShadowMap
          } 
        }}
      >
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        <ShadowLighting />

        {/* Physics 컴포넌트를 physicsKey로 완전 리셋 */}
        <Physics 
          key={physicsKey}
          gravity={gravity} 
          allowSleep={true}
          iterations={15}
          defaultContactMaterial={{
            friction: 0.3,
            restitution: 0.2,
          }}
          tolerance={0.001}
        >
          <SieveSimulation
            triggerSpawn={triggerSpawn}
            onSpawnHandled={handleSpawnHandled}
            selectedLevel={selectedLevel}
            setGravity={setGravity}
            onSeparationComplete={handleSeparationComplete}
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
          backgroundSvg='/img/cover/5-2-1.svg'
        />
      )}

      {/* 정리하기 팝업 */}
      {showSummaryPopup && (
        <SummaryPopup onClose={handleCloseSummaryPopup} />
      )}
    </div>
  );
}