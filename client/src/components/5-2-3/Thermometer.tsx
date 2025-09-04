import React from 'react'
import { CrayonTextBox } from '../common/CrayonTextBox'

interface ThermometerProps {
  temperature: number
  label: string
  color?: string
  position?: { top?: string; left?: string; right?: string; bottom?: string }
}

export const Thermometer: React.FC<ThermometerProps> = ({
  temperature,
  label,
  color = '#ef4444',
  position = { top: '20px', left: '20px' },
}) => {
  const maxTemp = 45
  const minTemp = 0
  const tempHeight = ((temperature - minTemp) / (maxTemp - minTemp)) * 120

  return (
    <div className='z-20' style={position}>
      <CrayonTextBox
        color='#52AE46'
        textcolor='#000000'
        bg='#fff'
        className='p-2'
        animated={true}
      >
        <div className='text-center mb-2'>
          <div className='text-lg font-bold text-gray-700'>{label}</div>
          <div className='text-lg font-bold' style={{ color }}>
            {temperature}°C
          </div>
        </div>

        <div className='relative w-8 h-32 mx-auto'>
          <div className='absolute left-1/2 transform -translate-x-1/2 w-3 h-28 bg-gray-200 rounded-full'></div>

          <div
            className='absolute left-1/2 transform -translate-x-1/2 w-3 rounded-full transition-all duration-900'
            style={{
              backgroundColor: color,
              height: `${tempHeight}px`,
              bottom: '16px',
            }}
          />

          <div
            className='absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full'
            style={{
              backgroundColor: color,
              bottom: '8px',
            }}
          />
        </div>
      </CrayonTextBox>
    </div>
  )
}
