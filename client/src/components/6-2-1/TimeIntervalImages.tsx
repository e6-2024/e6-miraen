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

  // 사용 가능한 시간대들
  const availableTimes = Object.keys(timeImageMap)

  // 선택된 시간에 해당하는 데이터 찾기
  const getDataByTime = (time: string) => {
    if (!timeData || timeData.length === 0) {
      console.warn('timeData가 없습니다:', timeData)
      return null
    }
    const foundData = timeData.find(data => data.time === time)
    if (!foundData) {
      console.warn(`시간 ${time}에 해당하는 데이터를 찾을 수 없습니다`)
      return timeData[0] // 첫 번째 데이터를 기본값으로 사용
    }
    return foundData
  }

  // 현재 선택된 시간의 데이터
  const currentSelectedData = getDataByTime(availableTimes[currentImageIndex]) || currentData

  // 시간 인덱스가 변경될 때마다 부모에게 알림
  useEffect(() => {
    if (isVisible) {
      onTimeSelect(currentSelectedData)
    } else {
      // TimeIntervalImages가 숨겨질 때 선택 데이터 초기화
      onTimeSelect(null)
    }
  }, [currentImageIndex, isVisible, onTimeSelect, currentSelectedData])

  // 자동 재생 효과
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && isVisible) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % availableTimes.length)
      }, 2000) // 2초마다 이미지 변경
    }
    return () => clearInterval(interval)
  }, [isPlaying, isVisible, availableTimes.length])

  // 컴포넌트가 보이지 않을 때는 렌더링하지 않음
  if (!isVisible) return null

  const currentTime = availableTimes[currentImageIndex]
  const currentImageName = timeImageMap[currentTime]

  return (
    <div
      className='fixed inset-0 z-[1000] bg-black bg-opacity-90 flex flex-col justify-center items-center'
      style={{
        width: '100vw',
        height: '100vh',
      }}>

      {/* 메인 이미지 */}
      <div className='w-full h-full flex justify-center items-center bg-white rounded-lg shadow-2xl'>
        <img
          src={`/img/6-2-1/${currentImageName}`}
          alt={`${currentTime} 관측 자료`}
          className='max-w-full object-contain'
        />
      </div>

      {/* 썸네일 네비게이션 */}
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