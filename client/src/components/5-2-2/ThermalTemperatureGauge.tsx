import React from 'react'
import { CrayonTextBox } from '../common/CrayonTextBox'

interface ThermalTemperatureGaugeProps {
  className?: string
}

export const ThermalTemperatureGauge: React.FC<ThermalTemperatureGaugeProps> = ({ className = '' }) => {
  // 온도 라벨들 (섭씨)
  const temperatureLabels = [
    { temp: '100°C', position: 10 },
    { temp: '90°C', position: 15 },
    { temp: '80°C', position: 20 },
    { temp: '70°C', position: 25 },
    { temp: '60°C', position: 30 },
    { temp: '50°C', position: 35 },
    { temp: '40°C', position: 40 },
    { temp: '30°C', position: 50 },
    { temp: '20°C', position: 65 },
    { temp: '10°C', position: 80 },
    { temp: '0°C', position: 90 },
  ]

  return (
    <div className={`fixed right-4 top-32 z-30 ${className}`}>
      <CrayonTextBox bg='rgb(0,0,0,0)' color='rgb(0,0,0,0)' height={500} animated={true}>
        <div className='flex flex-col items-center relative'>
          <div className='flex flex-col items-center mb-2'>
            <span className='text-white font-light text-sm drop-shadow-lg bg-opacity-50'>온도</span>
            <span className='text-white font-light text-sm drop-shadow-lg bg-opacity-50'>높음</span>
          </div>
          <div
            className='w-8 h-96 rounded-lg shadow-lg'
            style={{
              background: 'linear-gradient(to bottom, white, red, orange, yellow, green, blue)',
            }}></div>

          <div className='flex flex-col items-center mb-2'>
            <span className='text-white font-light text-sm drop-shadow-lg bg-opacity-50'>온도</span>
            <span className='text-white font-light text-sm drop-shadow-lg bg-opacity-50'>낮음</span>
          </div>
        </div>
      </CrayonTextBox>
    </div>
  )
}
