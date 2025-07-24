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
import ThermometerDisplay from '@/components/6-2-1/ThermometerDisplay'
import ObservationTable from '@/components/6-2-1/ObservationTable'
import ControlButtons from '@/components/6-2-1/ControlButtons'
import ProgressBar from '@/components/6-2-1/ProgressBar'

// 엑셀에서 변환한 실제 데이터
const timeData = timeData2

// 태양 위치 계산 유틸리티 함수
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
  const [modelScene, setModelScene] = useState(null)
  const backgroundMusicRef = useRef(null)

  // 시간 간격 확인 모드 상태
  const [isTimeIntervalMode, setIsTimeIntervalMode] = useState(false)
  const [timeIntervalData, setTimeIntervalData] = useState(null)

  // Intro 관련 상태
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  // 현재 표시할 데이터 결정 (시간 간격 모드일 때는 선택된 데이터, 아니면 현재 인덱스의 데이터)
  const currentData = timeIntervalData || timeData[currentTimeIndex]

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
      {/* 온도계 표시 - 항상 3D 오브젝트 위에 표시 */}
      {!showIntro && <ThermometerDisplay temperature={currentData.temperature} />}

      {/* 관측 자료 테이블 */}
      {!showIntro && <ObservationTable currentData={currentData} />}

      {/* 3D 캔버스 */}
      <Scene camera={{ position: [0.04, 0, 2.872], fov: 50 }} shadows>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />

        <ambientLight intensity={0.6} />

        {/* 공통 태양 위치를 사용하는 조명 */}
        <SunLight sunPosition={sunPosition} />

        <Model modelPath='models/6-2-1/pole.glb' position={[0, 1.9, 0]} scale={1} rotation={[0, 0, 0]} />
        <CompassBillboard />

        {/* 관측선 표시 - 공통 태양 위치 사용 */}
        {showObservationLines && (
          <AngleLines
            azimuth={currentData.azimuth}
            altitude={currentData.altitude}
            shadowLength={currentData.shadowLength}
            sunPosition={sunPosition}
          />
        )}

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
        <Environment preset={'apartment'} />

        <OrbitControls enabled={!showIntro} maxPolarAngle={Math.PI / 2} minDistance={0.2} maxDistance={3} />
        <CameraLogger />
      </Scene>

      {/* 진행바 - 시간 간격 모드가 아닐 때만 표시 */}
      {!showIntro && !isTimeIntervalMode && (
        <ProgressBar
          progress={progress}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          timeData={timeData}
          onProgressClick={handleProgressClick}
        />
      )}

      {/* 컨트롤 버튼들 */}
      {!showIntro && (
        <ControlButtons
          showObservationLines={showObservationLines}
          setShowObservationLines={setShowObservationLines}
          timeData={timeData}
          currentData={currentData}
          onTimeSelect={handleTimeSelect}
        />
      )}

      {/* Intro 오버레이 */}
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
