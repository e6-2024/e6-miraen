import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Lightformer,
  PerformanceMonitor,
  AccumulativeShadows,
  RandomizedLight,
  useProgress,
} from '@react-three/drei'
import { Model } from '../components/6-1-1/Model'
import { SpeechBubble } from '../components/6-1-1/SpeechBubble'
import {
  CleaningTool,
  VinegarTool,
  SprayTool,
  BleachTool,
  ToiletCleanerTool,
  GlassRagTool,
  ToiletBrushTool,
  BathroomScrubTool,
  KitchenSpongeTool,
} from '@/components/6-1-1/CleaningTool'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import CameraLogger from '@/components/CameraLogger'
import IntroMouseCameraController from '@/components/IntroMouseCameraController'
import { FishSmellEffect } from '@/components/6-1-1/FishSmellParticles'
import { Toilet } from '@/components/6-1-1/Toilet'

// 타입과 상수 import
import { CleaningToolType, SplashType, GamePhase, missions, wipingEfficiency, initialCamera } from '../types/6-1-1'

// UI 컴포넌트들 import
import { BackButton, WipingProgressUI, CleaningProgressUI, SolutionSelector, GameMessages } from '@/components/6-1-1/UI'
import { BathroomLight } from '@/components/6-1-1/BathroomLight'

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
  const [showWrongMessage, setShowWrongMessage] = useState(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isBathroomLightOn, setIsBathroomLightOn] = useState(false)

  // 청소 진행도 상태들
  const [cleaningProgress, setCleaningProgress] = useState({
    splash01: 100,
    splash02: 100,
    splash03: 100,
    splash04: 100,
  })

  const [wipingProgress, setWipingProgress] = useState({
    splash01: 0,
    splash02: 0,
    splash03: 0,
    splash04: 0,
  })

  const [mouseVelocity, setMouseVelocity] = useState(0)
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 })
  const [wipingIntensity, setWipingIntensity] = useState(0)

  const splashOpacities = {
    splash01: cleaningProgress.splash01 / 100,
    splash02: cleaningProgress.splash02 / 100,
    splash03: cleaningProgress.splash03 / 100,
    splash04: cleaningProgress.splash04 / 100,
  }

  // 사운드 함수들
  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const playGeneralButton = (audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const playNarration = (audioPath: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }

    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch((error) => {
        console.log('나레이션 재생 실패:', error.name)
      })
      currentAudioRef.current = audio

      audio.addEventListener('ended', () => {
        currentAudioRef.current = null
      })
    } catch (error) {
      console.log('나레이션 생성 실패:', error)
    }
  }

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const handleEnterExperience = () => {
    playClickSound()
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }

  const calculateWipingEfficiency = (velocity: number, missionId: SplashType) => {
    const efficiency = wipingEfficiency[missionId]
    const baseProgress = efficiency.base
    const velocityBonus = Math.min(velocity * efficiency.bonus, efficiency.bonus * 3)
    return baseProgress + velocityBonus
  }

  const handleWipingComplete = () => {
    if (!currentMission) return

    const mission = missions[currentMission]

    if (currentMission === 'splash01') {
      // 창문
      playNarration('/sounds/6-1-1/narration/6-1-1-D.MP3')
    } else if (currentMission === 'splash02') {
      // 변기
      playNarration('/sounds/6-1-1/narration/6-1-1-F.MP3')
    } else if (currentMission === 'splash03') {
      // 욕실바닥
      playNarration('/sounds/6-1-1/narration/6-1-1-H.MP3')
    } else if (currentMission === 'splash04') {
      // 도마
      playNarration('/sounds/6-1-1/narration/6-1-1-B.MP3')
    }

    playClickSound('/sounds/complete_cleaning.mp3')

    setShowMessage(`🎉 ${mission.name} 청소 완료! 깨끗해졌습니다.`)
    setGamePhase('completed')
  }

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

      let progress = 0
      const duration = 1000
      const startTime = Date.now()

      if (missionId === 'splash01') {
        //창문
        playNarration('/sounds/6-1-1/narration/6-1-1-C.MP3')
      } else if (missionId === 'splash02') {
        //변기
        playNarration('/sounds/6-1-1/narration/6-1-1-E.MP3')
      } else if (missionId === 'splash03') {
        //욕실바닥
        playNarration('/sounds/6-1-1/narration/6-1-1-G.MP3')
      } else if (missionId === 'splash04') {
        //도마
        playNarration('/sounds/6-1-1/narration/6-1-1-A.MP3')
      }

      if (missionId === 'splash02' || missionId === 'splash03') {
        setIsBathroomLightOn(true)
      }

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

  const handleSolutionSelect = (solutionId: CleaningToolType) => {
    if (!currentMission) return

    setSelectedSolution(solutionId)
    setShowMessage('')

    setWipingProgress((prev) => ({
      ...prev,
      [currentMission]: 0,
    }))

    const mission = missions[currentMission]

    if (solutionId === mission.correctSolution) {
      setGamePhase('spraying')
      setSprayCount(0)
    } else {
      setShowWrongMessage(true)
      playNarration('/sounds/6-1-1/narration/6-1-1-I.MP3')
      setShowMessage('용액을 다시 고르세요.')
    }
  }

  const handleSpray = () => {
    if (gamePhase !== 'spraying' || !currentMission) return

    const newSprayCount = sprayCount + 1
    setSprayCount(newSprayCount)

    if (newSprayCount >= 3) {
      setGamePhase('wiping')
    }
  }

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

      const intensity = Math.min(velocity / 20, 1)
      setWipingIntensity(intensity)
      if (velocity < 8) {
        return
      }
    }

    const efficiency = calculateWipingEfficiency(mouseVelocity, currentMission)

    setWipingProgress((prev) => {
      const newProgress = Math.min(100, prev[currentMission] + efficiency)

      if (newProgress >= 100 && prev[currentMission] < 100) {
        handleWipingComplete()
      }

      return {
        ...prev,
        [currentMission]: newProgress,
      }
    })

    const currentWipingProgress = wipingProgress[currentMission]
    const decreaseAmount = efficiency * (1 + currentWipingProgress / 10)

    setCleaningProgress((prev) => ({
      ...prev,
      [currentMission]: Math.max(0, prev[currentMission] - decreaseAmount),
    }))
  }

  const resetCamera = () => {
    if (controlsRef.current && !isAnimating) {
      setIsAnimating(true)

      if (currentMission) {
        setWipingProgress((prev) => ({
          ...prev,
          [currentMission]: 0,
        }))
      }

      setWipingIntensity(0)
      setMouseVelocity(0)

      setIsBathroomLightOn(false)

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

  // 마우스 이벤트 처리
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
      {/* UI 컴포넌트들 */}
      <BackButton
        isZoomed={isZoomed}
        showIntro={showIntro}
        onBack={resetCamera}
        onButtonClick={playGeneralButton}
        isAnimating={isAnimating}
      />

      <WipingProgressUI
        currentMission={currentMission}
        wipingProgress={currentMission ? wipingProgress[currentMission] : 0}
        wipingIntensity={wipingIntensity}
        gamePhase={gamePhase}
        showIntro={showIntro}
      />

      <GameMessages showMessage={showMessage} showIntro={showIntro} gamePhase={gamePhase} sprayCount={sprayCount} />

      <SolutionSelector
        gamePhase={gamePhase}
        showIntro={showIntro}
        selectedSolution={selectedSolution}
        onSolutionSelect={handleSolutionSelect}
        onButtonClick={playGeneralButton}
      />

      <CleaningProgressUI cleaningProgress={cleaningProgress} showIntro={showIntro} isZoomed={isZoomed} />

      <Scene shadows camera={{ position: initialCamera.position, fov: 50 }}>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
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
        <Environment frames={perfSucks ? 1 : Infinity} preset='studio' resolution={256} background={false} blur={1}>
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <group rotation={[Math.PI / 2, 1, 0]}>
            <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
            <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[50, 2, 1]} />
          </group>
          <Lightformer
            intensity={2}
            form='ring'
            color='white'
            rotation-y={Math.PI / 2}
            position={[1, 1, 1]}
            scale={[4, 4, 1]}
          />
        </Environment>
        <ContactShadows position={[0, -0.89, 0]} opacity={0.9} scale={20} blur={2.5} far={2} color='black' frames={2} />
        <AccumulativeShadows frames={20} alphaTest={0.15} opacity={0.1} scale={20} position={[0, -0.89, 0]}>
          <RandomizedLight amount={4} radius={3} ambient={0.3} intensity={0.5} position={[0, 2, 0]} bias={0.001} />
        </AccumulativeShadows>

        <Model scale={1} position={[0, 0, 0]} splashOpacities={splashOpacities} />
        <Toilet scale={1} position={[10.5, 4, 0.5]} splashOpacities={splashOpacities} />

        <CameraLogger />

        {isBathroomLightOn && (
          <>
            <pointLight intensity={2} position={[11, 6, 1]} color='#ff0000ff' distance={15} decay={1} />
            <pointLight intensity={1.5} position={[9, 5, 1]} color='#ff0000ff' distance={12} decay={1} />
            <spotLight
              intensity={2}
              position={[11, 7, 2]}
              target-position={[11, 4, 0]}
              angle={0.4}
              penumbra={0.3}
              color='#ff0000ff'
              distance={20}
              decay={1}
            />
          </>
        )}

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
            {currentMission === 'splash01' && <GlassRagTool visible={true} />}
            {currentMission === 'splash02' && <ToiletBrushTool visible={true} />}
            {currentMission === 'splash03' && <BathroomScrubTool visible={true} />}
            {currentMission === 'splash04' && <KitchenSpongeTool visible={true} />}
          </>
        )}

        {!showIntro && (
          <FishSmellEffect position={[-2.7, 0.7, 6.5]} opacity={cleaningProgress.splash04 / 100} enabled={true} />
        )}

        {!showIntro && gamePhase === 'selection' && (
          <>
            <SpeechBubble
              position={missions.splash01.position}
              pointColor='#2985ee'
              html='유리창의 얼룩 제거하기'
              onBubbleClick={() => {
                moveToTarget(missions.splash01.position, missions.splash01.cameraPosition, 'splash01')
                playGeneralButton()
              }}
            />

            <SpeechBubble
              position={missions.splash02.position}
              pointColor='#25e5c2'
              html='변기 청소하기'
              onBubbleClick={() => {
                moveToTarget(missions.splash02.position, missions.splash02.cameraPosition, 'splash02')
                playGeneralButton()
              }}
            />

            <SpeechBubble
              position={missions.splash03.position}
              pointColor='#129d3a'
              html='욕실 청소하기'
              bubbleOffset={[0.0, 0.4, 0.9]}
              onBubbleClick={() => {
                moveToTarget(missions.splash03.position, missions.splash03.cameraPosition, 'splash03')
                playGeneralButton()
              }}
            />

            <SpeechBubble
              position={missions.splash04.position}
              pointColor='#ff6b6b'
              html='생선 비린내를 제거하기'
              bubbleOffset={[0.4, 0.6, -0.2]}
              onBubbleClick={() => {
                moveToTarget(missions.splash04.position, missions.splash04.cameraPosition, 'splash04')
                playGeneralButton()
              }}
            />
          </>
        )}

        <OrbitControls
          ref={controlsRef}
          maxPolarAngle={Math.PI / 3}
          minPolarAngle={0}
          minAzimuthAngle={Math.PI / 2}
          maxAzimuthAngle={-Math.PI / 2}
          enablePan={false}
          enableZoom={!showIntro && gamePhase === 'selection'}
          enableRotate={!showIntro && gamePhase === 'selection'}
          minDistance={0}
          maxDistance={20}
        />
      </Scene>

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='산성 용액과 염기성 용액을 이용하는 예 알아보기'
          description={['집 안에서 이용하고 있는 산성 용액과 염기성 용액이 어떻게 이용되는지 알아봅시다.']}
          backgroundSvg='/img/cover/6-1-1.svg'
          descriptionSound='/sounds/6-1-1/narration/6-1-1-Goal.MP3'
        />
      )}
    </div>
  )
}
