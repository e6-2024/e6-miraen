import { useRef, useState, useEffect } from 'react'
import { CrayonTextBox } from '../common/CrayonTextBox'
import { CrayonTextButton } from '../common/CrayonUIButton'

interface ModeButton<T = string> {
  mode: T
  label: string
  color: string
  hoverColor: string
}

type ButtonStyle = {
  bg: string
  border: string
  text: string
}

type IntroButtonTheme = {
  goal: ButtonStyle
  guide: ButtonStyle
  start: ButtonStyle
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
  buttonTheme?: IntroButtonTheme
}

const anatomyTheme: IntroButtonTheme = {
  goal: { bg: '#6C63FF', border: '#5A54D6', text: '#FFFFFF' },
  guide: { bg: '#00BFA6', border: '#00897B', text: '#FFFFFF' },
  start: { bg: '#FFB74D', border: '#F57C00', text: '#1A1A1A' }, // 웜 앰버(텍스트 딥그레이)
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
  buttonTheme = anatomyTheme,
}: IntroProps<T>) {
  const backgroundRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showGoalPopup, setShowGoalPopup] = useState(false)
  const [showModeButtons, setShowModeButtons] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (showModeButtonsDirectly) {
      setShowModeButtons(true)
    }
  }, [showModeButtonsDirectly])

  const playDescriptionSound = (audioPath: string = descriptionSound) => {
    try {
      const newAudio = new Audio(audioPath)
      newAudio.volume = 1
      newAudio.play().catch(() => {})
      setAudio(newAudio)
    } catch {}
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
    onModeSelect?.(selectedMode)
    setIsAnimating(true)
    setTimeout(() => {
      setIsVisible(false)
      onEnter()
    }, 1000)
  }

  const handleGoalClick = () => setShowGoalPopup(true)
  const handleClosePopup = () => {
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      setAudio(null)
    }
    setShowGoalPopup(false)
  }

  // 활동 방법 클릭
  const handleActivityGuideClick = () => onActivityGuide?.()

  if (!isVisible) return null

  return (
    <div
      className={`
        absolute inset-0 transition-opacity duration-1000 ease-in-out overflow-hidden
        ${isAnimating ? 'opacity-0' : 'opacity-100'}
      `}>
      {/* 데스크톱 */}
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
          {/* 타이틀 */}
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

          {/* 활동 목표 / 활동 방법 */}
          <div className='flex items-center gap-8'>
            <CrayonTextButton
              ariaLabel='활동 목표'
              text='활동 목표'
              width={180}
              height={90}
              textSize={24}
              bg={buttonTheme.goal.bg}
              color={buttonTheme.goal.border}
              textcolor={buttonTheme.goal.text}
              className='transition-all duration-300  active:scale-90'
              onClick={() => {
                handleGoalClick()
                playDescriptionSound()
              }}
              innerCircleVisible={false}
            />
            <CrayonTextButton
              ariaLabel='활동 방법'
              text='활동 방법'
              width={180}
              height={90}
              textSize={24}
              bg={buttonTheme.guide.bg}
              color={buttonTheme.guide.border}
              textcolor={buttonTheme.guide.text}
              className='transition-all duration-300  active:scale-90'
              onClick={handleActivityGuideClick}
              innerCircleVisible={false}
            />
          </div>

          {/* 시작하기 또는 모드 선택 */}
          {!showModeButtons ? (
            <CrayonTextButton
              text='시작하기'
              width={260}
              height={108}
              // @ts-ignore
              textSize={32}
              bg={buttonTheme.start.bg}
              color={buttonTheme.start.border}
              textcolor={buttonTheme.start.text}
              className='transition-all duration-300  active:scale-90'
              onClick={handleEnter}
              innerCircleVisible={false}
            />
          ) : (
            <div className='flex flex-row gap-4 items-center'>
              {modeButtons.map(({ mode, label }, index) => {
                const scheme =
                  String(mode) === 'bones'
                    ? { bg: '#4E9F3D', border: '#3E7F30' }
                    : String(mode) === 'direct'
                    ? {  bg: '#F3921C', border: '#FFDBB0' }
                    : String(mode) === 'reflection'
                    ? { bg: '#01A7A2', border: '#78C9C9' }
                    : String(mode) === 'refraction'
                    ? {  bg: '#6C63FF', border: '#5A54D6' }
                    : String(mode) === 'light'
                    ? {  bg: '#F3921C', border: '#FFDBB0' }
                    : String(mode) === 'buzzer'
                    ? {  bg: '#4E9F3D', border: '#3E7F30' }
                    : { bg: '#6C63FF', border: '#5A54D6' }

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
                      // @ts-ignore
                      textSize={24}
                      bg={scheme.bg}
                      color={scheme.border}
                      textcolor='#FFFFFF'
                      className='font-bold  active:scale-90 transition-all duration-300'
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

      {/* 모바일 */}
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
            absolute inset-0 w-full h-full flex flex-col items-center justify-center
            px-6 py-8 text-center transition-opacity duration-1000 ease-in-out
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
            <CrayonTextButton
              ariaLabel='활동 목표'
              text='활동 목표'
              width={180}
              height={52}
              bg={buttonTheme.goal.bg}
              color={buttonTheme.goal.border}
              textcolor={buttonTheme.goal.text}
              className=' active:scale-95 transition-all duration-300'
              onClick={handleGoalClick}
              innerCircleVisible={false}
            />
            <CrayonTextButton
              ariaLabel='활동하기'
              text='활동하기'
              width={180}
              height={52}
              bg={buttonTheme.guide.bg}
              color={buttonTheme.guide.border}
              textcolor={buttonTheme.guide.text}
              className=' active:scale-95 transition-all duration-300'
              onClick={handleActivityGuideClick}
              innerCircleVisible={false}
            />
          </div>

          {!showModeButtons ? (
            <CrayonTextButton
              ariaLabel='시작하기'
              text='시작하기'
              width={220}
              height={82}
              bg={buttonTheme.start.bg}
              color={buttonTheme.start.border}
              textcolor={buttonTheme.start.text}
              className=' active:scale-95 transition-all duration-300'
              onClick={handleEnter}
              innerCircleVisible={false}
            />
          ) : (
            <div className='flex flex-col gap-3 items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500'>
              {modeButtons.map(({ mode, label, color, hoverColor }, index) => (
                <CrayonTextButton
                  key={String(mode)}
                  ariaLabel={label}
                  text={label}
                  height={56}
                  bg={color}
                  color='#3b3b3b'
                  textcolor='#FFFFFF'
                  className='font-bold  active:scale-95 transition-all duration-300'
                  onClick={() => handleModeButtonClick(mode)}
                  innerCircleVisible={false}
                  // hoverColor는 현재 컴포에서 직접 처리하지 않음 (원하면 CrayonTextButton에 hoverBg prop 추가)
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showGoalPopup && (
        <div className='absolute z-[40] inset-0 bg-black/50 flex items-center justify-center p-4'>
          <CrayonTextBox
            bg='#FFFFFF'
            color={buttonTheme.goal.bg}
            textcolor='#333333'
            padding={24}
            animated={true}
            className='w-[min(92vw,640px)] mx-4 shadow-2xl rounded-2xl'>
            {/* 제목 */}
            <div className='flex flex-row justify-center items-center gap-3 mb-6'>
              <h3 className='text-4xl font-bold text-gray-800'>활동 목표</h3>
            </div>

            {/* 내용 */}
            <div className='text-gray-700 text-[20pt] font-light leading-relaxed mb-8 text-center break-keep'>
              {Array.isArray(description) ? (
                description.map((line, index) => <p key={index}>{line}</p>)
              ) : (
                <p>{description}</p>
              )}
            </div>

            {/* 확인 버튼 (목표 테마 색) */}
            <div className='flex justify-center'>
              <CrayonTextButton
                ariaLabel='확인'
                text='확인'
                bg={buttonTheme.goal.bg}
                color={buttonTheme.goal.border}
                textcolor={buttonTheme.goal.text}
                className='w-full max-w-[320px] active:scale-95 transition-all duration-300'
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
