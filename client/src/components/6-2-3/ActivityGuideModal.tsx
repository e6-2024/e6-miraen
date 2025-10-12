import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AudioManager from './AudioManager'
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
    image: '/img/guide/6-2-3/guide1.jpeg',
    audioPath: '/sounds/6-2-3/intro/6-2-3-Intro-1.MP3',
  },
  {
    id: 'slide2',
    image: '/img/guide/6-2-3/guide2.jpeg',
    audioPath: '/sounds/6-2-3/intro/6-2-3-Intro-2.MP3',
  },
  {
    id: 'slide3',
    image: '/img/guide/6-2-3/guide3.jpeg',
    audioPath: '/sounds/6-2-3/intro/6-2-3-Intro-3.mp3',
  },
  {
    id: 'slide4',
    image: '/img/guide/6-2-3/guide4.jpeg',
    audioPath: '/sounds/6-2-3/intro/6-2-3-Intro-4.mp3',
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
          className='fixed inset-0 z-[1000] flex items-center justify-center bg-black/50'
          onClick={(e) => e.stopPropagation()}>
          <CrayonTextBox
            bg='#FFFFFF'
            color='#F3921C'
            textcolor='#FFDBB0'
            padding={16}
            animated={true}
            className='w-[80vw] z-[900] flex flex-col'>
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
                        ? 'bg-[#F3921C] shadow-[0_0_8px_rgba(82,174,170,0.6)] scale-125'
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
                  color='#FFDBB0'
                  bg='#F3921C'
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
