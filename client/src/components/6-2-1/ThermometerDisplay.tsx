import React, { useState, useRef, useEffect } from 'react'
import { Billboard, Html } from '@react-three/drei'
import { Vector3 } from 'three'
import { useAudioManager } from '@/components/6-2-1/GlobalAudioManager' // 위에서 만든 훅 import

interface ThermometerDisplayProps {
  temperature: number
  maxTemp?: number
  position?: [number, number, number] | Vector3
  audioPath?: string
  subtitle?: string
}

function ThermometerDisplay({ 
  temperature, 
  maxTemp = 28, 
  position = [0, 0, 0],
  audioPath = '/sounds/6-2-1/narration/thermometer.mp3',
  subtitle = '현재 온도를 나타내는 온도계입니다.'
}: ThermometerDisplayProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 전역 오디오 매니저 사용
  const {
    playAudio,
    stopAudio,
    isCurrentlyPlaying,
    isOtherAudioPlaying,
    isAnyAudioPlaying
  } = useAudioManager('thermometer') // 고유 ID 지정

  const height = Math.max(0, (temperature / maxTemp) * 100)

  // 온도에 따른 색상 계산
  const getTemperatureColor = (temp) => {
    return 'from-red-500 to-red-400'
  }

  // 오디오 재생 함수 (전역 매니저 사용)
  const handlePlayAudio = async () => {
    try {
      await playAudio(audioPath, 0.7)
      setShowSubtitle(true)
      
      // 오디오 재생 시간 추정 (실제로는 오디오 duration을 가져와야 함)
      // 여기서는 예시로 3초 후 자막 숨김
      setTimeout(() => {
        if (!isCurrentlyPlaying()) {
          setShowSubtitle(false)
        }
      }, 3000)
    } catch (error) {
      console.log('오디오 재생 실패:', error)
      setShowSubtitle(false)
    }
  }

  // 현재 재생 상태가 변경될 때 자막 처리
  useEffect(() => {
    if (!isCurrentlyPlaying()) {
      setShowSubtitle(false)
    }
  }, [isCurrentlyPlaying])

  // 호버 핸들러
  const handleMouseEnter = () => {
    setIsHovered(true)
    
    // 다른 오디오가 재생 중이거나 현재 오디오가 재생 중이면 새로 재생하지 않음
    if (!isAnyAudioPlaying()) {
      timeoutRef.current = setTimeout(() => {
        handlePlayAudio()
      }, 200)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    
    // 호버 해제 시 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // 다른 오디오가 재생 중일 때 시각적 표시
  const isDisabled = isOtherAudioPlaying()
  const isPlaying = isCurrentlyPlaying()

  return (
    <Billboard>
      <Html position={position} center distanceFactor={1.3} transform occlude>
        <div className="relative">
          {/* 자막 표시 */}
          {showSubtitle && isPlaying && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-64 z-50">
              <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-xl border border-white/20">
                <p className="text-sm text-center leading-relaxed">{subtitle}</p>
                {/* 말풍선 꼬리 */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-black/80"></div>
              </div>
            </div>
          )}

          {/* 다른 오디오 재생 중 알림 */}
          {isDisabled && isHovered && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-40">
              <div className="bg-orange-500/90 text-white px-3 py-1 rounded-lg text-xs shadow-lg">
                다른 설명이 재생 중입니다
              </div>
            </div>
          )}

          {/* 온도계 본체 */}
          <div 
            className={`flex items-center gap-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-xl border border-white/20 transition-all duration-200 ${
              isDisabled 
                ? 'opacity-60 cursor-not-allowed' 
                : 'cursor-pointer hover:scale-105 hover:shadow-2xl hover:bg-white'
            } ${isPlaying ? 'ring-2 ring-blue-400 ring-opacity-50 scale-105' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* 온도계 */}
            <div className="relative">
              {/* 온도계 튜브 */}
              <div className="w-4 h-24 bg-gray-100 rounded-full relative overflow-hidden border border-gray-200 shadow-inner">
                {/* 온도 액체 */}
                <div
                  className={`absolute bottom-0 w-full bg-gradient-to-t ${getTemperatureColor(
                    temperature,
                  )} transition-all duration-1000 ease-out rounded-full shadow-sm ${
                    (isHovered && !isDisabled) || isPlaying ? 'animate-pulse' : ''
                  }`}
                  style={{ height: `${height}%` }}
                />

                {/* 온도계 눈금 */}
                {[20, 40, 60, 80].map((pos) => (
                  <div key={pos} className="absolute right-0 w-1 h-px bg-gray-300" style={{ top: `${pos}%` }} />
                ))}
              </div>

              {/* 온도계 구 (하단) */}
              <div
                className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-br ${getTemperatureColor(
                  temperature,
                )} rounded-full shadow-lg border-2 border-white ${
                  (isHovered && !isDisabled) || isPlaying ? 'animate-pulse' : ''
                }`}
              />

              {/* 재생 중 표시 아이콘 */}
              {isPlaying && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>
              )}

              {/* 비활성화 상태 표시 */}
              {isDisabled && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>

            {/* 온도 표시 */}
            <div className="flex flex-col items-start">
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-light tabular-nums transition-colors duration-200 ${
                  isPlaying 
                    ? 'text-blue-600' 
                    : isDisabled 
                      ? 'text-gray-400' 
                      : isHovered 
                        ? 'text-blue-600' 
                        : 'text-gray-800'
                }`}>
                  {temperature}
                </span>
                <span className="text-lg text-gray-500 font-light">°C</span>
              </div>
              <div className={`text-xs font-light tracking-wide uppercase transition-colors duration-200 ${
                isPlaying 
                  ? 'text-blue-500' 
                  : isDisabled 
                    ? 'text-gray-400' 
                    : isHovered 
                      ? 'text-blue-500' 
                      : 'text-gray-400'
              }`}>
                온도계
              </div>
            </div>

            {/* 호버 힌트 */}
            {isHovered && !isDisabled && !isPlaying && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap animate-fade-in">
                🔊 음성 설명 재생 중...
              </div>
            )}
          </div>
        </div>
      </Html>
    </Billboard>
  )
}

export default ThermometerDisplay