import React, { useRef, useState } from 'react'
import { CrayonTextBox } from '../common/CrayonTextBox'

function ProgressBar({ progress, isPlaying, setIsPlaying, timeData, onProgressClick }) {
  const progressBarRef = useRef(null)

  const handleBarClick = (e) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      onProgressClick(clickX, rect.width)
    }
  }

  return (
    <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10'>
      <div className='transition-all duration-200'>
        <CrayonTextBox
          bg='#fff'
          color='#01A7A2'
          textcolor='#333'
          animated={true}
          className='p-4 rounded-2xl z-[50]'>
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
              className='h-full bg-[#01A7A2] transition-all ease-in-out'
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
