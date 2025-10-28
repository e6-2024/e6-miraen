import React, { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PopupContent } from '@/types/5-2-3/types'
import { CrayonTextBox } from '../common/CrayonTextBox'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'

interface PopupProps {
  isOpen: boolean
  onClose: () => void
  content: PopupContent
  onComplete?: () => void
}

export const Popup: React.FC<PopupProps> = ({ isOpen, onClose, content, onComplete }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    if (!isOpen) return

    if (content.narrationPath) {
      audioRef.current = new Audio(content.narrationPath)
      audioRef.current.volume = 0.5
      audioRef.current.load()
      const playPromise = audioRef.current.play()

      if (playPromise !== undefined) {
        playPromise.catch(() => {
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
    onClose()
    onComplete?.()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleConfirm}
        >
          <motion.div
            key="popup-content"
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CrayonTextBox
              bg="#FFFFFF"
              color="#52AE46"
              width={600}
              padding={40}
              paddingY={12}
              animated={true}
            >
              <h3 className="text-3xl font-bold text-center m-6 text-gray-800">{content.title}</h3>
              <p className="text-2xl text-center font-light text-gray-700 leading-relaxed mb-8">
                {content.content}
              </p>
              <div className="text-center">
                <CrayonTextButton
                  onClick={handleConfirm}
                  bg="#52AE46"
                  color="#52AE46"
                  textcolor="#FFFFFF"
                  text="확인"
                  innerCircleVisible={false}
                />
              </div>
            </CrayonTextBox>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
