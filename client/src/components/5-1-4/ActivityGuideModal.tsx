import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AudioManager from '../5-1-1/AudioManager'
import { CrayonTextButton } from '../common/CrayonUIButton'
import { CrayonTextBox } from '../common/CrayonTextBox'

interface ActivityGuideSlide {
  id: string
  image: string
  audioPath?: string
}

const activityGuideSlides: ActivityGuideSlide[] = [
  {
    id: 'slide1',
    image: '/img/guide/5-1-4/guide1.jpeg',
    audioPath: '/sounds/5-1-4/intro/5-1-4-Intro-1.MP3',
  },
  {
    id: 'slide2',
    image: '/img/guide/5-1-4/guide2.jpeg',
    audioPath: '/sounds/5-1-4/intro/5-1-4-Intro-2.MP3',
  },
  {
    id: 'slide3',
    image: '/img/guide/5-1-4/guide3.jpeg',
    audioPath: '/sounds/5-1-4/intro/5-1-4-Intro-3.MP3',
  },
  {
    id: 'slide4',
    image: '/img/guide/5-1-4/guide4.jpeg',
    audioPath: '/sounds/5-1-4/intro/5-1-4-Intro-4.MP3',
  },
  {
    id: 'slide5',
    image: '/img/guide/5-1-4/guide5.jpeg',
    audioPath: '/sounds/5-1-4/intro/5-1-4-Intro-5.MP3',
  },
  {
    id: 'slide6',
    image: '/img/guide/5-1-4/guide6.jpeg',
    audioPath: '/sounds/5-1-4/intro/5-1-4-Intro-6.MP3',
  },
]

const ActivityGuideModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  slides?: ActivityGuideSlide[]
}> = ({ isOpen, onClose, slides = activityGuideSlides }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const audioManager = AudioManager.getInstance()

  useEffect(() => {
    if (isOpen) setCurrentSlide(0)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && slides[currentSlide]?.audioPath) {
      audioManager.playNarration(slides[currentSlide].audioPath, 0.7)
    }
  }, [currentSlide, isOpen, slides, audioManager])

  useEffect(() => {
    if (!isOpen) audioManager.stopCurrentAudio()
  }, [isOpen, audioManager])

  const handleClose = () => {
    audioManager.playGeneralButton()
    audioManager.stopCurrentAudio()
    onClose()
  }

  const handleNext = () => {
    audioManager.playGeneralButton()
    if (currentSlide < slides.length - 1) setCurrentSlide((p) => p + 1)
    else handleClose()
  }

  const handlePrevious = () => {
    audioManager.playGeneralButton()
    if (currentSlide > 0) setCurrentSlide((p) => p - 1)
  }

  if (!isOpen || slides.length === 0) return null

  const currentSlideData = slides[currentSlide]
  const isLastSlide = currentSlide === slides.length - 1
  const isFirstSlide = currentSlide === 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.25, type: 'spring', damping: 20 }}
          className='fixed inset-0 z-[1100] flex items-center justify-center bg-black/50'
          onClick={(e) => e.stopPropagation()}>
          <CrayonTextBox
            bg='#FFFFFF'
            color='#D54D50' // 테두리 색 (그린 톤)
            textcolor='#333333'
            padding={16}
            paddingY={16}
            animated={true}
            className='w-[80vw] flex flex-col'>
            {/* 상단 닫기 버튼 */}
            <div className='shrink-0 w-full flex justify-end z-20'>
              <CrayonTextButton
                ariaLabel='닫기'
                icon='x'
                iconPosition='left'
                width={56}
                height={56}
                bg='#FF6B6B'
                color='#B63A3A'
                textcolor='#FFFFFF'
                className='active:scale-90 transition-all duration-300'
                onClick={handleClose}
                innerCircleVisible={false}
              />
            </div>

            {/* 메인 영역 */}
            <div className='relative flex-1 px-2 pb-2'>
              <div className='relative flex items-center justify-center p-2'>
                <img
                  src={currentSlideData.image}
                  alt={`활동 방법 ${currentSlide + 1}`}
                  className='w-[90%] object-contain rounded-2xl'
                />

                {!isFirstSlide && (
                  <div className='absolute left-0 top-1/2 -translate-y-1/2 z-10'>
                    <CrayonTextButton
                      ariaLabel='이전 슬라이드'
                      icon='chevron-left'
                      iconPosition='left'
                      width={56}
                      height={56}
                      bg='#9E9E9E'
                      color='#666666'
                      textcolor='#FFFFFF'
                      className=' active:scale-90 transition-all duration-300'
                      onClick={handlePrevious}
                      innerCircleVisible={false}
                    />
                  </div>
                )}

                {!isLastSlide && (
                  <div className='absolute right-0 top-1/2 -translate-y-1/2 z-10'>
                    <CrayonTextButton
                      ariaLabel='다음 슬라이드'
                      icon='chevron-right'
                      iconPosition='left'
                      width={56}
                      height={56}
                      bg='#9E9E9E'
                      color='#666666'
                      textcolor='#FFFFFF'
                      className=' active:scale-90 transition-all duration-300'
                      onClick={handleNext}
                      innerCircleVisible={false}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 하단 풋터 */}
            <div className='flex-1 pt-2'>
              <div className='flex justify-center mb-3'>
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full mx-2 transition-all duration-300 ${
                      index === currentSlide
                        ? 'bg-[#D54D50] shadow-[0_0_8px_rgba(213,77,88,0.6)] scale-125'
                        : 'bg-gray-300 '
                    }`}
                  />
                ))}
              </div>

              <div className='flex justify-center'>
                <CrayonTextButton
                  ariaLabel={isLastSlide ? '확인' : '다음'}
                  text={isLastSlide ? '확인' : '다음'}
                  icon={isLastSlide ? 'check' : 'chevron-right'}
                  iconPosition='right'
                  width={160}
                  height={60}
                  iconSize={30}
                  color='#E8AAAB'
                  bg='#D54D50'
                  textcolor='#FFFFFF'
                  className='relative  active:scale-95 transition-all duration-300'
                  onClick={handleNext}
                  innerCircleVisible={false}
                />
              </div>
            </div>
          </CrayonTextBox>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ActivityGuideModal
export { activityGuideSlides }
