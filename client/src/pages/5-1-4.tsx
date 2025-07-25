import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, useProgress, PerformanceMonitor, useGLTF, ContactShadows } from '@react-three/drei'
import AnimatedModel from '../components/AnimatedModel'
import AnimatedModel2 from '../components/AnimatedModel2'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import * as THREE from 'three'
import { AnimatePresence, motion } from 'framer-motion'

type ModelType = 'boy' | 'muscle' | 'bone'
type AnimationState = 'walk' | 'pose'
type PageMode = 'bones' | 'arm' | null

const preloadModelUrls = [
  '/models/Anatomy/Boy_Walking.gltf',
  '/models/Anatomy/Boy_Pose.gltf',
  '/models/Anatomy/Muscle_Walking.gltf',
  '/models/Anatomy/Muscle_Pose.gltf',
  '/models/Anatomy/Bone_Pose.gltf',
  '/models/Anatomy/Bone_Walking.gltf',
]

const allPreloadUrls = [...preloadModelUrls, ...preloadModelUrls.map((url) => `${url}#bone`)]

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

function IntroModels({ mousePosition }: { mousePosition: { x: number; y: number } }) {
  const rotationY = (mousePosition.x - 0.5) * 0.3 // -0.15 to 0.15 radians
  const rotationX = (mousePosition.y - 0.5) * 0.1 // -0.05 to 0.05 radians

  return (
    <group rotation={[rotationX, rotationY, 0]}>
      <group rotation={[0, Math.PI / 4, 0]}>
        <AnimatedModel
          url='/models/Anatomy/Boy_Pose.gltf'
          animIndex={0}
          scale={0.4}
          position={[-0.3, -0.3, 0.1]}
          loop={true}
          removeMuscleLayer={false}
        />
      </group>

      <group rotation={[0, -Math.PI / 4, 0]}>
        <AnimatedModel
          url='/models/Anatomy/Muscle_Pose.gltf'
          animIndex={0}
          scale={0.004}
          position={[0.2, -0.3, 0]}
          loop={true}
          removeMuscleLayer={false}
        />
      </group>

      <group rotation={[0, 0, 0]}>
        <AnimatedModel
          url='/models/Anatomy/Bone_Pose.gltf'
          animIndex={0}
          scale={0.0043}
          position={[0, -0.3, 0.1]}
          loop={true}
          removeMuscleLayer={false}
        />
      </group>
    </group>
  )
}

export default function IntegratedPage() {
  // 상태 관리
  const [mode, setMode] = useState<PageMode>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [targetMousePosition, setTargetMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [smoothMousePosition, setSmoothMousePosition] = useState({ x: 0.5, y: 0.5 })

  // 뼈와 근육 관찰 관련 상태
  const [modelType, setModelType] = useState<ModelType>('boy')
  const [animState, setAnimState] = useState<AnimationState>('pose')
  const [isModelsLoading, setIsModelsLoading] = useState(true)

  // 팔 움직임 관련 상태
  const [action, setAction] = useState<'extend' | 'fold'>('fold')
  const [perfSucks, degrade] = useState(false)
  const [hasExtended, setHasExtended] = useState(false)

  // 나레이션 관련 상태
  const [currentNarration, setCurrentNarration] = useState<HTMLAudioElement | null>(null)
  const [showNarrationText, setShowNarrationText] = useState(false)
  const [narrationText, setNarrationText] = useState<string[] | string>([])

  // 인트로 모델 로딩 상태
  const [introModelsLoaded, setIntroModelsLoaded] = useState(false)

  // 부드러운 마우스 위치 보간
  useEffect(() => {
    let animationFrame: number

    const animate = () => {
      setSmoothMousePosition(prev => {
        const dx = targetMousePosition.x - prev.x
        const dy = targetMousePosition.y - prev.y
        const lerp = 0.05 // 보간 속도 (0.01 = 매우 느림, 0.1 = 빠름)
        
        const newX = prev.x + dx * lerp
        const newY = prev.y + dy * lerp
        
        // 차이가 매우 작으면 목표 위치로 설정
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
          return targetMousePosition
        }
        
        return { x: newX, y: newY }
      })
      
      animationFrame = requestAnimationFrame(animate)
    }

    if (showIntro) {
      animationFrame = requestAnimationFrame(animate)
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame)
        }
      }
    }
  }, [targetMousePosition, showIntro])

  // 마우스 움직임 감지
  useEffect(() => {
    let mouseLeaveTimeout: NodeJS.Timeout | null = null

    const handleMouseMove = (event: MouseEvent) => {
      if (showIntro) {
        const x = event.clientX / window.innerWidth
        const y = event.clientY / window.innerHeight
        setTargetMousePosition({ x, y })
        
        const margin = 0.1
        const isOutOfBounds = x < margin || x > (1 - margin) || y < margin || y > (1 - margin)
        
        if (isOutOfBounds) {
          if (!mouseLeaveTimeout) {
            mouseLeaveTimeout = setTimeout(() => {
              setTargetMousePosition({ x: 0.5, y: 0.5 })
              mouseLeaveTimeout = null
            }, 400)
          }
        } else {
          if (mouseLeaveTimeout) {
            clearTimeout(mouseLeaveTimeout)
            mouseLeaveTimeout = null
          }
        }
      }
    }

    const handleMouseLeave = () => {
      if (showIntro) {
        // 완전히 화면을 벗어나면 즉시 중앙으로 돌아가기
        if (mouseLeaveTimeout) {
          clearTimeout(mouseLeaveTimeout)
        }
        mouseLeaveTimeout = setTimeout(() => {
          setTargetMousePosition({ x: 0.5, y: 0.5 })
          mouseLeaveTimeout = null
        }, 300)
      }
    }

    if (showIntro) {
      window.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseleave', handleMouseLeave)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseleave', handleMouseLeave)
        if (mouseLeaveTimeout) {
          clearTimeout(mouseLeaveTimeout)
        }
      }
    }
  }, [showIntro])

  // 인트로용 모델들 사전 로딩
  useEffect(() => {
    const loadIntroModels = async () => {
      try {
        const introUrls = [
          '/models/Anatomy/Boy_Pose.gltf',
          '/models/Anatomy/Muscle_Pose.gltf',
          '/models/Anatomy/Bone_Pose.gltf',
        ]

        const loadPromises = introUrls.map(async (url) => {
          return new Promise<void>((resolve) => {
            useGLTF.preload(url)
            setTimeout(resolve, 100)
          })
        })

        await Promise.all(loadPromises)
        setIntroModelsLoaded(true)
      } catch (error) {
        console.error('Intro models preloading failed:', error)
        setIntroModelsLoaded(true)
      }
    }

    loadIntroModels()
  }, [])

  // 효과음 재생 함수
  const playClickSound = useCallback((audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }, [])

  // 로딩 완료 핸들러
  const handleLoadingComplete = useCallback(() => {
    setIsLoaded(true)
  }, [])

  // 시작하기 버튼 클릭 핸들러
  const handleEnterExperience = useCallback(() => {
    playClickSound()
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }, [playClickSound])

  // 모드 선택 핸들러
  const handleModeSelect = useCallback(
    (selectedMode: PageMode) => {
      playClickSound()
      setMode(selectedMode)

      if (selectedMode === 'bones') {
        loadModels()
      }

      if (selectedMode === 'arm') {
        setAction('fold')
        setHasExtended(false)
      }
    },
    [playClickSound],
  )

  // 뒤로가기 핸들러
  const handleBackToModeSelection = useCallback(() => {
    playClickSound()

    // 기존 나레이션 정지
    if (currentNarration) {
      currentNarration.pause()
      currentNarration.currentTime = 0
      setCurrentNarration(null)
    }
    setShowNarrationText(false)
    setNarrationText([])

    setTimeout(() => {
      setMode(null)
    }, 100)
  }, [playClickSound, currentNarration])

  // 모델 사전 로딩
  const loadModels = async () => {
    setIsModelsLoading(true)

    try {
      const loadPromises = allPreloadUrls.map(async (url) => {
        return new Promise<void>((resolve) => {
          useGLTF.preload(url)
          setTimeout(resolve, 50)
        })
      })

      await Promise.all(loadPromises)

      setTimeout(() => {
        setIsModelsLoading(false)
      }, 500)
    } catch (error) {
      console.error('Model preloading failed:', error)
      setIsModelsLoading(false)
    }
  }

  // 나레이션 재생 함수
  const playNarration = (audioPath: string, text: string[] | string) => {
    if (currentNarration) {
      currentNarration.pause()
      currentNarration.currentTime = 0
    }

    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7

      setNarrationText(text)
      setShowNarrationText(true)

      audio.play().catch((error) => {
        console.log('나레이션 재생 실패:', error.name)
      })

      setCurrentNarration(audio)

      audio.addEventListener('ended', () => {
        setShowNarrationText(false)
        setNarrationText([])
        setCurrentNarration(null)
      })
    } catch (error) {
      console.log('나레이션 생성 실패:', error)
    }
  }

  // 뼈와 근육 관련 핸들러들
  const handleAnimationChange = (newAnimState: AnimationState) => {
    if (isModelsLoading) return

    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    setAnimState(newAnimState)

    if (newAnimState === 'walk') {
      let audioPath = ''
      let text: string[] = []

      switch (modelType) {
        case 'boy':
          audioPath = '/sounds/5-1-4/5-1-4-A.MP3'
          text = ['우리 몸은 뼈와 근육의 작용으로 움직입니다.']
          break
        case 'bone':
          audioPath = '/sounds/5-1-4/5-1-4-B.MP3'
          text = [
            '우리 몸속의 뼈는 모양과 크기가 다양합니다.',
            '뼈는 우리 몸의 형태를 만들고 몸을 지탱하며, 몸속에 있는 여러 기관을 보호합니다.',
          ]
          break
        case 'muscle':
          audioPath = '/sounds/5-1-4/5-1-4-C.MP3'
          text = ['우리 몸속의 근육은 모양과 크기가 다양합니다.', '근육은 뼈에 연결되어 있으며 뼈를 움직이게 합니다.']
          break
      }

      if (audioPath) {
        playNarration(audioPath, text)
      }
    } else {
      if (currentNarration) {
        currentNarration.pause()
        currentNarration.currentTime = 0
        setCurrentNarration(null)
      }
      setShowNarrationText(false)
      setNarrationText([])
    }
  }

  const handleModelTypeChange = (type: ModelType) => {
    if (isModelsLoading) return

    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    setModelType(type)

    if (currentNarration) {
      currentNarration.pause()
      currentNarration.currentTime = 0
      setCurrentNarration(null)
    }
    setShowNarrationText(false)
    setNarrationText([])

    if (animState === 'walk') {
      let audioPath = ''
      let text: string[] = []

      switch (type) {
        case 'boy':
          audioPath = '/sounds/5-1-4/5-1-4-A.MP3'
          text = ['우리 몸은 뼈와 근육의 작용으로 움직입니다.']
          break
        case 'bone':
          audioPath = '/sounds/5-1-4/5-1-4-B.MP3'
          text = [
            '우리 몸속의 뼈는 모양과 크기가 다양합니다.',
            '뼈는 우리 몸의 형태를 만들고 몸을 지탱하며, 몸속에 있는 여러 기관을 보호합니다.',
          ]
          break
        case 'muscle':
          audioPath = '/sounds/5-1-4/5-1-4-C.MP3'
          text = ['우리 몸속의 근육은 모양과 크기가 다양합니다.', '근육은 뼈에 연결되어 있으며 뼈를 움직이게 합니다.']
          break
      }

      if (audioPath) {
        playNarration(audioPath, text)
      }
    }
  }

  // 팔 움직임 관련 핸들러들
  const handleExtend = () => {
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    setAction('extend')
    setHasExtended(true)

    playNarration(
      '/sounds/5-1-4/5-1-4-E.MP3',
      '팔을 구부릴 때 팔 바깥쪽 근육이 늘어나고 팔 안쪽 근육이 줄어듭니다. 근육이 서로 반대로 작용하여 팔이 움직입니다.',
    )
  }

  const handleFold = () => {
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    setAction('fold')
    setHasExtended(false)

    playNarration(
      '/sounds/5-1-4/5-1-4-D.MP3',
      '팔을 펼 때 팔 바깥쪽 근육이 줄어들고 팔 안쪽 근육이 늘어납니다. 이렇게 근육이 협력하여 팔의 움직임을 만들어냅니다.',
    )
  }

  const getModelKey = () => {
    let base = modelType.charAt(0).toUpperCase() + modelType.slice(1)
    const anim = animState === 'walk' ? 'Walking' : 'Pose'
    return `${base}_${anim}`
  }

  const getModelUrl = () => `/models/Anatomy/${getModelKey()}.gltf`

  const getModelScale = () => {
    switch (modelType) {
      case 'boy':
        return 0.55
      case 'muscle':
        return 0.0055
      case 'bone':
        return 0.0055
      default:
        return 0.1
    }
  }

  const getModelPosition = (): [number, number, number] => [0, -0.208, 0]

  const modelKey = getModelKey()
  const modelUrl = getModelUrl()
  const lightIntensity = modelType === 'boy' ? 1.0 : 3.0

  const animIndexMap: Record<string, number> = {
    Boy_Walking: 0,
    Boy_Pose: 0,
    Muscle_Walking: 1,
    Muscle_Pose: 0,
    Bone_Walking: 1,
    Bone_Pose: 0,
  }

  const animIndex = animIndexMap[modelKey] ?? 0

  const getCurrentComponents = useMemo(() => {
    if (showIntro && introModelsLoaded) {
      return <IntroModels mousePosition={smoothMousePosition} />
    }

    if (mode === 'bones' && !isModelsLoading) {
      return (
        <AnimatedModel
          key={`${modelUrl}-${modelType}-${animState}`}
          url={modelUrl}
          animIndex={animIndex}
          scale={getModelScale()}
          position={getModelPosition()}
          loop={true}
          removeMuscleLayer={modelType === 'bone'}
        />
      )
    }

    if (mode === 'arm') {
      return (
        <AnimatedModel2
          url='/models/Anatomy/Arm/Flexing.glb'
          actionName={action}
          scale={1.5}
          position={[0, -0.375, 0]}
        />
      )
    }

    return null
  }, [mode, showIntro, introModelsLoaded, modelUrl, modelType, animState, animIndex, action, isModelsLoading, smoothMousePosition])

  const modeButtons = useMemo(
    () => [
      {
        mode: 'bones' as const,
        label: '뼈와 근육의 생김새 관찰',
        color: '#4CAF50',
        hoverColor: '#66BB6A',
      },
      {
        mode: 'arm' as const,
        label: '팔이 움직이는 원리 알아보기',
        color: '#2196F3',
        hoverColor: '#42A5F5',
      },
    ],
    [],
  )

  return (
    <div className='w-screen h-screen bg-white flex font-bold flex-col'>
      {/* 모드 선택 버튼들 */}
      <AnimatePresence>
        {!showIntro && mode === null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='fixed top-0 left-0 z-10 w-full h-full p-4 flex gap-4 justify-center items-center bg-gray-100 border-b shadow-sm'>
            {modeButtons.map(({ mode: buttonMode, label, color, hoverColor }) => (
              <button
                key={buttonMode}
                className='px-6 pt-5 pb-6 rounded-[30px] font-bold shadow-[inset_0px_-10px_10px_0px_rgba(50,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:shadow-[inset_0px_-10px_10px_0px_rgba(50,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(50,0,0,0.50)] transition-all duration-300'
                style={
                  {
                    backgroundColor: color,
                    '--hover-bg': hoverColor,
                  } as React.CSSProperties & { '--hover-bg': string }
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hoverColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = color
                }}
                onClick={() => {
                  handleModeSelect(buttonMode)
                }}
                aria-label={`${label} 모드 선택`}>
                <div className='text-center justify-center text-white text-xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                  {label}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 뒤로가기 버튼 */}
      <AnimatePresence>
        {mode !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute top-4 left-4 z-10 w-fit h-fit'>
            <button
              onClick={handleBackToModeSelection}
              className='px-6 pt-3 pb-4 bg-[#FF8026] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#ff9b54] hover:shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(152,0,0,0.50)] transition-all duration-300'
              aria-label='모드 선택 화면으로 돌아가기'>
              <div className='text-center justify-center text-white text-xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                뒤로가기
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 뼈와 근육 컨트롤 버튼들 */}
      <AnimatePresence>
        {mode === 'bones' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '15px',
              borderRadius: '15px',
              zIndex: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}>
            {/* 애니메이션 버튼 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {['pose', 'walk'].map((state) => (
                <button
                  key={state}
                  onClick={() => handleAnimationChange(state as AnimationState)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: animState === state ? '#4CAF50' : '#f1f1f1',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isModelsLoading ? 'not-allowed' : 'pointer',
                    opacity: isModelsLoading ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                  disabled={isModelsLoading}>
                  {state === 'walk' ? '걷기' : '정지'}
                </button>
              ))}
            </div>

            {/* 모델 타입 버튼 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {(['boy', 'bone', 'muscle'] as ModelType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleModelTypeChange(type)}
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: modelType === type ? '#2196F3' : '#f1f1f1',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: isModelsLoading ? 'not-allowed' : 'pointer',
                    opacity: isModelsLoading ? 0.5 : 1,
                    fontSize: '12px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                  }}
                  disabled={isModelsLoading}>
                  {type === 'boy' ? '겉모습' : type === 'muscle' ? '근육' : '뼈'}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 팔 움직임 컨트롤 버튼 */}
      <AnimatePresence>
        {mode === 'arm' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute top-4 right-4 z-10 flex flex-col gap-2'>
            <button
              onClick={handleFold}
              className='px-6 pt-3 pb-4 bg-[#4CAF50] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(0,152,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#66BB6A] hover:shadow-[inset_0px_-10px_10px_0px_rgba(0,152,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(0,152,0,0.50)] transition-all duration-300'>
              <div className='text-center justify-center text-white text-lg font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                팔을 펼 때
              </div>
            </button>
            <button
              onClick={handleExtend}
              className='px-6 pt-3 pb-4 bg-[#2196F3] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(0,50,152,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#42A5F5] hover:shadow-[inset_0px_-10px_10px_0px_rgba(0,50,152,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(0,50,152,0.50)] transition-all duration-300'>
              <div className='text-center justify-center text-white text-lg font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                팔을 구부릴 때
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D 씬 */}
      <div className='flex-1 relative overflow-hidden'>
        <Scene
          shadows
          camera={
            mode === 'bones'
              ? { position: [0, 0.9, 0.9], fov: 50 }
              : mode === 'arm'
              ? { position: [-0.1, 0.1, 0.4], fov: 50 }
              : { position: [-0.15, -0.1, 0.55], fov: 50 }
          }
          style={{ width: '100vw', height: '100vh' }}
          gl={{
            shadowMap: { enabled: true, type: THREE.PCFSoftShadowMap },
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.8,
            preserveDrawingBuffer: mode === 'arm',
          }}>
          <LoadingTracker onLoadingComplete={handleLoadingComplete} />

          {showIntro && <fog attach='fog' args={['#f0f0f0', 0, 10]} />}
          {showIntro && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} scale={2.0} receiveShadow>
              <planeGeometry args={[10, 10]} />
              <shadowMaterial opacity={0.3} />
            </mesh>
          )}
          {mode === 'bones' && <fog attach='fog' args={['#f0f0f0', 0.3, 0.9]} />}

          <ambientLight intensity={mode === 'arm' ? 1.0 * Math.PI : 2.0} />

          {mode === 'bones' && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
              <planeGeometry args={[5, 5]} />
              <shadowMaterial opacity={0.4} />
            </mesh>
          )}

          <directionalLight
            position={mode === 'arm' ? [0, 5, 3] : [0, 5, 3]}
            intensity={mode === 'bones' ? lightIntensity : 3.5}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={0.1}
            shadow-camera-far={10}
            shadow-camera-left={showIntro ? -5 : mode === 'bones' ? -1 : -3}
            shadow-camera-right={showIntro ? 5 : mode === 'bones' ? 1 : 3}
            shadow-camera-top={showIntro ? 5 : mode === 'bones' ? 1 : 3}
            shadow-camera-bottom={showIntro ? -5 : mode === 'bones' ? -1 : -3}
          />

          {mode === 'arm' && <PerformanceMonitor onDecline={() => degrade(true)} />}

          <AnimatePresence mode='wait'>
            {getCurrentComponents && <group key={showIntro ? 'intro' : mode}>{getCurrentComponents}</group>}
          </AnimatePresence>

          <OrbitControls
            enabled={!showIntro}
            enableRotate={true}
            autoRotate={showIntro}
            autoRotateSpeed={showIntro ? 0.5 : 0}
            minDistance={mode === 'bones' ? 0 : mode === 'arm' ? 0.1 : 0.5}
            maxDistance={mode === 'bones' ? 0.8 : mode === 'arm' ? 0.7 : 2.0}
            maxPolarAngle={mode === 'bones' ? Math.PI / 2 : mode === 'arm' ? Math.PI / 2 : Math.PI}
            minAzimuthAngle={mode === 'arm' ? -Math.PI / 4 : undefined}
            maxAzimuthAngle={mode === 'arm' ? Math.PI / 4 : undefined}
            minPolarAngle={mode === 'arm' ? Math.PI / 3 + Math.PI / 10 : 0}
          />

          <Environment
            preset='warehouse'
            files={
              mode === 'arm' ? 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr' : undefined
            }
            backgroundIntensity={0.09}
            backgroundBlurriness={0.5}
            environmentIntensity={0.2}
          />
        </Scene>
      </div>

      {/* Intro 컴포넌트 */}
      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='뼈와 근육을 관찰하고, 우리 몸이 움직이는 원리 알아보기'
          description={['우리 몸의 뼈와 근육의 생김새와 기능을 관찰하고, 우리 몸이 움직이는 원리를 알아봅시다.']}
          backgroundSvg='/img/cover/5-1-4.svg'
          descriptionSound='/sounds/5-1-4/5-1-4-Goal.MP3'
        />
      )}

      {/* 나레이션 텍스트 */}
      <AnimatePresence>
        {showNarrationText && mode === 'bones' && animState === 'walk' && Array.isArray(narrationText) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className='fixed bottom-8 left-8 z-50 max-w-lg'>
            <div className='bg-white border border-black p-4 rounded-lg shadow-lg'>
              <ol className='text-black text-lg leading-relaxed'>
                {narrationText.map((line, index) => (
                  <li key={index} className='mb-1'>
                    {line}
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 팔 움직임 나레이션 텍스트 */}
      <AnimatePresence>
        {showNarrationText && mode === 'arm' && typeof narrationText === 'string' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className='fixed bottom-8 left-8 z-50 max-w-lg'>
            <div className='bg-white border border-black p-4 rounded-lg shadow-lg'>
              <div className='text-black text-lg leading-relaxed'>{narrationText}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}