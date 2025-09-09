import React, { useState, useRef, useEffect } from 'react'
import { Billboard, Html } from '@react-three/drei'
import { Vector3 } from 'three'
import { useNarrationManager } from './useNarrationManager'
import { CrayonTextBox } from '../common/CrayonTextBox'

interface ThermometerDisplayProps {
  temperature: number
  maxTemp?: number
  position?: [number, number, number] | Vector3
  audioPath?: string
  subtitle?: string
}

function ThermometerDisplay({
  temperature,
  maxTemp = 25,
  position = [0, 0, 0],
  audioPath = '/sounds/6-2-1/narration/6-2-1-D.MP3',
  subtitle = '시간에 따라 변하는 태양 고도, 그림자 길이, 기온을 살펴봅시다.',
}: ThermometerDisplayProps) {
  const [isHovered, setIsHovered] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { playNarration, stopNarration, isCurrentlyPlaying, isOtherNarrationPlaying, isAnyNarrationPlaying } =
    useNarrationManager('thermometer')

  const height = Math.max(0, ((temperature + 5.0)/ maxTemp) * 100)

  const getTemperatureColor = (temp) => {
    return 'from-red-500 to-red-400'
  }

  const handlePlayNarration = async () => {
    try {
      await playNarration(audioPath, subtitle, 0.7)
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
    <Billboard>
      <Html position={position} center distanceFactor={3.5} transform occlude>
        <div className='relative'>
          {isDisabled && isHovered && (
            <div className='absolute -top-20 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-40'>
              <CrayonTextBox
                bg='#fff'
                color='#FF6F61'
                textcolor='#333'
                animated={false}
                className='shadow-lg font-light'
                fontSize='16px'
                text='다른 설명이 재생 중입니다.'></CrayonTextBox>
            </div>
          )}
          
          <CrayonTextBox bg='#fff' color='#01A7A2' textcolor='#333' animated={true}>
            <div
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${
                isPlaying ? 'scale-105' : ''
              }`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}>
              <div className='relative'>
                <div className='w-4 h-24 bg-gray-100 rounded-full relative overflow-hidden border border-gray-200 shadow-inner'>
                  <div
                    className={`absolute bottom-0 w-full bg-gradient-to-t ${getTemperatureColor(
                      temperature,
                    )} transition-all duration-1000 ease-out rounded-full shadow-sm ${
                      (isHovered && !isDisabled) || isPlaying ? 'animate-pulse' : ''
                    }`}
                    style={{ height: `${height}%` }}
                  />

                  {[20, 40, 60, 80].map((pos) => (
                    <div key={pos} className='absolute right-0 w-1 h-px bg-gray-300' style={{ top: `${pos}%` }} />
                  ))}
                </div>

                <div
                  className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-br ${getTemperatureColor(
                    temperature,
                  )} rounded-full shadow-lg border-2 border-white ${
                    (isHovered && !isDisabled) || isPlaying ? 'animate-pulse' : ''
                  }`}
                />

                {isPlaying && (
                  <div className='absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center animate-pulse'>
                    <div className='w-2 h-2 bg-white rounded-full animate-ping'></div>
                  </div>
                )}

                {isDisabled && (
                  <div className='absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center'>
                    <div className='w-2 h-2 bg-white rounded-full'></div>
                  </div>
                )}
              </div>

              <div className='flex flex-col items-start'>
                <div className='flex items-baseline gap-1'>
                  <span
                    className={`text-3xl font-light tabular-nums transition-colors duration-200 ${
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
                  <span className='text-lg text-gray-500 font-light'>°C</span>
                </div>
                <div
                  className={`text-xs font-light tracking-wide uppercase transition-colors duration-200 ${
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
            </div>
          </CrayonTextBox>
        </div>
      </Html>
    </Billboard>
  )
}

export default ThermometerDisplay
