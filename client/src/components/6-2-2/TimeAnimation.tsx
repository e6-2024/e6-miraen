import React from 'react'
import { CrayonTextBox } from '../common/CrayonTextBox'

interface TimeAnimationProps {
  isAnimating: boolean
  visible: boolean
  className?: string
}

export const TimeAnimation: React.FC<TimeAnimationProps> = ({ isAnimating, visible, className = '' }) => {
  if (!visible) return null

  return (
    <div className={`absolute top-0 left-0  z-20 ${className}`}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes bell-wiggle {
              0% { transform: rotate(0deg); }
              25% { transform: rotate(5deg); }
              50% { transform: rotate(0deg); }
              75% { transform: rotate(-5deg); }
              100% { transform: rotate(0deg); }
            }

            /* SVG 회전 정확도 보정 */
            .use-viewbox { transform-box: view-box; } /* viewBox 좌표 기준 사용 */
            .center-origin { transform-origin: 50px 60px; }
            .bell-origin-left  { transform-origin: 34px 14px; }
            .bell-origin-right { transform-origin: 66px 14px; }

            .spin-fast { animation: spin 2s linear infinite; }
            .wiggle    { animation: bell-wiggle 0.9s ease-in-out infinite; }
          `,
        }}
      />

      <CrayonTextBox bg='rgba(255, 255, 255, 30)' color='#01A7A2' textcolor='#000000' className='p-4' animated={true}>
        <svg viewBox='0 0 100 110' className='w-28 h-28'>
          {/* shadow */}
          <ellipse cx='50' cy='102' rx='28' ry='5' fill='rgba(0,0,0,0.12)' />

          {/* feet */}
          <rect x='28' y='92' width='10' height='6' rx='2' fill='#4b5563' />
          <rect x='62' y='92' width='10' height='6' rx='2' fill='#4b5563' />

          {/* handle */}
          <path d='M36 18 Q50 6 64 18' fill='none' stroke='#6b7280' strokeWidth='3' strokeLinecap='round' />

          {/* bells */}
          <g className={`use-viewbox ${isAnimating ? 'wiggle bell-origin-left' : ''}`}>
            <path d='M22 24 q12 -12 24 0 q-12 4 -24 0z' fill='#9ca3af' stroke='#6b7280' strokeWidth='2' />
          </g>
          <g className={`use-viewbox ${isAnimating ? 'wiggle bell-origin-right' : ''}`}>
            <path d='M54 24 q12 -12 24 0 q-12 4 -24 0z' fill='#9ca3af' stroke='#6b7280' strokeWidth='2' />
          </g>

          {/* pillar */}
          <rect x='47' y='24' width='6' height='10' rx='2' fill='#6b7280' />

          {/* clock body */}
          <circle cx='50' cy='60' r='34' fill='#fefce8' stroke='#6b7280' strokeWidth='3' />
          <circle cx='50' cy='60' r='28' fill='#fff' stroke='#e5e7eb' strokeWidth='1' />

          {/* ticks */}
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6
            const r1 = 28
            const r2 = i % 3 === 0 ? 21 : 24
            const x1 = 50 + r1 * Math.sin(a)
            const y1 = 60 - r1 * Math.cos(a)
            const x2 = 50 + r2 * Math.sin(a)
            const y2 = 60 - r2 * Math.cos(a)
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke='#111827'
                strokeWidth={i % 3 === 0 ? 2.2 : 1.2}
                strokeLinecap='round'
                opacity={i % 3 === 0 ? 0.9 : 0.7}
              />
            )
          })}
          <g className={`use-viewbox center-origin ${isAnimating ? 'spin-fast' : ''}`}>
            <line x1='50' y1='60' x2='50' y2='30' stroke='#ef4444' strokeWidth='3' strokeLinecap='round' />
          </g>

          {/* pivot */}
          <circle cx='50' cy='60' r='3' fill='#111827' />
        </svg>
      </CrayonTextBox>
    </div>
  )
}
