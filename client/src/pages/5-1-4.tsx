'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Environment, OrbitControls, useProgress, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { AnimatePresence, motion } from 'framer-motion'

import AnimatedModel from '../components/AnimatedModel'
import AnimatedModel2 from '../components/AnimatedModel2'
const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false })

import Intro from '@/components/intro/Intro'
import MouseInteractiveGroup from '@/components/MouseInteractiveGroup'
import ActivityGuideModal from '@/components/5-1-4/ActivityGuideModal'
import { CrayonTextBox } from '@/components/CrayonTextBox'
import { CrayonTextButton } from '@/components/CrayonUIButton'

type ModelType = 'boy' | 'muscle' | 'bone'
type AnimationState = 'walk' | 'pose'
type PageMode = 'bones' | 'arm' | null
type ButtonStyle = { bg: string; border: string; text: string }

const preloadModelUrls = [
  '/models/Anatomy/Boy_Walking.gltf',
  '/models/Anatomy/Boy_Pose.gltf',
  '/models/Anatomy/Muscle_Walking.gltf',
  '/models/Anatomy/Muscle_Pose.gltf',
  '/models/Anatomy/Bone_Pose.gltf',
  '/models/Anatomy/Bone_Walking.gltf',
]

const allPreloadUrls = [...preloadModelUrls, ...preloadModelUrls.map((url) => `${url}#bone`)]

type AnatomyTheme = {
  goal: ButtonStyle
  guide: ButtonStyle
  start: ButtonStyle
}

const anatomyTheme: AnatomyTheme = {
  goal: { bg: '#D54D50', border: '#E8AAAB', text: '#FFFFFF' },
  guide: { bg: '#D54D50', border: '#E8AAAB', text: '#FFFFFF' },
  start: { bg: '#F77F42', border: '#BF4E1D', text: '#FFFFFF' },
}

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()
  useEffect(() => {
    if (!active && progress === 100) onLoadingComplete()
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
  // ✅ 마운트 여부 - 클라 의존 UI는 mounted 이후에만 렌더
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // 상태 관리
  const [mode, setMode] = useState<PageMode>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [modelType, setModelType] = useState<ModelType>('boy')
  const [animState, setAnimState] = useState<AnimationState>('pose')
  const [isModelsLoading, setIsModelsLoading] = useState(true)

  const [action, setAction] = useState<'extend' | 'fold'>('fold')
  const [hasExtended, setHasExtended] = useState(false)

  const [currentNarration, setCurrentNarration] = useState<HTMLAudioElement | null>(null)
  const [showNarrationText, setShowNarrationText] = useState(false)
  const [narrationText, setNarrationText] = useState<string>('')

  const [introModelsLoaded, setIntroModelsLoaded] = useState(false)
  const [isBackFromMode, setIsBackFromMode] = useState(false)
  const [showActivityGuide, setShowActivityGuide] = useState(false)

  const orbitControlsRef = useRef<any>(null)

  // === BGM (hydration-safe) ===
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true) // 서버/초기 렌더와 동일한 상수로 시작
  const [bgmReady, setBgmReady] = useState(false)

  // 마운트 후에만 localStorage에서 복원
  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [mounted])

  // 오디오 인스턴스 준비 (클라 전용)
  useEffect(() => {
    if (!mounted) return
    const el = new Audio('/sounds/5-1-4/5-1-4-BGM_little-steps-246641.mp3')
    el.loop = true
    el.volume = 0.2
    bgmRef.current = el
    return () => {
      el.pause()
      bgmRef.current = null
    }
  }, [mounted])

  // 상태 반영 (재생/일시정지 + 저장)
  useEffect(() => {
    if (!mounted || !bgmRef.current) return
    try {
      localStorage.setItem('bgmEnabled', JSON.stringify(bgmEnabled))
    } catch {}
    if (bgmEnabled && bgmReady) {
      bgmRef.current.play().catch(() => {})
    } else {
      bgmRef.current.pause()
    }
  }, [bgmEnabled, bgmReady, mounted])

  const toggleBgm = () => setBgmEnabled((v) => !v)

  // 인트로 모델 프리로드
  useEffect(() => {
    const loadIntroModels = async () => {
      try {
        const introUrls = [
          '/models/Anatomy/Boy_Pose.gltf',
          '/models/Anatomy/Muscle_Pose.gltf',
          '/models/Anatomy/Bone_Pose.gltf',
        ]
        const loadPromises = introUrls.map(
          (url) =>
            new Promise<void>((resolve) => {
              useGLTF.preload(url)
              setTimeout(resolve, 100)
            }),
        )
        await Promise.all(loadPromises)
        setIntroModelsLoaded(true)
      } catch (error) {
        console.error('Intro models preloading failed:', error)
        setIntroModelsLoaded(true)
      }
    }
    loadIntroModels()
  }, [])

  // 효과음
  const playClickSound = useCallback((audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch {}
  }, [])

  // 로딩 완료
  const handleLoadingComplete = useCallback(() => setIsLoaded(true), [])

  // 시작하기 (현재는 모드 버튼에서 바로 진입)
  const handleEnterExperience = useCallback(() => {
    playClickSound()
    setBgmReady(true)
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

  // 모드 선택 (인트로 → 실험)
  const handleModeSelect = useCallback((selectedMode: PageMode) => {
    setMode(selectedMode)
    setShowIntro(false)
    setBgmReady(true)

    if (selectedMode === 'bones') loadModels()
    if (selectedMode === 'arm') {
      setAction('fold')
      setHasExtended(false)
    }
  }, [])

  // 뒤로가기 (실험 → 인트로)
  const handleBackToModeSelection = useCallback(() => {
    playClickSound()

    if (currentNarration) {
      currentNarration.pause()
      currentNarration.currentTime = 0
      setCurrentNarration(null)
    }
    setShowNarrationText(false)
    setNarrationText('')

    resetCamera()

    setMode(null)
    setShowIntro(true)
    setIsBackFromMode(true)
  }, [playClickSound, currentNarration, resetCamera])

  const handleBackToIntro = useCallback(() => {
    playClickSound()

    if (currentNarration) {
      currentNarration.pause()
      currentNarration.currentTime = 0
      setCurrentNarration(null)
    }
    setShowNarrationText(false)
    setNarrationText('')

    resetCamera()

    setMode(null)
    setShowIntro(true)
    setIsBackFromMode(false)
  }, [playClickSound, currentNarration, resetCamera])

  // 모델 사전 로딩
  const loadModels = async () => {
    setIsModelsLoading(true)
    try {
      const loadPromises = allPreloadUrls.map(
        (url) =>
          new Promise<void>((resolve) => {
            useGLTF.preload(url)
            setTimeout(resolve, 50)
          }),
      )
      await Promise.all(loadPromises)
      setTimeout(() => setIsModelsLoading(false), 100)
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
      audio.volume = 1
      setNarrationText(text)
      setShowNarrationText(true)
      audio.play().catch(() => {})
      setCurrentNarration(audio)
      audio.addEventListener('ended', () => {
        setShowNarrationText(false)
        setNarrationText('')
        setCurrentNarration(null)
      })
    } catch {}
  }

  // 뼈/근육 모드 핸들러
  const handleAnimationChange = (newAnimState: AnimationState) => {
    if (isModelsLoading) return
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    setAnimState(newAnimState)

    if (newAnimState === 'walk') {
      let audioPath = ''
      let text = ''
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
      if (audioPath) playNarration(audioPath, text)
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
      let text = ''
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
      if (audioPath) playNarration(audioPath, text)
    }
  }

  // 팔 모드 핸들러
  const handleExtend = () => {
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    setAction('extend')
    setHasExtended(true)
    playNarration(
      '/sounds/5-1-4/5-1-4-E-1.MP3',
      '팔을 구부릴 때는 팔 안쪽 근육이 줄어들고 팔 바깥쪽 근육이 늘어납니다.\n 이렇게 근육의 길이가 줄어들거나 늘어나면서 뼈가 움직이고 우리 몸도 움직입니다.',
    )
  }

  const handleFold = () => {
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    setAction('fold')
    setHasExtended(false)
    playNarration(
      '/sounds/5-1-4/5-1-4-D-1.MP3',
      '팔을 펼 때는 팔 안쪽 근육이 늘어나고 팔 바깥쪽 근육이 줄어듭니다.\n 이렇게 근육의 길이가 줄어들거나 늘어나면서 뼈가 움직이고 우리 몸도 움직입니다.',
    )
  }

  const getModelKey = () => {
    let base = modelType.charAt(0).toUpperCase() + modelType.slice(1)
    const anim = animState === 'walk' ? 'Walking' : 'Pose'
    return `${base}_${anim}`
  }
  const getModelUrl = () => `/models/Anatomy/${getModelKey()}.gltf`
  const getModelScale = () => (modelType === 'boy' ? 0.55 : 0.0055)
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
    if (showIntro && introModelsLoaded) return <IntroModels />
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
      { mode: 'bones' as const, label: '뼈와 근육의 생김새 관찰', color: '#f5600a', hoverColor: '#fc835b' },
      { mode: 'arm' as const, label: '팔이 움직이는 원리 알아보기', color: '#2196F3', hoverColor: '#42A5F5' },
    ],
    [],
  )

  const handleShowActivityGuide = () => setShowActivityGuide(true)
  const handleCloseActivityGuide = () => setShowActivityGuide(false)

  return (
    <div className='w-screen h-screen bg-white flex font-bold flex-col'>
      <AnimatePresence>
        {mounted && mode !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute top-4 left-4 z-10 w-fit h-fit'>
            <CrayonTextButton
              ariaLabel='모드 선택 화면으로 돌아가기'
              text='첫 화면으로'
              icon='arrow-left'
              iconPosition='left'
              width={170}
              height={75}
              iconSize={30}
              bg='#D54D50'
              color='#E8AAAB'
              textcolor='#FFFFFF'
              onClick={handleBackToModeSelection}
              innerCircleVisible={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 뼈와 근육 컨트롤 */}
      <AnimatePresence>
        {mounted && mode === 'bones' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute bottom-5 right-5 z-10'>
            <CrayonTextBox
              bg='#FFFFFF'
              color='#D54D50'
              textcolor='#333'
              padding={14}
              animated={true}
              className='rounded-3xl shadow-2xl border border-gray-100'>
              {/* 애니메이션 토글 */}
              <div className='flex justify-center gap-3 mb-3'>
                {(['pose', 'walk'] as AnimationState[]).map((state) => {
                  const active = animState === state
                  return (
                    <CrayonTextButton
                      key={state}
                      text={state === 'walk' ? '걷기' : '정지'}
                      ariaLabel={state === 'walk' ? '걷기' : '정지'}
                      width={120}
                      height={64}
                      bg={active ? '#D54D50' : '#9E9E9E'}
                      color={active ? '#E8AAAB' : '#666666'}
                      textcolor='#FFFFFF'
                      className={`transition-all duration-300 ${
                        isModelsLoading ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:scale-90'
                      }`}
                      onClick={() => !isModelsLoading && handleAnimationChange(state)}
                      innerCircleVisible={false}
                    />
                  )
                })}
              </div>

              {/* 모델 타입 선택 */}
              <div className='flex justify-center gap-3'>
                {(['boy', 'bone', 'muscle'] as ModelType[]).map((type) => {
                  const active = modelType === type
                  return (
                    <CrayonTextButton
                      key={type}
                      text={type === 'boy' ? '겉모습' : type === 'muscle' ? '근육' : '뼈'}
                      ariaLabel={type}
                      width={96}
                      height={64}
                      bg={active ? '#4CAF50' : '#9E9E9E'}
                      color={active ? '#096A2E' : '#666666'}
                      textcolor='#FFFFFF'
                      className={`transition-all duration-300 ${
                        isModelsLoading
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:brightness-110 active:scale-90 hover:scale-105'
                      }`}
                      onClick={() => !isModelsLoading && handleModelTypeChange(type)}
                      innerCircleVisible={false}
                    />
                  )
                })}
              </div>
            </CrayonTextBox>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 팔 컨트롤 */}
      <AnimatePresence>
        {mounted && mode === 'arm' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute bottom-4 right-4 z-10'>
            <CrayonTextBox
              bg='#FFFFFF'
              color='#D54D50'
              textcolor='#333'
              padding={12}
              animated={true}
              className='rounded-2xl shadow-2xl'>
              <div className='flex flex-col gap-2'>
                <CrayonTextButton
                  text='팔을 구부릴 때'
                  ariaLabel='팔을 구부릴 때'
                  width={180}
                  height={72}
                  bg='#D54D50'
                  color='#E8AAAB'
                  textcolor='#FFFFFF'
                  className='hover:brightness-110 active:scale-90 transition-all duration-300'
                  onClick={handleExtend}
                  innerCircleVisible={false}
                />
                <CrayonTextButton
                  text='팔을 펼 때'
                  ariaLabel='팔을 펼 때'
                  width={180}
                  height={72}
                  bg='#E8AAAB'
                  color='#D54D50'
                  textcolor='#FFFFFF'
                  className='hover:brightness-110 active:scale-90 transition-all duration-300'
                  onClick={handleFold}
                  innerCircleVisible={false}
                />
              </div>
            </CrayonTextBox>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D 씬 (클라 전용 / mounted 이후) */}
      <div className='flex-1 relative overflow-hidden'>
        {mounted && (
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
              position={[0, 5, 3]}
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
                mode === 'arm'
                  ? 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr'
                  : undefined
              }
              backgroundIntensity={0.09}
              backgroundBlurriness={0.5}
              environmentIntensity={0.2}
            />
          </Scene>
        )}
      </div>

      {/* Intro (텍스트 UI도 안전하게 mounted 이후) */}
      {mounted && isLoaded && showIntro && (
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
          buttonTheme={anatomyTheme}
        />
      )}

      {/* BGM 토글 버튼 (mounted 이후) */}
      {mounted && (
        <>
          <CrayonTextButton
            ariaLabel={'첫 화면으로'}
            icon={'home'}
            position='absolute'
            iconPosition='left'
            onClick={handleBackToIntro}
            width={108}
            height={108}
            color='#ffffff'
            textcolor='#ffffff'
            bg='rgba(255,255,255,0.10)'
            className='background-blur z-[200] right-[108px] mix-blend-difference'
            right={16}
            top={16}
            iconSize={40}
          />
          <CrayonTextButton
            icon={bgmEnabled ? 'volume2' : 'volumeX'}
            position='absolute'
            iconPosition='left'
            onClick={toggleBgm}
            width={108}
            height={108}
            color='#fff'
            textcolor='#fff'
            bg='rgba(255,255,255,0.10)'
            className='backdrop-blur z-[1000] mix-blend-difference'
            right={16}
            top={16}
            iconSize={40}
            innerCircleVisible={true}
          />
        </>
      )}

      {/* 모달 (mounted 이후) */}
      {mounted && <ActivityGuideModal isOpen={showActivityGuide} onClose={handleCloseActivityGuide} />}

      {/* 나레이션 텍스트 */}
      <AnimatePresence>
        {mounted && showNarrationText && mode === 'bones' && animState === 'walk' && narrationText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className='fixed bottom-2 p-2 left-4 z-50'>
            <CrayonTextBox
              text={narrationText}
              color='#E8AAAB'
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

      <AnimatePresence>
        {mounted && showNarrationText && mode === 'arm' && narrationText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className='fixed bottom-8 left-8 z-50'>
            <CrayonTextBox
              text={narrationText}
              color='#E8AAAB'
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
