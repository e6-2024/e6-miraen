import { useState, useCallback } from 'react'
import { ActivityGuideSlide, createActivityGuideSlides } from '@/types/ActivityGuide'
import AudioManager from '@/components/5-1-1/AudioManager'

interface UseActivityGuideReturn {
  isOpen: boolean
  slides: ActivityGuideSlide[]
  openGuide: () => void
  closeGuide: () => void
  toggleGuide: () => void
}

export const useActivityGuide = (pageId: string): UseActivityGuideReturn => {
  const [isOpen, setIsOpen] = useState(false)
  const audioManager = AudioManager.getInstance()
  
  // 페이지별 슬라이드 데이터 생성
  const slides = createActivityGuideSlides(pageId)

  const openGuide = useCallback(() => {
    audioManager.playGeneralButton()
    setIsOpen(true)
  }, [audioManager])

  const closeGuide = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleGuide = useCallback(() => {
    if (isOpen) {
      closeGuide()
    } else {
      openGuide()
    }
  }, [isOpen, openGuide, closeGuide])

  return {
    isOpen,
    slides,
    openGuide,
    closeGuide,
    toggleGuide
  }
}