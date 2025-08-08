import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, useProgress, PerformanceMonitor, useGLTF, ContactShadows } from '@react-three/drei'
import AnimatedModel from '../components/AnimatedModel'
import AnimatedModel2 from '../components/AnimatedModel2'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import * as THREE from 'three'
import { AnimatePresence, motion } from 'framer-motion'
import MouseInteractiveGroup from '@/components/MouseInteractiveGroup'
import ActivityGuideModal from '@/components/5-1-4/ActivityGuideModal'
import { CrayonTextBox } from '@/components/CrayonTextBox'

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

function IntroModels() {
  return (
    <MouseInteractiveGroup
      enabled={true}
      sensitivity={{ x: 0.3, y: 0.1 }}
      edgeReturnDelay={400}
      leaveReturnDelay={300}
      lerpSpeed={0.05}
      edgeMargin={0.05}>
      <group rotation={[0, Math.PI / 4, 0]}>
        <AnimatedModel
          url='/models/Anatomy/Boy_Pose.gltf'
          animIndex={0}
          scale={0.42}
          position={[-0.32, -0.3, 0.1]}
          loop={true}
          removeMuscleLayer={false}
        />
      </group>

      <group rotation={[0, -Math.PI / 4, 0]}>
        <AnimatedModel
          url='/models/Anatomy/Muscle_Pose.gltf'
          animIndex={0}
          scale={0.004}
          position={[0.23, -0.27, 0.2]}
          loop={true}
          removeMuscleLayer={false}
        />
      </group>

      <group rotation={[0, 0, 0]}>
        <AnimatedModel
          url='/models/Anatomy/Bone_Pose.gltf'
          animIndex={0}
          scale={0.0052}
          position={[-0.05, -0.34, 0.2]}
          loop={true}
          removeMuscleLayer={false}
        />
      </group>

      <group rotation={[0, -Math.PI / 4, 0]}>
        <AnimatedModel url='models/Anatomy/Plane.glb' animIndex={0} scale={3} position={[0, -0.9, 0]} />
      </group>
    </MouseInteractiveGroup>
  )
}

export default function IntegratedPage() {
  // 상태 관리
  const [mode, setMode] = useState<PageMode>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showMode, setShowMode] = useState(true)

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
  const [narrationText, setNarrationText] = useState<string>('')

  // 인트로 모델 로딩 상태
  const [introModelsLoaded, setIntroModelsLoaded] = useState(false)
  const [isBackFromMode, setIsBackFromMode] = useState(false)
  const [showActivityGuide, setShowActivityGuide] = useState(false)

  // 카메라 컨트롤 ref 추가
  const orbitControlsRef = useRef<any>(null)

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

  // 시작하기 버튼 클릭 핸들러 (사용하지 않음)
  const handleEnterExperience = useCallback(() => {
    playClickSound()
    // 더 이상 사용하지 않음 - 모드 선택이 바로 인트로에서 이루어짐
  }, [playClickSound])

  const resetCamera = useCallback(() => {
    if (orbitControlsRef.current) {
      const initialPosition = new THREE.Vector3(-0.15, 0, 0.55)
      const initialTarget = new THREE.Vector3(0, 0.0, 0)

      orbitControlsRef.current.object.position.copy(initialPosition)
      orbitControlsRef.current.target.copy(initialTarget)
      orbitControlsRef.current.update()
    }
  }, [])

  // 모드 선택 핸들러 (인트로에서 바로 실험 환경으로)
  const handleModeSelect = useCallback(
    (selectedMode: PageMode) => {
      setMode(selectedMode)
      setShowIntro(false) // 인트로 종료

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

  // 뒤로가기 핸들러 (인트로 화면으로)
  const handleBackToModeSelection = useCallback(() => {
    playClickSound()

    // 기존 나레이션 정지
    if (currentNarration) {
      currentNarration.pause()
      currentNarration.currentTime = 0
      setCurrentNarration(null)
    }
    setShowNarrationText(false)
    setNarrationText('')

    // 카메라 초기화
    resetCamera()

    setTimeout(() => {
      setMode(null)
      setShowIntro(true)
      setIsBackFromMode(true)
    }, 100)
  }, [playClickSound, currentNarration, resetCamera])

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

  const playNarration = (audioPath: string, text: string) => {
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
        setNarrationText('')
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
      let text: string

      switch (modelType) {
        case 'boy':
          audioPath = '/sounds/5-1-4/5-1-4-A.MP3'
          text = '• 우리 몸은 뼈와 근육의 작용으로 움직입니다.'
          break
        case 'bone':
          audioPath = '/sounds/5-1-4/5-1-4-B.MP3'
          text =
            '• 우리 몸속의 뼈는 모양과 크기가 다양합니다. \n• 뼈는 우리 몸의 형태를 만들고 몸을 지탱하며, 몸속에 있는 여러 기관을 보호합니다.'
          break
        case 'muscle':
          audioPath = '/sounds/5-1-4/5-1-4-C.MP3'
          text = '• 우리 몸속의 근육은 모양과 크기가 다양합니다. \n• 근육은 뼈에 연결되어 있으며 뼈를 움직이게 합니다.'
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
      setNarrationText('')
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
    setNarrationText('')

    if (animState === 'walk') {
      let audioPath = ''
      let text: string

      switch (type) {
        case 'boy':
          audioPath = '/sounds/5-1-4/5-1-4-A.MP3'
          text = '• 우리 몸은 뼈와 근육의 작용으로 움직입니다.'
          break
        case 'bone':
          audioPath = '/sounds/5-1-4/5-1-4-B.MP3'
          text =
            '• 우리 몸속의 뼈는 모양과 크기가 다양합니다.\n• 뼈는 우리 몸의 형태를 만들고 몸을 지탱하며, 몸속에 있는 여러 기관을 보호합니다.'
          break
        case 'muscle':
          audioPath = '/sounds/5-1-4/5-1-4-C.MP3'
          text = '• 우리 몸속의 근육은 모양과 크기가 다양합니다. \n• 근육은 뼈에 연결되어 있으며 뼈를 움직이게 합니다.'
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
      '/sounds/5-1-4/5-1-4-E-1.MP3',
      '팔을 구부릴 때 팔 바깥쪽 근육이 늘어나고 팔 안쪽 근육이 줄어듭니다. \n 이렇게 근육의 길이가 줄어들거나 늘어나면서 뼈가 움직이고 우리 몸도 움직입니다.',
    )
  }

  const handleFold = () => {
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    setAction('fold')
    setHasExtended(false)

    playNarration(
      '/sounds/5-1-4/5-1-4-D-1.MP3',
      '팔을 펼 때 팔 바깥쪽 근육이 줄어들고 팔 안쪽 근육이 늘어납니다.\n 이렇게 근육의 길이가 줄어들거나 늘어나면서 뼈가 움직이고 우리 몸도 움직입니다.',
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
      return <IntroModels />
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
  }, [mode, showIntro, introModelsLoaded, modelUrl, modelType, animState, animIndex, action, isModelsLoading])

  const modeButtons = useMemo(
    () => [
      {
        mode: 'bones' as const,
        label: '뼈와 근육의 생김새 관찰',
        color: '#f5600a',
        hoverColor: '#fc835b',
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

  const handleShowActivityGuide = () => {
    setShowActivityGuide(true)
  }

  const handleCloseActivityGuide = () => {
    setShowActivityGuide(false)
  }
  return (
    <div className='w-screen h-screen bg-white flex font-bold flex-col'>
      <AnimatePresence>
        {mode !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute top-4 left-4 z-10 w-fit h-fit'>
            <button
              onClick={() => {
                handleBackToModeSelection()
              }}
              className='px-6 pt-3 pb-4 bg-[#FF8026] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#ff9b54] hover:shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(152,0,0,0.50)] transition-all duration-300'
              aria-label='모드 선택 화면으로 돌아가기'>
              <div className='text-center justify-center text-white text-xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                첫 화면으로
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
            className='absolute bottom-5 right-5 flex flex-col gap-3 bg-white p-4 rounded-3xl z-10 shadow-2xl border border-gray-100'
            style={{ backdropFilter: 'blur(10px)' }}>
            {/* 애니메이션 버튼 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {['pose', 'walk'].map((state) => (
                <button
                  key={state}
                  onClick={() => handleAnimationChange(state as AnimationState)}
                  className={`px-5 pt-3 pb-4 rounded-[20px] font-bold text-lg transition-all duration-300 ${
                    animState === state
                      ? 'bg-[#4CAF50] text-white shadow-[inset_0px_-8px_8px_0px_rgba(0,152,0,0.50)] hover:bg-[#66BB6A] hover:shadow-[inset_0px_-8px_8px_0px_rgba(0,152,0,0.70)] [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'
                      : 'bg-[#9E9E9E] text-white shadow-[inset_0px_-8px_8px_0px_rgba(50,50,50,0.50)] hover:bg-[#BDBDBD] hover:shadow-[inset_0px_-8px_8px_0px_rgba(50,50,50,0.70)] [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'
                  } ${
                    isModelsLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(50,50,50,0.50)] hover:scale-105'
                  }`}
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
                  className={`w-16 h-16 rounded-[20px] font-bold text-lg transition-all duration-300 ${
                    modelType === type
                      ? 'bg-[#2196F3] text-white shadow-[inset_0px_-8px_8px_0px_rgba(0,50,152,0.50)] hover:bg-[#42A5F5] hover:shadow-[inset_0px_-8px_8px_0px_rgba(0,50,152,0.70)] [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'
                      : 'bg-[#9E9E9E] text-white shadow-[inset_0px_-8px_8px_0px_rgba(50,50,50,0.50)] hover:bg-[#BDBDBD] hover:shadow-[inset_0px_-8px_8px_0px_rgba(50,50,50,0.70)] [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'
                  } ${
                    isModelsLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(50,50,50,0.50)] hover:scale-105'
                  }`}
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
              onClick={handleExtend}
              className='px-6 pt-3 pb-4 bg-[#2196F3] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(0,50,152,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#42A5F5] hover:shadow-[inset_0px_-10px_10px_0px_rgba(0,50,152,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(0,50,152,0.50)] transition-all duration-300'>
              <div className='text-center justify-center text-white text-lg font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                팔을 구부릴 때
              </div>
            </button>
            <button
              onClick={handleFold}
              className='px-6 pt-3 pb-4 bg-[#4CAF50] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(0,152,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#66BB6A] hover:shadow-[inset_0px_-10px_10px_0px_rgba(0,152,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(0,152,0,0.50)] transition-all duration-300'>
              <div className='text-center justify-center text-white text-lg font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                팔을 펼 때
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showNarrationText && mode === 'arm' && Array.isArray(narrationText) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className='fixed bottom-8 left-8 z-50'>
            <div className='bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 whitespace-nowrap'>
              <div className='text-black text-lg leading-relaxed font-medium'>
                {narrationText.map((line, index) => (
                  <p key={index} className='mb-1'>
                    {line}
                  </p>
                ))}
              </div>
            </div>
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

          {showIntro && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} scale={10.0} receiveShadow>
              <planeGeometry args={[30, 30]} />
              <shadowMaterial opacity={0} />
            </mesh>
          )}
          {mode === 'bones' && <fog attach='fog' args={['#f0f0f0', 0.3, 2]} />}

          <ambientLight intensity={mode === 'arm' ? 1.0 * Math.PI : 2.0} />

          {mode === 'bones' && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
              <planeGeometry args={[5, 5]} />
              <shadowMaterial opacity={0.4} />
            </mesh>
          )}

          <directionalLight
            position={mode === 'arm' ? [0, 5, 3] : [0, 5, 3]}
            intensity={mode === 'bones' ? lightIntensity : 6}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={0.1}
            shadow-camera-far={10}
            shadow-camera-left={showIntro ? -5 : mode === 'bones' ? -1 : -3}
            shadow-camera-right={showIntro ? 5 : mode === 'bones' ? 1 : 3}
            shadow-camera-top={showIntro ? 5 : mode === 'bones' ? 1 : 3}
            shadow-camera-bottom={showIntro ? -5 : mode === 'bones' ? -1 : -3}
            shadow-bias={mode === 'bones' ? -0.0001 : -0.0005}
            shadow-radius={mode === 'bones' ? 0.01 : 0.02}
          />

          <AnimatePresence mode='wait'>
            {getCurrentComponents && <group key={showIntro ? 'intro' : mode}>{getCurrentComponents}</group>}
          </AnimatePresence>

          <OrbitControls
            ref={orbitControlsRef}
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
          title={'뼈와 근육을 관찰하고, \n우리 몸이 움직이는 원리 알아보기'}
          description={[
            '우리 몸의 뼈와 근육의 생김새를 관찰하고,',
            '팔이 움직이는 원리를 통해',
            '우리 몸이 움직이는 원리를 알아봅시다.',
          ]}
          backgroundSvg='/img/cover/5-1-4.svg'
          descriptionSound='/sounds/5-1-4/5-1-4-Goal-1.MP3'
          showModeSelection={true}
          modeButtons={modeButtons}
          onModeSelect={handleModeSelect}
          onActivityGuide={handleShowActivityGuide}
          showModeButtonsDirectly={isBackFromMode}
        />
      )}

      <ActivityGuideModal isOpen={showActivityGuide} onClose={handleCloseActivityGuide} />

      <AnimatePresence>
        {showNarrationText && mode === 'bones' && animState === 'walk' && narrationText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className='fixed bottom-2 p-2 left-4 z-50'>
            <CrayonTextBox
              text={narrationText}
              color='#333'
              bg='#fff'
              textcolor='#333'
              fontSize='16px'
              fontWeight='500'
              textAlign='left'
              padding={20}
              animated={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 팔 움직임 나레이션 텍스트 */}
      <AnimatePresence>
        {showNarrationText && mode === 'arm' && narrationText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className='fixed bottom-8 left-8 z-50'>
            <CrayonTextBox
              text={narrationText}
              color='#333'
              bg='#fff'
              textcolor='#333'
              fontSize='16px'
              fontWeight='500'
              textAlign='left'
              padding={20}
              animated={true}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
