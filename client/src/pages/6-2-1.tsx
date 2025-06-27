import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useProgress, Billboard, Text} from '@react-three/drei';
import * as THREE from 'three';
import Scene from '@/components/canvas/Scene';
import CameraController from '@/components/cameraController';
import CameraLogger from '@/components/CameraLogger';
import Intro from '@/components/intro/Intro';

const timeData = [
  { time: '09:30', azimuth: 119, altitude: 32, shadowDirection: 299, shadowLength: 16, temperature: 23.1 },
  { time: '10:30', azimuth: 133, altitude: 41, shadowDirection: 313, shadowLength: 12, temperature: 24.4 },
  { time: '11:30', azimuth: 152, altitude: 49, shadowDirection: 332, shadowLength: 9, temperature: 24.8 },
  { time: '12:30', azimuth: 176, altitude: 52, shadowDirection: 356, shadowLength: 8, temperature: 26.0 },
  { time: '13:30', azimuth: 200, altitude: 50, shadowDirection: 20, shadowLength: 8, temperature: 0 },
  { time: '14:30', azimuth: 220, altitude: 44, shadowDirection: 40, shadowLength: 10, temperature: 26.8 },
  { time: '15:30', azimuth: 236, altitude: 35, shadowDirection: 56, shadowLength: 14, temperature: 27.5 }
];

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()
  
  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])
  
  return null
}

function CompassBillboard() {
  const compassData = [
    { position: [0, 0.2, 2] as [number, number, number], text: '북', color: '#ff4444' },
    { position: [2, 0.2, 0] as [number, number, number], text: '서', color: '#44ff44' },
    { position: [0, 0.2, -2] as [number, number, number], text: '남', color: '#4444ff' },
    { position: [-2, 0.2, 0] as [number, number, number], text: '동', color: '#ffff44' }
  ];

  return (
    <>
      {compassData.map((compass, index) => (
        <Billboard key={index} position={compass.position}>
          <Text 
            fontSize={0.1}
            color={compass.color}
            anchorX="center"
            anchorY="middle"
          >
            {compass.text}
          </Text>
        </Billboard>
      ))}
    </>
  );
}

function Sun({ azimuth, altitude }) {
  const sunRef = useRef<THREE.Mesh>(null);
  
  const sunDistance = 1.0;
  const azimuthRad = (azimuth - 180) * (Math.PI / 180);
  const altitudeRad = altitude * (Math.PI / 180);
  
  const sunX = sunDistance * Math.cos(altitudeRad) * Math.sin(azimuthRad);
  const sunY = sunDistance * Math.sin(altitudeRad);
  const sunZ = sunDistance * Math.cos(altitudeRad) * Math.cos(azimuthRad);

  useFrame((state) => {
    if (sunRef.current && sunRef.current.material) {
      const material = sunRef.current.material as any;
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  return (
    <group position={[sunX, sunY, sunZ]}>
      <mesh ref={sunRef}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial 
          color="#FFD700" 
          emissive="#FFD700" 
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

// 조명 컴포넌트
function SunLight({ azimuth, altitude }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  
  // 태양 위치 계산
  const sunDistance = 15;
  const azimuthRad = (azimuth - 180) * (Math.PI / 180);
  const altitudeRad = altitude * (Math.PI / 180);
  
  const sunX = sunDistance * Math.cos(altitudeRad) * Math.sin(azimuthRad);
  const sunY = sunDistance * Math.sin(altitudeRad);
  const sunZ = sunDistance * Math.cos(altitudeRad) * Math.cos(azimuthRad);

  return (
    <directionalLight
      ref={lightRef}
      position={[sunX, sunY, sunZ]}
      intensity={2}
      color="#FFFFFF"
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-camera-far={50}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
      shadow-camera-near={0.1}
      shadow-bias={-0.0005}
    />
  );
}

function Model({ currentData, onSceneLoaded, child2Scale, child2Position }) {
  const { scene } = useGLTF('models/6-2-1/pole2.glb');
  
  React.useEffect(() => {
    if (scene) {

      scene.position.set(0,-0.4,0);

      if (scene.children[1]) {
        scene.children[1].scale.set(0.0005, 0.0005, 0.0005);
      }
      
      // children[2]의 스케일과 위치 설정
      if (scene.children[2]) {
        scene.children[2].scale.set(child2Scale.x, child2Scale.y, child2Scale.z);
        scene.children[2].position.set(child2Position.x, child2Position.y, child2Position.z);
      }
      
      // 모든 메쉬에 그림자 속성 적용
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          
          // 그림자를 더 선명하게 하기 위해 재질 설정
          if (mesh.material) {
            const material = mesh.material as any;
            material.needsUpdate = true;
          }
        }
      });
      
      // 씬이 로드되면 부모에게 알리기
      if (onSceneLoaded) {
        onSceneLoaded(scene);
      }
    }
  }, [scene, onSceneLoaded, child2Scale, child2Position]);
  
  return <primitive object={scene} scale={1} position={[0, -0.4, 0]} />;
}

// 온도계 컴포넌트
function Thermometer({ temperature, maxTemp = 27.5 }) {
  const height = Math.max(0, (temperature / maxTemp) * 100);
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-20 bg-gray-300 rounded-full relative overflow-hidden">
        <div 
          className="absolute bottom-0 w-full bg-red-500 transition-all duration-1000 ease-in-out rounded-full"
          style={{ height: `${height}%` }}
        />
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full" />
      </div>
      <span className="text-lg font-semibold">{temperature}°C</span>
    </div>
  );
}

// 메인 컴포넌트
export default function ShadowSimulation() {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTestObjects, setShowTestObjects] = useState(true);
  const [modelScene, setModelScene] = useState(null);
  
  // Intro 관련 상태 추가
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  
  // children[2] 조정 설정 - 여기서 값을 직접 수정하세요
  const child2Scale = { x: 0.001, y: 0.001, z: 0.001 };        // 스케일 조정
  const child2Position = { x: 0, y: 0, z: 0 };     // 위치 조정
  
  const currentData = timeData[currentTimeIndex];

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
  
  // 자동 재생 효과
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeIndex((prev) => {
          const nextIndex = (prev + 1) % timeData.length;
          setProgress((nextIndex / (timeData.length - 1)) * 100);
          return nextIndex;
        });
      }, 2000); // 2초마다 다음 시간으로
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // 진행바 업데이트
  useEffect(() => {
    setProgress((currentTimeIndex / (timeData.length - 1)) * 100);
  }, [currentTimeIndex]);

  return (
    <div className="w-screen h-screen bg-gradient-to-b relative">
      {/* 시간 표시 - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg flex items-center gap-4">
          <span className="text-xl font-bold">
            {currentData.time.startsWith('0') ? `오전 ${currentData.time}` : 
             parseInt(currentData.time.split(':')[0]) >= 12 ? 
             `오후 ${(parseInt(currentData.time.split(':')[0]) - 12).toString().padStart(2, '0')}:${currentData.time.split(':')[1]}` : 
             `오전 ${currentData.time}`}
          </span>
          <Thermometer temperature={currentData.temperature} />
        </div>
      )}

      {/* 관측 데이터 테이블 - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div className="absolute bottom-4 left-4 mt-20 z-10 bg-white bg-opacity-90 p-4 rounded-lg shadow-lg">
          <h3 className="font-bold mb-2">관측 데이터</h3>
          <table className="text-sm w-full border-collapse">
          <thead>
              <tr>
              <th className="text-center border-b pb-1 border border-gray-900">항목</th>
              <th className="text-center border-b pb-1 border border-gray-900">값</th>
              </tr>
          </thead>
          <tbody>
              <tr className='border border-gray-900'>
              <td className="px-3 py-3 border text-center border-gray-900">태양 고도</td>
              <td className="border text-center border-gray-900">{currentData.altitude}°</td>
              </tr>
              <tr>
              <td className="px-3 py-3 border text-center border-gray-900">그림자 길이</td>
              <td className="border text-center border-gray-900">{currentData.shadowLength}cm</td>
              </tr>
              <tr>
              <td className="px-3 py-3 border text-center border-gray-900">기온</td>
              <td className="px-3 py-3 border text-center border-gray-900">{currentData.temperature}°C</td>
              </tr>
          </tbody>
          </table>
        </div>
      )}

      {/* 시간 선택 버튼들 - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {timeData.map((data, index) => (
            <button
              key={data.time}
              onClick={() => {
                setCurrentTimeIndex(index);
                setIsPlaying(false);
              }}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                currentTimeIndex === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {data.time.startsWith('0') ? `오전 ${data.time}` : 
               parseInt(data.time.split(':')[0]) >= 12 ? 
               `오후 ${(parseInt(data.time.split(':')[0]) - 12).toString().padStart(2, '0')}:${data.time.split(':')[1]}` : 
               `오전 ${data.time}`}
            </button>
          ))}
        </div>
      )}

      {/* 3D 캔버스 */}
      <Scene 
        camera={{ position: [0.017, 0.06,  -1.6], fov: 50 }}
        shadows
      >
        {/* 로딩 추적 컴포넌트 추가 */}
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        
        <ambientLight intensity={0.6} />
        <SunLight azimuth={currentData.azimuth} altitude={currentData.altitude} />
        <Sun azimuth={currentData.azimuth} altitude={currentData.altitude} />

        
        

        <Model 
          currentData={currentData} 
          onSceneLoaded={setModelScene}
          child2Scale={child2Scale}
          child2Position={child2Position}
        />
        <CompassBillboard />


        <OrbitControls 
          enabled={!showIntro}
          // minPolarAngle={Math.PI / 3 + Math.PI / 10}
          maxPolarAngle={Math.PI / 2}
          minDistance={0.2} 
          maxDistance={3}
        />

        <CameraLogger/>
      </Scene>

      {!showIntro && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white bg-opacity-90 p-4 rounded-lg shadow-lg">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              {isPlaying ? (
                // 일시정지 아이콘
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-white"></div>
                  <div className="w-1 h-4 bg-white"></div>
                </div>
              ) : (
                // 재생 아이콘
                <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent"></div>
              )}
            </button>
            <span className="text-sm font-medium">
              {isPlaying ? '재생 중' : '일시 정지'}
            </span>
          </div>
          
          {/* 진행바 */}
          <div className="w-80 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>09:30</span>
            <span>15:30</span>
          </div>
        </div>
      )}

      {/* Intro 오버레이 - 로딩 완료 후 표시 */}
      {isLoaded && showIntro && (
        <Intro 
          onEnter={handleEnterExperience}
          title="계절의 변화"
          description={[
            "태양이 위치가 달라지는 동안 태양 고도, 그림자 길이는 계속 변합니다. 이들이 어떤 관계가 있는지 알아봅시다."
          ]}
          simbolSvgPath="/img/icon/계절의변화.svg"
        />
      )}
    </div>
  );
}