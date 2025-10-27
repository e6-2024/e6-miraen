import React, { useRef } from 'react'
import { CrayonTextBox } from '../common/CrayonTextBox'

function ProgressBar({ progress, isPlaying, setIsPlaying, timeData, onProgressClick, playbackSpeed, onSpeedToggle }) {
  const progressBarRef = useRef(null)

  const handleBarClick = (e) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      onProgressClick(clickX, rect.width)
    }
  }

  return (
    <div className='absolute font-light bottom-4 left-1/2 transform -translate-x-1/2 z-10'>
      <div className='transition-all duration-200'>
        <CrayonTextBox
          bg='#fff'
          color='#01A7A2'
          textcolor='#333'
          padding={40}
          paddingY={12}
          className='p-4 rounded-2xl z-[50]'>
          <div className='flex items-center gap-4 mb-3'>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className='relative w-12 h-12 bg-gradient-to-br from-[#01A7A2] to-[#018a86] rounded-full shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center group'>
              <div className='absolute inset-0 rounded-full bg-white opacity-0 transition-opacity duration-200'></div>
              
              {isPlaying ? (
                <div className='flex gap-1 items-center justify-center'>
                  <div className='w-1 h-4 bg-white rounded-sm'></div>
                  <div className='w-1 h-4 bg-white rounded-sm'></div>
                </div>
              ) : (
                <div className='w-0 h-0 border-l-[10px] border-l-white border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent ml-1'></div>
              )}
            </button>
            
            <div className='flex text-left flex-col'>
              <span className='text-xl font-semibold text-gray-800'>
                {isPlaying ? '재생 중' : '일시 정지'}
              </span>
              <span className='text-xl text-gray-500 font-light'>
                {timeData[Math.floor((progress / 100) * (timeData.length - 1))]?.time || '09:30'}
              </span>
            </div>
          </div>

          <div
            ref={progressBarRef}
            className='w-80 h-3 bg-gray-200 rounded-full overflow-hidden cursor-pointer transition-colors '
            onClick={handleBarClick}>
            <div
              className='h-full bg-gradient-to-r from-[#01A7A2] to-[#00d4cd] transition-all ease-in-out'
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 시간 표시 */}
          <div className='flex justify-between text-lg text-gray-500 mt-2 font-light'>
            <span>{timeData[0]?.time}</span>
            <span>{timeData[timeData.length - 1]?.time}</span>
          </div>
        </CrayonTextBox>
      </div>
    </div>
  )
}

export default ProgressBar