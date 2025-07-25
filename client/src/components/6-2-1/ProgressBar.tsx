import { time } from 'console'
import React, { useRef } from 'react'

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
    <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg'>
      <div className='flex items-center gap-4 mb-2'>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className='p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors'>
          {isPlaying ? (
            <div className='flex gap-1'>
              <div className='w-1 h-4 bg-white'></div>
              <div className='w-1 h-4 bg-white'></div>
            </div>
          ) : (
            <div className='w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent'></div>
          )}
        </button>
        <span className='text-sm font-light'>{isPlaying ? '재생 중' : '일시 정지'}</span>
      </div>

      <div 
        ref={progressBarRef}
        className='w-80 h-3 bg-gray-200 rounded-full overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors'
        onClick={handleBarClick}
      >
        <div
          className='h-full bg-blue-600 transition-all duration-300 ease-in-out'
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className='flex justify-between text-xs text-gray-600 mt-1 font-light'>
        <span>{timeData[0]?.time}</span>
        <span>{timeData[timeData.length - 1]?.time}</span>
      </div>
    </div>
  )
}

export default ProgressBar