// 5-1-4.tsx
import React from 'react';
import Intro2 from '@/components/intro/Intro2';

interface ButtonProps {
  label: string;
  link: string;
}

const LinkButton: React.FC<ButtonProps> = ({ label, link }) => {
  // 효과음 재생 함수
  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath);
      audio.volume = 0.7;
      audio.play().catch(error => {
        console.log('효과음 재생 실패:', error.name);
      });
    } catch (error) {
      console.log('효과음 생성 실패:', error);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 효과음 재생
    playClickSound();
    
    // 효과음이 재생될 시간을 확보한 후 페이지 이동
    e.preventDefault(); // 기본 링크 동작 방지
    
    setTimeout(() => {
      window.location.href = link; // 페이지 이동
    }, 800); // 200ms 지연 (효과음 재생 시간 확보)
  };

  return (
    <a 
      href={link}
      onClick={handleClick}
      className="w-72 px-6 py-5 bg-sky-100 rounded-[100px] inline-flex justify-center items-center gap-5.5 overflow-hidden cursor-pointer transition-all duration-200 hover:bg-sky-200 active:scale-95"
      target="_blank"
      rel="noopener noreferrer"
    > 
      <div className="flex-1 text-center justify-start text-blue-600 text-xl font-bold font-['Maplestory']">
        {label}
      </div>
    </a>
  );
};

const CenteredButtons: React.FC = () => {
  const buttons: ButtonProps[] = [
    { 
      label: '뼈와 근육 생김새 관찰', 
      link: '/5-1-4-1' 
    },
    { 
      label: '근육과 뼈 움직임 보기', 
      link: '/5-1-4-2' 
    },
  ];

  const introDescription = [
    "뼈와 근육의 생김새를 관찰하고 모형을 만들어 우리 몸이 움직이는 원리를 설명할 수 있어요."
  ];

  return (
    <div className="absolute w-full h-full bg-gray-50">
      <Intro2
        title="우리 몸의 구조와 기능"
        description={introDescription}
      />
      <div className="absolute top-3/4 left-1/2 transform -translate-x-1/2 flex space-x-4 z-[60]">
        {buttons.map((button, index) => (
          <LinkButton 
            key={index} 
            label={button.label} 
            link={button.link} 
          />
        ))}
      </div>
    </div>
  );
};

export default CenteredButtons;