// pages/index.tsx or App.tsx
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, Sky, useProgress } from '@react-three/drei'
import Model from '../components/6-1-2/Model'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { LensFlare } from '@andersonmancini/lens-flare'
import { EffectComposer } from '@react-three/postprocessing'
import CameraLogger from '@/components/CameraLogger'

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

// 카메라 컨트롤 컴포넌트
function CameraController({
  viewMode,
  isAnimationPlaying,
  sceneRef,
  showIntro
}: {
  viewMode: 'start' | 'following' | 'approaching' | 'free'
  isAnimationPlaying: boolean
  sceneRef: React.RefObject<THREE.Group>
  showIntro: boolean
}) {
  const { camera } = useThree()
  const orbitControlsRef = useRef<any>()
  const timeRef = useRef(0)

  // 말의 위치를 찾는 함수 (기준 물체로 사용)
  const getHorsePosition = () => {
    if (!sceneRef.current) return new THREE.Vector3(0, 0, 0)

    let horseObject: THREE.Object3D | null = null
    sceneRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === 'Mesh123') {
        horseObject = child
      }
    })

    if (horseObject) {
      const position = new THREE.Vector3()
      horseObject.getWorldPosition(position)
      return position
    }
    return new THREE.Vector3(0, 0, 0)
  }

  useFrame((state, delta) => {
    if (!isAnimationPlaying || showIntro) return

    timeRef.current += delta

    switch (viewMode) {
      case 'start':
        // 1. 시작지점에서 멀어지는 것 관찰
        // 고정된 시작점에서 물체들이 멀어지는 모습을 관찰
        camera.position.set(20.78, 12.35, -42.22)
        camera.lookAt(0, 0, -0) // 물체들이 이동하는 방향을 바라봄
        
        if (orbitControlsRef.current) {
          orbitControlsRef.current.target.set(0, 0, 0)
        }
        break

      case 'following':
        // 2. 물체들을 따라서 같이 움직이는 카메라 (말의 속도로)
        // 말의 현재 위치를 기준으로 카메라가 같이 이동
        const horsePos = getHorsePosition()
        
        // 카메라는 말과 같은 속도로 이동하되, 옆에서 관찰
        camera.position.set(
          horsePos.x + 12,  // 말의 왼쪽 옆
          horsePos.y + 2,  // 말보다 약간 위
          horsePos.z       // 말과 같은 Z축 위치
        )
        
        // 카메라가 바라보는 방향을 물체들이 있는 영역으로 설정
        const lookAtTarget = new THREE.Vector3(horsePos.x + 2, horsePos.y+2, horsePos.z)
        camera.lookAt(lookAtTarget)
        
        if (orbitControlsRef.current) {
          orbitControlsRef.current.target.copy(lookAtTarget)
        }
        break

      case 'approaching':
        // 3. 물체들이 다가오는 곳에서 관찰
        // 물체들의 이동 경로 앞쪽에 고정된 카메라
        // 물체들이 카메라쪽으로 다가오는 모습을 관찰
        camera.position.set(-2.814,1.80,398.85) // 물체들의 이동 경로 앞쪽
        camera.lookAt(0, 1, 0) // 물체들이 오는 방향을 바라봄
        
        if (orbitControlsRef.current) {
          orbitControlsRef.current.target.set(0, 1, 0)
        }
        break

      case 'free':
        // 자유 시점 - OrbitControls 활성화
        break
    }
  })

  return (
    <OrbitControls
      ref={orbitControlsRef}
      enabled={viewMode === 'free' && !showIntro} // 자유 시점일 때만 수동 조작 가능
      enablePan={viewMode === 'free'}
      enableZoom={viewMode === 'free'}
      enableRotate={viewMode === 'free'}
    />
  )
}

export default function Home() {
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false)
  const [viewMode, setViewMode] = useState<'start' | 'following' | 'approaching' | 'free'>('start')
  const sceneRef = useRef<THREE.Group>(null)

  // Intro 관련 상태
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
    playClickSound()
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }

  const handleStartAnimation = () => {
    setIsAnimationPlaying(true)
  }

  const handleViewChange = (mode: 'start' | 'following' | 'approaching' | 'free') => {
    setViewMode(mode)
  }


  const viewButtons: Array<{
  name: string
  mode: 'start' | 'following' | 'approaching' | 'free'
  }> = [
    { 
      name: '시작점에서 관찰하기', 
      mode: 'start' as const
    },
    { 
      name: '함께 이동하며 관찰하기', 
      mode: 'following' as const
    },
    { 
      name: '도착점에서 관찰하기', 
      mode: 'approaching' as const
    }
  ]

  return (
    <div className='w-screen h-screen bg-white relative'>
      {/* 컨트롤 패널 - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div className='absolute top-4 right-4 z-10 space-y-3 bg-white/95 p-4 rounded-xl shadow-lg max-w-sm'>
          <button
            onClick={handleStartAnimation}
            disabled={isAnimationPlaying}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
              isAnimationPlaying
                ? 'bg-green-500 text-white cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}>
            {isAnimationPlaying ? '물체 운동 관찰 중' : '운동 시작하기'}
          </button>

          {isAnimationPlaying && (
            <div className='space-y-2'>
              <h3 className='text-sm font-semibold text-gray-700 mb-2'>관찰 시점 선택</h3>
              {viewButtons.map((button, idx) => (
                <div key={idx} className='space-y-1'>
                  <button
                    onClick={() => handleViewChange(button.mode)}
                    className={`block w-full px-4 py-3 rounded-lg font-medium transition-all text-left ${
                      viewMode === button.mode
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}>
                    <div className='font-semibold'>{button.name}</div>
                    <div className={`text-xs mt-1 ${
                      viewMode === button.mode ? 'text-orange-100' : 'text-gray-600'
                    }`}>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Scene camera={{ position: [20.78, 12.35, -42.22], fov: 50 }} shadows='soft'>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        
        <ambientLight intensity={0.2} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={3}
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.0009}
        />

        <group ref={sceneRef}>
          <Model
            scale={1}
            position={[0, 0, 0]}
            animationSpeed={isAnimationPlaying ? 0.4 : 0}
            castShadow={true}
            receiveShadow={true}
          />
        </group>

        <CameraController 
          viewMode={viewMode}
          isAnimationPlaying={isAnimationPlaying}
          sceneRef={sceneRef}
          showIntro={showIntro}
        />

        <Sky
          distance={450000}
          sunPosition={[-10, 0.9, -10]}
          inclination={0.49}
          azimuth={0.25}
          rayleigh={1.2}
          turbidity={1}
          mieCoefficient={0.008}
          mieDirectionalG={0.85}
        />
        <Environment preset={'apartment'} />

        <CameraLogger/>
      </Scene>

      {/* Intro 오버레이 */}
      {isLoaded && showIntro && (
        <Intro 
          onEnter={handleEnterExperience}
          title="물체의 운동"
          description={[
            "다양한 시점에서 물체들의 운동을 관찰해보세요.",
            "시작점, 함께 이동, 정면 관찰의 세 가지 시점으로 운동을 이해할 수 있습니다."
          ]}
          simbolSvgPath="/img/icon/물체의운동.svg"
        />
      )}
    </div>
  )
}