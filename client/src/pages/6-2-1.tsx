import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Sky, OrbitControls, useGLTF, useProgress, Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import Scene from '@/components/canvas/Scene'
import CameraController from '@/components/cameraController'
import CameraLogger from '@/components/CameraLogger'
import Intro from '@/components/intro/Intro'
import { timeData2 } from '@/components/6-2-1/timeData'
import Model from '@/components/6-2-1/Model'

import LoadingTracker from '@/components/6-2-1/LoadingTracker'
import CompassBillboard from '@/components/6-2-1/CompassBillboard'
import SunLight from '@/components/6-2-1/SunLight'
import AngleLines from '@/components/6-2-1/AngleLines'
import TimeIntervalImages from '@/components/6-2-1/TimeIntervalImages'
import ThermometerDisplay from '@/components/6-2-1/ThermometerDisplay'
import ObservationTable from '@/components/6-2-1/ObservationTable'
import ControlButtons from '@/components/6-2-1/ControlButtons'
import ProgressBar from '@/components/6-2-1/ProgressBar'

const timeData = timeData2

const calculateSunPosition = (azimuth: number, altitude: number, distance: number = 15) => {
  const azimuthRad = azimuth * (Math.PI / 180)
  const altitudeRad = altitude * (Math.PI / 180)

  const sunX = distance * Math.cos(altitudeRad) * Math.sin(azimuthRad)
  const sunY = distance * Math.sin(altitudeRad)
  const sunZ = distance * Math.cos(altitudeRad) * Math.cos(azimuthRad)

  return { sunX, sunY, sunZ, azimuthRad, altitudeRad }
}

// 메인 컴포넌트
export default function ShadowSimulation() {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showObservationLines, setShowObservationLines] = useState(false)
  const [showTimeIntervalImages, setShowTimeIntervalImages] = useState(false)
  const [modelScene, setModelScene] = useState(null)
  const backgroundMusicRef = useRef(null)

  // 시간 간격 확인 모드 상태
  const [isTimeIntervalMode, setIsTimeIntervalMode] = useState(false)
  const [timeIntervalData, setTimeIntervalData] = useState(null)

  // TimeIntervalImages에서 선택된 시간 데이터
  const [selectedTimeData, setSelectedTimeData] = useState(null)

  // Intro 관련 상태
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  // 현재 표시할 데이터 결정
  const currentData = selectedTimeData || timeIntervalData || timeData[currentTimeIndex]

  // 공통 태양 위치 계산
  const sunPosition = useMemo(() => {
    return calculateSunPosition(currentData.azimuth, currentData.altitude)
  }, [currentData.azimuth, currentData.altitude])

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

  const playBackgroundMusic = (audioPath = '/sounds/6-2-1/6-2-1-bg.mp3') => {
    try {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause()
      }

      const audio = new Audio(audioPath)
      audio.volume = 0.3
      audio.loop = true
      backgroundMusicRef.current = audio

      audio.play().catch((error) => {
        console.log('배경음악 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('배경음악 생성 실패:', error)
    }
  }

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const handleEnterExperience = () => {
    playClickSound()
    playBackgroundMusic()
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }

  // 시간 간격 확인 모드에서 시각 선택 핸들러
  const handleTimeSelect = (data) => {
    if (data) {
      setTimeIntervalData(data)
      setIsTimeIntervalMode(true)
      // 자동 재생 중단
      setIsPlaying(false)
    } else {
      // 원래 모드로 복귀
      setTimeIntervalData(null)
      setIsTimeIntervalMode(false)
    }
  }

  // 시간별 이미지 표시 토글 핸들러
  const handleTimeIntervalImagesToggle = () => {
    setShowTimeIntervalImages(!showTimeIntervalImages)
    if (!showTimeIntervalImages) {
      // 이미지 모드 활성화 시 다른 오버레이들 숨기기
      setShowObservationLines(false)
      setIsPlaying(false)
    } else {
      // 이미지 모드 비활성화 시 선택된 시간 데이터 초기화
      setSelectedTimeData(null)
    }
  }

  // TimeIntervalImages에서 시간 선택 시 호출되는 핸들러
  const handleTimeIntervalSelect = (timeData) => {
    setSelectedTimeData(timeData)
  }

  // 진행바 클릭 핸들러 (시간 간격 모드가 아닐 때만 동작)
  const handleProgressClick = (clickX: number, barWidth: number) => {
    if (!isTimeIntervalMode) {
      const clickRatio = clickX / barWidth
      const newIndex = Math.round(clickRatio * (timeData.length - 1))
      setCurrentTimeIndex(Math.max(0, Math.min(newIndex, timeData.length - 1)))
    }
  }

  // 자동 재생 효과 (시간 간격 모드가 아닐 때만)
  useEffect(() => {
    let interval
    if (isPlaying && !isTimeIntervalMode) {
      interval = setInterval(() => {
        setCurrentTimeIndex((prev) => {
          const nextIndex = (prev + 1) % timeData.length
          setProgress((nextIndex / (timeData.length - 1)) * 100)
          return nextIndex
        })
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, isTimeIntervalMode])

  // 진행바 업데이트 (시간 간격 모드가 아닐 때만)
  useEffect(() => {
    if (!isTimeIntervalMode) {
      setProgress((currentTimeIndex / (timeData.length - 1)) * 100)
    }
  }, [currentTimeIndex, isTimeIntervalMode])


  return (
    <div className='w-screen h-screen bg-gradient-to-b relative'>
      {!showIntro && <ObservationTable currentData={currentData} />}


      <Scene camera={{ position: [2.88, 3.82, 11.4], fov: 50 }} shadows>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />

        <ambientLight intensity={0.6} />

        <SunLight sunPosition={sunPosition} />

        <CompassBillboard />

        {showObservationLines && !showTimeIntervalImages && (
          <AngleLines
            azimuth={currentData.azimuth}
            altitude={currentData.altitude}
            shadowLength={currentData.shadowLength}
            sunPosition={sunPosition}
          />
        )}

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial transparent opacity={0.5} />
        </mesh>

        <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.1, 2.5, 32]} />
          <meshStandardMaterial color='black' envMapIntensity={0} />
        </mesh>

        <Environment
          files='/img/cover/hdri.JPG'
          background={true}
          ground={{ height: 5, radius: 20, scale: 90 }}
          backgroundBlurriness={0.8}
          backgroundIntensity={0.7}
          environmentIntensity={0.8}
          backgroundRotation={[0, sunPosition.azimuthRad, 0]}
        />

        <OrbitControls
          enabled={!showIntro && !showTimeIntervalImages}
          minDistance={0.2}
          maxDistance={16}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 2.55}
        />
        {!showIntro && (
          <ThermometerDisplay temperature={currentData.temperature} position={[0.6, 3.2, 0]} />
        )}
      </Scene>

      {!showIntro && !isTimeIntervalMode && !showTimeIntervalImages && (
        <ProgressBar
          progress={progress}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          timeData={timeData}
          onProgressClick={handleProgressClick}
        />
      )}

      {!showIntro && !showTimeIntervalImages && (
        <ControlButtons
          showObservationLines={showObservationLines}
          setShowObservationLines={setShowObservationLines}
          timeData={timeData}
          currentData={currentData}
          onTimeSelect={handleTimeSelect}
        />
      )}

      {!showIntro && !showTimeIntervalImages && (
        <div className='fixed top-4 right-4 z-50 flex flex-col gap-2'>
          <button
            onClick={handleTimeIntervalImagesToggle}
            className='px-4 py-2 bg-white hover:bg-gray-400 text-black rounded-lg shadow-lg transition-colors duration-200 text-lg font-bold'>
            일정 시간 간격 관측 자료 확인하기
          </button>
        </div>
      )}

      {showTimeIntervalImages && (
        <div className='fixed top-4 right-4 z-[1001]'>
          <button
            onClick={() => {
              setShowTimeIntervalImages(false)
              setSelectedTimeData(null) // 돌아가기 시 선택된 시간 데이터 초기화
            }}
            className='px-4 py-2 bg-black hover:bg-black-700 text-white rounded-lg shadow-lg transition-colors duration-200 text-lg font-bold'>
            돌아가기
          </button>
        </div>
      )}

      <TimeIntervalImages
        currentData={currentData}
        isVisible={showTimeIntervalImages}
        timeData={timeData}
        onTimeSelect={handleTimeIntervalSelect}
      />

      {/* ObservationTable을 TimeIntervalImages보다 위에 표시 */}
      {!showIntro && showTimeIntervalImages && (
        <div className='fixed z-[1002]'>
          <ObservationTable currentData={currentData} />
        </div>
      )}

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='하루 동안 태양 고도, 그림자 길이, 기온의 관계 알아보기'
          description={['하루 동안 태양 고도, 그림자 길이, 기온의 변화를 살펴보고 이들의 관계를 알아봅시다.']}
          backgroundSvg='/img/cover/6-2-1.svg'
          descriptionSound='/sounds/6-2-1/narration/6-2-1-Goal.MP3'
        />
      )}
    </div>
  )
}
