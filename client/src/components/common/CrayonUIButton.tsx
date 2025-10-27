import React, { useId } from 'react'
import {
  Home,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  Heart,
  Star,
  Settings,
  User,
  MessageCircle,
  Search,
  Plus,
  Minus,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  RefreshCcw,
  Expand,
  PencilLine,
} from 'lucide-react'

interface CrayonTextButtonProps {
  position?: 'static' | 'absolute' | 'fixed' | 'relative'
  text?: string
  color?: string
  textcolor?: string
  bg?: string
  onClick?: () => void
  width?: number
  height?: number
  className?: string
  top?: number | string
  left?: number | string
  right?: number | string
  bottom?: number | string
  x?: number | string
  y?: number | string
  icon?: React.ComponentType<any> | string
  iconPosition?: 'left' | 'right'
  iconSize?: number
  ariaLabel?: string
  innerCircleVisible?: boolean
  textSize?: number
}

export const CrayonTextButton: React.FC<CrayonTextButtonProps> = ({
  position = 'static',
  text,
  color = '#3b82f6',
  textcolor = '#000000',
  bg = '#dbeafe',
  onClick,
  width = 210,
  height = 75,
  className = '',
  top,
  left,
  right,
  bottom,
  x,
  y,
  icon,
  iconPosition = 'left',
  iconSize = 50,
  ariaLabel,
  innerCircleVisible,
  textSize = '20pt',
}) => {
  const uniqueId = useId()

  const maskId = `crayonMask-${uniqueId}`
  const insetId = `innerStepInset-${uniqueId}`
  const paperStaticId = `paperTextureStatic-${uniqueId}`
  const paperAnimatedId = `paperTextureAnimated-${uniqueId}`
  const borderStaticId = `crayonBorderStatic-${uniqueId}`
  const borderAnimatedId = `crayonBorderAnimated-${uniqueId}`
  const strongCrayonId = `strongCrayon-${uniqueId}`

  // 포지셔닝 스타일
  const positionStyle: React.CSSProperties = {
    position,
    ...(top !== undefined && { top }),
    ...(left !== undefined && { left }),
    ...(right !== undefined && { right }),
    ...(bottom !== undefined && { bottom }),
    ...(x !== undefined && { left: x }),
    ...(y !== undefined && { top: y }),
  }

  // 아이콘 매핑
  const getIconComponent = (iconName: string | React.ComponentType<any>): React.ComponentType<any> | null => {
    if (typeof iconName === 'function') return iconName
    if (typeof iconName === 'string') {
      const key = iconName.trim().toLowerCase()
      const iconMap: Record<string, React.ComponentType<any>> = {
        home: Home,
        'arrow-right': ArrowRight,
        arrowright: ArrowRight,
        'arrow-left': ArrowLeft,
        arrowleft: ArrowLeft,
        'arrow-up': ArrowUp,
        arrowup: ArrowUp,
        'arrow-down': ArrowDown,
        arrowdown: ArrowDown,
        'chevron-right': ChevronRight,
        chevronright: ChevronRight,
        'chevron-left': ChevronLeft,
        chevronleft: ChevronLeft,
        play: Play,
        pause: Pause,
        heart: Heart,
        star: Star,
        settings: Settings,
        user: User,
        message: MessageCircle,
        messagecircle: MessageCircle,
        search: Search,
        plus: Plus,
        minus: Minus,
        check: Check,
        x: X,
        close: X,
        volume: Volume2,
        volume2: Volume2,
        'volume-off': VolumeX,
        volumeoff: VolumeX,
        volumex: VolumeX,
        mute: VolumeX,
        refreshccw: RefreshCcw,
        'refresh-ccw': RefreshCcw,
        refresh: RefreshCcw,
        replay: RefreshCcw,
        expand: Expand,
        pencilline: PencilLine,
      }
      return iconMap[key] || null
    }
    return null
  }

  const IconComponent = icon ? getIconComponent(icon) : null

  return (
    <div style={positionStyle} className='inline-block'>
      <svg width='0' height='0' className='absolute'>
        <defs>
          <mask id={maskId}>
            <rect
              x='5'
              y='5'
              width={width - 10}
              height={height - 10}
              rx={(height - 10) / 2}
              ry={(height - 10) / 2}
              fill='#fff'
            />
          </mask>
          <filter id={insetId} x='-25%' y='-25%' width='150%' height='150%'>
            <feComponentTransfer in='SourceAlpha' result='alpha'>
              <feFuncA type='linear' slope='1' />
            </feComponentTransfer>

            <feMorphology in='alpha' operator='erode' radius='2' result='eroded' />
            <feComposite in='alpha' in2='eroded' operator='in' result='rim' />

            <feGaussianBlur in='rim' stdDeviation='5' result='rimSoft' />

            <feOffset in='rimSoft' dx='0' dy='0.3' result='highlightShift' />
            <feFlood floodColor='black' floodOpacity='0.85' result='hlColor' />
            <feComposite in='hlColor' in2='highlightShift' operator='out' result='highlight' />

          </filter>

          <filter id={paperStaticId} x='-15%' y='-15%' width='130%' height='130%'>
            <feTurbulence baseFrequency='0.02' numOctaves='2' result='noise' />
            <feDisplacementMap in='SourceGraphic' in2='noise' scale='0' />
          </filter>
          <filter id={paperAnimatedId} x='-15%' y='-15%' width='130%' height='130%'>
            <feTurbulence baseFrequency='0.022' numOctaves='2' result='noise' seed='2'>
              <animate attributeName='seed' values='2;5;8;11;14;2' dur='12s' repeatCount='indefinite' />
            </feTurbulence>
            <feDisplacementMap in='SourceGraphic' in2='noise' scale='0.9'>
              <animate attributeName='scale' values='0.6;1.2;0.8;1.0;0.6' dur='8s' repeatCount='indefinite' />
            </feDisplacementMap>
          </filter>
          <filter id={borderStaticId} x='-15%' y='-15%' width='130%' height='130%'>
            <feTurbulence baseFrequency='0.3' numOctaves='2' result='crayonNoise' />
            <feDisplacementMap in='SourceGraphic' in2='crayonNoise' scale='0.0' />
          </filter>
          <filter id={borderAnimatedId} x='-15%' y='-15%' width='130%' height='130%'>
            <feTurbulence baseFrequency='0.02' numOctaves='3' result='crayonNoise' seed='5'>
              <animate attributeName='seed' values='7;12;18;3;25;7' dur='6s' repeatCount='indefinite' />
            </feTurbulence>
            <feDisplacementMap in='SourceGraphic' in2='crayonNoise' scale='1.1'>
              <animate attributeName='scale' values='0.8;1.4;1.0;1.2;0.8' dur='1s' repeatCount='indefinite' />
            </feDisplacementMap>
          </filter>
          <filter id={strongCrayonId} x='-20%' y='-20%' width='140%' height='140%'>
            <feTurbulence baseFrequency='0.65' numOctaves='3' result='strongNoise' seed='15'>
              <animate attributeName='seed' values='15;22;8;30;35;15' dur='4s' repeatCount='indefinite' />
            </feTurbulence>
            <feDisplacementMap in='SourceGraphic' in2='strongNoise' scale='2.0'>
              <animate attributeName='scale' values='1.5;2.5;1.8;2.2;1.5' dur='3s' repeatCount='indefinite' />
            </feDisplacementMap>
          </filter>
        </defs>
      </svg>

      <button
        type='button'
        aria-label={ariaLabel ?? text}
        onClick={onClick}
        className={`relative group rounded-full p-0 border-0 bg-transparent ${className}`}
        style={{ width, height, WebkitTapHighlightColor: 'transparent' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className='w-full h-full'>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={height / 2}
            ry={height / 2}
            fill={bg}
            filter={`url(#${paperStaticId})`}
            className='transition-all duration-300'
          />
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={(height) / 2}
            ry={(height) / 2}
            fill={bg}
            filter={`url(#${insetId})`}
            mask={`url(#${maskId})`}
          />
          <rect
            x={5}
            y={5}
            width={width - 10}
            height={height - 10}
            rx={(height - 10) / 2}
            ry={(height - 10) / 2}
            fill={bg}
            filter={`url(#${paperAnimatedId})`}
            className='transition-all duration-300 opacity-0'
          />
          <rect
            x={12}
            y={12}
            width={width - 24}
            height={height - 24}
            rx={(height - 24) / 2}
            ry={(height - 24) / 2}
            fill='none'
            stroke={color}
            strokeWidth='2'
            opacity='0.6'
            filter={`url(#${borderStaticId})`}
            className='transition-all duration-300'
          />
          {/* {innerCircleVisible && (
            <rect
              x={18}
              y={18}
              width={width - 36}
              height={height - 36}
              rx={(height - 36) / 2}
              ry={(height - 36) / 2}
              fill='none'
              stroke={color}
              strokeWidth='2'
              opacity='0'
              filter={`url(#${borderAnimatedId})`}
              className='transition-all duration-300 group-hover:opacity-100'
            />
          )} */}
          {/* <rect
            x={12}
            y={12}
            width={width - 24}
            height={height - 24}
            rx={(height - 24) / 2}
            ry={(height - 24) / 2}
            fill='none'
            stroke={color}
            strokeWidth='3'
            opacity='0'
            filter={`url(#${strongCrayonId})`}
            className='transition-all duration-300 group-hover:opacity-100'
          /> */}
        </svg>

        <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
          <div className={`flex items-center gap-2 ${iconPosition === 'right' ? 'flex-row-reverse' : ''}`}>
            {IconComponent && (
              <IconComponent size={iconSize} style={{ color: textcolor }} className='transition-all duration-300' />
            )}
            {text && (
              <span className='font-bold transition-all duration-300' style={{ color: textcolor, fontSize: textSize }}>
                {text}
              </span>
            )}
          </div>
        </div>
      </button>
    </div>
  )
}
