// components/Intro.tsx
import { useState } from 'react';

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

  const handleEnter = () => {
    onEnter();
  };

  if (!isVisible) return null;

  return (
    <div className={`
      absolute inset-0 z-50
      transition-opacity duration-300
      ${isVisible ? 'opacity-100' : 'opacity-0'}
    `}>
      <div className="hidden md:block w-full h-full bg-white bg-opacity-20 ">
        <div className="
          w-full h-full
          flex flex-col justify-center
          px-0 -top-0
          relative
        ">
          <div className="absolute top-0">
            <div className="relative -top-30 -left-0 w-[762px] h-[462px]">
              <img 
                src={bubbleSvgPath} 
                alt="bubble" 
                className="w-full h-full object-contain"
              />
            </div>
          
            <div className='absolute flex-row top-0'>
              <div className="relative flex flex-col items-center justify-center top-7 left-20 gap-2">
                <div className="relative -top-30 -left-0 w-[86px] h-[86px]">
                  <img 
                    src={simbolSvgPath} 
                    alt="simbol" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className='relative flex flex-col'>
                  <h1 className="text-6xl font-black mb-7 text-black leading-tight text-left">
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
                  onClick={onEnter}
                  className="
                    bg-[#E4F0FF]
                    text-blue-600 font-bold
                    px-12 py-4 rounded-full
                    transition-all duration-300
                    w-fit
                    hover:bg-blue-50
                  "
                >
                  시작하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden w-full h-full bg-white bg-opacity-80 backdrop-blur-sm">
        <div className="
          w-full h-full
          flex flex-col items-center justify-center
          px-6 py-8
          text-center
        ">
          <div className="w-20 h-20 mb-6">
            <img 
              src={simbolSvgPath} 
              alt="simbol" 
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black mb-4 text-black leading-tight">
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
            onClick={onEnter}
            className="
              bg-[#E4F0FF]
              text-blue-600 font-bold
              px-8 py-3 rounded-full
              transition-all duration-300
              w-fit
              hover:bg-blue-50
              active:scale-95
              text-sm sm:text-base
            "
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}