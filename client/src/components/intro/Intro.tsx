import { useRef, useState } from 'react'

interface ModeButton<T = string> {
  mode: T
  label: string
  color: string
  hoverColor: string
}

interface IntroProps<T = string> {
  onEnter: () => void
  title?: string
  description?: string | string[]
  bubbleSvgPath?: string
  simbolSvgPath?: string
  backgroundSvg?: string
  descriptionSound?: string
  showModeSelection?: boolean
  modeButtons?: ModeButton<T>[]
  onModeSelect?: (mode: T) => void
}

export default function Intro<T = string>({
  onEnter,
  title = '날씨와 우리 생활',
  description = '바람은 왜 불까요? 그리고 어떤 방향으로 불까요?\n바닷가에서 바람이 부는 까닭과 바람이 부는 방향에 대해\n알아봅시다.',
  backgroundSvg = '/img/cover/5-1-1.svg',
  descriptionSound = '',
  showModeSelection = false,
  modeButtons = [],
  onModeSelect,
}: IntroProps<T>) {
  const backgroundRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showGoalPopup, setShowGoalPopup] = useState(false)
  const [showModeButtons, setShowModeButtons] = useState(false)

  const playDescriptionSound = (audioPath: string = descriptionSound) => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const handleEnter = () => {
    if (showModeSelection && modeButtons.length > 0) {
      setShowModeButtons(true)
    } else {
      setIsAnimating(true)
      setTimeout(() => {
        setIsVisible(false)
        onEnter()
      }, 1000)
    }
  }

  const handleModeButtonClick = (selectedMode: T) => {
    if (onModeSelect) {
      onModeSelect(selectedMode)
    }

    // Intro 종료
    setIsAnimating(true)
    setTimeout(() => {
      setIsVisible(false)
      onEnter()
    }, 1000)
  }

  const handleGoalClick = () => {
    setShowGoalPopup(true)
  }

  const handleClosePopup = () => {
    setShowGoalPopup(false)
  }

  if (!isVisible) return null

  return (
    <div
      className={`
      absolute inset-0 z-50 transition-opacity duration-1000 ease-in-out overflow-hidden
      ${isAnimating ? 'opacity-0' : 'opacity-100'}
    `}>
      <div className='hidden md:block w-full h-full'>
        <div
          ref={backgroundRef}
          className={`
            absolute top-0 left-0 w-full h-full transition-all duration-1000 ease-in-out
            ${isAnimating ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
          `}>
          <img src={backgroundSvg} alt='Background' className='absolute inset-0 w-full h-full object-cover' />
        </div>

        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-fit h-fit flex flex-col items-center justify-center gap-6'>
          <div className='w-fit h-fit flex flex-col items-center justify-center'>
            <h1 className='text-7xl mb-7 text-[#222222] font-bold leading-tight text-center [text-shadow:_0px_4px_10px_rgb(0_0_0_/_0.50)] break-keep'>
              {title.split('\n').map((line, i) => (
                <div key={i}>
                  {line}
                  <br />
                </div>
              ))}
            </h1>
          </div>

          <div className='flex items-center gap-8'>
            <button
              onClick={() => {
                handleGoalClick()
                playDescriptionSound()
              }}
              className='px-8 pt-5 pb-6 bg-[#52AE46] rounded-[30px] shadow-[inset_0px_-10px_10px_0px_rgba(65,87,51,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#6BC05D] hover:shadow-[inset_0px_-10px_10px_0px_rgba(65,87,51,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(65,87,51,0.50)] transition-all duration-300'>
              <div className='text-center justify-center text-white text-2xl font-light [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                활동 목표
              </div>
            </button>

            <button
              className='px-8 pt-5 pb-6 bg-[#52AE46] rounded-[30px] shadow-[inset_0px_-10px_10px_0px_rgba(65,87,51,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#6BC05D] hover:shadow-[inset_0px_-10px_10px_0px_rgba(65,87,51,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(65,87,51,0.50)] transition-all duration-300'
              disabled>
              <div className='text-center justify-center text-white text-2xl font-light [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                활동하기
              </div>
            </button>
          </div>

          {!showModeButtons ? (
            <button
              onClick={handleEnter}
              className='px-9 pt-6 pb-8 bg-[#FF8026] rounded-[40px] shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#ff9b54] hover:shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(152,0,0,0.50)] transition-all duration-300'>
              <div className='text-center justify-center text-white text-4xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                시작하기
              </div>
            </button>
          ) : (
            <div className='flex flex-row gap-4 items-center animate-in fade-in slide-in-from-bottom-4 duration-500'>
              {modeButtons.map(({ mode, label, color, hoverColor }, index) => (
                <button
                  key={String(mode)}
                  onClick={() => handleModeButtonClick(mode)}
                  className='pt-4 pb-5 rounded-[30px] shadow-[inset_0px_-8px_8px_0px_rgba(50,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:shadow-[inset_0px_-8px_8px_0px_rgba(50,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(50,0,0,0.50)] transition-all duration-300 hover:scale-105 min-w-[300px]'
                  style={{
                    backgroundColor: color,
                    animationDelay: `${index * 100}ms`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hoverColor
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = color
                  }}>
                  <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                    {label}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='md:hidden w-full h-full'>
        <div
          className={`
      absolute top-0 left-0 w-full h-full transition-all duration-1000 ease-in-out
      ${isAnimating ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
    `}>
          <img src={backgroundSvg} alt='Background' className='absolute inset-0 w-full h-full object-cover' />
        </div>

        <div
          className={`
      absolute inset-0 w-full h-full
      flex flex-col items-center justify-center
      px-6 py-8
      text-center
      transition-opacity duration-1000 ease-in-out
      ${isAnimating ? 'opacity-0' : 'opacity-100'}
    `}>
          <h1 className='text-4xl mb-8 text-white leading-tight font-bold [text-shadow:_0px_4px_10px_rgb(0_0_0_/_0.50)]'>
            {title.split('\n').map((line, i) => (
              <div key={i}>
                {line}
                <br />
              </div>
            ))}
          </h1>

          <div className='flex items-center gap-4 mb-12'>
            <button
              onClick={handleGoalClick}
              className='px-6 py-3 bg-[#52AE46] rounded-[20px] shadow-[inset_0px_-6px_8px_0px_rgba(65,87,51,0.50)] inline-flex justify-center items-center overflow-hidden hover:bg-[#6BC05D] active:scale-95 transition-all duration-300'>
              <div className='text-center justify-center text-white text-xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                활동 목표
              </div>
            </button>

            <button
              className='px-6 py-3 bg-[#52AE46] rounded-[20px] shadow-[inset_0px_-6px_8px_0px_rgba(65,87,51,0.50)] inline-flex justify-center items-center overflow-hidden opacity-50 cursor-not-allowed transition-all duration-300'
              disabled>
              <div className='text-center justify-center text-white text-xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                활동하기
              </div>
            </button>
          </div>

          {!showModeButtons ? (
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
          ) : (
            <div className='flex flex-col gap-3 items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500'>
              {modeButtons.map(({ mode, label, color, hoverColor }, index) => (
                <button
                  key={String(mode)}
                  onClick={() => handleModeButtonClick(mode)}
                  className='w-full px-6 py-3 rounded-[20px] shadow-[inset_0px_-6px_8px_0px_rgba(50,0,0,0.50)] inline-flex justify-center items-center overflow-hidden hover:shadow-[inset_0px_-6px_8px_0px_rgba(50,0,0,0.70)] active:scale-95 transition-all duration-300'
                  style={{
                    backgroundColor: color,
                    animationDelay: `${index * 100}ms`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hoverColor
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = color
                  }}>
                  <div className='text-center justify-center text-white text-lg font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                    {label}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showGoalPopup && (
        <div className='absolute inset-0 bg-black/50 flex items-center justify-center z-60 p-4'>
          <div className='bg-white rounded-2xl p-8 max-w-lg mx-4 shadow-2xl transform animate-in fade-in zoom-in duration-300'>
            <div className='flex flex-row justify-center items-center gap-3 mb-6'>
              <h3 className='text-2xl font-bold text-gray-800'>활동 목표</h3>
            </div>

            <div className='text-gray-700 text-lg font-light leading-relaxed mb-8 text-center break-keep'>
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
              onClick={handleClosePopup}
              className='w-full px-6 py-3 bg-[#52AE46] text-white font-light rounded-xl hover:bg-[#6BC05D] transition-colors duration-200'>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}