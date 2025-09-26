import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { LoadingTracker } from '@/components/5-1-3/LoadingTracker'
import { ExperimentScene } from '@/components/5-1-3/ExperimentScene'
import { BeakerControlPanel } from '@/components/5-1-3/BeakerControlPanel'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { useSpoonBySpoonBeaker } from '@/hook/5-1-3/useSpoonBySpoonBeaker'
import { useTomatoDrop } from '@/hook/5-1-3/useTomatoDrop'
import { useSpoonAnimation } from '@/hook/5-1-3/useSpoonAnimation'
import { EXPERIMENT_CONFIGS, CAMERA_CONFIG, calculateSugarConcentration, playClickSound } from '@/utils/5-1-3/utils'

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => setMounted(true), [])

  const leftBeaker = useSpoonBySpoonBeaker(EXPERIMENT_CONFIGS.left.beakerId, EXPERIMENT_CONFIGS.left.spoonsCount)
  const leftTomato = useTomatoDrop('LEFT_TOMATO')
  const rightBeaker = useSpoonBySpoonBeaker(EXPERIMENT_CONFIGS.right.beakerId, EXPERIMENT_CONFIGS.right.spoonsCount)
  const rightTomato = useTomatoDrop('RIGHT_TOMATO')

  const leftSpoon = useSpoonAnimation()
  const rightSpoon = useSpoonAnimation()

  const leftConcentration = calculateSugarConcentration(leftBeaker.totalDissolved)
  const rightConcentration = calculateSugarConcentration(rightBeaker.totalDissolved)

  // BGM 관련 상태
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  // BGM 설정 로드
  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [mounted])

  // BGM 초기화
  useEffect(() => {
    if (!mounted) return
    const el = new Audio('/sounds/5-1-3/5-1-3-BGM.mp3')
    el.loop = true
    el.volume = 0.2
    bgmRef.current = el
    return () => {
      el.pause()
      bgmRef.current = null
    }
  }, [mounted])

  // BGM 재생/정지 제어
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

  const handleBackToIntro = useCallback(() => {
    setShowIntro(true)
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }, [])

  const handleBackToModeSelection = useCallback(() => {
    setShowIntro(true)
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }, [])

  useEffect(() => {
    console.log('Left beaker isDropping changed:', leftBeaker.isDropping, 'isAnimating:', leftSpoon.isAnimating)
    if (leftBeaker.isDropping && !leftSpoon.isAnimating) {
      console.log('Left spoon animation triggered!')
      leftSpoon.triggerAnimation()
    }
  }, [leftBeaker.isDropping, leftSpoon.isAnimating, leftSpoon.triggerAnimation])

  useEffect(() => {
    console.log('Right beaker isDropping changed:', rightBeaker.isDropping, 'isAnimating:', rightSpoon.isAnimating)
    if (rightBeaker.isDropping && !rightSpoon.isAnimating) {
      console.log('Right spoon animation triggered!')
      rightSpoon.triggerAnimation()
    }
  }, [rightBeaker.isDropping, rightSpoon.isAnimating, rightSpoon.triggerAnimation])

  useEffect(() => {
    if (leftTomato.isDropped && !leftSpoon.isAnimating) {
      leftSpoon.triggerAnimation()
    }
  }, [leftTomato.isDropped, leftSpoon.isAnimating, leftSpoon.triggerAnimation])

  useEffect(() => {
    if (rightTomato.isDropped && !rightSpoon.isAnimating) {
      rightSpoon.triggerAnimation()
    }
  }, [rightTomato.isDropped, rightSpoon.isAnimating, rightSpoon.triggerAnimation])

  const handleLoadingComplete = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleEnterExperience = useCallback(() => {
    playClickSound()
    setBgmReady(true)
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }, [])

  return (
    <div className='w-screen h-screen bg-[#FBF0C7] flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />
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
        bg='rgba(255,255,255,0.10)'
        className='background-blur z-[200] mix-blend-difference'
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
        bg='rgba(255,255,255,0.10)'
        className='backdrop-blur z-[200] mix-blend-difference'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {/* 컨트롤 패널들 */}
      {!showIntro && (
        <>
          <BeakerControlPanel
            beaker={leftBeaker}
            tomato={leftTomato}
            spoon={leftSpoon}
            side='left'
            spoonsCount={EXPERIMENT_CONFIGS.left.spoonsCount}
          />
          <BeakerControlPanel
            beaker={rightBeaker}
            tomato={rightTomato}
            spoon={rightSpoon}
            side='right'
            spoonsCount={EXPERIMENT_CONFIGS.right.spoonsCount}
          />
        </>
      )}

      {/* 3D 씬 */}
      <div className='flex-1'>
        <Scene shadows camera={{ position: CAMERA_CONFIG.position, fov: CAMERA_CONFIG.fov }}>
          <ExperimentScene
            leftBeaker={leftBeaker}
            rightBeaker={rightBeaker}
            leftTomato={leftTomato}
            rightTomato={rightTomato}
            leftSpoon={leftSpoon}
            rightSpoon={rightSpoon}
            leftConcentration={leftConcentration}
            rightConcentration={rightConcentration}
          />
        </Scene>
      </div>

      {/* 인트로 화면 */}
      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='진하기가 다른 두 용액에서 같은 물체가 뜨는 정도 관찰하기'
          description={[
            '색깔로 진하기를 알 수 없는 두 용액에 같은 물체를 넣어 용액의 상대적인 진하기를 비교해 봅시다.',
          ]}
          backgroundSvg='/img/cover/5-1-3.svg'
          descriptionSound='/sounds/5-1-3/narration/5-1-3-Goal.MP3'
        />
      )}
    </div>
  )
}