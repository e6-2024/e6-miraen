import { Environment, Sky } from '@react-three/drei'
import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'

import Model from '../components/6-1-2/Model'
import ResultModel from '../components/6-1-2/ResultModel'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { LoadingTracker } from '@/components/6-1-2/LoadingTracker'
import { NarrationSubtitle } from '@/components/6-1-2/NarrationSubtitle'
import { Controls } from '@/components/6-1-2/Controls'
import { CameraController } from '@/components/6-1-2/CameraController'
import { BackButton } from '@/components/6-1-2/BackButton'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { TiltOnMouse } from '@/components/common/Tilt'

import { ViewMode, VehicleId, AnimationState } from '@/types/6-1-2/types'
import { useAudio } from '@/hook/6-1-2/useAudio'
import { useBgm } from '@/hook/6-1-2/useBgm'

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
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleId>('train')
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showNarrationSubtitle, setShowNarrationSubtitle] = useState(false)
  const [narrationText, setNarrationText] = useState('')

  const sceneRef = useRef<THREE.Group>(null)
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
      }, 500)
    }, 300)
  }

  const handleToggleAnimation = () => {
    if (!animationState.isPlaying) {
      setAnimationState((prev) => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
      }))
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
    setViewMode('start')

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
        '/sounds/6-1-2/narration/6-1-2-C.MP3',
        setNarrationText,
        () => {
          setShowNarrationSubtitle(false)
          setNarrationText('')
        },
        '기차의 속력은 28 m/s, 자동차의 속력은 20 m/s, 자전거를 타는 사람의 속력은 8 m/s, 달리는 사람의 속력은 6 m/s, 말의 속력은 17 m/s이므로 기차, 자동차, 말, 자전거를 탄 사람, 달리는 사람 순으로 빠릅니다.',
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
  }

  const handleViewChange = (mode: ViewMode) => {
    if (mode !== 'firstPerson') {
      stopCurrentAudio()
    }

    setViewMode(mode)

    if (mode === 'firstPerson' && animationState.isPlaying && !animationState.isPaused) {
      playVehicleAudio(selectedVehicle)
    }
  }

  const handleVehicleSelect = (vehicleId: VehicleId) => {
    setSelectedVehicle(vehicleId)

    if (viewMode === 'firstPerson' && animationState.isPlaying && !animationState.isPaused) {
      playVehicleAudio(vehicleId)
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
      resetTrigger: false,
    })
    setShowResult(false)
    setViewMode('start')
    stopAllAudio()
  }

  return (
    <div className='w-screen h-screen bg-[#78C9C9] relative'>
      <NarrationSubtitle visible={showNarrationSubtitle} text={narrationText} />

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
        className='backdrop-blur z-[200] mix-blend-difference'
        right={138}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
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
        className='backdrop-blur z-[200] mix-blend-difference'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {/* <BackButton showIntro={showIntro} onClick={handleBackToIntro} /> */}

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

      <Scene camera={{ position: [2.078, 1.235, -4.222], fov: 50, far: 500 }} shadows='soft'>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        <TiltOnMouse enabled={showIntro} maxDeg={5}>
          <directionalLight
            position={[5, 20, 5]}
            intensity={1.2}
            castShadow
            color='#FFF8DC'
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
            shadow-camera-far={100}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-bias={-0.001}
            shadow-normalBias={0.02}
          />
          <directionalLight position={[-20, 30, 20]} intensity={0.8} color='#E6F3FF' />

          <mesh position={[0, -0.285, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[130, 130]} />
            <shadowMaterial transparent opacity={0.3} />
          </mesh>

          <group ref={sceneRef}>
            {showResult ? (
              <ResultModel scale={0.1} position={[0, 0, 2]} castShadow={true} receiveShadow={true} />
            ) : (
              <Model
                scale={0.1}
                position={[0, 0, 0]}
                animationSpeed={animationState.isPlaying && !animationState.isPaused ? 1.0 : 0}
                onAnimationComplete={handleAnimationComplete}
                resetTrigger={animationState.resetTrigger}
                castShadow={true}
                receiveShadow={true}
              />
            )}
          </group>

          <CameraController
            viewMode={viewMode}
            selectedVehicle={selectedVehicle}
            isAnimationPlaying={animationState.isPlaying && !animationState.isPaused}
            sceneRef={sceneRef}
            showIntro={showIntro}
            showResult={showResult}
          />

          <Sky
            distance={45000}
            sunPosition={[-1, 0.09, -1]}
            inclination={0.49}
            azimuth={0.25}
            rayleigh={1.2}
            turbidity={1}
            mieCoefficient={0.008}
            mieDirectionalG={0.85}
          />
        </TiltOnMouse>
        <Environment preset={'apartment'} />
      </Scene>

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='같은 시간 동안 이동한 물체의 빠르기 비교하기'
          description={['같은 시간 동안 이동한 물체의 빠르기를 비교해 봅시다.']}
          backgroundSvg='/img/cover/6-1-2.svg'
          descriptionSound='/sounds/6-1-2/narration/6-1-2-Goal.MP3'
        />
      )}
    </div>
  )
}
