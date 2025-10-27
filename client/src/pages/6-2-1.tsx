import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, useProgress } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'

import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'

import SunLight from '@/components/6-2-1/SunLight'
import AngleLines from '@/components/6-2-1/AngleLines'
import CompassBillboard from '@/components/6-2-1/CompassBillboard'
import ThermometerDisplay from '@/components/6-2-1/ThermometerDisplay'
import ObservationTable from '@/components/6-2-1/ObservationTable'
import ProgressBar from '@/components/6-2-1/ProgressBar'
import TimeIntervalImages from '@/components/6-2-1/TimeIntervalImages'
import SummaryPopup from '@/components/6-2-1/SummaryPopup'
import SubtitleDisplay from '@/components/6-2-1/SubtitleDisplay'

import { timeData2 } from '@/components/6-2-1/timeData'
import { useObservation } from '@/hook/6-2-1/useObservation'
import { useAudio } from '@/hook/6-2-1/useAudio'
import { CAMERA_CONFIG } from '@/utils/6-2-1/utils'
import IntroMouseCameraController from '@/components/intro/IntroMouseCameraController'
import { Light } from 'three'
import AudioManager from '@/components/6-2-1/AudioManager'
import ActivityGuideModal from '@/components/6-2-1/ActivityGuideModal'

type ButtonStyle = { bg: string; border: string; text: string }

type LightTheme = {
  goal: ButtonStyle
  guide: ButtonStyle
  start: ButtonStyle
}

const lightTheme: LightTheme = {
  goal: { bg: '#9B1CDF', border: '#DFB2FA', text: '#FFFFFF' },
  guide: { bg: '#9B1CDF', border: '#DFB2FA', text: '#FFFFFF' },
  start: { bg: '#01A7A2', border: '#78C9C9', text: '#FFFFFF' },
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

function TimeIntervalButton({ onClick }: { onClick: () => void }) {
  return (
    <div className='relative'>
      <CrayonTextButton
        text='시간 간격 관측 자료'
        width={280}
        bg={lightTheme.goal.bg}
        color={lightTheme.goal.border}
        textcolor='#FFF'
        onClick={onClick}
      />
    </div>
  )
}

function SummaryButton({ onClick }: { onClick: () => void }) {
  return (
    <div className='relative'>
      <CrayonTextButton
        text='정리하기'
        width={280}
        bg={lightTheme.goal.bg}
        color={lightTheme.goal.border}
        textcolor='#FFF'
        onClick={onClick}
      />
    </div>
  )
}

function ControlPanel({
  showObservationLines,
  onToggleLines,
  onShowInterval,
  onShowSummary,
}: {
  showObservationLines: boolean
  onToggleLines: () => void
  onShowInterval: () => void
  onShowSummary: () => void
}) {
  return (
    <div className='absolute bottom-5 right-5 flex flex-col gap-0'>
      <CrayonTextButton
        text={showObservationLines ? '태양 고도 숨기기' : '태양 고도 표시하기'}
        width={280}
        bg={showObservationLines ? lightTheme.goal.border : lightTheme.goal.bg}
        color={showObservationLines ? lightTheme.goal.bg : lightTheme.goal.border}
        textcolor={showObservationLines ? lightTheme.goal.bg : '#FFF'}
        onClick={onToggleLines}
      />

      <TimeIntervalButton onClick={onShowInterval} />

      <SummaryButton onClick={onShowSummary} />
    </div>
  )
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showTimeIntervalImages, setShowTimeIntervalImages] = useState(false)
  const [showSummaryPopup, setShowSummaryPopup] = useState(false)
  const audioManager = AudioManager.getInstance()
  const [showActivityGuide, setShowActivityGuide] = useState(false)

  // BGM 관리
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  // 관찰 데이터 훅
  const observation = useObservation(timeData2)
  const { playSound, playBackgroundMusic } = useAudio()

  // BGM 초기화 및 관리
  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const audio = playBackgroundMusic()
    bgmRef.current = audio

    return () => {
      if (audio) {
        audio.pause()
        bgmRef.current = null
      }
    }
  }, [mounted, playBackgroundMusic])

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

  // 이벤트 핸들러들
  const handleEnterExperience = useCallback(async () => {
    setShowIntro(false)
    setBgmReady(true)
    playSound('/sounds/Enter_Cute.mp3')
  }, [playSound])

  const handleBackToIntro = useCallback(() => {
    setShowIntro(true)
    setShowTimeIntervalImages(false)
    setShowSummaryPopup(false)
    observation.selectTimeData(null)
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }, [observation, playSound])

  const handleLoadingComplete = useCallback(() => setIsLoaded(true), [])

  const handleShowInterval = useCallback(() => {
    setShowTimeIntervalImages(true)
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }, [playSound])

  const handleShowSummary = useCallback(() => {
    setShowSummaryPopup(true)
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }, [playSound])

  const handleToggleLines = useCallback(() => {
    observation.setShowObservationLines(!observation.showObservationLines)
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }, [observation, playSound])

  const handleToggleSpeed = useCallback(() => {
    observation.toggleSpeed()
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }, [observation, playSound])

  const handleShowActivityGuide = () => {
    audioManager.playGeneralButton()
    setShowActivityGuide(true)
  }

  const handleCloseActivityGuide = () => setShowActivityGuide(false)

  return (
    <div className='w-screen h-screen bg-gradient-to-b from-sky-200 to-sky-400 flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />
      <CrayonTextButton
        ariaLabel='첫 화면으로'
        icon='home'
        position='absolute'
        iconPosition='left'
        onClick={handleBackToIntro}
        width={96}
        height={96}
        color='#ffffff'
        textcolor='#ffffff'
        bg={lightTheme.start.bg}
        className='z-[20]'
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
        bg={lightTheme.start.bg}
        className='z-[20]'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {/* 메인 3D 씬 */}
      <div className='flex-1'>
        <Scene shadows camera={{ position: CAMERA_CONFIG.position, fov: 50 }}>
          <IntroMouseCameraController enabled={showIntro} />
          <Environment
            files='/img/cover/hdri.JPG'
            background={true}
            ground={{ height: 5, radius: 20, scale: 90 }}
            backgroundBlurriness={0.8}
            backgroundIntensity={0.7}
            environmentIntensity={0.8}
            backgroundRotation={[0, observation.sunPosition.azimuthRad, 0]}
          />

          {/* 조명 */}
          <ambientLight intensity={0.6} />
          <SunLight sunPosition={observation.sunPosition} />

          {/* 3D 모델들 */}
          {!showIntro && <CompassBillboard />}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial transparent opacity={0.5} />
          </mesh>

          {/* 막대 */}
          <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.1, 0.1, 2.5, 32]} />
            <meshStandardMaterial color='black' envMapIntensity={0} />
          </mesh>

          {/* 관측선 */}
          {observation.showObservationLines && !showTimeIntervalImages && (
            <AngleLines
              azimuth={observation.currentData.azimuth}
              altitude={observation.currentData.altitude}
              shadowLength={observation.currentData.shadowLength}
              sunPosition={observation.sunPosition}
            />
          )}

          {/* 온도계 - 항상 표시 */}
          {!showTimeIntervalImages && !showSummaryPopup && !showIntro && (
            <ThermometerDisplay temperature={observation.currentData.temperature} position={[0.6, 3.5, 0]} />
          )}

          <OrbitControls
            enabled={!showIntro && !showTimeIntervalImages}
            minDistance={CAMERA_CONFIG.minDistance}
            maxDistance={CAMERA_CONFIG.maxDistance}
            minPolarAngle={CAMERA_CONFIG.minPolarAngle}
            maxPolarAngle={CAMERA_CONFIG.maxPolarAngle}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Scene>
      </div>

      {/* UI 컴포넌트들 */}
      {!showIntro && (
        <>
          {!showTimeIntervalImages && <ObservationTable currentData={observation.currentData} />}

          {!showTimeIntervalImages && (
            <ProgressBar
              progress={observation.progress}
              isPlaying={observation.isPlaying}
              setIsPlaying={observation.togglePlayback}
              timeData={observation.timeData}
              onProgressClick={observation.handleProgressClick}
              playbackSpeed={observation.playbackSpeed}
              onSpeedToggle={handleToggleSpeed}
            />
          )}
          {!showTimeIntervalImages && (
            <ControlPanel
              showObservationLines={observation.showObservationLines}
              onToggleLines={handleToggleLines}
              onShowInterval={handleShowInterval}
              onShowSummary={handleShowSummary}
            />
          )}
        </>
      )}

      {/* 시간 간격 이미지 */}
      {showTimeIntervalImages && (
        <>
          <div className='fixed top-4 right-4 z-[1001]'>
            <CrayonTextButton
              text='돌아가기'
              width={120}
              bg={lightTheme.goal.bg}
              color='#FFFFFF'
              textcolor='#FFFFFF'
              onClick={() => {
                setShowTimeIntervalImages(false)
                observation.selectTimeData(null)
                playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
              }}
            />
          </div>

          <TimeIntervalImages
            currentData={observation.currentData}
            isVisible={showTimeIntervalImages}
            timeData={observation.timeData}
            onTimeSelect={observation.selectTimeData}
          />

          <div className='z-[1002]'>
            <ObservationTable currentData={observation.currentData} />
          </div>
        </>
      )}

      {/* 정리하기 팝업 */}
      <SummaryPopup isOpen={showSummaryPopup} onClose={() => setShowSummaryPopup(false)} />

      {/* 자막 표시 */}
      <SubtitleDisplay />

      {/* 인트로 화면 */}
      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='하루 동안 태양 고도, 그림자 길이, 기온의 관계 알아보기'
          description={['하루 동안 태양 고도, 그림자 길이, 기온의 변화를 살펴보고 이들의 관계를 알아봅시다.']}
          backgroundSvg='/img/cover/6-2-1.svg'
          descriptionSound='/sounds/6-2-1/narration/6-2-1-Goal.MP3'
          onActivityGuide={handleShowActivityGuide}
          buttonTheme={lightTheme}
        />
      )}
      <ActivityGuideModal isOpen={showActivityGuide} onClose={handleCloseActivityGuide} />
    </div>
  )
}
