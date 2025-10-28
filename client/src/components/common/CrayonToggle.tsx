import React, { useCallback, useId } from 'react'
import { Sun, Moon } from 'lucide-react'

interface CrayonToggleButtonProps {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  className?: string
  width?: number
  height?: number

  dayBg?: string
  nightBg?: string
  borderColor?: string
  textColorDay?: string
  textColorNight?: string
  knobBg?: string

  labelDay?: string
  labelNight?: string
  iconSize?: number
}

export const CrayonToggle: React.FC<CrayonToggleButtonProps> = ({
  checked,
  onChange,
  disabled = false,
  className = '',
  width = 220,
  height = 70,

  dayBg = '#ffffff',
  nightBg = '#0B1220',
  borderColor = '#52AE46',
  textColorDay = '#000000',
  textColorNight = '#FDE047',
  knobBg = '#ffffff',

  labelDay = '낮',
  labelNight = '밤',
  iconSize = 28,
}) => {
  const uid = useId()
  const maskId = `crayonMask-${uid}`
  const paperStaticId = `paperTextureStatic-${uid}`
  const borderStaticId = `crayonBorderStatic-${uid}`
  const insetId = `innerStepInset-${uid}`

  const H = height
  const W = width
  const R = H / 2
  const pad = 6
  const innerH = H - pad * 2
  const innerW = W - pad * 2
  const knobSize = H - 12
  const knobX = checked ? pad + 6 : W - knobSize - pad - 6

  const handleClick = useCallback(() => {
    if (!disabled) onChange(!checked)
  }, [checked, disabled, onChange])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange(!checked)
    }
    if (e.key === 'ArrowLeft') onChange(false)
    if (e.key === 'ArrowRight') onChange(true)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="낮/밤 전환"
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={onKeyDown}
      className={`relative inline-block select-none rounded-full border-0 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      style={{ width: W, height: H, WebkitTapHighlightColor: 'transparent' }}
    >
      {/* defs */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <mask id={maskId}>
            <rect
              x={pad}
              y={pad}
              width={innerW}
              height={innerH}
              rx={innerH / 2}
              ry={innerH / 2}
              fill="#fff"
            />
          </mask>

          <filter id={paperStaticId} x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence baseFrequency="0.02" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
          </filter>

          <filter id={borderStaticId} x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence baseFrequency="0.3" numOctaves="2" result="crayonNoise" />
            <feDisplacementMap in="SourceGraphic" in2="crayonNoise" scale="0.3" />
          </filter>

          <filter id={insetId} x="-25%" y="-25%" width="150%" height="150%">
            <feComponentTransfer in="SourceAlpha" result="alpha">
              <feFuncA type="linear" slope="1" />
            </feComponentTransfer>
            <feMorphology in="alpha" operator="erode" radius="2" result="eroded" />
            <feComposite in="alpha" in2="eroded" operator="in" result="rim" />
            <feGaussianBlur in="rim" stdDeviation="5" result="rimSoft" />
            <feOffset in="rimSoft" dx="0" dy="0.3" result="highlightShift" />
            <feFlood floodColor="black" floodOpacity="0.85" result="hlColor" />
            <feComposite in="hlColor" in2="highlightShift" operator="out" result="highlight" />
          </filter>
        </defs>
      </svg>

      {/* 배경: 단색 */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0"
      >
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          rx={R}
          ry={R}
          fill={checked ? dayBg : nightBg}
          filter={`url(#${paperStaticId})`}
          className="transition-all duration-300"
        />
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          rx={R}
          ry={R}
          fill={checked ? dayBg : nightBg}
          filter={`url(#${insetId})`}
          mask={`url(#${maskId})`}
        />
        <rect
          x={pad + 6}
          y={pad + 6}
          width={W - (pad + 6) * 2}
          height={H - (pad + 6) * 2}
          rx={(H - (pad + 6) * 2) / 2}
          ry={(H - (pad + 6) * 2) / 2}
          fill="none"
          stroke={borderColor}
          strokeWidth="2"
          opacity="0.6"
          filter={`url(#${borderStaticId})`}
        />
      </svg>

      {/* 라벨 & 아이콘 */}
      <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none">
        <div
          className={`flex items-center gap-2 transition-all duration-300 ${
            checked ? 'opacity-90' : 'opacity-40'
          }`}
        >
          <Sun size={iconSize} style={{ color: textColorDay }} />
          <span className="font-bold text-[20pt]" style={{ color: textColorDay }}>
            {labelDay}
          </span>
        </div>
        <div
          className={`flex items-center gap-2 transition-all duration-300 ${
            !checked ? 'opacity-90' : 'opacity-40'
          }`}
        >
          <span className="font-bold text-[20pt]" style={{ color: textColorNight }}>
            {labelNight}
          </span>
          <Moon size={iconSize} style={{ color: textColorNight }} />
        </div>
      </div>
    </button>
  )
}
