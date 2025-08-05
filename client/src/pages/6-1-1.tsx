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
import { CleaningProgressUI, GameMessages, SolutionSelector } from '@/components/6-1-1/UI'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import IntroMouseCameraController from '@/components/IntroMouseCameraController'
import { CuttingBoardSmell } from '@/components/6-1-1/SmellPlane'
import { Toilet } from '@/components/6-1-1/Toilet'
import { CuttingBoard } from '@/components/6-1-1/CuttingBoardTool'
import { CleaningToolType, SplashType, GamePhase, missions, wipingEfficiency, initialCamera } from '../types/6-1-1'
import { AnimatePresence, motion } from 'framer-motion'
import ActivityGuideModal from '@/components/6-1-1/ActivityGuideModal'

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

function BackButton({
  isZoomed,
  showIntro,
  onBack,
  onRestart,
  isAnimating,
  gamePhase,
  currentMission,
}: {
  isZoomed: boolean
  showIntro: boolean
  onBack: () => void
  onRestart: () => void
  isAnimating: boolean
  gamePhase: GamePhase
  currentMission: SplashType | null
}) {
  if (!isZoomed || showIntro || gamePhase === 'wiping') return null

  return (
    <>
      <div className='absolute w-fit top-4 left-4 z-10 flex gap-4'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}>
          <button
            onClick={() => {
              onBack()
            }}
            disabled={isAnimating}
            className='px-6 pt-3 pb-4 bg-[#FF8026] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#ff9b54] hover:shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(152,0,0,0.50)] transition-all duration-300'
            aria-label='모드 선택 화면으로 돌아가기'>
            <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
              뒤로가기
            </div>
          </button>
        </motion.div>

        {currentMission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}>
            <button
              onClick={() => {
                onRestart()
              }}
              disabled={isAnimating}
              className='px-6 pt-3 pb-4 bg-[#52AE46] rounded-[20px] shadow-[inset_0px_-6px_8px_0px_rgba(65,87,51,0.50)] inline-flex justify-center items-center overflow-hidden hover:bg-[#6BC05D] inline-flex justify-center items-center gap-2.5 overflow-hidden active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(152,0,0,0.50)] transition-all duration-300'
              aria-label='모드 선택 화면으로 돌아가기'>
              <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                다시하기
              </div>
            </button>
          </motion.div>
        )}
      </div>
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
  const [showLiquidMessage, setShowLiquidMessage] = useState<string>('')
  const [showClickMessage, setClickMessage] = useState<string>('')
  const [showActivityGuide, setShowActivityGuide] = useState(false)

  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const wipingAudioRef = useRef<HTMLAudioElement | null>(null)

  const [sprayEffects, setSprayEffects] = useState<Record<SplashType, boolean>>({
    splash01: false,
    splash02: false,
    splash03: false,
    splash04: false,
  })

  const [cleaningProgress, setCleaningProgress] = useState<Record<SplashType, number>>({
    splash01: 0,
    splash02: 0,
    splash03: 0,
    splash04: 0,
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
    splash01: (100 - cleaningProgress.splash01) / 100,
    splash02: (100 - cleaningProgress.splash02) / 100,
    splash03: (100 - cleaningProgress.splash03) / 100,
    splash04: (100 - cleaningProgress.splash04) / 100,
  }

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
      currentAudioRef.current.currentTime = 0
    }

    try {
      const audio = new Audio(path)
      audio.volume = 0.7
      audio.loop = false
      audio.play().catch(() => {})
      currentAudioRef.current = audio
    } catch (error) {}
  }

  const liquidMessageNarrations = {
    splash01: '/sounds/6-1-1/narration/6-1-1-A-2.MP3',
    splash02: '/sounds/6-1-1/narration/6-1-1-C-2.MP3',
    splash03: '/sounds/6-1-1/narration/6-1-1-E-2.MP3',
    splash04: '/sounds/6-1-1/narration/6-1-1-G-2.MP3',
  }

  const clickMessageNarrations = {
    splash01: '/sounds/6-1-1/narration/6-1-1-A-3.MP3',
    splash02: '/sounds/6-1-1/narration/6-1-1-C-3.MP3',
    splash03: '/sounds/6-1-1/narration/6-1-1-E-3.MP3',
    splash04: '/sounds/6-1-1/narration/6-1-1-G-3.MP3',
  }

  const playLiquidMessageNarration = (splashType: SplashType) => {
    if (clickMessageNarrations[splashType]) {
      setTimeout(() => {
        playNarration(liquidMessageNarrations[splashType])
      }, 800)
    }
  }

  const playClickMessageNarration = (splashType: SplashType) => {
    if (clickMessageNarrations[splashType]) {
      setTimeout(() => {
        playNarration(clickMessageNarrations[splashType])
      }, 800)
    }
  }

  const stopAllAudio = () => {
    // 나레이션 오디오 정지
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }

    // 닦기 오디오 정지
    if (wipingAudioRef.current) {
      wipingAudioRef.current.pause()
      wipingAudioRef.current.currentTime = 0
      wipingAudioRef.current = null
    }

    // 모든 HTML5 오디오 요소 찾아서 정지
    const allAudioElements = document.querySelectorAll('audio')
    allAudioElements.forEach((audio) => {
      if (!audio.paused) {
        audio.pause()
        audio.currentTime = 0
      }
    })

    // Web Audio API 컨텍스트가 있다면 정지
    try {
      if (window.AudioContext || (window as any).webkitAudioContext) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        if (audioContext.state !== 'closed') {
          audioContext.suspend()
        }
      }
    } catch (error) {
      // Web Audio API 지원하지 않는 경우 무시
    }
  }

  const handleShowActivityGuide = () => {
    setShowActivityGuide(true)
  }

  const handleCloseActivityGuide = () => {
    setShowActivityGuide(false)
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
          setShowLiquidMessage(missions[missionId].showLiquidMessage)
          setClickMessage(missions[missionId].showClickMessage)

          const narrationFiles = {
            splash01: '/sounds/6-1-1/narration/6-1-1-A-1.MP3',
            splash02: '/sounds/6-1-1/narration/6-1-1-C-1.MP3',
            splash03: '/sounds/6-1-1/narration/6-1-1-E-1.MP3',
            splash04: '/sounds/6-1-1/narration/6-1-1-G-1.MP3',
          }

          playNarration(narrationFiles[missionId])
        }
      }

      animate()
    }
  }

  const resetCamera = () => {
    if (controlsRef.current && !isAnimating) {
      setIsAnimating(true)

      if (wipingAudioRef.current) {
        wipingAudioRef.current.pause()
        wipingAudioRef.current = null
      }

      if (currentMission) {
        // 완료된 미션이 아닐 때만 wipingProgress와 sprayEffects 리셋
        if (!completedMissions[currentMission]) {
          setWipingProgress((prev) => ({
            ...prev,
            [currentMission]: 0,
          }))

          setSprayEffects((prev) => ({
            ...prev,
            [currentMission]: false,
          }))
        }
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

  const handleSolutionSelect = (solutionId: CleaningToolType) => {
    if (!currentMission) return

    stopAllAudio()

    setSelectedSolution(solutionId)
    setShowMessage('')
    setWrongMessageShown(false)
    setWipingProgress((prev) => ({ ...prev, [currentMission]: 0 }))

    setSprayEffects((prev) => ({
      ...prev,
      [currentMission]: false,
    }))

    setGamePhase('spraying')
    setSprayCount(0)

    playLiquidMessageNarration(currentMission)

    setTimeout(() => {
      setSprayCount(0)
    }, 100)
  }

  const handleSpray = () => {
    if (gamePhase !== 'spraying' || !currentMission) return

    const sprayAudioFiles = {
      splash01: '/sounds/6-1-1/6-1-1-7_slime-splatter-4-220263.mp3',
      splash02: '/sounds/6-1-1/6-1-1-2_spray.MP3',
      splash03: '/sounds/6-1-1/6-1-1-7_slime-splatter-4-220263.mp3',
      splash04: '/sounds/6-1-1/6-1-1-7_slime-splatter-4-220263.mp3',
    }

    playSound(sprayAudioFiles[currentMission], 0.5)

    const newSprayCount = sprayCount + 1
    setSprayCount(newSprayCount)

    if (currentMission === 'splash01') {
      setSprayEffects((prev) => ({
        ...prev,
        [currentMission]: true,
      }))
    }

    if (currentMission === 'splash02') {
      setSprayEffects((prev) => ({
        ...prev,
        [currentMission]: true,
      }))
    }

    if (currentMission === 'splash03') {
      setSprayEffects((prev) => ({
        ...prev,
        [currentMission]: true,
      }))
    }

    if (currentMission === 'splash04') {
      setSprayEffects((prev) => ({
        ...prev,
        [currentMission]: true,
      }))
    }

    if (newSprayCount >= 2) {
      playClickMessageNarration(currentMission)

      setTimeout(() => {
        setGamePhase('wiping')

        const wipingAudioFiles = {
          splash01: '/sounds/6-1-1/6-1-1-9-1.MP3',
          splash02: '/sounds/6-1-1/6-1-1-4_Glass.MP3',
          splash03: '/sounds/6-1-1/6-1-1-8_Scrubbing.MP3',
          splash04: '/sounds/6-1-1/6-1-1-9-1.MP3',
        }

        try {
          const audio = new Audio(wipingAudioFiles[currentMission])
          audio.volume = 0.6
          audio.play().catch(() => {})
          wipingAudioRef.current = audio
        } catch (error) {}
      }, 1500)
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

      if (velocity < 8) return
    }

    const mission = missions[currentMission]

    if (selectedSolution === mission.correctSolution) {
      const efficiency = wipingEfficiency[currentMission]
      const baseProgress = efficiency.base
      const velocityBonus = Math.min(mouseVelocity * efficiency.bonus, efficiency.bonus * 3)
      const totalEfficiency = baseProgress + velocityBonus

      setWipingProgress((prev) => {
        const newProgress = Math.min(100, prev[currentMission] + totalEfficiency)

        if (newProgress >= 100 && prev[currentMission] < 100) {
          stopAllAudio()

          playSound('/sounds/6-1-1/6-1-1-3_correct-356013.mp3', 0.5)

          setSprayEffects((prevEffects) => ({
            ...prevEffects,
            [currentMission]: false,
          }))

          setCompletedMissions((prevCompleted) => {
            const newCompleted = { ...prevCompleted, [currentMission]: true }

            if (Object.values(newCompleted).every((completed) => completed)) {
              setTimeout(() => {
                playSound('/sounds/6-1-1/6-1-1-6_goodresult-82807.mp3', 0.2)
              }, 1000)
            }

            return newCompleted
          })

          const completionNarrations = {
            splash01: '/sounds/6-1-1/narration/6-1-1-B.MP3',
            splash02: '/sounds/6-1-1/narration/6-1-1-D.MP3',
            splash03: '/sounds/6-1-1/narration/6-1-1-F.MP3',
            splash04: '/sounds/6-1-1/narration/6-1-1-H.MP3',
          }

          const messages = {
            splash01: '염기성 물질인 비린내는 산성 용액인 식초와 만나면 성질이 변하여 제거됩니다.',
            splash02: '단백질 등으로 이루어진 얼룩은 염기성 물질인 유리 세정제와 만나면 성질이 변하여 제거됩니다.',
            splash03: '산성 용액인 변기용 세제로 변기를 청소하면 변기의 때가 성질이 변하여 제거됩니다.',
            splash04: '염기성 용액인 표백제로 욕실 바닥을 청소하면 욕실 바닥의 때가 성질이 변하여 제거됩니다.',
          }

          setShowMessage(messages[currentMission])
          setGamePhase('completed')

          setTimeout(() => {
            playNarration(completionNarrations[currentMission])
          }, 1000)
        }

        return { ...prev, [currentMission]: newProgress }
      })

      const increaseAmount = totalEfficiency * (1 + wipingProgress[currentMission] / 100)
      setCleaningProgress((prev) => ({
        ...prev,
        [currentMission]: Math.min(100, prev[currentMission] + increaseAmount),
      }))
    } else {
      if (!wrongMessageShown) {
        setWrongMessageShown(true)

        setTimeout(() => {
          setShowMessage('해당 용액을 다시 고르세요.')
          playNarration('/sounds/6-1-1/narration/6-1-1-I.MP3')

          setTimeout(() => {
            if (wipingAudioRef.current) {
              wipingAudioRef.current.pause()
              wipingAudioRef.current.currentTime = 0
              wipingAudioRef.current = null
            }

            setGamePhase('solution_choice')
            setSelectedSolution(null)
            setSprayCount(0)
            setShowMessage(missions[currentMission].selectMessage)
            setWrongMessageShown(false)
            setWipingProgress((prev) => ({ ...prev, [currentMission]: 0 }))

            setSprayEffects((prev) => ({
              ...prev,
              [currentMission]: false,
            }))
          }, 3000)
        }, 2000)
      }
    }
  }

  const restartCurrentMission = () => {
    if (!currentMission || isAnimating) return

    stopAllAudio()

    setCleaningProgress((prev) => ({ ...prev, [currentMission]: 0 })) // 100에서 0으로 변경
    setWipingProgress((prev) => ({ ...prev, [currentMission]: 0 }))
    setCompletedMissions((prev) => ({ ...prev, [currentMission]: false }))
    setSprayEffects((prev) => ({ ...prev, [currentMission]: false }))

    setSelectedSolution(null)
    setSprayCount(0)
    setMouseVelocity(0)
    setWrongMessageShown(false)
    setGamePhase('solution_choice')
    setShowMessage('')

    setTimeout(() => {
      const narrationFiles = {
        splash01: '/sounds/6-1-1/narration/6-1-1-A.MP3',
        splash02: '/sounds/6-1-1/narration/6-1-1-C.MP3',
        splash03: '/sounds/6-1-1/narration/6-1-1-E.MP3',
        splash04: '/sounds/6-1-1/narration/6-1-1-G.MP3',
      }

      setShowMessage(missions[currentMission].selectMessage)
      playNarration(narrationFiles[currentMission])
    }, 300)
  }

  const resetMission = (missionId: SplashType) => {
    setCleaningProgress((prev) => ({ ...prev, [missionId]: 0 }))
    setWipingProgress((prev) => ({ ...prev, [missionId]: 0 }))
    setCompletedMissions((prev) => ({ ...prev, [missionId]: false }))
    setSprayEffects((prev) => ({ ...prev, [missionId]: false }))
  }
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (gamePhase === 'wiping') {
        handleWiping(event)
      }
    }

    const handleClick = (event: MouseEvent) => {
      if (gamePhase === 'spraying' && selectedSolution && currentMission) {
        const target = event.target as HTMLElement
        if (!target.closest('button') && !target.closest('.absolute')) {
          handleSpray()
        }
      }
    }

    if (gamePhase === 'wiping') {
      window.addEventListener('mousemove', handleMouseMove)
    }

    if (gamePhase === 'spraying' && selectedSolution) {
      const timeoutId = setTimeout(() => {
        window.addEventListener('click', handleClick)
      }, 0)

      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('click', handleClick)
      }
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [gamePhase, sprayCount, currentMission, mouseVelocity, lastMousePosition, selectedSolution])

  return (
    <div className='w-screen h-screen bg-white flex flex-col'>
      {!showIntro && !currentMission && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className='absolute top-4 left-4 z-10 flex gap-4'>
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => {
              setShowIntro(true)
              stopAllAudio()
              setIsZoomed(false)
              setCurrentMission(null)
              setGamePhase('selection')
              setSelectedSolution(null)
              setSprayCount(0)
              setCleaningProgress({
                splash01: 0,
                splash02: 0,
                splash03: 0,
                splash04: 0,
              })
              setWipingProgress({
                splash01: 0,
                splash02: 0,
                splash03: 0,
                splash04: 0,
              })
              setCompletedMissions({
                splash01: false,
                splash02: false,
                splash03: false,
                splash04: false,
              })
              setSprayEffects({
                splash01: false,
                splash02: false,
                splash03: false,
                splash04: false,
              })
              setMouseVelocity(0)
              setLastMousePosition({ x: 0, y: 0 })
              setIsBathroomLightOn(false)
              setWrongMessageShown(false)
              setShowMessage('')
              setShowLiquidMessage('')
              setClickMessage('')
            }}
            className='px-6 pt-3 pb-4 bg-[#FF8026] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#ff9b54] hover:shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(152,0,0,0.50)] transition-all duration-300'
            aria-label='모드 선택 화면으로 돌아가기'>
            <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
              첫 화면으로
            </div>
          </button>
        </motion.div>
      )}

      <BackButton
        isZoomed={isZoomed}
        showIntro={showIntro}
        onBack={resetCamera}
        onRestart={restartCurrentMission}
        isAnimating={isAnimating}
        gamePhase={gamePhase}
        currentMission={currentMission}
      />

      <GameMessages
        showMessage={showMessage}
        showIntro={showIntro}
        gamePhase={gamePhase}
        material={showClickMessage}
        wipingProgress={currentMission ? wipingProgress[currentMission] : 0}
        showLiquidMessage={showLiquidMessage}
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

        <Model
          scale={1}
          position={[0, 1.04, 0]}
          splashOpacities={splashOpacities}
          sprayEffects={sprayEffects}
          wipingProgress={wipingProgress}
        />
        <group renderOrder={-1}>
          <Toilet
            scale={1}
            position={[10.5, 5, 0.5]}
            splashOpacities={splashOpacities}
            sprayEffects={sprayEffects}
            wipingProgress={wipingProgress}
          />
        </group>

        {isBathroomLightOn && (
          <pointLight intensity={7} position={[7.0, 2, -2]} color='#c0ce6f' distance={7} decay={1} />
        )}

        {gamePhase === 'spraying' && selectedSolution && (
          <>
            {selectedSolution === 'vinegar' && <VinegarTool visible={true} onSpray={handleSpray} />}
            {selectedSolution === 'spray' && <SprayTool visible={true} onSpray={handleSpray} />}
            {selectedSolution === 'toilet_cleaner' && <ToiletCleanerTool visible={true} onSpray={handleSpray} />}
            {selectedSolution === 'bleach' && <BleachTool visible={true} onSpray={handleSpray} />}
          </>
        )}

        {gamePhase === 'wiping' && currentMission && (
          <>
            {currentMission === 'splash02' && <GlassRagTool visible={true} />}
            {currentMission === 'splash03' && <ToiletBrushTool visible={true} />}
            {currentMission === 'splash04' && <BathroomScrubTool visible={true} />}
          </>
        )}

        {!showIntro && (
          <>
            <CuttingBoardSmell
              position={missions.splash01.position}
              opacity={1 - cleaningProgress.splash01 / 100}
              enabled={true}
            />
            <CuttingBoard
              position={missions.splash01.position}
              wipingProgress={wipingProgress.splash01}
              isInteractive={currentMission === 'splash01' && gamePhase === 'wiping'}
              sprayEffect={sprayEffects.splash01}
              isCompleted={completedMissions.splash01}
            />
          </>
        )}

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
          onActivityGuide={handleShowActivityGuide}
        />
      )}
      <ActivityGuideModal isOpen={showActivityGuide} onClose={handleCloseActivityGuide} />
    </div>
  )
}
