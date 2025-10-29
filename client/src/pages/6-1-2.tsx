import { Environment, Sky, Clouds, Cloud } from '@react-three/drei'
import { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'

import Model from '../components/6-1-2/Model'
import ResultModel from '../components/6-1-2/ResultModel'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { LoadingTracker } from '@/components/6-1-2/LoadingTracker'
import { NarrationSubtitle } from '@/components/6-1-2/NarrationSubtitle'
import { InformationSubtitle } from '@/components/6-1-2/InformationTitle'
import { Controls } from '@/components/6-1-2/Controls'
import { CameraController } from '@/components/6-1-2/CameraController'
import { BackButton } from '@/components/6-1-2/BackButton'
import { VehicleInfo } from '@/components/6-1-2/VehicleInfo'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { TiltOnMouse } from '@/components/common/Tilt'
import ActivityGuideModal from '@/components/6-1-2/ActivityGuideModal'
import AudioManager from '@/components/6-1-2/AudioManager'

import { ViewMode, VehicleId, AnimationState } from '@/types/6-1-2/types'
import { useAudio } from '@/hook/6-1-2/useAudio'
import { useBgm } from '@/hook/6-1-2/useBgm'
import { useHelper } from '@react-three/drei'
import { useThree } from '@react-three/fiber'

type ButtonStyle = { bg: string; border: string; text: string }

type SpeedTheme = {
  goal: ButtonStyle
  guide: ButtonStyle
  start: ButtonStyle
}

const speedTheme: SpeedTheme = {
  goal: { bg: '#05A8A4', border: '#7BCACA', text: '#FFFFFF' },
  guide: { bg: '#05A8A4', border: '#7BCACA', text: '#FFFFFF' },
  start: { bg: '#9B1CDF', border: '#DFB2FA', text: '#FFFFFF' },
}

function makeRng(seed = 123456789) {
  let s = seed >>> 0
  return () => {
    s = (1664525 * s + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function FogController({
  showResult,
  isLoaded,
  showIntro,
}: {
  showResult: boolean
  isLoaded: boolean
  showIntro: boolean
}) {
  const { scene } = useThree()

  useEffect(() => {
    if (isLoaded && !showResult) {
      scene.fog = new THREE.FogExp2('#D9E4EB', 0.043)
    } else {
      scene.fog = null
    }

    return () => {
      scene.fog = null
    }
  }, [showResult, isLoaded, showIntro, scene])

  return null
}
function Lights() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null!)

  return (
    <>
      <ambientLight intensity={0.2} color='#ff8c42' />
      <directionalLight
        ref={dirLightRef}
        position={[10, 12, 8]}
        intensity={0.2}
        castShadow
        color='#ff6b35'
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
    </>
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    isPaused: false,
    isCompleted: false,
    resetTrigger: false,
  })
  const [showResult, setShowResult] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('start')
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleId>('horse')
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showNarrationSubtitle, setShowNarrationSubtitle] = useState(false)
  const [narrationText, setNarrationText] = useState('')
  const [cameraResetTrigger, setCameraResetTrigger] = useState(false)

  const modelSceneRef = useRef<THREE.Group>(null)
  const resultSceneRef = useRef<THREE.Group>(null)

  const audioManager = AudioManager.getInstance()

  const [showActivityGuide, setShowActivityGuide] = useState(false)
  const handleCloseActivityGuide = useCallback(() => setShowActivityGuide(false), [])
  const handleShowActivityGuide = () => {
    audioManager.playGeneralButton()
    setShowActivityGuide(true)
  }

  const getCurrentSceneRef = () => {
    return showResult ? resultSceneRef : modelSceneRef
  }

  const { playClickSound, playNarrationAudio, playVehicleAudio, stopCurrentAudio, stopAllAudio } = useAudio()
  const { bgmEnabled, setBgmReady, toggleBgm } = useBgm(mounted)

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const handleEnterExperience = () => {
    playClickSound()
    setBgmReady(true)
    setTimeout(() => {
      setShowIntro(false)
      setTimeout(() => {
        playNarrationAudio(
          '/sounds/6-1-2/narration/6-1-2-A.MP3',
          setNarrationText,
          () => {
            setShowNarrationSubtitle(false)
            setNarrationText('')
          },
          '운동 시작하기 버튼을 눌러 물체를 움직여 보세요.',
          5000,
        )
        setShowNarrationSubtitle(true)
      }, 100)
    }, 100)
  }

  const handleToggleAnimation = () => {
    if (!animationState.isPlaying) {
      setAnimationState((prev) => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
      }))

      if (viewMode === 'firstPerson') {
        setTimeout(() => {
          playVehicleAudio(selectedVehicle)
        }, 50)
      }
    } else {
      setAnimationState((prev) => ({
        ...prev,
        isPaused: !prev.isPaused,
      }))

      if (!animationState.isPaused) {
        stopCurrentAudio()
      } else {
        if (viewMode === 'firstPerson') {
          playVehicleAudio(selectedVehicle)
        }
      }
    }
  }

  // viewMode나 animationState가 변경될 때 firstPerson 오디오 체크
  useEffect(() => {
    if (viewMode === 'firstPerson' && animationState.isPlaying && !animationState.isPaused && !showResult) {
      // firstPerson 모드이고 애니메이션이 재생 중일 때 오디오 재생
      playVehicleAudio(selectedVehicle)
    } else if (viewMode !== 'firstPerson' || !animationState.isPlaying || animationState.isPaused) {
      // firstPerson이 아니거나 애니메이션이 중지된 경우 오디오 중지
      stopCurrentAudio()
    }
  }, [
    viewMode,
    animationState.isPlaying,
    animationState.isPaused,
    selectedVehicle,
    showResult,
    playVehicleAudio,
    stopCurrentAudio,
  ])

  const handleResetAnimation = () => {
    stopAllAudio()
    setShowNarrationSubtitle(false)
    setNarrationText('')

    setAnimationState({
      isPlaying: false,
      isPaused: false,
      isCompleted: false,
      resetTrigger: true,
    })
    setShowResult(false)

    setTimeout(() => {
      setAnimationState((prev) => ({ ...prev, resetTrigger: false }))
    }, 100)
  }

  const handleAnimationComplete = () => {
    stopCurrentAudio()
    setAnimationState((prev) => ({
      ...prev,
      isCompleted: true,
      isPlaying: false,
      isPaused: false,
    }))
  }

  const handleShowResult = () => {
    stopCurrentAudio()
    setShowResult(true)
    setViewMode('start')

    setTimeout(() => {
      playNarrationAudio(
        '/sounds/6-1-2/narration/6-1-2-C-2.MP3',
        setNarrationText,
        () => {
          setShowNarrationSubtitle(false)
          setNarrationText('')
        },
        '기차의 속력은 28 m/s, 자동차의 속력은 20 m/s, 자전거를 타는 사람의 속력은 8 m/s, 달리는 사람의 속력은 6 m/s, 말의 속력은 17 m/s이므로 기차, 자동차, 말, 자전거를 타는 사람, 달리는 사람 순으로 빠릅니다.',
      )
      setShowNarrationSubtitle(true)
    }, 500)
  }

  const handleBackToAnimation = () => {
    setShowResult(false)
    setViewMode('start')
    setShowNarrationSubtitle(false)
    setNarrationText('')
    stopAllAudio()
    setAnimationState({
      isPlaying: false,
      isPaused: false,
      isCompleted: false,
      resetTrigger: true,
    })

    setTimeout(() => {
      setAnimationState((prev) => ({ ...prev, resetTrigger: false }))
    }, 100)
  }

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode)
    if (mode === 'firstPerson' && animationState.isPlaying && !animationState.isPaused) {
      setTimeout(() => {
        playVehicleAudio(selectedVehicle)
      }, 50)
    } else if (mode !== 'firstPerson') {
      stopCurrentAudio()
    }
  }

  const handleVehicleSelect = (vehicleId: VehicleId) => {
    setSelectedVehicle(vehicleId)

    if (viewMode === 'firstPerson' && animationState.isPlaying && !animationState.isPaused) {
      stopCurrentAudio()
      setTimeout(() => {
        playVehicleAudio(vehicleId)
      }, 50)
    }
  }

  useEffect(() => {
    return () => {
      stopAllAudio()
    }
  }, [stopAllAudio])

  const handleBackToIntro = () => {
    setShowIntro(true)
    setAnimationState({
      isPlaying: false,
      isPaused: false,
      isCompleted: false,
      resetTrigger: true,
    })
    setShowResult(false)
    setViewMode('start')
    setSelectedVehicle('horse')

    stopAllAudio()
    stopCurrentAudio()
    setShowNarrationSubtitle(false)
    setNarrationText('')

    setCameraResetTrigger(true)
    setTimeout(() => {
      setCameraResetTrigger(false)
    }, 100)

    setTimeout(() => {
      setAnimationState((prev) => ({ ...prev, resetTrigger: false }))
    }, 100)
  }

  return (
    <div className='w-screen h-screen bg-[#78C9C9] relative'>
      {!showIntro && <NarrationSubtitle visible={showNarrationSubtitle} text={narrationText} />}
      {!showIntro && <InformationSubtitle visible={showResult} />}

      <VehicleInfo viewMode={viewMode} selectedVehicle={selectedVehicle} animationState={animationState} />

      <CrayonTextButton
        ariaLabel={'첫 화면으로'}
        icon={'home'}
        position='absolute'
        iconPosition='left'
        onClick={handleBackToIntro}
        width={96}
        height={96}
        color='#ffffff'
        textcolor='#ffffff'
        bg={speedTheme.goal.bg}
        className='z-[200]'
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
        color='#fff'
        textcolor='#fff'
        bg={speedTheme.goal.bg}
        className='z-[200]'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {!showIntro && (
        <Controls
          animationState={animationState}
          viewMode={viewMode}
          selectedVehicle={selectedVehicle}
          showResult={showResult}
          onToggleAnimation={handleToggleAnimation}
          onResetAnimation={handleResetAnimation}
          onShowResult={handleShowResult}
          onBackToAnimation={handleBackToAnimation}
          onViewChange={handleViewChange}
          onVehicleSelect={handleVehicleSelect}
        />
      )}

      <Scene
        camera={{ position: [2.078, 0.5, -24.222], fov: 50, far: 100 }}
        dpr={[1, 2]}
        shadows={{ type: THREE.PCFSoftShadowMap }}>
        <FogController showResult={showResult} isLoaded={isLoaded} showIntro={showIntro} />

        {!showResult && (
          <Sky
            distance={45000}
            sunPosition={[100, 120, 80]}
            inclination={0.001}
            azimuth={0.25}
            rayleigh={0.7}
            turbidity={1.2}
            mieCoefficient={0.04}
            mieDirectionalG={0.99}
          />
        )}

        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        <TiltOnMouse enabled={showIntro} maxDeg={0.7}>
          <Lights />

          <mesh position={[0, -0.17, 0.0]} scale={20.0} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial transparent opacity={0.3} />
          </mesh>

          <group ref={modelSceneRef} visible={!showResult}>
            <Model
              scale={0.1}
              position={[0, 0.1, -20]}
              animationSpeed={animationState.isPlaying && !animationState.isPaused ? 1.0 : 0}
              onAnimationComplete={handleAnimationComplete}
              resetTrigger={animationState.resetTrigger}
              castShadow={true}
              receiveShadow={true}
            />
          </group>

          <group ref={resultSceneRef} visible={showResult}>
            <ResultModel scale={0.1} position={[0, 0, 2]} castShadow={true} receiveShadow={true} />
          </group>

          <CameraController
            viewMode={viewMode}
            selectedVehicle={selectedVehicle}
            isAnimationPlaying={animationState.isPlaying && !animationState.isPaused}
            sceneRef={modelSceneRef}
            showIntro={showIntro}
            showResult={showResult}
            animationState={animationState}
            resetTrigger={cameraResetTrigger}
          />
        </TiltOnMouse>
        <Environment preset={'apartment'} environmentIntensity={0.75} environmentRotation={[0, Math.PI / 2, 0]} />
      </Scene>

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='같은 시간 동안 이동한 물체의 빠르기 비교하기'
          description={['같은 시간 동안 이동한 물체의 빠르기를 비교해 봅시다.']}
          backgroundSvg='/img/cover/6-1-2.svg'
          descriptionSound='/sounds/6-1-2/narration/6-1-2-Goal.MP3'
          onActivityGuide={handleShowActivityGuide}
          buttonTheme={speedTheme}
        />
      )}
      <ActivityGuideModal isOpen={showActivityGuide} onClose={handleCloseActivityGuide} />
    </div>
  )
}
