import React, { useState, useEffect } from 'react'
import ObservationTable from '@/components/6-2-1/ObservationTable'

interface TimeIntervalImagesProps {
  currentData: {
    time: string
    azimuth: number
    altitude: number
    temperature: number
    shadowLength: number
  }
  isVisible: boolean
  timeData: Array<{
    time: string
    azimuth: number
    altitude: number
    temperature: number
    shadowLength: number
  }>
  onTimeSelect: (data: any) => void
}

// 이미지 파일명과 시간 매핑
const timeImageMap = {
  '09:30': '930.png',
  '10:30': '1030.png',
  '11:30': '1130.png',
  '12:30': '1230.png',
  '13:30': '1330.png',
  '14:30': '1430.png',
  '15:30': '1530.png',
}

function TimeIntervalImages({ currentData, isVisible, timeData, onTimeSelect }: TimeIntervalImagesProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const availableTimes = Object.keys(timeImageMap)

  const getDataByTime = (time: string) => {
    if (!timeData || timeData.length === 0) {
      console.warn('timeData가 없습니다:', timeData)
      return null
    }
    const foundData = timeData.find(data => data.time === time)
    if (!foundData) {
      console.warn(`시간 ${time}에 해당하는 데이터를 찾을 수 없습니다`)
      return timeData[0] 
    }
    return foundData
  }

  const currentSelectedData = getDataByTime(availableTimes[currentImageIndex]) || currentData

  useEffect(() => {
    if (isVisible) {
      onTimeSelect(currentSelectedData)
    } else {
      onTimeSelect(null)
    }
  }, [currentImageIndex, isVisible, onTimeSelect, currentSelectedData])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && isVisible) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % availableTimes.length)
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, isVisible, availableTimes.length])

  if (!isVisible) return null

  const currentTime = availableTimes[currentImageIndex]
  const currentImageName = timeImageMap[currentTime]

  return (
    <div className='fixed inset-0 z-[1000] bg-white flex flex-col justify-center items-center'>
        <img
          src={`/img/6-2-1/${currentImageName}`}
          alt={`${currentTime} 관측 자료`}
          className='h-screen w-auto max-w-none'
        />

      <div className='absolute left-4 top-4 mt-4 gap-2 flex flex-col'>
        {availableTimes.map((time, index) => (
          <button
            key={time}
            onClick={() => {
              setCurrentImageIndex(index)
              onTimeSelect(getDataByTime(time))
            }}
            className={`px-3 py-1 rounded-full text-lg transition-all duration-200 ${
              index === currentImageIndex
                ? 'bg-orange-500 text-white font-bold'
                : 'bg-white bg-opacity-70 font-bold text-gray-800 hover:bg-opacity-90'
            }`}>
            {time}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TimeIntervalImages