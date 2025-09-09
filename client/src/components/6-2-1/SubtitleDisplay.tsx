import React, { useEffect, useState } from 'react'
import NarrationManager from './NarrationManager'
import { CrayonTextBox } from '../common/CrayonTextBox'

const SubtitleDisplay: React.FC = () => {
  const [subtitle, setSubtitle] = useState<string>('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const manager = NarrationManager.getInstance()

    const handleNarrationChange = (isPlaying: boolean, narrationId?: string, subtitle?: string) => {
      if (isPlaying && subtitle) {
        setSubtitle(subtitle)
        setIsVisible(true)
      } else {
        setIsVisible(false)
        setTimeout(() => setSubtitle(''), 6000)
      }
    }

    manager.addListener(handleNarrationChange)

    return () => {
      manager.removeListener(handleNarrationChange)
    }
  }, [])

  if (!isVisible || !subtitle) {
    return null
  }

  return (
    <div className='absolute z-[20000] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-2xl'>
      <CrayonTextBox
      bg='#fff'
      color='#01A7A2'
      textcolor='#333'
      animated={true}>
        <p className='text-lg text-center leading-relaxed font-bold'>{subtitle}</p>
      </CrayonTextBox>
    </div>
  )
}

export default SubtitleDisplay
