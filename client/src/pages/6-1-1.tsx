import { Canvas } from '@react-three/fiber'
import { OrbitControls, useProgress } from '@react-three/drei'
import { Model } from '../components/6-1-1/Model'
import { SpeechBubble } from '../components/6-1-1/SpeechBubble'
import { RagTool, SprayTool } from '@/components/6-1-1/CleaningTool'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import CameraLogger from '@/components/CameraLogger'

// 청소 도구 타입 정의
type CleaningToolType = 'rag' | 'spray' | 'bleach' | 'vinegar' | null
type SplashType = 'splash01' | 'splash02' | 'splash03'

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
  const controlsRef = useRef<any>()
  const [isAnimating, setIsAnimating] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [activeTool, setActiveTool] = useState<CleaningToolType>(null)
  const [activeCleaningZone, setActiveCleaningZone] = useState<SplashType | null>(null)
  
  // Intro 관련 상태 추가
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  
  // 각 얼룩의 게이지 상태 관리 (100에서 시작해서 0으로)
  const [cleaningProgress, setCleaningProgress] = useState({
    splash01: 100, // 유리 얼룩 (100% 더러움)
    splash02: 100, // 변기 얼룩  
    splash03: 100, // 욕실 얼룩
  })
  
  // opacity는 progress에 비례 (100 = 1.0, 0 = 0.0)
  const splashOpacities = {
    splash01: cleaningProgress.splash01 / 100,
    splash02: cleaningProgress.splash02 / 100,
    splash03: cleaningProgress.splash03 / 100,
  }

  // 초기 카메라 설정 저장
  const initialCamera = {
    position: [-0.34, 12, -10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
  }

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

  // 클릭으로 청소하기
  const handleCleaningClick = () => {
    if (!activeCleaningZone) return
    
    // 클릭할 때마다 5-15씩 랜덤하게 감소 (게임적 요소)
    const decreaseAmount = Math.random() * 10 + 5 // 5-15 사이 랜덤값
    
    setCleaningProgress(prev => ({
      ...prev,
      [activeCleaningZone]: Math.max(0, prev[activeCleaningZone] - decreaseAmount)
    }))
  }

  // 전체 화면 클릭 이벤트
  useEffect(() => {
    const handleClick = () => {
      if (activeCleaningZone) {
        handleCleaningClick()
      }
    }

    if (activeCleaningZone) {
      window.addEventListener('click', handleClick)
    }

    return () => {
      window.removeEventListener('click', handleClick)
    }
  }, [activeCleaningZone])

  const moveToTarget = (targetPosition: [number, number, number], cameraPosition: [number, number, number], toolType: CleaningToolType, splashType?: SplashType) => {
    if (controlsRef.current && !isAnimating) {
      setIsAnimating(true)
      setIsZoomed(true)
      setActiveTool(toolType)
      setActiveCleaningZone(splashType || null) // 청소 구역 활성화

      const startTarget = controlsRef.current.target.clone()
      const startPosition = controlsRef.current.object.position.clone()

      const endTarget = new THREE.Vector3(...targetPosition)
      const endPosition = new THREE.Vector3(...cameraPosition)

      let progress = 0
      const duration = 1000
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        progress = Math.min(elapsed / duration, 1)

        const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

        controlsRef.current.target.lerpVectors(startTarget, endTarget, easeProgress)
        controlsRef.current.object.position.lerpVectors(startPosition, endPosition, easeProgress)
        controlsRef.current.update()

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
        }
      }

      animate()
    }
  }

  const resetCamera = () => {
    moveToTarget(initialCamera.target, initialCamera.position, null)
    setIsZoomed(false)
    setActiveTool(null)
    setActiveCleaningZone(null) // 청소 구역 비활성화
  }

  // 청소 완료 체크
  const isCleaningComplete = (splashType: SplashType) => cleaningProgress[splashType] <= 0

  return (
    <div className='w-screen h-screen bg-white flex flex-col'>
      {/* 돌아가기 버튼 - Intro가 보일 때는 숨김 */}
      {isZoomed && !showIntro && (
        <div className='absolute top-4 left-4 z-10'>
          <button
            onClick={resetCamera}
            disabled={isAnimating}
            className='bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg shadow-lg transition-colors'>
            🏠 돌아가기
          </button>
        </div>
      )}

      {/* 게임 UI - 클릭 안내 - Intro가 보일 때는 숨김 */}
      {activeCleaningZone && !showIntro && (
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none'>
          <div className='bg-black bg-opacity-70 text-white px-6 py-4 rounded-xl text-center animate-pulse'>
            <div className='text-2xl mb-2'>🖱️ 클릭해서 청소하세요!</div>
            <div className='text-lg'>
              {activeCleaningZone === 'splash01' && '🪟 유리창을 깨끗하게!'}
              {activeCleaningZone === 'splash02' && '🚽 변기를 깨끗하게!'}
              {activeCleaningZone === 'splash03' && '🛁 욕실을 깨끗하게!'}
            </div>
            {isCleaningComplete(activeCleaningZone) && (
              <div className='text-green-400 text-xl font-bold mt-2'>✨ 청소 완료! ✨</div>
            )}
          </div>
        </div>
      )}

      {/* 청소 게이지 UI - Intro가 보일 때는 숨김 */}
      {!showIntro && (
        <div className='absolute bottom-4 left-4 z-10'>
          <div className='bg-white bg-opacity-95 p-4 rounded-xl shadow-lg border-2 border-gray-200'>
            <div className='text-lg font-bold mb-3 text-center text-gray-800'>🧹 청소 진행도</div>
            <div className='space-y-3'>
              {/* 유리창 게이지 */}
              <div className='flex items-center gap-3'>
                <span className='text-blue-600 font-semibold w-12'>🪟</span>
                <div className='flex-1'>
                  <div className='flex justify-between text-sm mb-1'>
                    <span>유리창</span>
                    <span className={cleaningProgress.splash01 <= 0 ? 'text-green-600 font-bold' : 'text-gray-600'}>
                      {cleaningProgress.splash01 <= 0 ? '완료!' : `${Math.round(100 - cleaningProgress.splash01)}%`}
                    </span>
                  </div>
                  <div className='w-32 bg-gray-200 rounded-full h-3 overflow-hidden'>
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${cleaningProgress.splash01 <= 0 ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.max(0, 100 - cleaningProgress.splash01)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 변기 게이지 */}
              <div className='flex items-center gap-3'>
                <span className='text-teal-600 font-semibold w-12'>🚽</span>
                <div className='flex-1'>
                  <div className='flex justify-between text-sm mb-1'>
                    <span>변기</span>
                    <span className={cleaningProgress.splash02 <= 0 ? 'text-green-600 font-bold' : 'text-gray-600'}>
                      {cleaningProgress.splash02 <= 0 ? '완료!' : `${Math.round(100 - cleaningProgress.splash02)}%`}
                    </span>
                  </div>
                  <div className='w-32 bg-gray-200 rounded-full h-3 overflow-hidden'>
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${cleaningProgress.splash02 <= 0 ? 'bg-green-500' : 'bg-teal-500'}`}
                      style={{ width: `${Math.max(0, 100 - cleaningProgress.splash02)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 욕실 게이지 */}
              <div className='flex items-center gap-3'>
                <span className='text-green-600 font-semibold w-12'>🛁</span>
                <div className='flex-1'>
                  <div className='flex justify-between text-sm mb-1'>
                    <span>욕실</span>
                    <span className={cleaningProgress.splash03 <= 0 ? 'text-green-600 font-bold' : 'text-gray-600'}>
                      {cleaningProgress.splash03 <= 0 ? '완료!' : `${Math.round(100 - cleaningProgress.splash03)}%`}
                    </span>
                  </div>
                  <div className='w-32 bg-gray-200 rounded-full h-3 overflow-hidden'>
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${cleaningProgress.splash03 <= 0 ? 'bg-green-500' : 'bg-green-600'}`}
                      style={{ width: `${Math.max(0, 100 - cleaningProgress.splash03)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 전체 완료 메시지 */}
            {Object.values(cleaningProgress).every(progress => progress <= 0) && (
              <div className='mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center'>
                <div className='text-green-800 font-bold text-lg'>🎉 모든 청소 완료! 🎉</div>
                <div className='text-green-600 text-sm'>방이 깨끗해졌습니다!</div>
              </div>
            )}
          </div>
        </div>
      )}

      <Scene camera={{ position: initialCamera.position, fov: 50 }}>
        {/* 로딩 추적 컴포넌트 추가 */}
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={1} />
        <Model scale={1} position={[0, 0, 0]} splashOpacities={splashOpacities} />

        <CameraLogger/>

        {/* 청소 도구들 */}
        <RagTool visible={activeTool === 'rag' || activeTool === 'bleach'} />
        <SprayTool visible={activeTool === 'spray' || activeTool === 'vinegar'} />

        {/* 말풍선들 - Intro가 보일 때는 숨김 */}
        {!showIntro && (
          <>
            <SpeechBubble
              position={[-6, 1, -1.2]}
              pointColor='#2985ee'
              html='<mark>유리 세정제</mark>로 얼룩 제거하기'
              onBubbleClick={() => moveToTarget([-6, 1, -1.2], [-5, 2, 1], 'spray', 'splash01')}
            />

            <SpeechBubble
              position={[10.22, 0, 0.33]}
              pointColor='#25e5c2'
              html='<mark>변기용 세제</mark>로 변기 청소하기'
              onBubbleClick={() => moveToTarget([10, 2.0, -0.33], [10, 2.2, -0.33], 'rag', 'splash02')}
            />

            <SpeechBubble
              position={[9.22, -0.5, -2.33]}
              pointColor='#129d3a'
              html='<mark>표백제</mark>로 욕실 청소하기'
              bubbleOffset={[0.0, 0.4, 0.2]}
              onBubbleClick={() => moveToTarget([10.22, -2.5, -3.33], [8.22, 2.5, -2.33], 'bleach', 'splash03')}
            />

            <SpeechBubble
              position={[-2.7, 0.5, 5.1]}
              pointColor='#ff6b6b'
              html='<mark>식초</mark>로 생선 비린내 제거하기'
              bubbleOffset={[0.4, 0.6, -0.2]}
              onBubbleClick={() => moveToTarget([-2.7, 0.2, 5.1], [-0, 2.0, 5.1], 'vinegar')}
            />
          </>
        )}

        <OrbitControls 
          ref={controlsRef} 
          maxPolarAngle={Math.PI / 2} 
          minPolarAngle={Math.PI / 6}
          enablePan={!showIntro && !activeCleaningZone}
          enableZoom={!showIntro && !activeCleaningZone}
          enableRotate={!showIntro && !activeCleaningZone}
        />

      </Scene>

      {/* Intro 오버레이 - 로딩 완료 후 표시 */}
      {isLoaded && showIntro && (
        <Intro 
          onEnter={handleEnterExperience}
          title="산과 염기"
          description={[
            "우리 주변에는 여러 가지 산성 용액과 염기성 용액이 있습니다. 산성 용액과 염기성 용액을 이용하는 예를 조사해 봅시다."
          ]}
          simbolSvgPath="/img/icon/산과염기.svg"
        />
      )}
    </div>
  )
}