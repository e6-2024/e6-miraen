import React, { useState } from 'react'
import { Billboard, Html } from '@react-three/drei'
import { Vector3 } from 'three'
import { CrayonTextBox } from '../common/CrayonTextBox'

interface ThermometerDisplayProps {
  temperature: number
  maxTemp?: number
  position?: [number, number, number] | Vector3
}

function ThermometerDisplay({
  temperature,
  maxTemp = 25,
  position = [0, 0, 0],
}: ThermometerDisplayProps) {
  const [isHovered, setIsHovered] = useState(false)

  // 비율: 온도 범위 보정 (예: -5°C ~ maxTemp 기준으로 0~100%)
  const height = Math.max(0, ((temperature + 5.0) / maxTemp) * 100)

  // 온도 색상 (원하면 온도에 따라 달리해도 됨)
  const getTemperatureColor = (temp: number) => {
    return 'from-red-500 to-red-400'
  }

  return (
    <Billboard>
      <Html position={position} center distanceFactor={3.5} transform>
        <div className="relative">
          <CrayonTextBox bg="#fff" color="#01A7A2" textcolor="#333" padding={12} paddingY={12}>
            <div
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${
                isHovered ? 'scale-[1.03]' : ''
              }`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="relative">
                {/* 막대 */}
                <div className="w-4 h-24 bg-gray-100 rounded-full relative overflow-hidden border border-gray-200 shadow-inner">
                  <div
                    className={`absolute bottom-0 w-full bg-gradient-to-t ${getTemperatureColor(
                      temperature
                    )} transition-all duration-700 ease-out rounded-full shadow-sm ${
                      isHovered ? 'animate-pulse' : ''
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  {[20, 40, 60, 80].map((pos) => (
                    <div key={pos} className="absolute right-0 w-1 h-px bg-gray-300" style={{ top: `${pos}%` }} />
                  ))}
                </div>

                {/* 수은 볼 */}
                <div
                  className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-br ${getTemperatureColor(
                    temperature
                  )} rounded-full shadow-lg border-2 border-white ${isHovered ? 'animate-pulse' : ''}`}
                />
              </div>

              {/* 숫자/라벨 */}
              <div className="flex flex-col items-start">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-light tabular-nums transition-colors duration-200`}
                  >
                    {temperature}
                  </span>
                  <span className="text-xl text-gray-500 font-light">°C</span>
                </div>
                <div
                  className={`text-lg font-light tracking-wide uppercase transition-colors duration-200`}
                >
                  온도계
                </div>
              </div>
            </div>
          </CrayonTextBox>
        </div>
      </Html>
    </Billboard>
  )
}

export default ThermometerDisplay
