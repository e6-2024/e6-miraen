import { useState, useMemo, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useProgress } from '@react-three/drei'
import Light1 from '@/components/6-2-3/Light1'
import Light2 from '@/components/6-2-3/Light2'
import Fan1 from '@/components/6-2-3/Fan1'
import Fan2 from '@/components/6-2-3/Fan2'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import BG from '@/components/6-2-3/BG'
import * as THREE from 'three'

import { AnimatePresence, motion } from 'framer-motion'
import ConnectedBuzzers from '@/components/6-2-3/ConnectedBuzzers'
import ConnectedLights from '@/components/6-2-3/ConnectedLights'
import ConnectedFans from '@/components/6-2-3/ConnectedFans'

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

// 정리하기 팝업 컴포넌트
function SummaryPopup({
  mode,
  isOpen,
  onClose,
}: {
  mode: 'light' | 'buzzer' | 'fan'
  isOpen: boolean
  onClose: () => void
}) {
  const summaryTexts = {
    light: '전기 회로에 전지 한 개를 연결할 때보다 전지 두 개를 직렬연결할 때 전구의 밝기가 더 밝습니다.',
    buzzer: '전기 회로에 전지 한 개를 연결할 때보다 전지 두 개를 직렬연결할 때 버저에서 나는 소리가 더 큽니다.',
    fan: '전기 회로에 전지 한 개를 연결할 때보다 전지 두 개를 직렬연결할 때 전동기의 날개가 더 빠르게 돌아갑니다.',
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
        onClick={onClose}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className='bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl'
          onClick={(e) => e.stopPropagation()}>
          <h2 className='text-2xl font-bold text-center mb-6 text-gray-800'>정리하기</h2>
          <p className='text-lg text-center font-light text-gray-700 leading-relaxed mb-8'>{summaryTexts[mode]}</p>
          <div className='text-center'>
            <button
              onClick={onClose}
              className='px-8 py-3 bg-blue-500 text-white rounded-xl font-light hover:bg-blue-600 transition-colors duration-200'>
              확인
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Home() {
  // 랜덤 모드 선택 함수
  const getRandomMode = useCallback((): 'light' | 'buzzer' | 'fan' => {
    const modes: ('light' | 'buzzer' | 'fan')[] = ['light', 'buzzer', 'fan']
    return modes[Math.floor(Math.random() * modes.length)]
  }, [])

  // 초기 랜덤 모드로 설정 (intro 상태에서는 랜덤 모드가 미리 선택됨)
  const [initialRandomMode] = useState<'light' | 'buzzer' | 'fan'>(() => getRandomMode())
  const [mode, setMode] = useState<'light' | 'buzzer' | 'fan' | null>(null)
  const [showSummaryPopup, setShowSummaryPopup] = useState(false)

  // 전구 조명 세기 조절
  const [light1Intensity, setLight1Intensity] = useState(1.0)
  const [light2Intensity, setLight2Intensity] = useState(0.5)

  // Intro 관련 상태
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  // 자막 관련 상태
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [subtitleText, setSubtitleText] = useState('')

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

  // 자막과 함께 오디오 재생하는 함수
  const playAudioWithSubtitle = useCallback((audioPath: string, subtitle: string, duration: number = 5000) => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7

      // 자막 표시
      setSubtitleText(subtitle)
      setShowSubtitle(true)

      // 오디오 재생
      audio.play().catch((error) => {
        console.log('오디오 재생 실패:', error.name)
      })

      // 오디오 종료 시 자막 숨김
      audio.addEventListener('ended', () => {
        setShowSubtitle(false)
      })

      // fallback: 지정된 시간 후 자막 숨김
      setTimeout(() => {
        setShowSubtitle(false)
      }, duration)
    } catch (error) {
      console.log('오디오 생성 실패:', error)
    }
  }, [])

  const handleLoadingComplete = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleEnterExperience = useCallback(() => {
    // 효과음 재생
    playClickSound()

    // 효과음이 재생될 시간을 확보한 후 Intro 숨기고 모드 선택 화면으로 이동
    setTimeout(() => {
      setShowIntro(false)
      // mode는 null로 유지해서 모드 선택 화면을 보여줌
    }, 300) // 300ms 지연
  }, [playClickSound])

  const handleModeSelect = useCallback(
    (selectedMode: 'light' | 'buzzer' | 'fan') => {
      playClickSound()
      setMode(selectedMode)

      // 모드 진입 시 A 오디오와 자막 재생
      setTimeout(() => {
        playAudioWithSubtitle('/sounds/6-2-3/narration/6-2-3-A.MP3', '전기 회로에 전지를 연결해 보세요.', 6000)
      }, 500)
    },
    [playClickSound, playAudioWithSubtitle],
  )

  const handleBackToModeSelection = useCallback(() => {
    playClickSound()
    // 부드러운 전환을 위해 약간의 지연 추가
    setTimeout(() => {
      setMode(null)
    }, 100)
  }, [playClickSound])

  const handleSummaryClick = useCallback(() => {
    if (!mode) return

    // 정리하기 버튼 클릭 사운드
    playClickSound()

    // 각 모드별 정리하기 오디오 재생
    const summaryAudioMap = {
      light: '/sounds/6-2-3/narration/6-2-3-E.MP3',
      buzzer: '/sounds/6-2-3/narration/6-2-3-F.MP3',
      fan: '/sounds/6-2-3/narration/6-2-3-G.MP3',
    }

    playClickSound(summaryAudioMap[mode])
    setShowSummaryPopup(true)
  }, [mode, playClickSound])

  const handleCloseSummaryPopup = useCallback(() => {
    setShowSummaryPopup(false)
  }, [])

  // 현재 모드에 따라 컴포넌트를 조건부 렌더링 (useMemo로 최적화)
  const getCurrentComponents = useMemo(() => {
    const currentMode = showIntro ? initialRandomMode : mode // intro 상태에서는 랜덤 모드 사용

    switch (currentMode) {
      case 'light':
        return (
          <>
            <ConnectedLights key='connected-lights' scale={1} position={[0, 0, 0]} />
          </>
        )
      case 'buzzer':
        return (
          <>
            <ConnectedBuzzers key='connected-buzzers' scale={1} position={[0, 0, 0]} />
          </>
        )
      case 'fan':
        return (
          <>
            <ConnectedFans key='connected-fans' scale={1} position={[0, 0, 0]} />
          </>
        )
      default:
        return null
    }
  }, [mode, showIntro, initialRandomMode, light1Intensity, light2Intensity])

  const modeButtons = useMemo(
    () => [
      {
        mode: 'light' as const,
        label: '전구를 연결한 전기회로',
        color: '#ffbc04',
        hoverColor: '#f5c951',
      },
      {
        mode: 'buzzer' as const,
        label: '버저를 연결한 전기회로',
        color: '#2dc46e',
        hoverColor: '#48dd89',
      },
      {
        mode: 'fan' as const,
        label: '전동기를 연결한 전기회로',
        color: '#b73ce8',
        hoverColor: '#ba5ae1',
      },
    ],
    [],
  )

  return (
    <div className='w-screen h-screen bg-white flex flex-col'>
      {/* 모드 선택 버튼들 */}
      <AnimatePresence>
        {!showIntro && mode === null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='fixed top-0 left-0 z-10 w-full h-full p-4 flex gap-4 justify-center items-center bg-gray-100 border-b shadow-sm'>
            {modeButtons.map(({ mode: buttonMode, label, color, hoverColor }) => (
              <button
                key={buttonMode}
                className='px-6 pt-5 pb-6 rounded-[30px] shadow-[inset_0px_-10px_10px_0px_rgba(50,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:shadow-[inset_0px_-10px_10px_0px_rgba(50,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(50,0,0,0.50)] transition-all duration-300'
                style={
                  {
                    backgroundColor: color,
                    '--hover-bg': hoverColor,
                  } as React.CSSProperties & { '--hover-bg': string }
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hoverColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = color
                }}
                onClick={() => handleModeSelect(buttonMode)}
                aria-label={`${label} 모드 선택`}>
                <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                  {label}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 뒤로가기 버튼 */}
      <AnimatePresence>
        {mode !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute top-4 left-4 z-10 w-fit h-fit'>
            <button
              onClick={handleBackToModeSelection}
              className='px-6 pt-3 pb-4 bg-[#FF8026] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#ff9b54] hover:shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(152,0,0,0.50)] transition-all duration-300'
              aria-label='모드 선택 화면으로 돌아가기'>
              <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                뒤로가기
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 정리하기 버튼 */}
      <AnimatePresence>
        {mode !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute top-4 right-4 z-10 w-fit h-fit'>
            <button
              onClick={handleSummaryClick}
              className='px-6 pt-3 pb-4 bg-[#4CAF50] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(0,152,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#66BB6A] hover:shadow-[inset_0px_-10px_10px_0px_rgba(0,152,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(0,152,0,0.50)] transition-all duration-300'
              aria-label='정리하기'>
              <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                정리하기
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D 씬 */}
      <div className='flex-1 relative overflow-hidden'>
        <Scene
          shadows
          gl={{ shadowMap: { enabled: true, type: THREE.PCFSoftShadowMap } }}
          camera={{ position: [14, 8, 15], fov: 50 }}>
          <LoadingTracker onLoadingComplete={handleLoadingComplete} />

          <fog attach='fog' args={['#0c0c0cff', 10, 25]} />
          <fogExp2 attach='fog' color={'#ffffffff'} density={0.002} />
          <ambientLight intensity={0.5} />
          <directionalLight
            intensity={mode === 'light' || (showIntro && initialRandomMode === 'light') ? 1 : 3}
            position={[2, 5, 5]}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={50}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            shadow-bias={-0.0001}
            shadow-normalBias={0.2}
          />

          <hemisphereLight args={['#ffffff', '#404040', 0.3]} />
          <AnimatePresence mode='wait'>
            {getCurrentComponents && (
              <group key={showIntro ? `intro-${initialRandomMode}` : mode}>{getCurrentComponents}</group>
            )}
          </AnimatePresence>
          <BG mode={showIntro ? initialRandomMode : mode} />
          <OrbitControls
            enabled={!showIntro}
            enablePan={true}
            enableRotate={true}
            enableZoom={true}
            minDistance={0}
            maxDistance={17}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 3}
          />
        </Scene>
      </div>

      {/* Intro 화면 */}
      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='전지의 수에 따른 전기 회로의 특징 비교하기'
          description={['전지 1 개를 연결한 전기 회로와 전지 2 개를 직렬연결한 전기 회로의 특징을 비교해 봅시다.']}
          backgroundSvg='/img/cover/6-2-3.svg'
          descriptionSound='/sounds/6-2-3/narration/6-2-3-Goal.MP3'
        />
      )}

      {/* 정리하기 팝업 */}
      {mode && <SummaryPopup mode={mode} isOpen={showSummaryPopup} onClose={handleCloseSummaryPopup} />}

      {/* 자막 표시 */}
      <AnimatePresence>
        {showSubtitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className='fixed bottom-8 left-0 right-0 z-50 flex justify-center'>
            <div className='bg-black bg-opacity-80 rounded-xl px-8 py-4 max-w-lg'>
              <div className='text-white text-xl font-bold text-center leading-relaxed whitespace-pre-line'>
                {subtitleText}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
