// components/Intro.tsx
import { useState, useEffect } from 'react';

interface IntroProps {
  onEnter: () => void;
  title?: string;
  description?: string | string[];
  bubbleSvgPath?: string;
  simbolSvgPath?: string;
}

export default function Intro({ 
  onEnter, 
  title = "날씨와 우리 생활", 
  description = "바람은 왜 불까요? 그리고 어떤 방향으로 불까요?\n바닷가에서 바람이 부는 까닭과 바람이 부는 방향에 대해\n알아봅시다.",
  bubbleSvgPath = "/img/Bubble.svg",
  simbolSvgPath = '/img/Group 2.svg'
}: IntroProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleEnter = () => {
    setIsExiting(true);
    
    // 애니메이션 완료 후 onEnter 호출
    setTimeout(() => {
      onEnter();
      setIsVisible(false);
    }, 1000); // 애니메이션 지속 시간과 맞춤
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed inset-0 z-50
      transition-opacity duration-300
      ${isVisible ? 'opacity-100' : 'opacity-0'}
    `}>
      {/* 배경 SVG - 전체 화면 */}
      <div className={`
        absolute inset-0 w-full h-full
        transition-transform duration-1000 ease-in-out
        ${isExiting ? 'scale-150' : 'scale-100'}
      `}>
        <img 
          src={simbolSvgPath} 
          alt="Background" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* 오버레이 - 데스크톱 */}
      <div className={`
        hidden md:block absolute inset-0 
        bg-white bg-opacity-70 backdrop-blur-sm
        transition-all duration-1000 ease-in-out
        ${isExiting ? 'bg-opacity-0 backdrop-blur-0' : 'bg-opacity-70'}
      `}>
        <div className="
          w-full h-full
          flex flex-col justify-center
          px-0 -top-0
          relative
        ">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className='absolute flex-row top-0'>
              <div className={`
                relative flex flex-col items-center justify-center top-7 left-20 gap-2
                transition-all duration-1000 ease-in-out
                ${isExiting ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}
              `}>
                <div className='relative flex flex-col'>
                  <h1 className="text-6xl mb-7 text-black leading-tight text-left">
                    {title}
                  </h1>
                  <div className="text-gray-800 mb-7 text-left max-w-md">
                    {Array.isArray(description) ? 
                      description.map((line, index) => (
                        <p key={index} className={index > 0 ? 'mt-1' : ''}>
                          {line}
                        </p>
                      )) :
                      <p>{description}</p>
                    }
                  </div>
                </div>
                <button
                  onClick={handleEnter}
                  disabled={isExiting}
                  className={`
                    bg-[#E4F0FF]
                    text-blue-600 font-bold
                    px-12 py-4 rounded-full
                    transition-all duration-300
                    w-fit
                    hover:bg-blue-50
                    ${isExiting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  시작하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 오버레이 - 모바일 */}
      <div className={`
        md:hidden absolute inset-0 
        bg-white bg-opacity-80 backdrop-blur-sm
        transition-all duration-1000 ease-in-out
        ${isExiting ? 'bg-opacity-0 backdrop-blur-0' : 'bg-opacity-80'}
      `}>
        <div className={`
          w-full h-full
          flex flex-col items-center justify-center
          px-6 py-8
          text-center
          transition-all duration-1000 ease-in-out
          ${isExiting ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}
        `}>
          <h1 className="text-2xl sm:text-4xl mb-4 text-black leading-tight">
            {title}
          </h1>

          <div className="text-gray-800 text-center max-w-sm mb-8 text-sm sm:text-base">
            {Array.isArray(description) ? 
              description.map((line, index) => (
                <p key={index} className={index > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              )) :
              <p>{description}</p>
            }
          </div>

          <button
            onClick={handleEnter}
            disabled={isExiting}
            className={`
              bg-[#E4F0FF]
              text-blue-600 font-bold
              px-8 py-3 rounded-full
              transition-all duration-300
              w-fit
              hover:bg-blue-50
              active:scale-95
              text-sm sm:text-base
              ${isExiting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}