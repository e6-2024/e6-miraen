// components/Intro.tsx
import { useRef, useState } from 'react'

interface IntroProps {
  onEnter: () => void
  title?: string
  description?: string | string[]
  bubbleSvgPath?: string
  simbolSvgPath?: string
  backgroundSvg?: string
}

export default function Intro2({
  onEnter,
  title = '날씨와 우리 생활',
  description = '바람은 왜 불까요? 그리고 어떤 방향으로 불까요?\n바닷가에서 바람이 부는 까닭과 바람이 부는 방향에 대해\n알아봅시다.',
  backgroundSvg = '/img/cover/5-1-1.svg',
}: IntroProps) {
  const backgroundRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const handleEnter = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsVisible(false)
      onEnter()
    }, 1000) // 애니메이션 끝나고 UI 제거 (1초 뒤)
  }
  if (!isVisible) return null

  return (
    <div
      className={`
      absolute inset-0 z-50 transition-opacity duration-1000 ease-in-out overflow-hidden
      ${isAnimating ? 'opacity-0' : 'opacity-100'}
    `}>
      {/* 데스크탑 */}
      <div className='hidden md:block w-full h-full'>
        {/* 배경 이미지 */}
        <div
          ref={backgroundRef}
          className={`
            absolute top-0 left-0 w-full h-full transition-all duration-1000 ease-in-out
            ${isAnimating ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
          `}>
          <img src={backgroundSvg} alt='Background' className='absolute inset-0 w-full h-full object-cover' />
        </div>
        {/* 제목 및 설명 */}
        <div className='absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-fit h-fit flex flex-col items-center justify-center gap-36'>
          <div className='w-fit h-fit flex flex-col items-center justify-center gap-6'>
            <h1 className='text-7xl mb-7 text-white font-bold leading-tight text-center [text-shadow:_0px_4px_10px_rgb(0_0_0_/_0.50)]'>
              {title.split('\n').map((line, i) => (
                <div key={i}>
                  {line}
                  <br />
                </div>
              ))}
            </h1>
            <div className='text-white text-4xl font-light text-center [text-shadow:_0px_4px_10px_rgb(0_0_0_/_0.50)]'>
              {Array.isArray(description) ? (
                description.map((line, index) => (
                  <p key={index} className={index > 0 ? 'mt-1' : ''}>
                    {line}
                  </p>
                ))
              ) : (
                <p>{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 */}
      <div className='md:hidden w-full h-full'>
        {/* 배경 이미지 */}
        <div
          className={`
      absolute top-0 left-0 w-full h-full transition-all duration-1000 ease-in-out
      ${isAnimating ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
    `}>
          <img src={backgroundSvg} alt='Background' className='absolute inset-0 w-full h-full object-cover' />
        </div>

        {/* 텍스트와 버튼 */}
        <div
          className={`
      absolute inset-0 w-full h-full
      flex flex-col items-center justify-center
      px-6 py-8
      text-center
      transition-opacity duration-1000 ease-in-out
      ${isAnimating ? 'opacity-0' : 'opacity-100'}
    `}>
          <h1 className='text-4xl mb-8 text-white leading-tight font-bold'>
            {title.split('\n').map((line, i) => (
              <div key={i}>
                {line}
                <br />
              </div>
            ))}
          </h1>

          <div className='text-white max-w-sm mb-16 text-xl font-light'>
            {Array.isArray(description) ? (
              description.map((line, index) => (
                <p key={index} className={index > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              ))
            ) : (
              <p>{description}</p>
            )}
          </div>

          <button
            onClick={handleEnter}
            className='
              bg-[#FF8026]
              text-white font-bold
              px-8 py-3 rounded-[20px]
              transition-all duration-300
              hover:bg-[#ff9b54]
              active:scale-95
              text-2xl
              shadow-[inset_0px_-6px_8px_0px_rgba(152,0,0,0.50)]
            '>
            시작하기
          </button>
        </div>
      </div>
    </div>
  )
}
