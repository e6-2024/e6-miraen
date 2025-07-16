import { Canvas } from '@react-three/fiber'
import { useEffect } from 'react'
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Lightformer,
  PerformanceMonitor,
  AccumulativeShadows,
  RandomizedLight,
  useProgress,
} from '@react-three/drei'
import Model from '../components/5-1-3/Model'
import { useState, useRef, useCallback } from 'react'
import Scene from '@/components/canvas/Scene'
import { BaseModel } from '@/components/5-1-3/BaseModel'
import { Tomato } from '@/components/5-1-3/Tomato'
import { DirectTomato } from '@/components/5-1-3/DirectTomato'
import { Spoon } from '@/components/5-1-3/Spoon'
import { SugarParticles } from '@/components/5-1-3/SugarParticles'
import Intro from '@/components/intro/Intro'

function useSpoonBySpoonBeaker(beakerId: string, totalSpoons: number) {
  const [currentSpoon, setCurrentSpoon] = useState(0)
  const [totalDissolved, setTotalDissolved] = useState(0)
  const [isDropping, setIsDropping] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startExperiment = useCallback(() => {
    console.log(`${beakerId}: 실험 시작 - 총 ${totalSpoons}스푼`)
    setCurrentSpoon(1)
    setTotalDissolved(0)
    setIsCompleted(false)
    setIsDropping(true)
  }, [beakerId, totalSpoons])

  const handleSpoonDissolved = useCallback(() => {
    console.log(`${beakerId}: ${currentSpoon}번째 스푼 용해 완료`)
    setTotalDissolved((prev) => prev + 1)
    setIsDropping(false)

    if (currentSpoon < totalSpoons) {
      console.log(`${beakerId}: 다음 스푼 준비 중...`)
      timeoutRef.current = setTimeout(() => {
        setCurrentSpoon((prev) => prev + 1)
        setIsDropping(true)
        console.log(`${beakerId}: ${currentSpoon + 1}번째 스푼 투입`)
      }, 0)
    } else {
      console.log(`${beakerId}: 모든 스푼 완료!`)
      setIsCompleted(true)
    }
  }, [beakerId, currentSpoon, totalSpoons])

  const stopExperiment = useCallback(() => {
    console.log(`${beakerId}: 실험 중지`)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsDropping(false)
    setCurrentSpoon(0)
  }, [beakerId])

  const reset = useCallback(() => {
    console.log(`${beakerId}: 초기화`)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setCurrentSpoon(0)
    setTotalDissolved(0)
    setIsDropping(false)
    setIsCompleted(false)
  }, [beakerId])

  const isExperimentRunning = currentSpoon > 0 && !isCompleted

  return {
    currentSpoon,
    totalDissolved,
    isDropping,
    isCompleted,
    isExperimentRunning,
    startExperiment,
    stopExperiment,
    reset,
    handleSpoonDissolved,
    progress: `${currentSpoon}/${totalSpoons}`,
  }
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

function useTomatoDrop(beakerId: string) {
  const [isDropped, setIsDropped] = useState(false)
  const [isFloating, setIsFloating] = useState(false)

  const dropTomato = useCallback(() => {
    console.log(`${beakerId}: 토마토 드롭!`)
    setIsDropped(true)
    setIsFloating(false)
  }, [beakerId])

  const handleTomatoInWater = useCallback(() => {
    console.log(`${beakerId}: 토마토가 물에 들어감`)
    setIsFloating(true)
  }, [beakerId])

  const reset = useCallback(() => {
    console.log(`${beakerId}: 토마토 리셋`)
    setIsDropped(false)
    setIsFloating(false)
  }, [beakerId])

  return {
    isDropped,
    isFloating,
    dropTomato,
    handleTomatoInWater,
    reset,
  }
}

function useSpoonAnimation() {
  const [rotation, setRotation] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const triggerAnimation = () => {
    if (animationRef.current || isAnimating) {
      return // 이미 애니메이션 중이면 무시
    }

    console.log('숟가락 애니메이션 시작')
    setIsAnimating(true)
    setRotation(0)

    const startTime = Date.now()
    const duration = 1000

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentRotation = (-progress * Math.PI) / 2

      setRotation(currentRotation)

      if (progress >= 1) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        animationRef.current = setTimeout(() => {
          const returnStartTime = Date.now()
          const returnDuration = 500

          intervalRef.current = setInterval(() => {
            const returnElapsed = Date.now() - returnStartTime
            const returnProgress = Math.min(returnElapsed / returnDuration, 1)
            const returnRotation = (-Math.PI / 2) * (1 - returnProgress)

            setRotation(returnRotation)

            if (returnProgress >= 1) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
              setRotation(0)
              setIsAnimating(false)
              animationRef.current = null
              console.log('숟가락 애니메이션 완료')
            }
          }, 16)
        })
      }
    }, 16)
  }

  const cleanup = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current)
      animationRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRotation(0)
    setIsAnimating(false)
  }

  return {
    rotation,
    isAnimating,
    triggerAnimation,
    cleanup,
  }
}

export default function Home() {
  const [perfSucks, degrade] = useState(false)

  const leftBeaker = useSpoonBySpoonBeaker('LEFT', 1)
  const leftTomato = useTomatoDrop('LEFT_TOMATO')
  const rightBeaker = useSpoonBySpoonBeaker('RIGHT', 5)
  const rightTomato = useTomatoDrop('RIGHT_TOMATO')

  const leftSpoon = useSpoonAnimation()
  const rightSpoon = useSpoonAnimation()

  const leftConcentration = leftBeaker.totalDissolved * 4.2
  const rightConcentration = rightBeaker.totalDissolved * 4.2

  const leftDensity = 1.0 + leftConcentration * 0.004
  const rightDensity = 1.0 + rightConcentration * 0.004

  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  // 설탕 드롭 시 스푼 애니메이션 - isDropping이 true가 될 때 트리거
  useEffect(() => {
    console.log('Left beaker isDropping changed:', leftBeaker.isDropping, 'isAnimating:', leftSpoon.isAnimating)
    if (leftBeaker.isDropping && !leftSpoon.isAnimating) {
      console.log('Left spoon animation triggered!')
      leftSpoon.triggerAnimation()
    }
  }, [leftBeaker.isDropping])

  useEffect(() => {
    console.log('Right beaker isDropping changed:', rightBeaker.isDropping, 'isAnimating:', rightSpoon.isAnimating)
    if (rightBeaker.isDropping && !rightSpoon.isAnimating) {
      console.log('Right spoon animation triggered!')
      rightSpoon.triggerAnimation()
    }
  }, [rightBeaker.isDropping])

  // 토마토 드롭 시 스푼 애니메이션
  useEffect(() => {
    if (leftTomato.isDropped && !leftSpoon.isAnimating) {
      leftSpoon.triggerAnimation()
    }
  }, [leftTomato.isDropped])

  useEffect(() => {
    if (rightTomato.isDropped && !rightSpoon.isAnimating) {
      rightSpoon.triggerAnimation()
    }
  }, [rightTomato.isDropped])

  const resetAll = useCallback(() => {
    leftBeaker.reset()
    rightBeaker.reset()
    leftTomato.reset()
    rightTomato.reset()
    leftSpoon.cleanup()
    rightSpoon.cleanup()
  }, [leftBeaker, rightBeaker, leftTomato, rightTomato, leftSpoon, rightSpoon])

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

  const handleEnterExperience = () => {
    // 효과음 재생
    playClickSound()

    // 효과음이 재생될 시간을 확보한 후 Intro 숨김
    setTimeout(() => {
      setShowIntro(false)
    }, 300) // 300ms 지연
  }

  return (
    <div className='w-screen h-screen flex flex-col'>
      {!showIntro && (
        <>
          <div className='absolute top-4 left-4 z-10 bg-blue-50/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-blue-200 w-48'>
            <h3 className='text-lg font-bold text-blue-800 mb-3'>왼쪽 비커</h3>
            <div className='mb-3 p-3 bg-blue-100 rounded-lg'>
              <div className='text-sm text-blue-700 font-light'>
                <div>
                  투입량: <span className='font-bold'>1스푼</span>
                </div>
              </div>
            </div>

            {leftBeaker.isExperimentRunning && (
              <div className='mb-3 p-2 bg-yellow-100 border font-light border-yellow-300 rounded text-sm text-yellow-800'>
                {leftBeaker.isDropping ? `${leftBeaker.currentSpoon}번째 스푼 용해 중...` : '다음 스푼 준비 중...'}
              </div>
            )}

            {leftBeaker.isCompleted && !leftTomato.isDropped && (
              <div className='mb-3 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800 font-light'>
                ✅ 설탕이 용해되었어요! 이제 토마토를 떨어뜨려보세요.
              </div>
            )}

            <div className='flex flex-col gap-2'>
              <div className='flex gap-2'>
                <button
                  onClick={leftBeaker.startExperiment}
                  disabled={leftBeaker.isExperimentRunning || leftBeaker.isCompleted}
                  className='w-full px-3 py-2 bg-blue-500 text-white rounded font-light hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm'>
                  설탕 실험
                </button>
                <button
                  onClick={leftBeaker.stopExperiment}
                  disabled={!leftBeaker.isExperimentRunning}
                  className='w-full px-3 py-2 bg-red-500 text-white rounded font-light hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm'>
                  중지
                </button>
              </div>

              {leftBeaker.isCompleted && (
                <button
                  onClick={leftTomato.dropTomato}
                  disabled={leftTomato.isDropped}
                  className='px-3 py-2 bg-purple-500 text-white rounded font-light hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm'>
                  🍅 토마토 떨어뜨리기
                </button>
              )}

              <button
                onClick={() => {
                  leftBeaker.reset()
                  leftTomato.reset()
                  leftSpoon.cleanup()
                }}
                disabled={leftBeaker.isExperimentRunning}
                className='px-3 py-2 bg-gray-500 text-white rounded font-light hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm'>
                초기화
              </button>
            </div>
          </div>

          <div className='absolute top-4 right-4 z-10 bg-green-50/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-green-200 w-48'>
            <h3 className='text-lg font-bold text-green-800 mb-3'>오른쪽 비커</h3>
            <div className='mb-3 p-3 bg-green-100 rounded-lg'>
              <div className='text-sm text-green-700 font-light'>
                <div>
                  투입량: <span className='font-bold'>5스푼</span>
                </div>
              </div>
            </div>

            {rightBeaker.isExperimentRunning && (
              <div className='mb-3 p-2 bg-yellow-100 border font-light border-yellow-300 rounded text-sm text-yellow-800'>
                {rightBeaker.isDropping ? `${rightBeaker.currentSpoon}번째 스푼 용해 중...` : '다음 스푼 준비 중...'}
              </div>
            )}

            {rightBeaker.isCompleted && !rightTomato.isDropped && (
              <div className='mb-3 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800'>
                ✅ 설탕 실험 완료! 이제 토마토를 떨어뜨려보세요
              </div>
            )}

            <div className='flex flex-col gap-2'>
              <div className='flex gap-2'>
                <button
                  onClick={rightBeaker.startExperiment}
                  disabled={rightBeaker.isExperimentRunning || rightBeaker.isCompleted}
                  className='w-full px-3 py-2 bg-green-500 text-white font-light rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm'>
                  설탕 실험
                </button>
                <button
                  onClick={rightBeaker.stopExperiment}
                  disabled={!rightBeaker.isExperimentRunning}
                  className='w-full px-3 py-2 bg-red-500 text-white font-light rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm'>
                  중지
                </button>
              </div>

              {rightBeaker.isCompleted && (
                <button
                  onClick={rightTomato.dropTomato}
                  disabled={rightTomato.isDropped}
                  className='px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm'>
                  🍅 토마토 떨어뜨리기
                </button>
              )}

              <button
                onClick={() => {
                  rightBeaker.reset()
                  rightTomato.reset()
                  rightSpoon.cleanup()
                }}
                disabled={rightBeaker.isExperimentRunning}
                className='px-3 py-2 bg-gray-500 text-white rounded font-light hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm'>
                초기화
              </button>
            </div>
          </div>
        </>
      )}

      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      <Scene shadows camera={{ position: [4, 1, 8], fov: 20 }}>
        <PerformanceMonitor onDecline={() => degrade(true)} />
        <Environment frames={perfSucks ? 1 : Infinity} preset='studio' resolution={256} background={false} blur={1}>
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <group rotation={[Math.PI / 2, 1, 0]}>
            <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
            <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[50, 2, 1]} />
          </group>
          <Lightformer
            intensity={5}
            form='ring'
            color='white'
            rotation-y={Math.PI / 2}
            position={[1, 1, 1]}
            scale={[4, 4, 1]}
          />
        </Environment>
        <ContactShadows position={[0, -0.59, 0]} opacity={0.9} scale={10} blur={1.5} far={2} color='black' frames={2} />
        <AccumulativeShadows frames={20} alphaTest={0.15} opacity={0.1} scale={20} position={[0, -0.59, 0]}>
          <RandomizedLight amount={4} radius={3} ambient={0.3} intensity={0.5} position={[0, 2, 0]} bias={0.001} />
        </AccumulativeShadows>

        <Model
          scale={0.8}
          position={[-1.3, -0.6, 0]}
          shouldDropSugar={leftBeaker.isDropping}
          sugarAmount={1}
          onAllDissolved={leftBeaker.handleSpoonDissolved}
          beakerId={`LEFT_BEAKER`}
          isCompleted={leftBeaker.isCompleted}
        />

        {leftBeaker.isCompleted && (
          <DirectTomato
            startPosition={[-1.5, 0.85, -0.05]}
            sugarConcentration={leftConcentration}
            beakerRadius={0.32}
            waterLevel={0.4}
            beakerPosition={[-1.3, -0.44, 0]}
            isDropped={leftTomato.isDropped}
            onDrop={leftTomato.handleTomatoInWater}
            maxRiseHeight={0.04}
            riseSpeed={0.1}
            riseSpringStiffness={10}
            riseSpringDamping={15}
          />
        )}

        <BaseModel scale={6} position={[-0.5, -0.6, 0]} />

        {!leftBeaker.isCompleted && (
          <Tomato scale={6} position={[-0.45, -0.7, 0.25]} rotation={[1.744, -0.13, -0.618]} />
        )}
        {!rightBeaker.isCompleted && <Tomato scale={6} position={[-0.7, -0.7, -0.01]} rotation={[1.744, 0.13, 0.8]} />}

        <Spoon
          scale={20}
          position={[-1.9, 1.0, -0.08]}
          rotation={[Math.PI / 2 + leftSpoon.rotation, -Math.PI / 12, -Math.PI / 2]}
        />

        <Spoon
          scale={20}
          position={[1.9, 1.0, -0.01]}
          rotation={[Math.PI / 2 + rightSpoon.rotation, Math.PI / 12, Math.PI / 2]}
        />

        <Model
          scale={0.8}
          position={[1.3, -0.6, 0]}
          shouldDropSugar={rightBeaker.isDropping}
          sugarAmount={1}
          onAllDissolved={rightBeaker.handleSpoonDissolved}
          beakerId={`RIGHT_BEAKER`}
          isCompleted={rightBeaker.isCompleted}
        />

        <OrbitControls
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          minPolarAngle={Math.PI / 3 + Math.PI / 10}
          maxPolarAngle={Math.PI / 2}
          minDistance={1}
          maxDistance={20}
        />

        {rightBeaker.isCompleted && (
          <DirectTomato
            startPosition={[1.1, 0.85, 0.0]}
            sugarConcentration={rightConcentration}
            beakerRadius={0.32}
            waterLevel={0.56}
            beakerPosition={[1.3, -0.4, 0]}
            isDropped={rightTomato.isDropped}
            onDrop={rightTomato.handleTomatoInWater}
            maxRiseHeight={-0.15}
            riseSpeed={0.1}
            riseSpringStiffness={10}
            riseSpringDamping={15}
          />
        )}
      </Scene>

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='용해와 용액'
          description={[
            '색깔로 구별할 수 없는 용액의 진하기는 어떻게 비교할 수 있을까요?',
            '용액의 상대적인 진하기를 비교해 봅시다.',
          ]}
          backgroundSvg='/img/cover/5-1-3.svg'
          descriptionSound='/sounds/5-1-3/5-1-3-Goal.MP3'
        />
      )}
    </div>
  )
}
