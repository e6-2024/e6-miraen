import React from 'react';

interface CrayonTextBoxProps {
  text: string;
  color?: string;
  textcolor?: string;
  bg?: string;
  width?: number;
  height?: number;
  className?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: string;
  fontWeight?: string;
  padding?: number;
  animated?: boolean;
}

export const CrayonTextBox: React.FC<CrayonTextBoxProps> = ({ 
  text, 
  color = '#3b82f6', 
  textcolor = '#000000',
  bg = '#dbeafe', 
  width,
  height,
  className = '',
  textAlign = 'center',
  fontSize = '18px',
  fontWeight = 'bold',
  padding = 16,
  animated = false
}) => {
  // 텍스트를 줄바꿈으로 분할
  const textLines = text.split('\n').filter(line => line.trim());

  return (
    <div className={`relative w-fit h-fit ${className}`}>
      {/* SVG 필터 정의 */}
      <svg width="0" height="0" className="absolute">
        <defs>
          {/* 종이 질감 필터 - 정적 */}
          <filter id="paperTextureBoxStatic" x="-15%" y="-15%" width="130%" height="130%">
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
          <filter id="paperTextureBoxAnimated" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence 
              baseFrequency="0.022" 
              numOctaves="2" 
              result="noise"
              seed="3"
            >
              {animated && (
                <animate
                  attributeName="seed"
                  values="3;7;12;16;20;3"
                  dur="15s"
                  repeatCount="indefinite"
                />
              )}
            </feTurbulence>
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale="0.9"
            >
              {animated && (
                <animate 
                  attributeName="scale" 
                  values="0.7;1.1;0.9;1.0;0.7" 
                  dur="10s" 
                  repeatCount="indefinite"
                />
              )}
            </feDisplacementMap>
          </filter>
          
          {/* 크레파스 테두리 - 정적 */}
          <filter id="crayonBorderBoxStatic" x="-15%" y="-15%" width="130%" height="130%">
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
          <filter id="crayonBorderBoxAnimated" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence 
              baseFrequency="0.32" 
              numOctaves="3" 
              result="crayonNoise"
              seed="8"
            >
              {animated && (
                <animate
                  attributeName="seed"
                  values="8;15;22;5;30;8"
                  dur="8s"
                  repeatCount="indefinite"
                />
              )}
            </feTurbulence>
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="crayonNoise" 
              scale="1.1"
            >
              {animated && (
                <animate 
                  attributeName="scale" 
                  values="0.9;1.3;1.0;1.2;0.9" 
                  dur="6s" 
                  repeatCount="indefinite"
                />
              )}
            </feDisplacementMap>
          </filter>
        </defs>
      </svg>

      <div 
        className="relative"
        style={{
          padding: `${padding}px`,
          backgroundColor: bg,
          borderRadius: '15px',
          border: `3px solid ${color}`,
          color: textcolor,
          fontSize,
          fontWeight,
          filter: animated ? "url(#paperTextureBoxAnimated)" : "url(#paperTextureBoxStatic)",
        }}
      >
        {/* 크레파스 효과를 위한 오버레이 */}
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            border: `3px solid ${color}`,
            borderRadius: '12px',
            opacity: 1,
            filter: animated ? "url(#crayonBorderBoxAnimated)" : "url(#crayonBorderBoxStatic)",
          }}
        />
        
        <div 
          className="relative z-10"
          style={{ 
            textAlign,
            wordBreak: 'keep-all',
            overflowWrap: 'break-word',
            lineHeight: '1.6'
          }}
        >
          {textLines.map((line, index) => (
            <div key={index} className="mb-1">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};