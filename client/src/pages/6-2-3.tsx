import { useState, useMemo, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useProgress, Environment } from '@react-three/drei'
import Light1 from '@/components/6-2-3/Light1'
import Light2 from '@/components/6-2-3/Light2'
import Fan1 from '@/components/6-2-3/Fan1'
import Fan2 from '@/components/6-2-3/Fan2'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import BG from '@/components/6-2-3/BG'
import * as THREE from 'three'
import AudioManager from '@/components/6-2-3/AudioManager'
import { AnimatePresence, motion } from 'framer-motion'
import ConnectedBuzzers from '@/components/6-2-3/ConnectedBuzzers'
import ConnectedLights from '@/components/6-2-3/ConnectedLights'
import ConnectedFans from '@/components/6-2-3/ConnectedFans'
import IntroMouseCameraController from '@/components/IntroMouseCameraController'

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
  const audioManager = AudioManager.getInstance()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
        onClick={() => {
          audioManager.playGeneralButton()
          onClose()
        }}>
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
              onClick={() => {
                audioManager.playGeneralButton()
                onClose()
              }}
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
  // AudioManager 인스턴스
  const audioManager = AudioManager.getInstance()

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

  const playClickSound = useCallback(
    (audioPath: string = '/sounds/Enter_Cute.mp3') => {
      audioManager.playEffect(audioPath, 0.7).catch((error) => {
        console.log('효과음 재생 실패:', error)
      })
    },
    [audioManager],
  )

  // 자막과 함께 오디오 재생하는 함수
  const playAudioWithSubtitle = useCallback(
    (audioPath: string, subtitle: string, duration: number = 5000) => {
      // 자막 표시
      setSubtitleText(subtitle)
      setShowSubtitle(true)

      // 나레이션 재생
      audioManager
        .playNarration(audioPath, 0.7)
        .then(() => {
          // 오디오 종료 시 자막 숨김
          setShowSubtitle(false)
        })
        .catch((error) => {
          console.log('나레이션 재생 실패:', error)
          setShowSubtitle(false)
        })

      // fallback: 지정된 시간 후 자막 숨김
      setTimeout(() => {
        setShowSubtitle(false)
      }, duration)
    },
    [audioManager],
  )

  const handleLoadingComplete = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleEnterExperience = useCallback(() => {
    playClickSound()
  }, [playClickSound, mode])

  const handleModeSelect = useCallback(
    (selectedMode: 'light' | 'buzzer' | 'fan') => {
      audioManager.playGeneralButton()
      setMode(selectedMode)
      setShowIntro(false)
      setTimeout(() => {
        playAudioWithSubtitle('/sounds/6-2-3/narration/6-2-3-A.MP3', '전기 회로에 전지를 연결해 보세요.', 6000)
      }, 500)
    },
    [playAudioWithSubtitle, audioManager],
  )

  const handleBackToModeSelection = useCallback(() => {
    audioManager.playGeneralButton()
    audioManager.stopAll()
    setTimeout(() => {
      setMode(null)
      setShowIntro(true)
    }, 100)
  }, [audioManager])

  const handleSummaryClick = useCallback(() => {
    if (!mode) return

    // 정리하기 버튼 클릭 사운드
    audioManager.playGeneralButton()

    // 각 모드별 정리하기 오디오 재생
    const summaryAudioMap = {
      light: '/sounds/6-2-3/narration/6-2-3-E.MP3',
      buzzer: '/sounds/6-2-3/narration/6-2-3-F.MP3',
      fan: '/sounds/6-2-3/narration/6-2-3-G.MP3',
    }

    audioManager.playNarration(summaryAudioMap[mode], 0.7).catch((error) => {
      console.log('정리하기 나레이션 재생 실패:', error)
    })

    setShowSummaryPopup(true)
  }, [mode, playClickSound, audioManager])

  const handleCloseSummaryPopup = useCallback(() => {
    setShowSummaryPopup(false)
  }, [])

  // 컴포넌트 언마운트 시 모든 오디오 정리
  useEffect(() => {
    return () => {
      audioManager.stopAll()
    }
  }, [audioManager])

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
      {mode === null && !showIntro && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='absolute inset-0 z-40 flex flex-row items-center justify-center gap-8 bg-white/90 backdrop-blur-sm'>
          <div className='flex flex-row gap-6 max-w-md w-full px-4'>
            {modeButtons.map(({ mode: buttonMode, label, color, hoverColor }, index) => (
              <motion.button
                key={buttonMode}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                className='w-full px-6 pt-5 pb-6 rounded-[30px] shadow-[inset_0px_-10px_10px_0px_rgba(50,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:shadow-[inset_0px_-10px_10px_0px_rgba(50,0,0,0.70)] active:scale-95 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(50,0,0,0.50)] transition-all duration-300 hover:scale-105'
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
                onClick={() => {
                  handleModeSelect(buttonMode)
                }}
                aria-label={`${label} 모드 선택`}>
                <div className='text-center justify-center text-white text-xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                  {label}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {mode !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute top-4 left-4 z-10 w-fit h-fit'>
            <button
              onClick={() => {
                audioManager.playGeneralButton()
                handleBackToModeSelection()
              }}
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
          gl={{
            shadowMap: { enabled: true, type: THREE.PCFSoftShadowMap },
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.8,
          }}
          camera={{ position: [14, 8, 15], fov: 50 }}>
          <LoadingTracker onLoadingComplete={handleLoadingComplete} />
          <IntroMouseCameraController enabled={showIntro} />

          <fog attach='fog' args={['#0c0c0cff', 10, 25]} />
          <fogExp2 attach='fog' color={'#ffffffff'} density={0.002} />
          <directionalLight
            intensity={mode === 'light' || (showIntro && initialRandomMode === 'light') ? 2 : 4}
            position={[5, 10, 5]}
            castShadow
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
            shadow-camera-far={50}
            shadow-camera-left={-40}
            shadow-camera-right={40}
            shadow-camera-top={40}
            shadow-camera-bottom={-40}
            shadow-bias={-0.0005}
            shadow-normalBias={0.1}
          />

          <hemisphereLight args={['#ffffff', '#404040', 0.2]} />
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
          <Environment
            preset='warehouse'
            backgroundIntensity={mode === 'light' || (showIntro && initialRandomMode === 'light') ? 0.005 : 0.03}
            backgroundBlurriness={0.5}
            environmentIntensity={mode === 'light' || (showIntro && initialRandomMode === 'light') ? 0.2 : 0.8}
          />
        </Scene>
      </div>

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='전지의 수에 따른 전기 회로의 특징 비교하기'
          description={['전지 1 개를 연결한 전기 회로와 전지 2 개를 직렬연결한', '전기 회로의 특징을 비교해 봅시다.']}
          backgroundSvg='/img/cover/6-2-3.svg'
          descriptionSound='/sounds/6-2-3/narration/6-2-3-Goal.MP3'
          // 모드 선택 관련 props 추가
          showModeSelection={true}
          modeButtons={modeButtons}
          onModeSelect={handleModeSelect}
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
