import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  ContactShadows,
  PerformanceMonitor,
  AccumulativeShadows,
  RandomizedLight,
  useProgress,
} from '@react-three/drei'
import { Model } from '../components/6-1-1/Model'
import { SpeechBubble } from '../components/6-1-1/SpeechBubble'
import {
  VinegarTool,
  SprayTool,
  BleachTool,
  ToiletCleanerTool,
  GlassRagTool,
  ToiletBrushTool,
  BathroomScrubTool,
} from '@/components/6-1-1/CleaningTool'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import IntroMouseCameraController from '@/components/IntroMouseCameraController'
import { CuttingBoardSmell } from '@/components/6-1-1/SmellPlane'
import { Toilet } from '@/components/6-1-1/Toilet'
import { CuttingBoard } from '@/components/6-1-1/CuttingBoardTool'
import { CleaningToolType, SplashType, GamePhase, missions, wipingEfficiency, initialCamera } from '../types/6-1-1'

// 로딩 트래커
function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

// 뒤로가기 버튼
function BackButton({ 
  isZoomed, 
  showIntro, 
  onBack, 
  isAnimating, 
  gamePhase 
}: {
  isZoomed: boolean
  showIntro: boolean
  onBack: () => void
  isAnimating: boolean
  gamePhase: GamePhase
}) {
  if (!isZoomed || showIntro || gamePhase === 'wiping') return null

  return (
    <div className='absolute top-4 left-4 z-10'>
      <button
        onClick={onBack}
        disabled={isAnimating}
        className='bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 font-light text-white px-4 py-2 rounded-lg shadow-lg transition-colors'>
        🏠 돌아가기
      </button>
    </div>
  )
}

// 청소 진행도 UI
function CleaningProgressUI({
  cleaningProgress,
  completedMissions,
  showIntro,
  isZoomed,
  onReset,
}: {
  cleaningProgress: Record<SplashType, number>
  completedMissions: Record<SplashType, boolean>
  showIntro: boolean
  isZoomed: boolean
  onReset: (missionId: SplashType) => void
}) {
  if (showIntro || isZoomed) return null

  const missionList = [
    { id: 'splash01' as const, name: '도마', color: '#2985ee' },
    { id: 'splash02' as const, name: '유리창', color: '#25e5c2' },
    { id: 'splash03' as const, name: '변기', color: '#129d3a' },
    { id: 'splash04' as const, name: '욕실', color: '#ff6b6b' },
  ]

  return (
    <div className='absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200 min-w-[200px] z-10'>
      <h3 className='text-lg font-bold mb-3 text-gray-800'>청소 진행도</h3>
      <div className='space-y-3 font-light'>
        {missionList.map((mission) => {
          const progress = cleaningProgress[mission.id]
          const isCompleted = completedMissions[mission.id]

          return (
            <div key={mission.id} className='space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-700'>{mission.name}</span>
                <span className='text-xs text-gray-500'>
                  {isCompleted ? '완료' : `${Math.round(progress)}%`}
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='h-2 rounded-full transition-all duration-300'
                  style={{
                    width: `${100 - progress}%`,
                    backgroundColor: mission.color,
                  }}
                />
              </div>
              {isCompleted && (
                <button
                  onClick={() => onReset(mission.id)}
                  className='w-full text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 transition-colors duration-200'>
                  다시 하기
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 용액 선택 UI
function SolutionSelector({
  gamePhase,
  showIntro,
  selectedSolution,
  onSolutionSelect,
}: {
  gamePhase: GamePhase
  showIntro: boolean
  selectedSolution: CleaningToolType
  onSolutionSelect: (solutionId: CleaningToolType) => void
}) {
  if (gamePhase !== 'solution_choice' || showIntro) return null

  const solutions = [
    { id: 'vinegar', name: '식초', color: '#ff9999', img: '/img/6-1-1/vinegar.png' },
    { id: 'spray', name: '유리 세정제', color: '#99ccff', img: '/img/6-1-1/glass_cleaner.png' },
    { id: 'toilet_cleaner', name: '변기용 세제', color: '#99ff99', img: '/img/6-1-1/toilet_cleaner.png' },
    { id: 'bleach', name: '표백제', color: '#ffff99', img: '/img/6-1-1/bleach.png' },
  ]

  return (
    <div className='absolute bottom-4 right-4 z-10'>
      <div className='bg-white bg-opacity-95 p-4 rounded-xl shadow-lg border-2 border-gray-200'>
        <div className='text-lg font-bold mb-3 text-center text-gray-800'>용액 선택</div>
        <div className='grid grid-cols-2 gap-3'>
          {solutions.map((solution) => (
            <button
              key={solution.id}
              onClick={() => onSolutionSelect(solution.id as CleaningToolType)}
              className={`
                px-4 py-3 rounded-lg font-bold text-white shadow-lg 
                hover:scale-105 active:scale-95 transition-all text-black
                ${selectedSolution === solution.id ? 'ring-4 ring-yellow-400' : ''}
              `}
              style={{ backgroundColor: solution.color }}>
              {solution.img && (
                <img src={solution.img} alt={solution.name} className='w-24 h-24 object-contain' />
              )}
              {solution.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// 게임 메시지
function GameMessages({ 
  showMessage, 
  showIntro, 
  gamePhase, 
  sprayCount,
  wipingProgress 
}: {
  showMessage: string
  showIntro: boolean
  gamePhase: GamePhase
  sprayCount: number
  wipingProgress: number
}) {
  if (showIntro) return null

  return (
    <>
      {/* 중앙 메시지 */}
      {showMessage && (
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none'>
          <div className='bg-black bg-opacity-70 text-white px-6 py-4 rounded-xl text-center'>
            <div className='text-xl font-bold'>{showMessage}</div>
          </div>
        </div>
      )}

      {/* 스프레이 안내 */}
      {gamePhase === 'spraying' && (
        <div className='absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none'>
          <div className='bg-blue-600 bg-opacity-90 text-white px-6 py-4 rounded-xl text-center'>
            <div className='text-lg font-bold'>🖱️ 클릭해서 용액을 뿌리세요! ({sprayCount}/3)</div>
          </div>
        </div>
      )}

      {/* 와이핑 안내 */}
      {gamePhase === 'wiping' && (
        <div className='absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none'>
          <div className='bg-green-600 bg-opacity-90 text-white px-6 py-4 rounded-xl text-center'>
            <div className='text-lg font-bold'>
              🧽 마우스를 움직여서 닦아주세요! ({Math.round(wipingProgress)}%)
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function Home() {
  const controlsRef = useRef<any>()
  const [perfSucks, degrade] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [currentMission, setCurrentMission] = useState<SplashType | null>(null)
  const [gamePhase, setGamePhase] = useState<GamePhase>('selection')
  const [selectedSolution, setSelectedSolution] = useState<CleaningToolType>(null)
  const [sprayCount, setSprayCount] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showMessage, setShowMessage] = useState<string>('')
  const [wrongMessageShown, setWrongMessageShown] = useState(false)
  const [isBathroomLightOn, setIsBathroomLightOn] = useState(false)
  
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const wipingAudioRef = useRef<HTMLAudioElement | null>(null)

  const [cleaningProgress, setCleaningProgress] = useState<Record<SplashType, number>>({
    splash01: 100,
    splash02: 100,
    splash03: 100,
    splash04: 100,
  })

  const [completedMissions, setCompletedMissions] = useState<Record<SplashType, boolean>>({
    splash01: false,
    splash02: false,
    splash03: false,
    splash04: false,
  })

  const [wipingProgress, setWipingProgress] = useState<Record<SplashType, number>>({
    splash01: 0,
    splash02: 0,
    splash03: 0,
    splash04: 0,
  })

  const [mouseVelocity, setMouseVelocity] = useState(0)
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 })

  const splashOpacities = {
    splash01: cleaningProgress.splash01 / 100,
    splash02: cleaningProgress.splash02 / 100,
    splash03: cleaningProgress.splash03 / 100,
    splash04: cleaningProgress.splash04 / 100,
  }

  // 오디오 함수들
  const playSound = (path: string, volume = 0.7) => {
    try {
      const audio = new Audio(path)
      audio.volume = volume
      audio.play().catch(() => {})
    } catch (error) {}
  }

  const playNarration = (path: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
    }
    
    try {
      const audio = new Audio(path)
      audio.volume = 0.7
      audio.play().catch(() => {})
      currentAudioRef.current = audio
    } catch (error) {}
  }

  // 카메라 이동
  const moveToTarget = (
    targetPosition: [number, number, number],
    cameraPosition: [number, number, number],
    missionId: SplashType,
  ) => {
    if (controlsRef.current && !isAnimating) {
      setIsAnimating(true)
      setIsZoomed(true)
      setCurrentMission(missionId)
      setGamePhase('solution_choice')

      const startTarget = controlsRef.current.target.clone()
      const startPosition = controlsRef.current.object.position.clone()
      const endTarget = new THREE.Vector3(...targetPosition)
      const endPosition = new THREE.Vector3(...cameraPosition)

      if (missionId === 'splash03' || missionId === 'splash04') {
        setIsBathroomLightOn(true)
      }

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
          setShowMessage(missions[missionId].selectMessage)
        }
      }

      animate()
    }
  }

  // 카메라 리셋
  const resetCamera = () => {
    if (controlsRef.current && !isAnimating) {
      setIsAnimating(true)

      if (wipingAudioRef.current) {
        wipingAudioRef.current.pause()
        wipingAudioRef.current = null
      }

      if (currentMission) {
        setWipingProgress((prev) => ({
          ...prev,
          [currentMission]: 0,
        }))
      }

      setMouseVelocity(0)
      setIsBathroomLightOn(false)
      setWrongMessageShown(false)

      const startTarget = controlsRef.current.target.clone()
      const startPosition = controlsRef.current.object.position.clone()
      const endTarget = new THREE.Vector3(...initialCamera.target)
      const endPosition = new THREE.Vector3(...initialCamera.position)

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
          setIsZoomed(false)
          setCurrentMission(null)
          setGamePhase('selection')
          setSelectedSolution(null)
          setSprayCount(0)
          setShowMessage('')
        }
      }

      animate()
    }
  }

  // 용액 선택
  const handleSolutionSelect = (solutionId: CleaningToolType) => {
    if (!currentMission) return

    setSelectedSolution(solutionId)
    setShowMessage('')
    setWrongMessageShown(false)
    setWipingProgress((prev) => ({ ...prev, [currentMission]: 0 }))
    setGamePhase('spraying')
    setSprayCount(0)
  }

  // 스프레이
  const handleSpray = () => {
    if (gamePhase !== 'spraying' || !currentMission) return

    playSound('/sounds/6-1-1/6-1-1-2_spray.MP3', 0.5)

    const newSprayCount = sprayCount + 1
    setSprayCount(newSprayCount)

    if (newSprayCount >= 3) {
      setGamePhase('wiping')
      
      // 닦기 사운드 시작
      try {
        const audio = new Audio('/sounds/6-1-1/6-1-1-9_varrendo-101422.mp3')
        audio.volume = 0.6
        audio.loop = true
        audio.play().catch(() => {})
        wipingAudioRef.current = audio
      } catch (error) {}
    }
  }

  // 닦기
  const handleWiping = (mouseEvent?: MouseEvent) => {
    if (gamePhase !== 'wiping' || !currentMission) return

    if (mouseEvent) {
      const currentMousePos = { x: mouseEvent.clientX, y: mouseEvent.clientY }

      if (lastMousePosition.x === 0 && lastMousePosition.y === 0) {
        setLastMousePosition(currentMousePos)
        return
      }

      const deltaX = currentMousePos.x - lastMousePosition.x
      const deltaY = currentMousePos.y - lastMousePosition.y
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      setMouseVelocity(velocity)
      setLastMousePosition(currentMousePos)

      if (velocity < 8) return
    }

    const mission = missions[currentMission]

    // 올바른 용액일 때만 진행도 증가
    if (selectedSolution === mission.correctSolution) {
      const efficiency = wipingEfficiency[currentMission]
      const baseProgress = efficiency.base
      const velocityBonus = Math.min(mouseVelocity * efficiency.bonus, efficiency.bonus * 3)
      const totalEfficiency = baseProgress + velocityBonus

      setWipingProgress((prev) => {
        const newProgress = Math.min(100, prev[currentMission] + totalEfficiency)

        if (newProgress >= 100 && prev[currentMission] < 100) {
          if (wipingAudioRef.current) {
            wipingAudioRef.current.pause()
            wipingAudioRef.current = null
          }

          playSound('/sounds/6-1-1/6-1-1-3_correct-356013.mp3', 0.5)

          setCompletedMissions((prevCompleted) => {
            const newCompleted = { ...prevCompleted, [currentMission]: true }
            
            // 모든 미션 완료 체크
            if (Object.values(newCompleted).every((completed) => completed)) {
              setTimeout(() => {
                playSound('/sounds/6-1-1/6-1-1-6_goodresult-82807.mp3', 0.2)
              }, 1000)
            }

            return newCompleted
          })

          // 완료 메시지
          const messages = {
            splash01: '염기성 물질인 비린내는 산성 용액인 식초와 만나면 성질이 변하여 제거됩니다.',
            splash02: '단백질 등으로 이루어진 얼룩은 염기성 물질인 유리 세정제와 만나면 성질이 변하여 제거됩니다.',
            splash03: '산성 용액인 변기용 세제로 변기를 청소하면 변기의 때가 성질이 변하여 제거됩니다.',
            splash04: '염기성 용액인 표백제로 욕실 바닥을 청소하면 욕실 바닥의 때가 성질이 변하여 제거됩니다.',
          }

          setShowMessage(messages[currentMission])
          setGamePhase('completed')
        }

        return { ...prev, [currentMission]: newProgress }
      })

      // 청소 진행도 감소
      const decreaseAmount = totalEfficiency * (1 + wipingProgress[currentMission] / 10)
      setCleaningProgress((prev) => ({
        ...prev,
        [currentMission]: Math.max(0, prev[currentMission] - decreaseAmount),
      }))
    } else {
      // 잘못된 용액일 때
      if (!wrongMessageShown) {
        setWrongMessageShown(true)

        setTimeout(() => {
          setShowMessage('해당 용액을 다시 고르세요.')
          playNarration('/sounds/6-1-1/narration/6-1-1-I.MP3')

          setTimeout(() => {
            if (wipingAudioRef.current) {
              wipingAudioRef.current.pause()
              wipingAudioRef.current = null
            }

            setGamePhase('solution_choice')
            setSelectedSolution(null)
            setSprayCount(0)
            setShowMessage(missions[currentMission].selectMessage)
            setWrongMessageShown(false)
            setWipingProgress((prev) => ({ ...prev, [currentMission]: 0 }))
          }, 3000)
        }, 2000)
      }
    }
  }

  // 미션 리셋
  const resetMission = (missionId: SplashType) => {
    setCleaningProgress((prev) => ({ ...prev, [missionId]: 100 }))
    setWipingProgress((prev) => ({ ...prev, [missionId]: 0 }))
    setCompletedMissions((prev) => ({ ...prev, [missionId]: false }))
  }

  // 이벤트 리스너
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (gamePhase === 'wiping') {
        handleWiping(event)
      }
    }

    const handleClick = () => {
      if (gamePhase === 'spraying') {
        handleSpray()
      }
    }

    if (gamePhase === 'wiping') {
      window.addEventListener('mousemove', handleMouseMove)
    }

    if (gamePhase === 'spraying') {
      window.addEventListener('click', handleClick)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [gamePhase, sprayCount, currentMission, mouseVelocity, lastMousePosition])

  return (
    <div className='w-screen h-screen bg-white flex flex-col'>
      <BackButton
        isZoomed={isZoomed}
        showIntro={showIntro}
        onBack={resetCamera}
        isAnimating={isAnimating}
        gamePhase={gamePhase}
      />

      <GameMessages 
        showMessage={showMessage} 
        showIntro={showIntro} 
        gamePhase={gamePhase} 
        sprayCount={sprayCount}
        wipingProgress={currentMission ? wipingProgress[currentMission] : 0}
      />

      <SolutionSelector
        gamePhase={gamePhase}
        showIntro={showIntro}
        selectedSolution={selectedSolution}
        onSolutionSelect={handleSolutionSelect}
      />

      <CleaningProgressUI
        cleaningProgress={cleaningProgress}
        completedMissions={completedMissions}
        showIntro={showIntro}
        isZoomed={isZoomed}
        onReset={resetMission}
      />

      <Scene shadows camera={{ position: initialCamera.position, fov: 50 }}>
        <LoadingTracker onLoadingComplete={() => setIsLoaded(true)} />
        <IntroMouseCameraController enabled={showIntro} />
        
        <directionalLight
          castShadow
          intensity={1}
          position={[-6, 3, -10]}
          shadow-mapSize={[2048, 2048]}
          shadow-radius={4}
          shadow-bias={-0.0001}
        />

        <PerformanceMonitor onDecline={() => degrade(true)} />
        <ContactShadows position={[0, 0, 0]} opacity={0.9} scale={30} blur={2.5} far={10} color='black' frames={2} />
        <AccumulativeShadows frames={20} alphaTest={0.15} opacity={0.1} scale={30} position={[0, -0.89, 0]}>
          <RandomizedLight amount={4} radius={3} ambient={0.3} intensity={0.5} position={[0, 2, 0]} bias={0.001} />
        </AccumulativeShadows>

        <Model scale={1} position={[0, 1.04, 0]} splashOpacities={splashOpacities} />
        <Toilet scale={1} position={[10.5, 5, 0.5]} splashOpacities={splashOpacities} />
        
        {isBathroomLightOn && (
          <pointLight intensity={7} position={[7.0, 2, -2]} color='#c0ce6f' distance={7} decay={1} />
        )}

        {/* 청소 도구들 */}
        {gamePhase === 'spraying' && selectedSolution && (
          <>
            {selectedSolution === 'vinegar' && <VinegarTool visible={true} />}
            {selectedSolution === 'spray' && <SprayTool visible={true} />}
            {selectedSolution === 'toilet_cleaner' && <ToiletCleanerTool visible={true} />}
            {selectedSolution === 'bleach' && <BleachTool visible={true} />}
          </>
        )}

        {gamePhase === 'wiping' && currentMission && (
          <>
            {currentMission === 'splash02' && <GlassRagTool visible={true} />}
            {currentMission === 'splash03' && <ToiletBrushTool visible={true} />}
            {currentMission === 'splash04' && <BathroomScrubTool visible={true} />}
          </>
        )}

        {/* 도마 관련 */}
        {!showIntro && (
          <>
            <CuttingBoardSmell
              position={missions.splash01.position}
              opacity={cleaningProgress.splash01 / 100}
              enabled={true}
            />
            <CuttingBoard
              position={missions.splash01.position}
              wipingProgress={wipingProgress.splash01}
              isInteractive={currentMission === 'splash01' && gamePhase === 'wiping'}
            />
          </>
        )}

        {/* 미션 버블들 */}
        {!showIntro && gamePhase === 'selection' && (
          <>
            <SpeechBubble
              position={missions.splash01.position}
              html='도마에서 나는 생선 비린내 제거하기'
              onBubbleClick={() => {
                moveToTarget(missions.splash01.position, missions.splash01.cameraPosition, 'splash01')
                playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
              }}
            />

            <SpeechBubble
              position={missions.splash02.position}
              html='유리창의 얼룩 제거하기'
              onBubbleClick={() => {
                moveToTarget(missions.splash02.position, missions.splash02.cameraPosition, 'splash02')
                playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
              }}
            />

            <SpeechBubble
              position={missions.splash03.position}
              html='변기 청소하기'
              onBubbleClick={() => {
                moveToTarget(missions.splash03.position, missions.splash03.cameraPosition, 'splash03')
                playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
              }}
            />

            <SpeechBubble
              position={missions.splash04.position}
              html='욕실 청소하기'
              onBubbleClick={() => {
                moveToTarget(missions.splash04.position, missions.splash04.cameraPosition, 'splash04')
                playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3', 0.5)
              }}
            />
          </>
        )}

        <OrbitControls
          ref={controlsRef}
          maxPolarAngle={Math.PI / 2 - Math.PI / 30}
          minPolarAngle={0}
          minAzimuthAngle={Math.PI / 2}
          maxAzimuthAngle={-Math.PI / 2}
          enablePan={false}
          enableZoom={!showIntro}
          enableRotate={!showIntro}
          minDistance={0}
          maxDistance={30}
        />

        <Environment
          files='/img/cover/hdri.JPG'
          background={true}
          ground={{ height: 5, radius: 80, scale: 100 }}
          backgroundBlurriness={0.8}
          backgroundIntensity={0.7}
          environmentIntensity={0.8}
        />
      </Scene>

      {isLoaded && showIntro && (
        <Intro
          onEnter={() => {
            playSound('/sounds/Enter_Cute.mp3')
            setTimeout(() => setShowIntro(false), 300)
          }}
          title='산성 용액과 염기성 용액을 이용하는 예 알아보기'
          description={['집 안에서 이용하고 있는 산성 용액과 염기성 용액이 어떻게 이용되는지 알아봅시다.']}
          backgroundSvg='/img/cover/6-1-1.svg'
          descriptionSound='/sounds/6-1-1/narration/6-1-1-Goal.MP3'
        />
      )}
    </div>
  )
}