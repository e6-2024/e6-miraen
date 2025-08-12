import { useRef, useState, useEffect } from 'react'
import { CrayonTextBox } from '../CrayonTextBox'
import { CrayonTextButton } from '../CrayonUIButton'
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
  showModeButtonsDirectly?: boolean
  onActivityGuide?: () => void
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
  showModeButtonsDirectly = false,
  onActivityGuide,
}: IntroProps<T>) {
  const backgroundRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showGoalPopup, setShowGoalPopup] = useState(false)
  const [showModeButtons, setShowModeButtons] = useState(false)

  // showModeButtonsDirectly가 true면 바로 모드 버튼 표시 (뒤로가기 후)
  useEffect(() => {
    if (showModeButtonsDirectly) {
      setShowModeButtons(true)
    }
  }, [showModeButtonsDirectly])

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

  // 활동하기 버튼 클릭 핸들러
  const handleActivityGuideClick = () => {
    if (onActivityGuide) {
      onActivityGuide()
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={`
      absolute inset-0 z-50 transition-opacity duration-1000 ease-in-out overflow-hidden
      z-500
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
            <h1 className='text-7xl mb-7 mix-blend-difference text-white font-bold leading-tight text-center [text-shadow:_0px_4px_10px_rgb(0_0_0_/_0.50)] break-keep'>
              {title.split('\n').map((line, i) => (
                <div key={i}>
                  {line}
                  <br />
                </div>
              ))}
            </h1>
          </div>

          <div className='flex items-center gap-8'>
            <div className='flex items-center gap-8'>
              <CrayonTextButton
                ariaLabel='활동 목표'
                text='활동 목표'
                iconPosition='left'
                width={180}
                height={72}
                bg='#D54D50'
                color='#E8AAAB'
                textSize={22}
                textcolor='#FFFFFF'
                className='transition-all duration-300'
                onClick={() => {
                  handleGoalClick()
                  playDescriptionSound()
                }}
                innerCircleVisible={false}
              />
              <CrayonTextButton
                ariaLabel='활동 방법'
                text='활동 방법'
                iconPosition='left'
                width={180}
                height={72}
                textSize={22}
                bg='#D54D50'
                color='#E8AAAB'
                textcolor='#FFFFFF'
                className='transition-all duration-300'
                onClick={handleActivityGuideClick}
                innerCircleVisible={false}
              />
            </div>
          </div>

          {!showModeButtons ? (
            <CrayonTextButton
              text='시작하기'
              width={260}
              height={86}
              textSize={32}
              bg='#F77F42'
              color='#BF4E1D'
              textcolor='#FFFFFF'
              onClick={handleEnter}
            />
          ) : (
            <div className='flex flex-row gap-4 items-center'>
              {modeButtons.map(({ mode, label }, index) => {
                const scheme =
                  String(mode) === 'bones'
                    ? { bg: '#4E9F3D', border: '#3E7F30' } // Green (Primary)
                    : { bg: '#6C63FF', border: '#5A54D6' } // Purple-Blue (Accent)

                return (
                  <div
                    key={String(mode)}
                    className='animate-in fade-in slide-in-from-bottom-4 duration-500'
                    style={{ animationDelay: `${index * 100}ms` }}>
                    <CrayonTextButton
                      ariaLabel={label}
                      text={label}
                      width={320}
                      height={96}
                      textSize={24}
                      bg={scheme.bg}
                      color={scheme.border}
                      textcolor='#FFFFFF'
                      className='font-bold hover:brightness-110 active:scale-90 transition-all duration-300'
                      onClick={() => handleModeButtonClick(mode)}
                      innerCircleVisible={false}
                    />
                  </div>
                )
              })}
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
              onClick={handleActivityGuideClick}
              className='px-6 py-3 bg-[#52AE46] rounded-[20px] shadow-[inset_0px_-6px_8px_0px_rgba(65,87,51,0.50)] inline-flex justify-center items-center overflow-hidden hover:bg-[#6BC05D] active:scale-95 transition-all duration-300'>
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
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-[1100] p-4'>
          <CrayonTextBox
            bg='#FFFFFF'
            color='#52AE46' // 테두리(그린)
            textcolor='#333333'
            padding={24}
            animated={true}
            className='w-[min(92vw,640px)] mx-4 shadow-2xl rounded-2xl'>
            {/* 제목 */}
            <div className='flex flex-row justify-center items-center gap-3 mb-6'>
              <h3 className='text-2xl font-bold text-gray-800'>활동 목표</h3>
            </div>

            {/* 내용 */}
            <div className='text-gray-700 text-lg font-light leading-relaxed mb-8 text-center break-keep'>
              {Array.isArray(description) ? (
                description.map((line, index) => <p key={index}>{line}</p>)
              ) : (
                <p>{description}</p>
              )}
            </div>

            {/* 확인 버튼 */}
            <div className='flex justify-center'>
              <CrayonTextButton
                ariaLabel='확인'
                text='확인'
                width={160}
                height={56}
                bg='#52AE46'
                color='#2E7D32'
                textcolor='#FFFFFF'
                className='w-full max-w-[320px] hover:brightness-110 active:scale-95 transition-all duration-300'
                onClick={handleClosePopup}
                innerCircleVisible={false}
              />
            </div>
          </CrayonTextBox>
        </div>
      )}
    </div>
  )
}
