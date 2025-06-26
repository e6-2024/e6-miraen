// components/intro/Intro2.tsx
import { useState } from 'react';

interface IntroProps {
  title?: string;
  description?: string | string[];
  bubbleSvgPath?: string;
  symbolSvgPath?: string;
}

export default function Intro2({ 
  title = "날씨와 우리 생활", 
  description = "바람은 왜 불까요? 그리고 어떤 방향으로 불까요?\n바닷가에서 바람이 부는 까닭과 바람이 부는 방향에 대해\n알아봅시다.",
  bubbleSvgPath = "/img/BubbleSpecial.svg",
  symbolSvgPath = '/img/icon/우리몸의구조와기능.svg'
}: IntroProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const renderDescription = () => {
    if (Array.isArray(description)) {
      return description.map((line, index) => (
        <p key={index} className={index > 0 ? 'mt-2' : ''}>
          {line}
        </p>
      ));
    }
    return <p>{description}</p>;
  };

  return (
    <div className={`
      absolute inset-0 z-50 pointer-events-none
      transition-opacity duration-300 top-0
      ${isVisible ? 'opacity-100' : 'opacity-0'}
    `}>
      {/* Desktop Layout */}
      <div className="hidden md:block w-full h-full bg-white bg-opacity-20 pointer-events-auto">
        <div className="relative w-full h-full">
          {/* 말풍선 Bubble 이미지 */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[907px]">
            <img
              src={bubbleSvgPath}
              alt="speech bubble"
              className="w-full h-full object-contain"
            />
          </div>

          {/* 텍스트와 아이콘 */}
          <div className="absolute top-[80px] left-1/2 transform -translate-x-1/2 z-10 w-[600px] max-w-full text-center flex flex-col items-center">
            <div className="w-[86px] h-[86px] mb-4">
              <img
                src={symbolSvgPath}
                alt="symbol"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-4xl font-black mb-4 text-black leading-tight">
              {title}
            </h1>
            <div className="text-base text-blue-700 leading-relaxed">
              {renderDescription()}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden w-full h-full bg-white bg-opacity-90 backdrop-blur-sm pointer-events-auto">
        <div className="w-full h-full flex flex-col items-center justify-center px-6 py-8 text-center">
          <div className="w-20 h-20 mb-6">
            <img 
              src={symbolSvgPath} 
              alt="symbol" 
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black mb-4 text-black leading-tight">
            {title}
          </h1>

          <div className="text-gray-800 text-center max-w-sm mb-8 text-sm sm:text-base">
            {renderDescription()}
          </div>
        </div>
      </div>
    </div>
  );
}