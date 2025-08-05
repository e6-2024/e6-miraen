import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AudioManager from '../5-1-1/AudioManager'

interface ActivityGuideSlide {
  id: string
  image: string
  title?: string
  description?: string
  audioPath?: string
}

interface ActivityGuideModalProps {
  isOpen: boolean
  onClose: () => void
  slides: ActivityGuideSlide[]
  className?: string
}

const ActivityGuideModal: React.FC<ActivityGuideModalProps> = ({
  isOpen,
  onClose,
  slides,
  className = ''
}) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const audioManager = AudioManager.getInstance()

  // 모달이 열릴 때 첫 번째 슬라이드로 초기화
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0)
    }
  }, [isOpen])

  // 슬라이드 변경 시 오디오 재생
  useEffect(() => {
    if (isOpen && slides[currentSlide]?.audioPath) {
      audioManager.playNarration(slides[currentSlide].audioPath, 0.7)
    }
  }, [currentSlide, isOpen, slides, audioManager])

  // 모달이 닫힐 때 오디오 정리
  useEffect(() => {
    if (!isOpen) {
      audioManager.stopCurrentAudio()
    }
  }, [isOpen, audioManager])

  const handleClose = () => {
    audioManager.playGeneralButton()
    audioManager.stopCurrentAudio()
    onClose()
  }

  const handleNext = () => {
    audioManager.playGeneralButton()
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1)
    } else {
      // 마지막 슬라이드에서 확인 버튼을 누르면 모달 닫기
      handleClose()
    }
  }

  const handlePrevious = () => {
    audioManager.playGeneralButton()
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1)
    }
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
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${className}`}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, type: "spring", damping: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl transition-colors duration-200 shadow-lg"
              aria-label="닫기"
            >
              ×
            </button>

            {/* 이전 버튼 */}
            {!isFirstSlide && (
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors duration-200 shadow-lg"
                aria-label="이전 슬라이드"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
            )}

            {/* 다음 버튼 (마지막 슬라이드가 아닐 때만) */}
            {!isLastSlide && (
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors duration-200 shadow-lg"
                aria-label="다음 슬라이드"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                </svg>
              </button>
            )}

            {/* 메인 콘텐츠 */}
            <div className="flex flex-col h-full">
              {/* 제목 영역 */}
              {currentSlideData.title && (
                <div className="px-8 pt-8 pb-4">
                  <h2 className="text-2xl font-bold text-gray-800 text-center">
                    {currentSlideData.title}
                  </h2>
                </div>
              )}

              {/* 이미지 영역 */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-full max-h-full">
                  <img
                    src={currentSlideData.image}
                    alt={`활동 방법 ${currentSlide + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                  />
                </div>
              </div>

              {/* 설명 영역 */}
              {currentSlideData.description && (
                <div className="px-8 pb-4">
                  <p className="text-lg text-gray-700 text-center leading-relaxed">
                    {currentSlideData.description}
                  </p>
                </div>
              )}

              {/* 하단 버튼 및 인디케이터 영역 */}
              <div className="p-8 border-t border-gray-200">
                {/* 슬라이드 인디케이터 */}
                <div className="flex justify-center mb-6">
                  {slides.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full mx-1 transition-colors duration-200 ${
                        index === currentSlide ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* 확인/다음 버튼 */}
                <div className="flex justify-center">
                  <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-xl transition-colors duration-200 shadow-lg min-w-[120px]"
                  >
                    {isLastSlide ? '확인' : '다음'}
                  </button>
                </div>

                {/* 슬라이드 카운터 */}
                <div className="text-center mt-4 text-gray-500">
                  {currentSlide + 1} / {slides.length}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ActivityGuideModal