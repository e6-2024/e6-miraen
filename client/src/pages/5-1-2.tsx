import { Canvas, useThree } from '@react-three/fiber'
import { useState, useEffect, useCallback, useMemo } from 'react'
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

import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { OpticalMode, LensType, RayStates } from '@/types/5-1-2/types'
import { useAudio } from '@/hook/5-1-2/useAudio'
import { CAMERA_CONFIGS, getLaserPointerPosition, getNarrationText } from '@/utils/5-1-2/utils'

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
      enablePan={false}
      enableRotate={true}
      minDistance={5}
      maxDistance={25}
      maxPolarAngle={currentConfig.maxPolarAngle}
      minAzimuthAngle={currentConfig.minAzimuthAngle}
      maxAzimuthAngle={currentConfig.maxAzimuthAngle}
      enableDamping={true}
      dampingFactor={0.05}
    />
  )
}

// 나레이션 팝업
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
    <div className='fixed top-5 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white px-6 py-4 rounded-xl shadow-2xl z-50 text-base font-medium max-w-4/5 text-center backdrop-blur border border-white border-opacity-10'>
      {text}
    </div>
  )
}

// 모드 컨트롤 UI
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
    { key: 'convex' as const, label: '볼록렌즈' },
    { key: 'concave' as const, label: '오목렌즈' },
  ]

  return (
    <div className='absolute top-5 left-5 flex flex-col gap-4 bg-black bg-opacity-80 p-5 rounded-lg text-white'>
      {/* 모드 선택 */}
      <div className='flex gap-2'>
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
      </div>

      {/* 굴절 모드일 때 렌즈 타입 선택 */}
      {activeMode === 'refraction' && (
        <>
          <h4 className='text-base font-medium'>볼록렌즈와 오목렌즈가 있어요.</h4>
          <div className='flex gap-2'>
            {lensTypes.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onLensTypeChange(key)}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  lensType === key ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
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
          <h4 className='text-base font-medium'>레이저 빛의 각도를 조절해보세요.</h4>
          <div className='flex items-center gap-2'>
            <input
              type='range'
              min='3'
              max='65'
              value={laserAngle}
              onChange={(e) => onAngleChange(Number(e.target.value))}
              className='w-48 accent-green-500'
            />
          </div>
        </>
      )}
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
    <button
      onClick={onClick}
      className='fixed bottom-5 right-5 px-5 py-3 bg-white text-black rounded-lg cursor-pointer text-sm font-bold shadow-lg hover:shadow-xl transition-shadow z-50'>
      {titles[mode]}
    </button>
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
    <div className='fixed bottom-5 left-5 right-44 bg-white text-black px-5 py-3 rounded-lg shadow-lg z-50 text-sm'>
      {descriptions[mode]}
    </div>
  )
}

export default function OpticalExperiment() {
  const [activeMode, setActiveMode] = useState<OpticalMode | null>('direct')
  const [lensType, setLensType] = useState<LensType>('convex')
  const [laserAngle, setLaserAngle] = useState(45)
  const [rayStates, setRayStates] = useState<RayStates>([false, false, false])
  const [showExplanation, setShowExplanation] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showNarration, setShowNarration] = useState(false)
  const [narrationText, setNarrationText] = useState('')
  const [isBackFromMode, setIsBackFromMode] = useState(false)

  const { playSound, playBackgroundMusic, playNarration, stopNarration } = useAudio()

  const modeButtons = useMemo(
    () => [
      { mode: 'direct', label: '빛의 직진 관찰하기', color: '#4fc3f7', hoverColor: '#29b6f6' },
      { mode: 'reflection', label: '빛의 반사 관찰하기', color: '#ff6b6b', hoverColor: '#ff5722' },
      { mode: 'refraction', label: '빛의 굴절 관찰하기', color: '#25e5c2', hoverColor: '#00bcd4' },
    ],
    [],
  )

  // 모드 선택 핸들러 (새로 추가)
  const handleModeSelect = useCallback(
    (selectedMode: OpticalMode) => {
      setActiveMode(selectedMode)
      setShowIntro(false)
      playSound('/sounds/Enter_Cute.mp3')
      setTimeout(playBackgroundMusic, 1000)
    },
    [playSound, playBackgroundMusic],
  )

  // 첫 화면으로 돌아가기 핸들러 (새로 추가)
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

  // 기존 모드 변경 시 상태 초기화 로직은 activeMode가 변경될 때만 실행
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

  return (
    <div className='w-screen h-screen font-light flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      <NarrationPopup isVisible={showNarration} text={narrationText} onHide={() => setShowNarration(false)} />

      {/* 첫 화면으로 돌아가기 버튼 - 모드가 선택된 상태에서만 표시 */}
      {hasContent && (
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

          {/* 조명 설정 */}
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
            shadow-bias={-0.0001}
          />
          <ambientLight color='white' intensity={1} />

          {/* 모드가 선택된 경우에만 실험 컨텐츠 렌더링 */}
          {hasContent && (
            <>
              {/* 광학 실험실 */}
              <OpticalLab mode={activeMode} lensType={lensType} rayStates={rayStates} laserAngle={laserAngle} />

              {/* 3D 모델 */}
              <Model
                mode={activeMode}
                onToggle={handleRayToggle}
                rayStates={rayStates}
                laserAngle={laserAngle}
                onAngleChange={setLaserAngle}
              />

              {/* 레이저 포인터 */}
              <LaserPointer
                position={getLaserPointerPosition(activeMode)}
                angle={laserAngle}
                visible={true}
                onToggle={handleRayToggle}
                rayStates={rayStates}
                pivotOffset={[0, 0, activeMode === 'reflection' ? -20.0 : 3]}
                mode={activeMode}
              />

              {/* 말풍선 */}
              <SpeechBubble
                position={
                  activeMode === 'direct' ? [-10, 3, 0] : activeMode === 'reflection' ? [-10, 3, -6] : [-10, 6.5, 0]
                }
                pointColor={activeMode === 'direct' ? '#4fc3f7' : activeMode === 'reflection' ? '#ff6b6b' : '#25e5c2'}
                html='버튼을 눌러 3구 레이저를 켜고, 빛이 나아가는 모습을 관찰해 보세요.'
                visible={!showIntro}
              />
            </>
          )}

          {/* 카메라 컨트롤 - 모드가 선택된 경우에만 */}
          {hasContent && <ModeBasedControls mode={activeMode} />}

          <SafePostEffects />
        </Scene>
      </div>

      {/* UI 컨트롤들 - 모드가 선택되고 인트로가 끝난 후에만 표시 */}
      {hasContent && !showIntro && isLoaded && (
        <>
          {/* <ModeControls
            activeMode={activeMode}
            lensType={lensType}
            laserAngle={laserAngle}
            onModeChange={handleModeChange}
            onLensTypeChange={setLensType}
            onAngleChange={setLaserAngle}
          /> */}

          <ExplanationBox isVisible={showExplanation} mode={activeMode} lensType={lensType} />

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

      {/* 인트로 화면 - 모드 선택 기능 추가 */}
      {isLoaded && showIntro && (
        <Intro
          onEnter={() => {}} // 더 이상 사용하지 않음
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
          buttonTheme={lightTheme}
        />
      )}
    </div>
  )
}
