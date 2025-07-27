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
import CameraLogger from '@/hook/CameraLogger'
import IntroMouseCameraController from '@/components/IntroMouseCameraController'
import { FishSmellEffect } from '@/components/6-1-1/FishSmellParticles'
import { Toilet } from '@/components/6-1-1/Toilet'

import { CleaningToolType, SplashType, GamePhase, missions, wipingEfficiency, initialCamera } from '../types/6-1-1'

import { BackButton, WipingProgressUI, SolutionSelector, GameMessages } from '@/components/6-1-1/UI'
import { BathroomLight } from '@/components/6-1-1/BathroomLight'
import { BubbleParticles } from '@/components/6-1-1/BubbleParticles'

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

function CleaningProgressUI({
  cleaningProgress,
  completedMissions,
  showIntro,
  isZoomed,
  onReset,
  onButtonClick,
}: {
  cleaningProgress: {
    splash01: number
    splash02: number
    splash03: number
    splash04: number
  }
  completedMissions: {
    splash01: boolean
    splash02: boolean
    splash03: boolean
    splash04: boolean
  }
  showIntro: boolean
  isZoomed: boolean
  onReset: (missionId: 'splash01' | 'splash02' | 'splash03' | 'splash04') => void
  onButtonClick: () => void
}) {
  if (showIntro || isZoomed) return null

  const missions = [
    { id: 'splash01' as const, name: '유리창', color: '#2985ee' },
    { id: 'splash02' as const, name: '변기', color: '#25e5c2' },
    { id: 'splash03' as const, name: '욕실', color: '#129d3a' },
    { id: 'splash04' as const, name: '도마', color: '#ff6b6b' },
  ]

  const handleReset = (missionId: 'splash01' | 'splash02' | 'splash03' | 'splash04') => {
    onButtonClick()
    onReset(missionId)
  }

  return (
    <div className='absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200 min-w-[200px] z-10'>
      <h3 className='text-lg font-bold mb-3 text-gray-800'>청소 진행도</h3>
      <div className='space-y-3 font-light'>
        {missions.map((mission) => {
          const progress = cleaningProgress[mission.id]
          const isCompleted = completedMissions[mission.id]

          return (
            <div key={mission.id} className='space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-700'>{mission.name}</span>
                <span className='text-xs text-gray-500'>{isCompleted ? '완료' : `${Math.round(progress)}%`}</span>
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
                  onClick={() => handleReset(mission.id)}
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
  const wipingAudioRef = useRef<HTMLAudioElement | null>(null)

  const [cleaningProgress, setCleaningProgress] = useState({
    splash01: 100,
    splash02: 100,
    splash03: 100,
    splash04: 100,
  })

  const [completedMissions, setCompletedMissions] = useState({
    splash01: false,
    splash02: false,
    splash03: false,
    splash04: false,
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

    setCompletedMissions((prev) => ({
      ...prev,
      [currentMission]: true,
    }))

    if (currentMission === 'splash01') {
      playNarration('/sounds/6-1-1/narration/6-1-1-D.MP3')
      setShowMessage('단백질 등으로 이루어진 얼룩은 염기성 물질인 유리 세정제와 만나면 성질이 변하여 제거됩니다.')
    } else if (currentMission === 'splash02') {
      playNarration('/sounds/6-1-1/narration/6-1-1-F.MP3')
      setShowMessage('산성 용액인 변기용 세제로 변기를 청소하면 변기의 때가 성질이 변하여 제거됩니다.')
    } else if (currentMission === 'splash03') {
      playNarration('/sounds/6-1-1/narration/6-1-1-H.MP3')
      setShowMessage('염기성 용액인 표백제로 욕실 바닥을 청소하면 욕실 바닥의 때가 성질이 변하여 제거됩니다.')
    } else if (currentMission === 'splash04') {
      playNarration('/sounds/6-1-1/narration/6-1-1-B.MP3')
      setShowMessage('염기성 물질인 비린내는 산성 용액인 식초와 만나면 성질이 변하여 제거됩니다.')
    }

    playClickSound('/sounds/complete_cleaning.mp3')
    setGamePhase('completed')
  }

  const playWipingSound = (missionId: SplashType) => {
    let audioPath = ''

    switch (missionId) {
      case 'splash01':
        audioPath = '/sounds/6-1-1/6-1-1-4_Glass.MP3'
        break
      case 'splash02':
        audioPath = '/sounds/6-1-1/6-1-1-5_toilet.MP3'
        break
      case 'splash03':
        audioPath = '/sounds/6-1-1/6-1-1-8_Scrubbing.MP3'
        break
      case 'splash04':
        audioPath = '/sounds/6-1-1/6-1-1-9_varrendo-101422.mp3'
        break
    }

    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.6
      audio.loop = true
      audio.play().catch((error) => {
        console.log('wiping 효과음 재생 실패:', error.name)
      })
      return audio
    } catch (error) {
      console.log('wiping 효과음 생성 실패:', error)
      return null
    }
  }

  const playSpraySound = (missionId: SplashType) => {
    let audioPath = ''

    switch (missionId) {
      case 'splash01':
      case 'splash04':
        audioPath = '/sounds/6-1-1/6-1-1-2_spray.MP3'
        break
      case 'splash02':
      case 'splash03':
        audioPath = '/sounds/6-1-1/6-1-1-7_slime-splatter-4-220263.mp3'
        break
    }

    if (audioPath) {
      try {
        const audio = new Audio(audioPath)
        audio.volume = 0.5
        audio.play().catch((error) => {
          console.log('spray 효과음 재생 실패:', error.name)
        })
      } catch (error) {
        console.log('spray 효과음 생성 실패:', error)
      }
    }
  }

  const playCompletionSound = (missionId: SplashType) => {
    let audioPath = ''

    switch (missionId) {
      case 'splash01':
        audioPath = '/sounds/6-1-1/6-1-1-3_correct-356013.mp3'
        break
      case 'splash02':
        audioPath = '/sounds/6-1-1/6-1-1-3_correct-356013.mp3'
        break
      case 'splash03':
        audioPath = '/sounds/6-1-1/6-1-1-3_correct-356013.mp3'
        break
      case 'splash04':
        audioPath = '/sounds/6-1-1/6-1-1-3_correct-356013.mp3'
        break
    }

    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
      audio.play().catch((error) => {
        console.log('완료 효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('완료 효과음 생성 실패:', error)
    }
  }

  const playAllCompletionSound = () => {
    try {
      const audio = new Audio('/sounds/6-1-1/6-1-1-6_goodresult-82807.mp3')
      audio.volume = 0.2
      audio.play().catch((error) => {
        console.log('전체 완료 효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('전체 완료 효과음 생성 실패:', error)
    }
  }

  const resetMission = (missionId: SplashType) => {
    setCleaningProgress((prev) => ({
      ...prev,
      [missionId]: 100,
    }))
    setWipingProgress((prev) => ({
      ...prev,
      [missionId]: 0,
    }))
    setCompletedMissions((prev) => ({
      ...prev,
      [missionId]: false,
    }))
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

    playSpraySound(currentMission)

    const newSprayCount = sprayCount + 1
    setSprayCount(newSprayCount)

    if (newSprayCount >= 3) {
      setGamePhase('wiping')

      const wipingAudio = playWipingSound(currentMission)
      wipingAudioRef.current = wipingAudio
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

      if (wipingAudioRef.current) {
        wipingAudioRef.current.volume = Math.min(0.6, 0.3 + velocity / 50)
      }

      if (velocity < 8) {
        return
      }
    }

    const efficiency = calculateWipingEfficiency(mouseVelocity, currentMission)

    setWipingProgress((prev) => {
      const newProgress = Math.min(100, prev[currentMission] + efficiency)

      if (newProgress >= 100 && prev[currentMission] < 100) {
        if (wipingAudioRef.current) {
          wipingAudioRef.current.pause()
          wipingAudioRef.current = null
        }

        playCompletionSound(currentMission)

        setCompletedMissions((prevCompleted) => {
          const newCompleted = {
            ...prevCompleted,
            [currentMission]: true,
          }

          const allCompleted = Object.values(newCompleted).every((completed) => completed)
          if (allCompleted) {
            setTimeout(() => {
              playAllCompletionSound()
            }, 1000)
          }

          return newCompleted
        })

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

      <CleaningProgressUI
        cleaningProgress={cleaningProgress}
        completedMissions={completedMissions}
        showIntro={showIntro}
        isZoomed={isZoomed}
        onReset={resetMission}
        onButtonClick={playGeneralButton}
      />

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
          <Lightformer intensity={3} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <group rotation={[Math.PI / 2, 1, 0]}>
            <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
          </group>
          <Lightformer
            intensity={1.2}
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
        {isBathroomLightOn && (
          <>
            <pointLight intensity={7} position={[7.0, 2, -2]} color='#c0ce6f' distance={7} decay={1} />
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
          <>
            <FishSmellEffect position={[-2.7, 0.7, 6.5]} opacity={cleaningProgress.splash04 / 100} enabled={true} />
            {gamePhase === 'wiping' && currentMission === 'splash03' && (
              <BubbleParticles position={[9.22, -0.5, -2.33]} progress={cleaningProgress.splash03 / 100} />
            )}

            {gamePhase === 'wiping' && currentMission === 'splash02' && (
              <BubbleParticles position={[10.22, 0, 0.33]} progress={cleaningProgress.splash02 / 100} />
            )}
          </>
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
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 6}
          minAzimuthAngle={Math.PI / 2}
          maxAzimuthAngle={-Math.PI / 2}
          enablePan={false}
          enableZoom={!showIntro}
          enableRotate={!showIntro}
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
