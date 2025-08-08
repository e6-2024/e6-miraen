
import React from 'react';
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
  ChevronLeft
} from 'lucide-react';

interface CrayonTextButtonProps {
  text: string;
  color?: string;
  textcolor?: string;
  bg?: string;
  onClick?: () => void;
  width?: number;
  height?: number;
  className?: string;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  x?: number | string;
  y?: number | string;
  icon?: React.ComponentType<any> | string;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
}

export const CrayonTextButton: React.FC<CrayonTextButtonProps> = ({ 
  text, 
  color = '#3b82f6', 
  textcolor = '#000000',
  bg = '#dbeafe', 
  onClick,
  width = 180,
  height = 60,
  className = '',
  top,
  left,
  right,
  bottom,
  x,
  y,
  icon,
  iconPosition = 'left',
  iconSize = 20
}) => {
  // 포지셔닝 스타일 계산
  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    ...(top !== undefined && { top }),
    ...(left !== undefined && { left }),
    ...(right !== undefined && { right }),
    ...(bottom !== undefined && { bottom }),
    ...(x !== undefined && { left: x }),
    ...(y !== undefined && { top: y }),
  };

  // 아이콘 매핑 (문자열로 전달할 경우)
  const getIconComponent = (iconName: string | React.ComponentType<any>): React.ComponentType<any> | null => {
    if (typeof iconName === 'function') {
      return iconName;
    }
    
    const iconMap: Record<string, React.ComponentType<any>> = {
      home: Home,
      'arrow-right': ArrowRight,
      'arrow-left': ArrowLeft,
      'arrow-up': ArrowUp,
      'arrow-down': ArrowDown,
      'chevron-right': ChevronRight,
      'chevron-left': ChevronLeft,
      play: Play,
      pause: Pause,
      heart: Heart,
      star: Star,
      settings: Settings,
      user: User,
      message: MessageCircle,
      search: Search,
      plus: Plus,
      minus: Minus,
      check: Check,
      x: X,
    };
    
    return iconMap[iconName.toLowerCase()] || null;
  };

  const IconComponent = icon ? getIconComponent(icon) : null;

  return (
    <div style={positionStyle} className="inline-block">
      {/* SVG 필터 정의 */}
      <svg width="0" height="0" className="absolute">
        <defs>
          {/* 종이 질감 필터 - 정적 */}
          <filter id="paperTextureStatic" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence 
              baseFrequency="0.02" 
              numOctaves="2" 
              result="noise"
            />
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale="0.8"
            />
          </filter>
          
          {/* 종이 질감 필터 - 애니메이션 */}
          <filter id="paperTextureAnimated" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence 
              baseFrequency="0.022" 
              numOctaves="2" 
              result="noise"
              seed="2"
            >
              <animate
                attributeName="seed"
                values="2;5;8;11;14;2"
                dur="12s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale="0.9"
            >
              <animate 
                attributeName="scale" 
                values="0.6;1.2;0.8;1.0;0.6" 
                dur="8s" 
                repeatCount="indefinite"
              />
            </feDisplacementMap>
          </filter>
          
          {/* 크레파스 테두리 - 정적 */}
          <filter id="crayonBorderStatic" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence 
              baseFrequency="0.3" 
              numOctaves="2" 
              result="crayonNoise"
            />
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="crayonNoise" 
              scale="1.0"
            />
          </filter>
          
          {/* 크레파스 테두리 - 애니메이션 */}
          <filter id="crayonBorderAnimated" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence 
              baseFrequency="0.02" 
              numOctaves="3" 
              result="crayonNoise"
              seed="5"
            >
              <animate
                attributeName="seed"
                values="7;12;18;3;25;7"
                dur="6s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="crayonNoise" 
              scale="1.1"
            >
              <animate 
                attributeName="scale" 
                values="0.8;1.4;1.0;1.2;0.8" 
                dur="1s" 
                repeatCount="indefinite"
              />
            </feDisplacementMap>
          </filter>

          {/* 호버용 강한 크레파스 효과 */}
          <filter id="strongCrayon" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence 
              baseFrequency="0.65" 
              numOctaves="3" 
              result="strongNoise"
              seed="15"
            >
              <animate
                attributeName="seed"
                values="15;22;8;30;35;15"
                dur="4s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="strongNoise" 
              scale="2.0"
            >
              <animate 
                attributeName="scale" 
                values="1.5;2.5;1.8;2.2;1.5" 
                dur="3s" 
                repeatCount="indefinite"
              />
            </feDisplacementMap>
          </filter>
        </defs>
      </svg>

      <button
        className={`relative group ${className}`}
        onClick={onClick}
      >
        <svg 
          width={width} 
          height={height} 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full"
        >
          {/* 배경 둥근 직사각형 - 기본상태 */}
          <rect
            x="5"
            y="5"
            width={width - 10}
            height={height - 10}
            rx={(height - 10) / 2}
            ry={(height - 10) / 2}
            fill={bg}
            filter="url(#paperTextureStatic)"
            className="transition-all duration-300 group-hover:opacity-0"
          />
          
          {/* 배경 둥근 직사각형 - 호버상태 */}
          <rect
            x="5"
            y="5"
            width={width - 10}
            height={height - 10}
            rx={(height - 10) / 2}
            ry={(height - 10) / 2}
            fill={bg}
            filter="url(#paperTextureAnimated)"
            className="transition-all duration-300 opacity-0 group-hover:opacity-100"
          />
          
          {/* 크레파스 테두리 - 기본상태 */}
          <rect
            x="12"
            y="12"
            width={width - 24}
            height={height - 24}
            rx={(height - 24) / 2}
            ry={(height - 24) / 2}
            fill="none"
            stroke={color}
            strokeWidth="2"
            opacity="0.6"
            filter="url(#crayonBorderStatic)"
            className="transition-all duration-300 group-hover:opacity-0"
          />
          
          {/* 크레파스 테두리 - 호버상태 */}
          <rect
            x="12"
            y="12"
            width={width - 24}
            height={height - 24}
            rx={(height - 24) / 2}
            ry={(height - 24) / 2}
            fill="none"
            stroke={color}
            strokeWidth="2"
            opacity="0"
            filter="url(#crayonBorderAnimated)"
            className="transition-all duration-300 group-hover:opacity-60"
          />
          
          {/* 호버시 강한 테두리 */}
          <rect
            x="12"
            y="12"
            width={width - 24}
            height={height - 24}
            rx={(height - 24) / 2}
            ry={(height - 24) / 2}
            fill="none"
            stroke={color}
            strokeWidth="3"
            opacity="0"
            filter="url(#strongCrayon)"
            className="transition-all duration-300 group-hover:opacity-100"
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`flex items-center gap-2 ${iconPosition === 'right' ? 'flex-row-reverse' : ''}`}>
            {IconComponent && (
              <IconComponent 
                size={iconSize} 
                style={{ textcolor }} 
                className="transition-all duration-300"
              />
            )}
            <span 
              className="font-bold text-lg transition-all duration-300"
              style={{ color: textcolor }}
            >
              {text}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};