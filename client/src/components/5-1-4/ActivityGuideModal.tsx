import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AudioManager from '../5-1-1/AudioManager'

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, type: 'spring', damping: 20 }}
            className='relative bg-white rounded-3xl w-[min(97vw,1152px)] h-[min(97vh,720px)] overflow-hidden flex flex-col'
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단: 닫기 버튼 */}
            <div className='shrink-0 w-full flex justify-end p-3'>
              <button
                onClick={handleClose}
                className='w-14 h-14 bg-[#FF6B6B] rounded-[20px] shadow-[inset_0_-5px_5px_rgba(152,0,0,0.50)] inline-flex justify-center items-center text-white font-bold text-3xl hover:bg-[#FF8A8A] hover:shadow-[inset_0_-5px_5px_rgba(152,0,0,0.70)] active:scale-90 active:shadow-[inset_0_-2px_2px_rgba(152,0,0,0.50)] transition-all duration-300 [text-shadow:_0_0_4px_rgb(0_0_0_/_0.25)]'
                aria-label='닫기'
              >
                ×
              </button>
            </div>

            {/* 메인 영역: 컨테이너 남은 공간을 꽉 채움 */}
            <div className='relative flex-1 min-h-0 px-4 pb-2'>
              {/* 이미지 래퍼 */}
              <div className='relative w-full h-full flex items-center justify-center p-2'>
                <img
                  src={currentSlideData.image}
                  alt={`활동 방법 ${currentSlide + 1}`}
                  className='w-full h-full object-contain rounded-2xl'
                />

                {/* 이전 버튼 (이미지 중앙 수직 정렬) */}
                {!isFirstSlide && (
                  <button
                    onClick={handlePrevious}
                    className='absolute left-4 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-[#9E9E9E] rounded-[18px] shadow-[inset_0_-8px_8px_rgba(50,50,50,0.50)] inline-flex justify-center items-center text-white hover:bg-[#BDBDBD] hover:shadow-[inset_0_-8px_8px_rgba(50,50,50,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0_-2px_2px_rgba(50,50,50,0.50)] transition-all duration-300'
                    aria-label='이전 슬라이드'
                  >
                    <svg width='28' height='28' viewBox='0 0 24 24' fill='currentColor' style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.25))' }}>
                      <path d='M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z' />
                    </svg>
                  </button>
                )}

                {/* 다음 버튼 */}
                {!isLastSlide && (
                  <button
                    onClick={handleNext}
                    className='absolute right-4 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-[#9E9E9E] rounded-[18px] shadow-[inset_0_-8px_8px_rgba(50,50,50,0.50)] inline-flex justify-center items-center text-white hover:bg-[#BDBDBD] hover:shadow-[inset_0_-8px_8px_rgba(50,50,50,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0_-2px_2px_rgba(50,50,50,0.50)] transition-all duration-300'
                    aria-label='다음 슬라이드'
                  >
                    <svg width='28' height='28' viewBox='0 0 24 24' fill='currentColor' style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.25))' }}>
                      <path d='M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z' />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* 하단 풋터 */}
            <div className='shrink-0 p-4 border-t border-gray-200'>
              <div className='flex justify-center mb-4'>
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full mx-2 transition-all duration-300 ${
                      index === currentSlide
                        ? 'bg-[#4CAF50] shadow-[0_0_8px_rgba(76,175,80,0.6)] scale-125'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <div className='flex justify-center'>
                <button
                  onClick={handleNext}
                  className='px-10 py-4 bg-[#4CAF50] rounded-[22px] shadow-[inset_0_-10px_10px_rgba(0,152,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#66BB6A] hover:shadow-[inset_0_-10px_10px_rgba(0,152,0,0.70)] active:scale-95 active:translate-y-1.5 active:shadow-[inset_0_-2px_2px_rgba(0,152,0,0.50)] transition-all duration-300 hover:scale-105 min-w-[120px]'
                >
                  <span className='text-white text-xl font-bold [text-shadow:_0_0_4px_rgb(0_0_0_/_0.25)]'>
                    {isLastSlide ? '확인' : '다음'}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ActivityGuideModal
export { activityGuideSlides }
