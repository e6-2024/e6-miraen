import React, { useState, useRef, useEffect } from 'react'
import { useNarrationManager } from './useNarrationManager'

function ObservationTable({ currentData }) {
  const [isHovered, setIsHovered] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    playNarration,
    isCurrentlyPlaying,
    isOtherNarrationPlaying,
    isAnyNarrationPlaying
  } = useNarrationManager('observation-table')

  const handlePlayNarration = async () => {
    try {
      await playNarration(
        '/sounds/6-2-1/narration/6-2-1-E.MP3',
        '실시간으로 변하는 관측 자료를 나타냅니다.',
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
    <div className='absolute bottom-4 left-4 z-10'>
      {isDisabled && isHovered && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-40">
          <div className="bg-orange-500/90 text-white font-light px-3 py-1 rounded-lg text-xs shadow-lg">
            다른 설명이 재생 중입니다
          </div>
        </div>
      )}

      <div 
        className={`bg-white bg-opacity-95 p-6 rounded-xl shadow-2xl border-2 border-blue-200 transition-all duration-200 ${
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

        <h3 className='font-bold mb-4 text-lg text-gray-800 text-center bg-blue-50 py-2 px-4 rounded-lg'>
          관측 자료
        </h3>
        <table className='text-base w-full border-collapse min-w-[280px]'>
          <thead>
            <tr>
              <th className='text-center border-2 border-gray-600 py-3 px-4 bg-sky-100 font-light'>
                시각
              </th>
              <th className='text-center border-2 border-gray-600 py-3 px-4 bg-white font-light'>
                {currentData.time}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className='py-3 px-4 border-2 border-gray-600 text-center bg-sky-100 font-light'>
                태양 방위각
              </td>
              <td className='border-2 border-gray-600 text-center py-3 px-4 bg-white font-light'>
                {currentData.azimuth}°
              </td>
            </tr>
            <tr>
              <td className='py-3 px-4 border-2 border-gray-600 text-center bg-sky-100 font-light'>
                태양 고도
              </td>
              <td className='border-2 border-gray-600 text-center py-3 px-4 bg-white font-light'>
                {currentData.altitude}°
              </td>
            </tr>
            <tr>
              <td className='py-3 px-4 border-2 border-gray-600 text-center bg-sky-100 font-light'>
                그림자 길이
              </td>
              <td className='border-2 border-gray-600 text-center py-3 px-4 bg-white font-light'>
                {currentData.shadowLength} cm
              </td>
            </tr>
            <tr>
              <td className='py-3 px-4 border-2 border-gray-600 text-center bg-sky-100 font-light'>
                기온
              </td>
              <td className='py-3 px-4 border-2 border-gray-600 text-center bg-white font-light'>
                {currentData.temperature}°C
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  )
}

export default ObservationTable