import React from 'react';

interface CrayonTextBoxProps {
  text?: string;
  color?: string;
  textcolor?: string;
  bg?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: string;
  fontWeight?: string;
  padding?: number;
  animated?: boolean;
  position?: string;
  children?: React.ReactNode;
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
  fontSize = '20px',
  fontWeight = 'light',
  padding = 16,
  animated = false,
  children,
  position='relative',
}) => {
  const textLines = (text ?? '').split('\n').filter((line) => line.trim());

  return (
    <div
      className={`${position} ${className}`}     // ✅ w-fit 고정 제거
      style={{
        width: width ?? undefined,            // ✅ 사이즈 적용
        height: height ?? undefined,
      }}
    >
      {/* SVG 필터 정의 */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="paperTextureBoxStatic" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence baseFrequency="0.02" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" />
          </filter>
          <filter id="paperTextureBoxAnimated" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence baseFrequency="0.022" numOctaves="2" result="noise" seed="3">
              {animated && (
                <animate attributeName="seed" values="3;7;12;16;20;3" dur="15s" repeatCount="indefinite" />
              )}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.9">
              {animated && (
                <animate attributeName="scale" values="0.7;1.1;0.9;1.0;0.7" dur="10s" repeatCount="indefinite" />
              )}
            </feDisplacementMap>
          </filter>
          <filter id="crayonBorderBoxStatic" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence baseFrequency="0.3" numOctaves="2" result="crayonNoise" />
            <feDisplacementMap in="SourceGraphic" in2="crayonNoise" scale="1.0" />
          </filter>
          <filter id="crayonBorderBoxAnimated" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence baseFrequency="0.32" numOctaves="3" result="crayonNoise" seed="8">
              {animated && (
                <animate attributeName="seed" values="8;15;22;5;30;8" dur="8s" repeatCount="indefinite" />
              )}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="crayonNoise" scale="1.1">
              {animated && (
                <animate attributeName="scale" values="0.9;1.3;1.0;1.2;0.9" dur="6s" repeatCount="indefinite" />
              )}
            </feDisplacementMap>
          </filter>
        </defs>
      </svg>

      {/* 컨테이너 */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          padding: `${padding}px`,
          backgroundColor: bg,
          borderRadius: '15px',
          border: `3px solid ${color}`,
          color: textcolor,
          fontSize,
          fontWeight,
        }}
      >
        {/* 크레파스 오버레이 */}
        {/* <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            border: `3px solid ${color}`,
            borderRadius: '12px',
            opacity: 1,
            filter: animated ? 'url(#crayonBorderBoxAnimated)' : 'url(#crayonBorderBoxStatic)',
          }}
        /> */}

        {/* 내용 */}
        <div
          className="relative z-10 w-full h-full"
          style={{
            textAlign,
            wordBreak: 'keep-all',
            overflowWrap: 'break-word',
            lineHeight: 1.6,
          }}
        >
          {children ? (
            children
          ) : (
            textLines.map((line, index) => (
              <div key={index} className="mb-1">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
