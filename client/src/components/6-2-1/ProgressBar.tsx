import React, { useRef, useState, useEffect } from 'react'
import { useNarrationManager } from './useNarrationManager'
import { CrayonTextBox } from '../common/CrayonTextBox'

function ProgressBar({ progress, isPlaying, setIsPlaying, timeData, onProgressClick }) {
  const progressBarRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { playNarration, isCurrentlyPlaying, isOtherNarrationPlaying, isAnyNarrationPlaying } =
    useNarrationManager('progress-bar')

  const handlePlayNarration = async () => {
    try {
      await playNarration(
        '/sounds/6-2-1/narration/6-2-1-F.MP3',
        '시각을 설정하면 해당 시각의 태양 고도, 그림자 길이, 기온을 확인할 수 있습니다.',
        0.7,
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

  const handleBarClick = (e) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      onProgressClick(clickX, rect.width)
    }
  }

  const isDisabled = isOtherNarrationPlaying()
  const isPlayingNarration = isCurrentlyPlaying()

  return (
    <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10'>
      {isDisabled && isHovered && (
        <div className='absolute -top-24 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-40'>
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

      <div
        className={`transition-all duration-200 ${
          isPlayingNarration ? 'scale-105' : ''
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        {isPlayingNarration && (
          <div className='absolute -top-2 -right-2 w-4 h-4 bg-[blue-500] rounded-full flex items-center justify-center animate-pulse'>
            <div className='w-2 h-2 rounded-full animate-ping'></div>
          </div>
        )}
        <CrayonTextBox
          bg='#fff'
          color='#01A7A2'
          textcolor='#333'
          animated={true}
          className='p-4 rounded-2xl z-[50]'>
          {isDisabled && (
            <div className='absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center'>
              <div className='w-2 h-2 bg-white rounded-full'></div>
            </div>
          )}

          <div className='flex items-center gap-4 mb-2'>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className='p-2 w-6 h-8 bg-[#01A7A2] text-white rounded-full transition-colors'>
              {isPlaying ? (
                <div className='flex gap-1 justify-center items-center'>
                  <div className='w-1 h-2 bg-white'></div>
                  <div className='w-1 h-2 bg-white'></div>
                </div>
              ) : (
                <div className='w-0 h-0 flex justify-center items-center border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent'></div>
              )}
            </button>
            <span className='text-sm font-light'>{isPlaying ? '재생 중' : '일시 정지'}</span>
          </div>

          <div
            ref={progressBarRef}
            className='w-80 h-3 bg-gray-200 rounded-full overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors'
            onClick={handleBarClick}>
            <div
              className='h-full bg-blue-600 transition-all ease-in-out'
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className='flex justify-between text-xs text-gray-600 mt-1 font-light'>
            <span>{timeData[0]?.time}</span>
            <span>{timeData[timeData.length - 1]?.time}</span>
          </div>
        </CrayonTextBox>
      </div>
    </div>
  )
}

export default ProgressBar
