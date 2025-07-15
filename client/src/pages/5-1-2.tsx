// pages/5-1-2.tsx
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useState, useMemo } from 'react'
import {
  OrbitControls,
  Environment,
  useProgress,
  AccumulativeShadows,
  RandomizedLight,
  ContactShadows,
} from '@react-three/drei'
import { OpticalLab } from '../scenes/OpticalLab'
import { RayToggleButton } from '@/components/5-1-2/buttonToggle'
import Scene from '@/components/canvas/Scene'
import Model from '@/components/5-1-2/Model'
import Intro from '@/components/intro/Intro'
import { SpeechBubble } from '@/components/5-1-2/SpeechBubble'

import * as THREE from 'three'

const PostEffects = dynamic(() => import('../components/5-1-2/PostEffects'), { ssr: false })

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

function ModeBasedControls({ mode }: { mode: 'direct' | 'reflection' | 'refraction' }) {
  const { camera } = useThree()

  const cameraConfigs = {
    direct: {
      position: [0, 0, 20] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
      minDistance: 5,
      maxDistance: 25,
      maxPolarAngle: Math.PI / 2,
      minAzimuthAngle: 0,
      maxAzimuthAngle: Math.PI / 4,
      enablePan: false,
      enableZoom: true,
      enableRotate: true,
    },
    reflection: {
      position: [-27, 10, -0.9] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
      minDistance: 5,
      maxDistance: 25,
      maxPolarAngle: Math.PI / 2.2,
      minAzimuthAngle: -Math.PI / 2,
      maxAzimuthAngle: Math.PI / 4,
      enablePan: false,
      enableZoom: true,
      enableRotate: true,
    },
    refraction: {
      position: [0, 0, 20] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
      minDistance: 5,
      maxDistance: 25,
      maxPolarAngle: Math.PI / 2,
      minAzimuthAngle: 0,
      maxAzimuthAngle: Math.PI / 4,
      enablePan: false,
      enableZoom: true,
      enableRotate: true,
    },
  }

  const currentConfig = cameraConfigs[mode]

  useEffect(() => {
    const newPosition = new THREE.Vector3(...currentConfig.position)
    camera.position.copy(newPosition)
    camera.lookAt(new THREE.Vector3(...currentConfig.target))
    camera.updateProjectionMatrix()
  }, [mode])

  return (
    <OrbitControls
      target={currentConfig.target}
      enableZoom={currentConfig.enableZoom}
      enablePan={currentConfig.enablePan}
      enableRotate={currentConfig.enableRotate}
      minDistance={currentConfig.minDistance}
      maxDistance={currentConfig.maxDistance}
      maxPolarAngle={currentConfig.maxPolarAngle}
      minAzimuthAngle={currentConfig.minAzimuthAngle}
      maxAzimuthAngle={currentConfig.maxAzimuthAngle}
      enableDamping={true}
      dampingFactor={0.05}
    />
  )
}

function ExplanationToggleButton({
  mode,
  lensType,
  onClick,
}: {
  mode: 'direct' | 'reflection' | 'refraction'
  lensType: 'convex' | 'concave'
  onClick: () => void
}) {
  const getTitle = () => {
    switch (mode) {
      case 'direct':
        return '빛의 직진'
      case 'reflection':
        return '빛의 반사'
      case 'refraction':
        return lensType === 'convex' ? '빛의 굴절 (볼록렌즈)' : '빛의 굴절 (오목렌즈)'
      default:
        return ''
    }
  }

  return (
    <button
      onClick={onClick}
      style={{
        bottom: '20px',
        right: '20px',
        padding: '12px 20px',
        backgroundColor: 'white',
        color: 'black',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
      }}>
      {getTitle()}
    </button>
  )
}

interface ExplanationBoxProps {
  isVisible: boolean
  mode: 'direct' | 'reflection' | 'refraction'
  lensType: 'convex' | 'concave'
}

function ExplanationBox({ isVisible, mode, lensType }: ExplanationBoxProps) {
  if (!isVisible) return null

  const getDescription = () => {
    switch (mode) {
      case 'direct':
        return '빛이 곧게 나아가는 성질을 빛의 직진이라고 합니다.'
      case 'reflection':
        return '빛이 거울과 같은 물체에 부딪쳐 방향이 바뀌어 나아가는 현상을 빛의 반사라고 합니다.'
      case 'refraction':
        return lensType === 'convex'
          ? '공기 중에서 직진하던 빛이 다른 물질로 비스듬히 나아갈 때 그 경계에서 꺾여서 나아가는 현상을 빛의 굴절이라고 합니다.'
          : '공기 중에서 직진하던 빛이 다른 물질로 비스듬히 나아갈 때 그 경계에서 꺾여서 나아가는 현상을 빛의 굴절이라고 합니다.'
      default:
        return ''
    }
  }

  return (
    <div
      style={{
        bottom: '20px',
        left: '20px',
        right: '180px',
        backgroundColor: 'white',
        color: 'black',
        padding: '12px 20px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        animation: 'slideInFromBottom 0.3s ease-out',
      }}>
      <div
        style={{
          fontSize: '14px',
          color: 'black',
        }}>
        {getDescription()}
      </div>
      <style jsx>{`
        @keyframes slideInFromBottom {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// 나레이션 팝업 컴포넌트 추가
function NarrationPopup({ isVisible, text, onHide }: { isVisible: boolean; text: string; onHide: () => void }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onHide()
      }, 5000) // 5초 후 자동 숨김

      return () => clearTimeout(timer)
    }
  }, [isVisible, onHide])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: 2000,
        fontSize: '16px',
        fontWeight: '500',
        maxWidth: '80vw',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        animation: 'fadeInSlideDown 0.4s ease-out',
      }}>
      {text}
      <style jsx>{`
        @keyframes fadeInSlideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default function Home() {
  const [activeMode, setActiveMode] = useState<'direct' | 'reflection' | 'refraction'>('direct')
  const [lensType, setLensType] = useState<'convex' | 'concave'>('convex')
  const [laserAngle, setLaserAngle] = useState<number>(45)

  const [rayStates, setRayStates] = useState<[boolean, boolean, boolean]>([false, false, false])
  const [showExplanation, setShowExplanation] = useState(false)

  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const [backgroundAudio, setBackgroundAudio] = useState<HTMLAudioElement | null>(null)
  const [currentNarrationAudio, setCurrentNarrationAudio] = useState<HTMLAudioElement | null>(null)
  const [showNarration, setShowNarration] = useState(false)
  const [narrationText, setNarrationText] = useState('')

  useEffect(() => {
    setRayStates([false, false, false])
    setLaserAngle(45)
    stopCurrentNarration()
    setShowExplanation(false)
    setShowNarration(false) // 나레이션 팝업도 숨김
  }, [activeMode])

  useEffect(() => {
    if (activeMode === 'refraction') {
      setRayStates([false, false, false])
      stopCurrentNarration()
      setShowExplanation(false)
      setShowNarration(false) // 나레이션 팝업도 숨김
    }
  }, [lensType])

  // 나레이션 텍스트 생성 함수
  const getNarrationText = (mode: string, lens?: string) => {
    switch (mode) {
      case 'direct':
        return '빛은 곧게 나아갑니다.'
      case 'reflection':
        return '빛은 곧게 나아가다가 거울에 부딪치면 방향이 바뀌어 나아갑니다.'
      case 'refraction':
        return lens === 'convex'
          ? '빛은 볼록렌즈를 통과할 때 렌즈의 가운데 쪽으로 굴절하여 나아갑니다.'
          : '빛은 오목렌즈를 통과할 때 렌즈의 바깥쪽으로 굴절하여 나아갑니다.'
      default:
        return ''
    }
  }

  useEffect(() => {
    const allRaysOn = rayStates.every((state) => state)

    if (allRaysOn) {
      playExplanationAudio()

      // 나레이션 팝업 표시
      const text = getNarrationText(activeMode, lensType)
      setNarrationText(text)
      setShowNarration(true)
    } else {
      stopCurrentNarration()
      setShowNarration(false)
    }
  }, [rayStates, activeMode, lensType])

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const playBackgroundMusic = () => {
    try {
      const audio = new Audio('/sounds/5-1-2/5-1-2-A.MP3')
      audio.loop = false
      audio.volume = 0.3
      audio.play().catch((error) => {
        console.log('배경음악 재생 실패:', error.name)
      })
      setBackgroundAudio(audio)
    } catch (error) {
      console.log('배경음악 생성 실패:', error)
    }
  }

  const playExplanationAudio = () => {
    try {
      let audioPath = ''

      switch (activeMode) {
        case 'direct':
          audioPath = '/sounds/5-1-2/5-1-2-B.MP3'
          break
        case 'reflection':
          audioPath = '/sounds/5-1-2/5-1-2-C.MP3'
          break
        case 'refraction':
          audioPath = lensType === 'convex' ? '/sounds/5-1-2/5-1-2-D.MP3' : '/sounds/5-1-2/5-1-2-E.MP3'
          break
      }

      stopCurrentNarration()

      const audio = new Audio(audioPath)
      audio.volume = 0.3
      audio.play().catch((error) => {
        console.log('설명 음성 재생 실패:', error.name)
      })

      setCurrentNarrationAudio(audio)

      audio.addEventListener('ended', () => {
        setCurrentNarrationAudio(null)
      })
    } catch (error) {
      console.log('설명 음성 생성 실패:', error)
    }
  }

  const stopCurrentNarration = () => {
    if (currentNarrationAudio) {
      currentNarrationAudio.pause()
      currentNarrationAudio.currentTime = 0
      setCurrentNarrationAudio(null)
    }
  }

  const handleEnterExperience = () => {
    playClickSound()
    setTimeout(() => {
      setShowIntro(false)

      setTimeout(() => {
        playBackgroundMusic()
      }, 1000)
    }, 300)
  }

  const handleModeChange = (newMode: 'direct' | 'reflection' | 'refraction') => {
    setActiveMode(newMode)
    setShowExplanation(false)
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }

  const handleExplanationToggle = () => {
    setShowExplanation(!showExplanation)
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }

  const handleRayToggle = (buttonIndex: number) => {
    setRayStates((prevStates) => {
      const newStates = [...prevStates] as [boolean, boolean, boolean]
      newStates[buttonIndex] = !newStates[buttonIndex]
      return newStates
    })

    playClickSound('/sounds/5-1-2-2_cassette-recorder-stop-button-mechanical-click-sound-359987.mp3')
  }

  const handleAngleChange = (newAngle: number) => {
    setLaserAngle(newAngle)
  }

  const handleRayComplete = () => {
    const text = getNarrationText(activeMode, lensType)
    setNarrationText(text)
    setShowNarration(true)

    // 5초 후 자동 숨김
    setTimeout(() => {
      setShowNarration(false)
    }, 5000)
  }

  // 나레이션 숨김 핸들러 추가
  const handleHideNarration = () => {
    setShowNarration(false)
  }

  useEffect(() => {
    return () => {
      if (backgroundAudio) {
        backgroundAudio.pause()
        backgroundAudio.currentTime = 0
      }
      stopCurrentNarration()
    }
  }, [backgroundAudio])

  return (
    <div className='w-screen h-screen flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      {/* 나레이션 팝업 추가 */}
      <NarrationPopup isVisible={showNarration} text={narrationText} onHide={handleHideNarration} />

      <div className='flex-1'>
        <Scene shadows camera={{ position: [0, 0, 20], fov: 50 }}>
          <Environment preset='city' environmentIntensity={0.2}>
            <color attach='background' args={['#00b7ffff']} />
          </Environment>

          <directionalLight
            color='white'
            intensity={1.5}
            position={[15, 25, 15]}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />


          <ambientLight color='white' intensity={0.4} />

          <OpticalLab mode={activeMode} lensType={lensType} rayStates={rayStates} laserAngle={laserAngle} />

          <Model
            mode={activeMode}
            onToggle={handleRayToggle}
            rayStates={rayStates}
            laserAngle={laserAngle}
            onAngleChange={handleAngleChange}
          />

          <ModeBasedControls mode={activeMode} />

          <SafePostEffects />
          {!showIntro && (
            <SpeechBubble
              position={
                activeMode === 'direct' ? [-10, 3, 0] : activeMode === 'reflection' ? [-10, 3, -6] : [-10, 6.5, 0]
              }
              pointColor={activeMode === 'direct' ? '#4fc3f7' : activeMode === 'reflection' ? '#ff6b6b' : '#25e5c2'}
              html='버튼을 눌러 3구 레이저를 켜고, 빛이 나아가는 모습을 관찰해 보세요.'
            />
          )}
        </Scene>
      </div>

      {!showIntro && isLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '20px',
            borderRadius: '10px',
            color: 'white',
          }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['direct', 'reflection', 'refraction'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: activeMode === mode ? '#4CAF50' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}>
                {mode === 'direct' ? '직진' : mode === 'reflection' ? '반사' : '굴절'}
              </button>
            ))}
          </div>

          {activeMode === 'refraction' && (
            <>
              <h4 style={{ margin: '10px 0 5px 0', fontSize: '16px' }}>볼록렌즈와 오목렌즈가 있어요.</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                {(['convex', 'concave'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setLensType(type)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: lensType === type ? '#2196F3' : '#333',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}>
                    {type === 'convex' ? '볼록렌즈' : '오목렌즈'}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeMode === 'reflection' && (
            <>
              <h4 style={{ margin: '10px 0 5px 0', fontSize: '16px' }}>광원의 각도를 조절해보세요.</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type='range'
                  min='3'
                  max='65'
                  value={laserAngle}
                  onChange={(e) => setLaserAngle(Number(e.target.value))}
                  style={{
                    width: '150px',
                    accentColor: '#4CAF50',
                  }}
                />
                <span style={{ fontSize: '14px', minWidth: '40px' }}>{Math.round(laserAngle)}°</span>
              </div>
            </>
          )}
        </div>
      )}

      {!showIntro && isLoaded && (
        <>
          <div className='flex absolute right-0 bottom-0 flex-row px-2 py-2 max-h-100 gap-2'>
            <ExplanationBox isVisible={showExplanation} mode={activeMode} lensType={lensType} />
            <ExplanationToggleButton mode={activeMode} lensType={lensType} onClick={handleExplanationToggle} />
          </div>
        </>
      )}

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title={`빛의 직진, 반사, 굴절 관찰하기`}
          description={[
            '빛이 공기 중에서 나아갈 때, 거울과 같은 물체에 부딪쳤을 때, 렌즈를 통과할 때 어떻게 나아가는지 알아봅시다.',
          ]}
          backgroundSvg='/img/cover/5-1-2.svg'
        />
      )}
    </div>
  )
}
