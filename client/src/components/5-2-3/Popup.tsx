import React, { useState, useEffect, useRef } from 'react'
import { PopupContent } from '@/types/5-2-3/types'
import { CrayonTextBox } from '../common/CrayonTextBox'

interface PopupProps {
  isOpen: boolean
  onClose: () => void
  content: PopupContent
  onComplete?: () => void
}

export const Popup: React.FC<PopupProps> = ({ isOpen, onClose, content, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)

      if (content.narrationPath) {
        audioRef.current = new Audio(content.narrationPath)
        audioRef.current.volume = 0.5

        audioRef.current.load()
        const playPromise = audioRef.current.play()

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            const playOnClick = () => {
              if (audioRef.current) {
                audioRef.current.play().catch(console.error)
              }
              document.removeEventListener('click', playOnClick)
            }
            document.addEventListener('click', playOnClick)
          })
        }
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
    }
  }, [isOpen, content.narrationPath])

  const handleConfirm = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    setIsVisible(false)
    setTimeout(() => {
      onClose()
      onComplete?.()
    }, 300)
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 flex items-center justify-center z-50 transition-all duration-300'>
      <CrayonTextBox color='#52AE46' bg='#fff' width={600} animated={true}>
        <div className='p-6'>
          <h3 className='text-xl font-bold text-gray-900 mb-3'>{content.title}</h3>
          <p className='text-gray-600 text-lg font-light leading-relaxed mb-6'>{content.content}</p>
          <div className='flex justify-center'>
            <button
              onClick={handleConfirm}
              className='px-6 py-2 bg-[#52AE46] text-white rounded-lg font-light transition-all duration-200'>
              확인
            </button>
          </div>
        </div>
      </CrayonTextBox>
    </div>
  )
}
