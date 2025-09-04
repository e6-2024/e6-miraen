import React from 'react';

interface TimeAnimationProps {
  isAnimating: boolean;
  visible: boolean;
}

export const TimeAnimation: React.FC<TimeAnimationProps> = ({ isAnimating, visible }) => {
  if (!visible) return null;

  return (
    <div className='absolute top-20 left-1/2 transform -translate-x-1/2 z-20'>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes clockRotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .clock-hand {
              animation: clockRotate 2s linear infinite;
              transform-origin: 50% 50%;
            }
          `,
        }}
      />
      <div className='bg-white rounded-full p-4 shadow-lg'>
        <div className='w-16 h-16 relative'>
          <svg viewBox='0 0 40 40' className='w-full h-full'>
            {Array.from({ length: 12 }, (_, i) => (
              <line
                key={i}
                x1='20'
                y1='2'
                x2='20'
                y2='6'
                stroke={isAnimating ? '#3b82f6' : '#e5e7eb'}
                strokeWidth='2'
                transform={`rotate(${i * 30} 20 20)`}
              />
            ))}
            <line
              x1='20'
              y1='20'
              x2='20'
              y2='8'
              stroke='#374151'
              strokeWidth='2'
              className={isAnimating ? 'clock-hand' : ''}
              style={{
                transformOrigin: '20px 20px',
              }}
            />
            <circle cx='20' cy='20' r='1' fill='#374151' />
          </svg>
        </div>
      </div>
    </div>
  );
};