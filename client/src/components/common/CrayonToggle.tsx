import React, { useCallback } from 'react'
import { Sun as SunIcon, Moon as MoonIcon } from 'lucide-react'

type ToggleState = boolean // true=left(ON), false=right(OFF)

interface CrayonToggleSwitchProps {
  checked: ToggleState
  onChange: (next: ToggleState) => void
  leftLabel?: string
  rightLabel?: string
  leftIcon?: React.ComponentType<any> | string
  rightIcon?: React.ComponentType<any> | string
  width?: number
  height?: number
  className?: string
  ariaLabel?: string
  disabled?: boolean
  // 색상 커스텀
  bg?: string           // 바탕색
  border?: string       // 외곽선(크레용) 색
  knobBg?: string       // 손잡이 배경
  activeText?: string   // 활성 라벨 색
  inactiveText?: string // 비활성 라벨 색
}

export const CrayonToggle: React.FC<CrayonToggleSwitchProps> = ({
  checked,
  onChange,
  leftLabel = 'ON',
  rightLabel = 'OFF',
  leftIcon = '',
  rightIcon = '',
  width = 260,
  height = 88,
  className = '',
  ariaLabel = 'toggle switch',
  disabled = false,
  bg = '#fef3c7',         // amber-100
  border = '#111827',     // zinc-900
  knobBg = '#ffffff',
  activeText = '#111827',
  inactiveText = '#6b7280',
}) => {
  const radius = Math.round(height / 2)
  const padding = 8
  const trackW = width - padding * 2
  const trackH = height - padding * 2
  const knobSize = trackH - 10
  const knobRadius = Math.round(knobSize / 2)

  const handleToggle = useCallback(() => {
    if (!disabled) onChange(!checked)
  }, [checked, disabled, onChange])

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange(!checked)
    }
    if (e.key === 'ArrowLeft') onChange(true)
    if (e.key === 'ArrowRight') onChange(false)
  }

  // 손잡이 위치 (좌=checked, 우=!checked)
  const knobX = checked
    ? padding + 5
    : padding + trackW - knobSize-12

  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onClick={handleToggle}
      className={`relative inline-block select-none outline-none ${disabled ? 'opacity-60 pointer-events-none' : 'cursor-pointer'} ${className}`}
      style={{ width, height }}
    >
      {/* SVG 필터 정의(크레용/종이 질감) */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="paperTextureSwitch" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence baseFrequency="0.02" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.7" />
          </filter>
          <filter id="crayonBorderSwitch" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence baseFrequency="0.5" numOctaves="3" result="n" seed="9">
              <animate attributeName="seed" values="9;13;7;18;9" dur="4s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.8">
              <animate attributeName="scale" values="1.2;2.2;1.6;2.0;1.2" dur="2.4s" repeatCount="indefinite" />
            </feDisplacementMap>
          </filter>
        </defs>
      </svg>

      {/* 트랙(배경) */}
      <svg width={width} height={height} className="absolute inset-0">
        <rect
          x={0.5}
          y={0.5}
          width={width - 1}
          height={height - 1}
          rx={radius}
          ry={radius}
          fill={bg}
          filter="url(#paperTextureSwitch)"
        />
        <rect
          x={4}
          y={4}
          width={width - 8}
          height={height - 8}
          rx={radius - 4}
          ry={radius - 4}
          fill="none"
          stroke={border}
          strokeWidth={3}
          opacity={0.9}
          filter="url(#crayonBorderSwitch)"
        />
      </svg>

      {/* 라벨/아이콘 */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        <div className="flex px-2 items-center gap-2">
          <span
            className="font-bold"
            style={{ color: checked ? activeText : inactiveText }}
          >
            {leftLabel}
          </span>
        </div>
        <div className="flex px-1 items-center gap-2">
          <span
            className="font-bold"
            style={{ color: !checked ? activeText : inactiveText }}
          >
            {rightLabel}
          </span>
        </div>
      </div>

      {/* 손잡이 */}
      <div
        className="absolute top-1/2 -translate-y-1/2 transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: `translate(${knobX}px, -50%)` }}
      >
        <svg width={knobSize + 10} height={knobSize + 10}>
          <circle
            cx={(knobSize + 10) / 2}
            cy={(knobSize + 10) / 2}
            r={knobRadius + 3}
            fill={knobBg}
            filter="url(#paperTextureSwitch)"
          />
          <circle
            cx={(knobSize + 10) / 2}
            cy={(knobSize + 10) / 2}
            r={knobRadius + 3}
            fill="none"
            stroke={border}
            strokeWidth={3}
            filter="url(#crayonBorderSwitch)"
          />
        </svg>
      </div>
    </div>
  )
}
