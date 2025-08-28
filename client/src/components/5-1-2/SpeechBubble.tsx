import React from 'react';
import { Html, useCursor } from '@react-three/drei';

interface SpeechBubbleProps {
  position: [number, number, number];
  html: string;
  onBubbleClick?: () => void;
  pointColor?: string;
  bubbleOffset?: [number, number, number];
}

export const SpeechBubble = ({
  position,
  html,
  onBubbleClick,
  pointColor = '#ff6b6b',
  bubbleOffset = [0.2, 0.8, 0],
}: SpeechBubbleProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  useCursor(isHovered);

  const handleClick = () => {
    onBubbleClick?.();
    console.log('말풍선 클릭됨', position);
  };

  return (
    <group position={position}>
      <Html 
        prepend={true} 
        transform={false} 
        position={bubbleOffset}
      >
        <div
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            borderColor: pointColor,
          }}
          className="bg-white p-3 rounded-xl shadow-xl border-2 relative cursor-pointer hover:scale-105 active:scale-95 transition-all"
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div 
            className="text-sm text-gray-800 whitespace-nowrap" 
            dangerouslySetInnerHTML={{ __html: html }} 
          />
        </div>
      </Html>
    </group>
  );
};
