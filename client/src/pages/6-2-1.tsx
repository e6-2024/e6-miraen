import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, useProgress } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import * as THREE from 'three'

import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'

import Model from '@/components/6-2-1/Model'
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
import { useNarrationManager } from '@/components/6-2-1/useNarrationManager'

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
  const [isHovered, setIsHovered] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { playNarration, isCurrentlyPlaying, isOtherNarrationPlaying, isAnyNarrationPlaying } =
    useNarrationManager('time-interval-button')

  const handlePlayNarration = async () => {
    try {
      await playNarration(
        '/sounds/6-2-1/narration/6-2-1-G.MP3',
        '9 시 30 분부터 15 시 30 분까지 1 시간 간격으로 측정한 관측 자료를 확인해 봅시다.',
        0.7,
      )
    } catch (error) {
      console.log('나레이션 재생 실패:', error)
    }
  }

  const handleMouseEnter = () => {
    setIsHovered(true)

    if (!isAnyNarrationPlaying()) {
      timeoutRef.current = setTimeout(() => {
        handlePlayNarration()
      }, 200)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const isDisabled = isOtherNarrationPlaying()
  const isPlaying = isCurrentlyPlaying()

  return (
    <div className='relative' onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {isDisabled && isHovered && (
        <div className='absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-40'>
          <div className='bg-orange-500/90 text-white font-light px-3 py-1 rounded-lg text-xs shadow-lg'>
            다른 설명이 재생 중입니다
          </div>
        </div>
      )}

      <CrayonTextButton
        text='시간 간격 관측 자료'
        width={190}
        bg={lightTheme.goal.bg}
        color={lightTheme.goal.border}
        textcolor='#FFF'
        onClick={onClick}
        className={isPlaying ? 'scale-105' : ''}
      />

      {isPlaying && (
        <div className='absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center animate-pulse'>
          <div className='w-2 h-2 bg-white rounded-full animate-ping'></div>
        </div>
      )}

      {isDisabled && (
        <div className='absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center'>
          <div className='w-2 h-2 bg-white rounded-full'></div>
        </div>
      )}
    </div>
  )
}

function SummaryButton({ onClick }: { onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { playNarration, isCurrentlyPlaying, isOtherNarrationPlaying, isAnyNarrationPlaying } =
    useNarrationManager('summary-button')

  const handlePlayNarration = async () => {
    try {
      await playNarration(
        '/sounds/6-2-1/narration/6-2-1-H.MP3',
        '하루 동안 태양 고도, 그림자 길이, 기온의 관계를 알아봅시다.',
        0.7,
      )
    } catch (error) {
      console.log('나레이션 재생 실패:', error)
    }
  }

  const handleMouseEnter = () => {
    setIsHovered(true)

    if (!isAnyNarrationPlaying()) {
      timeoutRef.current = setTimeout(() => {
        handlePlayNarration()
      }, 200)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const isDisabled = isOtherNarrationPlaying()
  const isPlaying = isCurrentlyPlaying()

  return (
    <div className='relative' onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {isDisabled && isHovered && (
        <div className='absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-40'>
          <div className='bg-orange-500/90 text-white font-light px-3 py-1 rounded-lg text-xs shadow-lg'>
            다른 설명이 재생 중입니다
          </div>
        </div>
      )}

      <CrayonTextButton
        text='정리하기'
        width={190}
        bg={lightTheme.goal.bg}
        color={lightTheme.goal.border}
        textcolor='#FFF'
        onClick={onClick}
        className={isPlaying ? 'scale-105' : ''}
      />

      {isPlaying && (
        <div className='absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center animate-pulse'>
          <div className='w-2 h-2 bg-white rounded-full animate-ping'></div>
        </div>
      )}

      {isDisabled && (
        <div className='absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center'>
          <div className='w-2 h-2 bg-white rounded-full'></div>
        </div>
      )}
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
        width={190}
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

function NarrationText() {
  return (
    <div className='absolute top-1/2 z-[30] left-1/2 -translate-x-1/2 -translate-y-1/2 font-light'>
      <CrayonTextBox bg='#FFFFFF' color='#F3921C' animated={true}>
        시간에 따라 변하는 태양 고도, 그림자 길이, 기온을 관찰해봅시다.
      </CrayonTextBox>
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
  const [showNarrationText, setShowNarrationText] = useState(true)

  // BGM 관리
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  // 관찰 데이터 훅
  const observation = useObservation(timeData2)
  const { playSound, playNarration, stopNarration, playBackgroundMusic } = useAudio()

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
  const handleEnterExperience = useCallback(() => {
    setShowIntro(false)
    setBgmReady(true)
    playSound('/sounds/Enter_Cute.mp3')

    setTimeout(() => {
      playNarration('intro')
      setShowNarrationText(true)
      setTimeout(() => setShowNarrationText(false), 4000)
    }, 1000)
  }, [playSound, playNarration])

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

  return (
    <div className='w-screen h-screen bg-gradient-to-b from-sky-200 to-sky-400 flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />
      <CrayonTextButton
        ariaLabel='첫 화면으로'
        icon='home'
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
        className='backdrop-blur z-[1000] mix-blend-difference'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {/* 나레이션 텍스트 */}
      {showNarrationText && !showIntro && <NarrationText />}

      {/* 뒤로가기 버튼 */}
      {!showIntro && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute top-4 left-4 z-10'>
            <CrayonTextButton
              ariaLabel='첫 화면으로 돌아가기'
              text='첫 화면으로'
              icon='arrow-left'
              iconPosition='left'
              width={170}
              height={75}
              iconSize={30}
              bg={lightTheme.start.bg}
              color={lightTheme.start.border}
              textcolor={lightTheme.start.text}
              onClick={handleBackToIntro}
              innerCircleVisible={false}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* 메인 3D 씬 */}
      <div className='flex-1'>
        <Scene shadows camera={{ position: CAMERA_CONFIG.position, fov: 50 }}>
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
          <CompassBillboard />

          {/* 그림자 평면 */}
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

          {/* 온도계 */}
          {observation.showThermometer && !showTimeIntervalImages && !showSummaryPopup && !showIntro && (
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
            />
          )}

          {/* 컨트롤 패널 */}
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
          buttonTheme={lightTheme}
        />
      )}
    </div>
  )
}
