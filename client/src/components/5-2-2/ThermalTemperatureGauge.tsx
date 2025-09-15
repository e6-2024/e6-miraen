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
    <div className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-30 ${className}`}>
      <CrayonTextBox bg='rgb(0,0,0,0)' color='rgb(0,0,0,0)' 
      height={460} animated={true}>
        <div className='relative'>
          <div
            className='w-8 h-96 rounded-lg shadow-lg'
            style={{
              background: 'linear-gradient(to bottom, white, red, orange, yellow, green, blue)',
            }}></div>

          <div className='absolute left-1/2 -bottom-7 -translate-x-1/2 text-center'>
            <span className='text-white whitespace-nowrap font-light text-xs drop-shadow-lg bg-opacity-50 px-1 py-0.5 rounded'>온도 낮음</span>
          </div>
          <div className='absolute left-1/2 -top-7 -translate-x-1/2 text-center'>
            <span className='text-white whitespace-nowrap font-light text-xs drop-shadow-lg bg-opacity-50 px-1 py-0.5 rounded'>온도 높음</span>
          </div>
        </div>
      </CrayonTextBox>
    </div>
  )
}
