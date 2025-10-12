import { Canvas, useThree } from '@react-three/fiber'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Environment, useProgress, OrbitControls } from '@react-three/drei'
import dynamic from 'next/dynamic'
import * as THREE from 'three'

import { OpticalLab } from '../scenes/OpticalLab'
import { LaserPointer } from '@/components/5-1-2/LaserPointer'
import { SpeechBubble } from '@/components/5-1-2/SpeechBubble'
import Scene from '../components/canvas/Scene'
import Model from '../components/5-1-2/Model'
import Intro from '../components/intro/Intro'
import Stand from '../components/5-1-2/Stand'
import Background from '@/components/5-1-2/Background'

import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { OpticalMode, LensType, RayStates } from '@/types/5-1-2/types'
import { useAudio } from '@/hook/5-1-2/useAudio'
import {
  CAMERA_CONFIGS,
  getLaserPointerPosition,
  getLaserPointerRotation,
  getStandPosition,
  getStandRotation,
  getAudioPath,
} from '@/utils/5-1-2/utils'
import { LensPopup } from '@/components/5-1-2/LensPopup'
import { TiltOnMouse } from '@/components/common/Tilt'
import ActivityGuideModal from '@/components/5-1-2/ActivityGuideModal'
import AudioManager from '@/components/5-1-2/AudioManager'

const PostEffects = dynamic(() => import('../components/5-1-2/PostEffects'), { ssr: false })

type ButtonStyle = { bg: string; border: string; text: string }

type LightTheme = {
  goal: ButtonStyle
  guide: ButtonStyle
  start: ButtonStyle
}

const lightTheme: LightTheme = {
  goal: { bg: '#52AE46', border: '#A1CC90', text: '#FFFFFF' },
  guide: { bg: '#52AE46', border: '#A1CC90', text: '#FFFFFF' },
  start: { bg: '#F3921C', border: '#FFDBB0', text: '#FFFFFF' },
}

function SafePostEffects() {
  const { gl, scene, camera } = useThree()
  const isReady = gl && scene && camera
  return isReady ? <PostEffects /> : null
}

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

function ModeBasedControls({ mode }: { mode: OpticalMode }) {
  const { camera } = useThree()
  const currentConfig = CAMERA_CONFIGS[mode]

  useEffect(() => {
    const newPosition = new THREE.Vector3(...currentConfig.position)
    camera.position.copy(newPosition)
    camera.lookAt(new THREE.Vector3(...currentConfig.target))
    camera.updateProjectionMatrix()
  }, [mode, camera, currentConfig])

  return (
    <OrbitControls
      target={currentConfig.target}
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={40}
      maxPolarAngle={currentConfig.maxPolarAngle}
      minAzimuthAngle={currentConfig.minAzimuthAngle}
      maxAzimuthAngle={currentConfig.maxAzimuthAngle}
      enableDamping={true}
      dampingFactor={0.05}
    />
  )
}

function NarrationPopup({
  isVisible,
  text,
  onHide,
  autoHideDelay = 5000,
}: {
  isVisible: boolean
  text: string
  onHide: () => void
  autoHideDelay?: number
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onHide, autoHideDelay)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onHide, autoHideDelay])

  if (!isVisible) return null

  return (
    <div className='fixed top-5 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white px-6 py-4 rounded-xl shadow-2xl z-50 text-base font-bold max-w-4/5 text-center backdrop-blur border border-white border-opacity-10'>
      {text}
    </div>
  )
}

function ModeControls({
  activeMode,
  lensType,
  laserAngle,
  onModeChange,
  onLensTypeChange,
  onAngleChange,
}: {
  activeMode: OpticalMode
  lensType: LensType
  laserAngle: number
  onModeChange: (mode: OpticalMode) => void
  onLensTypeChange: (type: LensType) => void
  onAngleChange: (angle: number) => void
}) {
  const modes = [
    { key: 'direct' as const, label: '직진' },
    { key: 'reflection' as const, label: '반사' },
    { key: 'refraction' as const, label: '굴절' },
  ]

  const lensTypes = [
    { key: 'convex' as const, label: '볼록 렌즈' },
    { key: 'concave' as const, label: '오목 렌즈' },
  ]

  if (activeMode === 'direct') {
    return null
  }

  return (
    <div className='absolute bottom-5 left-5 flex flex-col gap-4 p-0 rounded-lg text-white'>
      <CrayonTextBox color='#F3921C' bg='#FFF' animated={true}>
        {/* 모드 선택 */}
        {/* <div className='flex gap-2'>
        {modes.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className={`px-4 py-2 rounded text-sm transition-colors ${
              activeMode === key ? 'bg-green-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div> */}

        {activeMode === 'refraction' && (
          <>
            <h4 className='text-base font-light pb-1.5'>볼록 렌즈와 오목 렌즈가 있어요.</h4>
            <div className='flex gap-2'>
              {lensTypes.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => onLensTypeChange(key)}
                  className={`px-3 py-1.5 rounded text-base font-light transition-colors ${
                    lensType === key ? 'bg-[#52AE46] text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* 반사 모드일 때 각도 조절 */}
        {activeMode === 'reflection' && (
          <>
            <h4 className='text-base font-light'>레이저 빛의 각도를 조절해보세요.</h4>
            <div className='flex items-center gap-2'>
              <input
                type='range'
                min='5'
                max='85'
                value={laserAngle}
                onChange={(e) => onAngleChange(Number(e.target.value))}
                className='w-48 accent-[#52AE46]'
              />
            </div>
          </>
        )}
      </CrayonTextBox>
    </div>
  )
}

// 설명 버튼 및 박스
function ExplanationToggleButton({
  mode,
  lensType,
  onClick,
}: {
  mode: OpticalMode
  lensType: LensType
  onClick: () => void
}) {
  const titles = {
    direct: '빛의 직진',
    reflection: '빛의 반사',
    refraction: '빛의 굴절',
  }

  return (
    <>
      <div className='absolute bottom-4 right-4' onClick={onClick}>
        <CrayonTextButton
          text={titles[mode]}
          width={140}
          height={75}
          bg='#F3921C'
          color='#FFDBB0'
          textcolor='#FFFFFF'></CrayonTextButton>
      </div>
    </>
  )
}

function LensButton({
  mode,
  lensType,
  onLensClick,
}: {
  mode: OpticalMode
  lensType: LensType
  onLensClick: () => void
}) {
  if (mode !== 'refraction') {
    return null
  }

  return (
    <div className='absolute bottom-24 right-4' onClick={onLensClick}>
      <CrayonTextButton
        text={lensType === 'concave' ? '오목 렌즈 둘러 보기' : lensType === 'convex' ? '볼록 렌즈 둘러 보기' : ''}
        width={200}
        height={75}
        bg='#52AE46'
        color='#A1CC90'
        textcolor='#FFFFFF'></CrayonTextButton>
    </div>
  )
}

function SubtitleBox({
  mode,
  lensType,
  rayStates,
  isVisible,
}: {
  mode: OpticalMode
  lensType: LensType
  rayStates: RayStates
  isVisible: boolean
}) {
  const descriptions = {
    default: '버튼을 눌러 3구 레이저를 켜고 빛의 경로를 관찰해보세요.',
    direct: '빛은 곧게 나아갑니다.',
    reflection: '빛은 곧게 나아가다가 거울에 부딪치면 방향이 바뀌어 나아갑니다.',
    convex: '빛은 볼록 렌즈를 통과할 때 렌즈의 가운데 쪽으로 굴절하여 나아갑니다.',
    concave: '빛은 오목 렌즈를 통과할 때 렌즈의 바깥쪽으로 굴절하여 나아갑니다.',
  }

  if (!isVisible) return null

  return (
    <div className='absolute flex w-full font-light justify-center left-1/2 -translate-x-1/2 items-center bottom-4 -translate-y-1/2 pointer-events-none'>
      <CrayonTextBox color='#F3921C' bg='#FFF' fontSize='16px'>
        {mode === 'direct' ? descriptions[mode] : mode === 'reflection' ? descriptions[mode] : descriptions[lensType]}
      </CrayonTextBox>
    </div>
  )
}

function ExplanationBox({ isVisible, mode, lensType }: { isVisible: boolean; mode: OpticalMode; lensType: LensType }) {
  if (!isVisible) return null

  const descriptions = {
    direct: '빛이 곧게 나아가는 성질을 빛의 직진이라고 합니다.',
    reflection: '빛이 거울과 같은 물체에 부딪쳐 방향이 바뀌어 나아가는 현상을 빛의 반사라고 합니다.',
    refraction:
      '공기 중에서 직진하던 빛이 다른 물질로 비스듬히 나아갈 때 그 경계에서 꺾여서 나아가는 현상을 빛의 굴절이라고 합니다.',
  }

  return (
    <div className='absolute left-1/2 font-light top-1/2 -translate-x-1/2 -translate-y-1/2'>
      <CrayonTextBox textcolor='#333' color='#F3921C' bg='#F3921C' fontSize='20px' width='380px' animated={false}>
        {descriptions[mode]}
      </CrayonTextBox>
    </div>
  )
}

function ExplanationBox2({ isVisible }: { isVisible?: boolean }) {
  const descriptions = '버튼을 눌러 3구 레이저를 켜고 빛의 경로를 관찰해보세요.'
  if (!isVisible) return null
  return (
    <div className='absolute flex w-full font-light justify-center left-1/2 -translate-x-1/2 items-center top-16 -translate-y-1/2 pointer-events-none'>
      <CrayonTextBox color='#F3921C' bg='#FFF' fontSize='16px'>
        {descriptions}
      </CrayonTextBox>
    </div>
  )
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [activeMode, setActiveMode] = useState<OpticalMode | null>('direct')
  const [lensType, setLensType] = useState<LensType>('convex')
  const [laserAngle, setLaserAngle] = useState(45)
  const [rayStates, setRayStates] = useState<RayStates>([false, false, false])
  const [showExplanation, setShowExplanation] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showNarration, setShowNarration] = useState(false)
  const [isBackFromMode, setIsBackFromMode] = useState(false)
  const [showLensPopup, setShowLensPopup] = useState(false)
  const [narrationText, setnarrationText] = useState()
  const [showSubtitle, setShowSubtitle] = useState(false)
  const { playSound, playNarration, stopNarration } = useAudio()
  const [showActivityGuide, setShowActivityGuide] = useState(false)
  const audioManager = AudioManager.getInstance()

  const modeButtons = useMemo(
    () => [
      { mode: 'direct', label: '빛의 직진 관찰하기', color: '#4fc3f7', hoverColor: '#29b6f6' },
      { mode: 'reflection', label: '빛의 반사 관찰하기', color: '#ff6b6b', hoverColor: '#ff5722' },
      { mode: 'refraction', label: '빛의 굴절 관찰하기', color: '#25e5c2', hoverColor: '#00bcd4' },
    ],
    [],
  )

  const handleLensTypeChange = useCallback(
    (next: LensType) => {
      setLensType(next)
      setRayStates([false, false, false])
      setShowSubtitle(false)
      stopNarration()
    },
    [stopNarration],
  )

  const handleShowActivityGuide = () => {
    audioManager.playGeneralButton()
    setShowActivityGuide(true)
  }

  const handleCloseActivityGuide = () => setShowActivityGuide(false)

  // === BGM ===
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const el = new Audio('/sounds/5-1-2/5-1-2-BGM.mp3')
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

  const handleModeSelect = useCallback(
    (selectedMode: OpticalMode) => {
      setActiveMode(selectedMode)
      setShowIntro(false)
      setBgmReady(true)

      playSound('/sounds/Enter_Cute.mp3')
      setTimeout(() => {
        playNarration('/sounds/5-1-2/5-1-2-A.MP3')
      }, 1000)
    },
    [playSound, playNarration],
  )
  const handleBackToModeSelection = useCallback(() => {
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    stopNarration()
    setShowNarration(false)
    setActiveMode('direct')
    setShowIntro(true)
    setIsBackFromMode(true)
    setRayStates([false, false, false])
    setLaserAngle(45)
    setShowExplanation(false)
  }, [playSound, stopNarration])

  useEffect(() => {
    if (activeMode) {
      setRayStates([false, false, false])
      setLaserAngle(45)
      stopNarration()
      setShowExplanation(false)
      setShowNarration(false)
    }
  }, [activeMode, stopNarration])

  const handleModeChange = useCallback(
    (newMode: OpticalMode) => {
      setActiveMode(newMode)
      setShowExplanation(false)
      playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    },
    [playSound],
  )

  const handleLensClick = useCallback(() => {
    setShowLensPopup(true)
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }, [playSound])

  const handleBackToIntro = useCallback(() => {
    setShowIntro(true)
    setIsBackFromMode(false)
    setActiveMode('direct')
  }, [])

  const handleRayToggle = useCallback(
    (buttonIndex: number) => {
      setRayStates((prevStates) => {
        const newStates = [...prevStates] as RayStates
        newStates[buttonIndex] = !newStates[buttonIndex]
        return newStates
      })
      playSound('/sounds/5-1-2-2_cassette-recorder-stop-button-mechanical-click-sound-359987.mp3')
    },
    [playSound],
  )

  const hasContent = activeMode !== null

  const handleLoadingComplete = useCallback(() => setIsLoaded(true), [])

  useEffect(() => {
    const allRaysActive = rayStates.every((state) => state === true)
    setShowSubtitle(allRaysActive)

    if (allRaysActive && activeMode) {
      const audioPath = getAudioPath(activeMode, lensType)
      if (audioPath) {
        playNarration(audioPath)
      }
    }
  }, [rayStates, activeMode, lensType, playNarration])

  return (
    <div className='w-screen h-screen bg-[#FBF0C7] flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      <NarrationPopup isVisible={showNarration} text={narrationText} onHide={() => setShowNarration(false)} />

      <CrayonTextButton
        ariaLabel={'첫 화면으로'}
        icon={'home'}
        position='absolute'
        iconPosition='left'
        onClick={handleBackToModeSelection}
        width={96}
        height={96}
        color={lightTheme.start.border}
        textcolor='#fff'
        bg={lightTheme.start.bg}
        className='z-[1000]'
        right={120}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      <CrayonTextButton
        icon={bgmEnabled ? 'volume2' : 'volumeX'}
        position='absolute'
        iconPosition='left'
        onClick={toggleBgm}
        width={96}
        height={96}
        color={lightTheme.start.border}
        textcolor='#fff'
        bg={lightTheme.start.bg}
        className='z-[1000]'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {!showIntro && hasContent && (
        <AnimatePresence>
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
              bg='#F3921C'
              color='#FFDBB0'
              textcolor='#FFFFFF'
              onClick={handleBackToModeSelection}
              innerCircleVisible={false}
            />
          </motion.div>
        </AnimatePresence>
      )}

      <div className='flex-1'>
        <Scene shadows camera={{ position: [0, 0, 20], fov: 50 }}>
          <Environment preset='city' environmentIntensity={0.2}>
            <color attach='background' args={['#00b7ffff']} />
          </Environment>
          <directionalLight
            color='white'
            intensity={1.2}
            position={[25, 50, 25]}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-camera-near={0.1}
            shadow-camera-far={200}
            shadow-normalBias={0.2}
            shadow-bias={-0.0001}
          />
          <ambientLight color='white' intensity={1} />

          {hasContent && (
            <>
              <TiltOnMouse enabled={showIntro} maxDeg={5} position={[0, -4, 0]}>
                <OpticalLab mode={activeMode} lensType={lensType} rayStates={rayStates} laserAngle={laserAngle} />
                <Model
                  mode={activeMode}
                  onToggle={handleRayToggle}
                  rayStates={rayStates}
                  laserAngle={laserAngle}
                  onAngleChange={setLaserAngle}
                />

                <Stand
                  position={getStandPosition(activeMode, laserAngle)}
                  rotation={getStandRotation(activeMode, laserAngle)}
                />

                <LaserPointer
                  position={getLaserPointerPosition(activeMode, laserAngle)}
                  rotation={getLaserPointerRotation(activeMode, laserAngle)}
                  visible={true}
                  onToggle={handleRayToggle}
                  rayStates={rayStates}
                  pivotOffset={[0, 0, activeMode === 'reflection' ? 0 : 3]}
                  mode={activeMode}
                />
              </TiltOnMouse>
            </>
          )}

          {hasContent && <ModeBasedControls mode={activeMode} />}

          <SafePostEffects />
        </Scene>
      </div>

      {hasContent && !showIntro && isLoaded && (
        <>
          <ModeControls
            activeMode={activeMode}
            lensType={lensType}
            laserAngle={laserAngle}
            onModeChange={handleModeChange}
            onLensTypeChange={handleLensTypeChange}
            onAngleChange={setLaserAngle}
          />
          <ExplanationBox2 isVisible={!showSubtitle} />
          <ExplanationBox isVisible={showExplanation} mode={activeMode} lensType={lensType} />
          <LensButton mode={activeMode} lensType={lensType} onLensClick={handleLensClick} />
          <SubtitleBox mode={activeMode} lensType={lensType} rayStates={rayStates} isVisible={showSubtitle} />

          <LensPopup isVisible={showLensPopup} lensType={lensType} onClose={() => setShowLensPopup(false)} />

          <ExplanationToggleButton
            mode={activeMode}
            lensType={lensType}
            onClick={() => {
              setShowExplanation(!showExplanation)
              playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
            }}
          />
        </>
      )}

      {isLoaded && showIntro && (
        <Intro
          onEnter={() => {}}
          title='빛의 직진, 반사, 굴절 관찰하기'
          description={[
            '빛이 공기 중에서 나아갈 때, 거울과 같은 물체에 부딪쳤을 때, 렌즈를 통과할 때 어떻게 나아가는지 알아봅시다.',
          ]}
          backgroundSvg='/img/cover/5-1-2.svg'
          descriptionSound='/sounds/5-1-2/5-1-2-Goal.MP3'
          showModeSelection={true}
          modeButtons={modeButtons}
          onModeSelect={handleModeSelect}
          showModeButtonsDirectly={isBackFromMode}
          onActivityGuide={handleShowActivityGuide}
          buttonTheme={lightTheme}
        />
      )}
      <ActivityGuideModal isOpen={showActivityGuide} onClose={handleCloseActivityGuide} />
    </div>
  )
}
