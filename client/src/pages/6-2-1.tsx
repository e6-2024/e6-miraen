import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Sky, OrbitControls, useGLTF, useProgress, Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import Scene from '@/components/canvas/Scene'
import CameraController from '@/components/cameraController'
import CameraLogger from '@/hook/CameraLogger'
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
import SummaryPopup from '@/components/6-2-1/SummaryPopup'
import SubtitleDisplay from '@/components/6-2-1/SubtitleDisplay'
import { useNarrationManager } from '@/components/6-2-1/useNarrationManager'
import NarrationManager from '@/components/6-2-1/NarrationManager'
import IntroMouseCameraController from '@/components/IntroMouseCameraController'


const timeData = timeData2

const calculateSunPosition = (azimuth: number, altitude: number, distance: number = 15) => {
  const azimuthRad = azimuth * (Math.PI / 180)
  const altitudeRad = altitude * (Math.PI / 180)

  const sunX = distance * Math.cos(altitudeRad) * Math.sin(azimuthRad)
  const sunY = distance * Math.sin(altitudeRad)
  const sunZ = distance * Math.cos(altitudeRad) * Math.cos(azimuthRad)

  return { sunX, sunY, sunZ, azimuthRad, altitudeRad }
}

function TimeIntervalButton() {
  const [isHovered, setIsHovered] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    playNarration,
    isCurrentlyPlaying,
    isOtherNarrationPlaying,
    isAnyNarrationPlaying
  } = useNarrationManager('time-interval-button')

  const handlePlayNarration = async () => {
    try {
      await playNarration(
        '/sounds/6-2-1/narration/6-2-1-G.MP3',
        '9시 30분부터 15시 30분까지 1시간 간격으로 측정한 관측 자료를 확인해 봅시다.',
        0.7
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
    <div className="relative">
      {isDisabled && isHovered && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-40">
          <div className="bg-orange-500/90 text-white font-light px-3 py-1 rounded-lg text-xs shadow-lg">
            다른 설명이 재생 중입니다
          </div>
        </div>
      )}

      <button
        className={`px-4 py-2 bg-white hover:bg-gray-400 text-black rounded-lg shadow-lg transition-all duration-200 text-lg font-bold ${
          isPlaying ? 'ring-2 ring-blue-400 ring-opacity-50 scale-105' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isPlaying && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          </div>
        )}

        {isDisabled && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}

        일정 시간 간격 관측 자료 확인하기

      </button>
    </div>
  )
}

function SummaryButton({ onClick }) {
  const [isHovered, setIsHovered] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    playNarration,
    isCurrentlyPlaying,
    isOtherNarrationPlaying,
    isAnyNarrationPlaying
  } = useNarrationManager('summary-button')

  const handlePlayNarration = async () => {
    try {
      await playNarration(
        '/sounds/6-2-1/narration/6-2-1-H.MP3',
        '하루 동안 태양 고도, 그림자 길이, 기온의 관계를 알아봅시다.',
        0.7
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
    <div className="relative">
      {isDisabled && isHovered && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-40">
          <div className="bg-orange-500/90 text-white font-light px-3 py-1 rounded-lg text-xs shadow-lg">
            다른 설명이 재생 중입니다
          </div>
        </div>
      )}

      <button
        onClick={onClick}
        className={`px-4 py-2 w-fit bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all duration-200 text-lg font-bold ${
          isPlaying ? 'ring-2 ring-blue-400 ring-opacity-50 scale-105' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isPlaying && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          </div>
        )}

        {isDisabled && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}

        정리하기
      </button>
    </div>
  )
}

export default function ShadowSimulation() {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showObservationLines, setShowObservationLines] = useState(false)
  const [showTimeIntervalImages, setShowTimeIntervalImages] = useState(false)
  const [showSummaryPopup, setShowSummaryPopup] = useState(false)
  const [modelScene, setModelScene] = useState(null)
  const backgroundMusicRef = useRef(null)

  const [isTimeIntervalMode, setIsTimeIntervalMode] = useState(false)
  const [timeIntervalData, setTimeIntervalData] = useState(null)

  const [selectedTimeData, setSelectedTimeData] = useState(null)

  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const currentData = selectedTimeData || timeIntervalData || timeData[currentTimeIndex]

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

  const playGeneralButton = (audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
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

      const narrationManager = NarrationManager.getInstance()
      narrationManager.setBackgroundMusic(audio)

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

  const handleTimeSelect = (data) => {
    if (data) {
      setTimeIntervalData(data)
      setIsTimeIntervalMode(true)
      setIsPlaying(false)
    } else {
      setTimeIntervalData(null)
      setIsTimeIntervalMode(false)
    }
  }

  const handleTimeIntervalImagesToggle = () => {
    setShowTimeIntervalImages(!showTimeIntervalImages)
    if (!showTimeIntervalImages) {
      setShowObservationLines(false)
      setIsPlaying(false)
    } else {
      setSelectedTimeData(null)
    }
  }

  const handleTimeIntervalSelect = (timeData) => {
    setSelectedTimeData(timeData)
  }

  const handleProgressClick = (clickX: number, barWidth: number) => {
    if (!isTimeIntervalMode) {
      const clickRatio = clickX / barWidth
      const newIndex = Math.round(clickRatio * (timeData.length - 1))
      setCurrentTimeIndex(Math.max(0, Math.min(newIndex, timeData.length - 1)))
    }
  }

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

  useEffect(() => {
    if (!isTimeIntervalMode) {
      setProgress((currentTimeIndex / (timeData.length - 1)) * 100)
    }
  }, [currentTimeIndex, isTimeIntervalMode])

  return (
    <div className='w-screen h-screen bg-gradient-to-b relative overflow-hidden'>
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
        {!showIntro && !showSummaryPopup &&(
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
        <div className='absolute top-4 right-4 z-50 flex flex-col items-end gap-2'>
          <div onClick={() => { handleTimeIntervalImagesToggle(); playGeneralButton(); }}>
            <TimeIntervalButton />
          </div>
          
          <SummaryButton onClick={() => {setShowSummaryPopup(true); playGeneralButton();}} />
        </div>
      )}

      {showTimeIntervalImages && (
        <div className='fixed top-4 right-4 z-[1001]'>
          <button
            onClick={() => {
              setShowTimeIntervalImages(false)
              setSelectedTimeData(null)
              playGeneralButton()
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

      {!showIntro && showTimeIntervalImages && (
        <div className='fixed z-[1002]'>
          <ObservationTable currentData={currentData} />
        </div>
      )}

      <SummaryPopup isOpen={showSummaryPopup} onClose={() => setShowSummaryPopup(false)} />

      <SubtitleDisplay />

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