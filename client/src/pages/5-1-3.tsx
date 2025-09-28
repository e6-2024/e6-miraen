// app/5-1-3/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { LoadingTracker } from '@/components/5-1-3/LoadingTracker'
import { ExperimentScene } from '@/components/5-1-3/ExperimentScene'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { CAMERA_CONFIG, playClickSound } from '@/utils/5-1-3/utils'
import { TiltOnMouse } from '@/components/common/Tilt'

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [experimentStarted, setExperimentStarted] = useState(true)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [selectedBeaker, setSelectedBeaker] = useState<'left' | 'right' | null>(null)

  // 실험 단계 상태
  const [leftDissolved, setLeftDissolved] = useState(false)
  const [rightDissolved, setRightDissolved] = useState(false)
  const [tomatoDragPhase, setTomatoDragPhase] = useState(false)
  const [tomatoDroppedSide, setTomatoDroppedSide] = useState<'left' | 'right' | null>(null)
  const [showRemoveButton, setShowRemoveButton] = useState(false)
  const [leftTested, setLeftTested] = useState(false)
  const [rightTested, setRightTested] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => setMounted(true), [])

  // Audio
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const narrationRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  const handlePowderDissolved = useCallback((side: 'left' | 'right') => {
    if (side === 'left') setLeftDissolved(true)
    else setRightDissolved(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [mounted])

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
    if (narrationRef.current) {
      narrationRef.current.pause()
      narrationRef.current = null
    }
    setShowIntro(true)
    setExperimentStarted(false)
    setShowSubtitle(false)
    setSelectedBeaker(null)
    setLeftDissolved(false)
    setRightDissolved(false)
    setTomatoDragPhase(false)
    setTomatoDroppedSide(null)
    setShowRemoveButton(false)
    setLeftTested(false)
    setRightTested(false)
    setShowSummary(false)
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }, [])

  const handleLoadingComplete = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleEnterExperience = useCallback(() => {
    playClickSound()
    setBgmReady(true)
    setTimeout(() => {
      setShowIntro(false)
      setExperimentStarted(true)
      setShowSubtitle(true)

      // 기존 내레이션 정리
      narrationRef.current?.pause()

      // 내레이션 설정
      const narration = new Audio('/sounds/5-1-3/narration/5-1-3-A.MP3')
      narration.volume = 0.8
      narrationRef.current = narration
      narration.play().catch(() => {})
    }, 300)
  }, [])

  // 내레이션 종료 시 자막 끄기
  useEffect(() => {
    const el = narrationRef.current
    if (!el) return
    const onEnd = () => setShowSubtitle(false)
    el.addEventListener('ended', onEnd)
    return () => el.removeEventListener('ended', onEnd)
  }, [showIntro, experimentStarted])

  const handleNarrationComplete = useCallback(() => {
    setShowSubtitle(false)
  }, [])

  const handleBeakerSelected = useCallback((beaker: 'left' | 'right') => {
    setSelectedBeaker(beaker)
    setShowSubtitle(true)
  }, [])

  // 토마토 드래그 페이즈 시작
  const handleTomatoDragPhaseStart = useCallback(() => {
    setTomatoDragPhase(true)
    setShowSubtitle(true)
    console.log('토마토 드래그 페이즈 시작 - 양쪽 stick wiping 완료됨')
  }, [])

  // 토마토 드롭 핸들러
  const handleTomatoDropped = useCallback((beaker: 'left' | 'right') => {
    setTomatoDroppedSide(beaker)
    setShowRemoveButton(true)
    
    // 해당 비커에 대한 테스트 마크
    if (beaker === 'left') {
      setLeftTested(true)
      // 왼쪽 비커 내레이션
      const narration = new Audio('/sounds/5-1-3/narration/left-sink.mp3') // 실제 파일 경로로 변경
      narration.volume = 0.8
      narrationRef.current = narration
      narration.play().catch(() => {})
    } else {
      setRightTested(true)
      // 오른쪽 비커 내레이션
      const narration = new Audio('/sounds/5-1-3/narration/right-float.mp3') // 실제 파일 경로로 변경
      narration.volume = 0.8
      narrationRef.current = narration
      narration.play().catch(() => {})
    }
  }, [])

  // 토마토 제거 핸들러
  const handleTomatoRemoved = useCallback(() => {
    // 전역 함수 호출
    ;(window as any).removeTomato?.()
    setTomatoDroppedSide(null)
    setShowRemoveButton(false)
  }, [])

  // 실험 완료 핸들러
  const handleExperimentComplete = useCallback(() => {
    setShowSummary(true)
    setShowSubtitle(true)
  }, [])

  // 설탕 실험 시작 핸들러
  const handleStartSugarExperiment = (side: 'left' | 'right') => {
    if (side === 'left') {
      ;(window as any).startLeftSugarExperiment?.()
    } else {
      ;(window as any).startRightSugarExperiment?.()
    }
  }

  return (
    <div className='w-screen h-screen bg-[#999] flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      {/* 홈 */}
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

      {/* BGM */}
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

      {/* 자막 표시 */}
      {showSubtitle && (
        <div className='fixed top-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3'>
          {/* 초기 설탕 실험 단계 */}
          {!tomatoDragPhase && selectedBeaker === null && (
            <CrayonTextBox
              color='#01A7A2'
              bg='#FFF'
              textcolor='#333'
              className='font-light'
              width={600}
              text='같은 양의 물에 설탕의 양을 다르게 용해하여 진하기가 다른 두 용액을 만들어 보세요.'
            />
          )}

          {/* 비커 선택 단계 */}
          {!tomatoDragPhase && selectedBeaker !== null && (
            <CrayonTextBox className='flex gap-3 items-center'>
              <CrayonTextButton
                ariaLabel='선택된 비커 안내'
                position='relative'
                text={
                  selectedBeaker === 'left'
                    ? '왼쪽 비커: 설탕 한 숟가락 용해하기'
                    : '오른쪽 비커: 설탕 다섯 숟가락 용해하기'
                }
                width={360}
                height={72}
                color='#01A7A2'
                textcolor='#fff'
                bg='rgba(1,167,162,0.85)'
                className='shadow-lg'
                iconPosition='left'
                iconSize={20}
                innerCircleVisible={true}
              />

              <div className='flex flex-col gap-2'>
                <button
                  onClick={() => handleStartSugarExperiment(selectedBeaker)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-md
                  ${
                    selectedBeaker === 'left' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  } text-white`}>
                  설탕 넣기 시작
                </button>

                <button
                  onClick={() => setSelectedBeaker(null)}
                  className='rounded-lg px-4 py-2 text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 transition-colors shadow-md'>
                  선택 해제
                </button>
              </div>
            </CrayonTextBox>
          )}

          {/* 토마토 드래그 단계 */}
          {tomatoDragPhase && !showSummary && (
            <CrayonTextBox
              color='#FF6B6B'
              bg='#FFF'
              textcolor='#333'
              className='font-light'
              width={600}
              text='용액에 방울토마토를 드래그하여 넣어보세요.'
            />
          )}

          {/* 토마토 실험 결과 표시 */}
          {tomatoDroppedSide === 'left' && (
            <CrayonTextBox
              color='#4ECDC4'
              bg='#FFF'
              textcolor='#333'
              className='font-light'
              width={600}
              text='설탕 한 숟가락을 용해한 용액에서 방울토마토가 가라앉습니다.'
            />
          )}

          {tomatoDroppedSide === 'right' && (
            <CrayonTextBox
              color='#45B7D1'
              bg='#FFF'
              textcolor='#333'
              className='font-light'
              width={600}
              text='설탕 다섯 숟가락을 용해한 용액에서 방울토마토가 높이 떠오릅니다.'
            />
          )}

          {/* 정리하기 단계 */}
          {showSummary && (
            <CrayonTextBox
              color='#FFD93D'
              bg='#FFF'
              textcolor='#333'
              className='font-light'
              width={700}
              text='같은 물체를 넣었을 때 물체가 높이 떠오른 용액이 더 진한 용액입니다.'
            />
          )}
        </div>
      )}

      {/* 방울토마토 꺼내기 버튼 */}
      {showRemoveButton && (
        <div className='fixed bottom-20 left-1/2 -translate-x-1/2 z-10'>
          <CrayonTextButton
            text='방울토마토 꺼내기'
            position='relative'
            width={200}
            height={60}
            color='#FF6B6B'
            textcolor='#fff'
            bg='rgba(255,107,107,0.9)'
            className='shadow-lg font-medium'
            onClick={handleTomatoRemoved}
            innerCircleVisible={true}
          />
        </div>
      )}

      {/* 정리하기 버튼 */}
      {showSummary && (
        <div className='fixed bottom-20 left-1/2 -translate-x-1/2 z-10'>
          <CrayonTextButton
            text='정리하기'
            position='relative'
            width={200}
            height={60}
            color='#FFD93D'
            textcolor='#333'
            bg='rgba(255,217,61,0.9)'
            className='shadow-lg font-bold'
            onClick={() => {
              // 정리하기 로직 (예: 다음 단계로 이동)
              console.log('정리하기 완료')
            }}
            innerCircleVisible={true}
          />
        </div>
      )}

      {/* 용해 완료 알림 */}
      <AnimatePresence>
        {leftDissolved && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className='pointer-events-none fixed bottom-32 left-[18%] -translate-x-1/2 z-[150]'>
            <div className='bg-black/60 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap'>
              가루가 다 용해되었어요!
            </div>
          </motion.div>
        )}
        {rightDissolved && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className='pointer-events-none fixed bottom-32 right-[18%] translate-x-1/2 z-[150]'>
            <div className='bg-black/60 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap'>
              가루가 다 용해되었어요!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <Scene shadows camera={{ position: CAMERA_CONFIG.position, fov: CAMERA_CONFIG.fov }}>
        <TiltOnMouse enabled={showIntro} maxDeg={5}>
          <ExperimentScene
            experimentStarted={experimentStarted}
            onNarrationComplete={handleNarrationComplete}
            onBeakerSelected={handleBeakerSelected}
            onPowderDissolved={handlePowderDissolved}
            onTomatoDragPhaseStart={handleTomatoDragPhaseStart}
            onTomatoDropped={handleTomatoDropped}
            onExperimentComplete={handleExperimentComplete}
            leftDissolved={leftDissolved}
            rightDissolved={rightDissolved}
          />
        </TiltOnMouse>
      </Scene>

      {/* Intro */}
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