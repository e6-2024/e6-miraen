import React from 'react'
import { Billboard, Html } from '@react-three/drei'
import { Vector3 } from 'three'

interface ThermometerDisplayProps {
  temperature: number
  maxTemp?: number
  position?: [number, number, number] | Vector3
}

function ThermometerDisplay({ temperature, maxTemp = 28, position = [0, 0, 0] }: ThermometerDisplayProps) {
  const height = Math.max(0, (temperature / maxTemp) * 100)

  // 온도에 따른 색상 계산
  const getTemperatureColor = (temp) => {
    return 'from-red-500 to-red-400'
  }

  return (
    <Billboard>
      <Html position={position} center distanceFactor={1.3} transform occlude className='pointer-events-none'>
        <div className='flex items-center gap-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-xl border border-white/20'>
          {/* 온도계 */}
          <div className='relative'>
            {/* 온도계 튜브 */}
            <div className='w-4 h-24 bg-gray-100 rounded-full relative overflow-hidden border border-gray-200 shadow-inner'>
              {/* 온도 액체 */}
              <div
                className={`absolute bottom-0 w-full bg-gradient-to-t ${getTemperatureColor(
                  temperature,
                )} transition-all duration-1000 ease-out rounded-full shadow-sm`}
                style={{ height: `${height}%` }}
              />

              {/* 온도계 눈금 - 더 미니멀하게 */}
              {[20, 40, 60, 80].map((pos) => (
                <div key={pos} className='absolute right-0 w-1 h-px bg-gray-300' style={{ top: `${pos}%` }} />
              ))}
            </div>

            {/* 온도계 구 (하단) */}
            <div
              className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-br ${getTemperatureColor(
                temperature,
              )} rounded-full shadow-lg border-2 border-white`}
            />
          </div>

          {/* 온도 표시 */}
          <div className='flex flex-col items-start'>
            <div className='flex items-baseline gap-1'>
              <span className='text-3xl font-light text-gray-800 tabular-nums'>{temperature}</span>
              <span className='text-lg text-gray-500 font-light'>°C</span>
            </div>
            <div className='text-xs text-gray-400 font-light tracking-wide uppercase'>온도계</div>
          </div>
        </div>
      </Html>
    </Billboard>
  )
}

export default ThermometerDisplay
