import React, { useState } from 'react'

interface ControlButtonsProps {
  showObservationLines: boolean
  setShowObservationLines: (show: boolean) => void
  timeData: Array<{
    time: string
    azimuth: number
    altitude: number
    temperature: number
    shadowLength: number
  }>
  currentData: {
    time: string
    azimuth: number
    altitude: number
    temperature: number
    shadowLength: number
  }
  onTimeSelect: (data: any) => void
}

function ControlButtons({ 
  showObservationLines, 
  setShowObservationLines, 
  timeData, 
  currentData, 
  onTimeSelect 
}: ControlButtonsProps) {
  const [showTimeSelector, setShowTimeSelector] = useState(false)

  const handleTimeIntervalClick = () => {
    setShowTimeSelector(!showTimeSelector)
  }

  const handleTimeSelect = (data: any) => {
    onTimeSelect(data)
    setShowTimeSelector(false)
  }

  const handleAngleLineToggle = () => {
    setShowObservationLines(!showObservationLines)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* 관측선 표시/숨김 버튼 */}
      <button
        onClick={handleAngleLineToggle}
        className={`px-4 py-2 rounded-lg shadow-lg transition-colors duration-200 text-lg font-bold ${
          showObservationLines
            ? 'bg-black hover:bg-gray-400 text-white'
            : 'bg-white hover:bg-gray-400 text-black'
        }`}
      >
        {showObservationLines ? '관측선 숨기기' : '관측선 표시하기'}
      </button>

      {/* 시간 선택 드롭다운 */}
      {showTimeSelector && (
        <div className="bg-white rounded-lg shadow-xl p-3 border border-gray-200 max-h-48 overflow-y-auto">
          <div className="text-sm font-semibold text-gray-700 mb-2">시간 선택:</div>
          <div className="space-y-1">
            {timeData.map((data, index) => (
              <button
                key={index}
                onClick={() => handleTimeSelect(data)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors duration-150 ${
                  data.time === currentData.time
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {data.time} - 고도: {data.altitude.toFixed(1)}°, 온도: {data.temperature}°C
              </button>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => {
                onTimeSelect(null)
                setShowTimeSelector(false)
              }}
              className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors duration-150"
            >
              원래 모드로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ControlButtons