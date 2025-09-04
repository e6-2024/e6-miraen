
import React from 'react';

interface PressureDisplayProps {
  type: 'high' | 'low';
  label: string;
  color: string;
  position?: { top?: string; left?: string; right?: string; bottom?: string };
}

export const PressureDisplay: React.FC<PressureDisplayProps> = ({
  type,
  label,
  color,
  position = { top: '20px', left: '20px' },
}) => {
  const isHigh = type === 'high';

  const Arrow = ({ direction }: { direction: 'up' | 'down' | 'left' | 'right' }) => {
    const getArrowStyle = () => {
      const base = 'w-0 h-0 border-2 border-transparent';
      switch (direction) {
        case 'up':
          return `${base} border-b-4`;
        case 'down':
          return `${base} border-t-4`;
        case 'left':
          return `${base} border-r-4`;
        case 'right':
          return `${base} border-l-4`;
      }
    };

    const getBorderColor = () => {
      switch (direction) {
        case 'up':
          return { borderBottomColor: color };
        case 'down':
          return { borderTopColor: color };
        case 'left':
          return { borderRightColor: color };
        case 'right':
          return { borderLeftColor: color };
      }
    };

    return <div className={getArrowStyle()} style={getBorderColor()} />;
  };

  return (
    <div className='z-20 bg-white rounded-lg p-4 shadow-lg' style={position}>
      <div className='text-center'>
        <div className='text-sm font-bold text-gray-700 mb-2'>{label}</div>

        <div className='relative w-16 h-16 mx-auto mb-2'>
          <div
            className='absolute inset-0 rounded-full border-4 flex items-center justify-center'
            style={{ borderColor: color }}>
            <div className='text-2xl font-bold' style={{ color }}>
              {isHigh ? 'H' : 'L'}
            </div>
          </div>

          {isHigh ? (
            <>
              <div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2'>
                <Arrow direction="up" />
              </div>
              <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2'>
                <Arrow direction="down" />
              </div>
              <div className='absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2'>
                <Arrow direction="left" />
              </div>
              <div className='absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2'>
                <Arrow direction="right" />
              </div>
            </>
          ) : (
            <>
              <div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2'>
                <Arrow direction="down" />
              </div>
              <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2'>
                <Arrow direction="up" />
              </div>
              <div className='absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2'>
                <Arrow direction="right" />
              </div>
              <div className='absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2'>
                <Arrow direction="left" />
              </div>
            </>
          )}
        </div>

        <div className='text-xs font-bold' style={{ color }}>
          {isHigh ? '고기압' : '저기압'}
        </div>
      </div>
    </div>
  );
};

