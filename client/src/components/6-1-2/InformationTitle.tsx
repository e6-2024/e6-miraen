import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { AnimatePresence, motion } from 'framer-motion'

interface InformationSubtitleProps {
  visible: boolean
}

export function InformationSubtitle({ visible }: InformationSubtitleProps) {
  if (!visible) return null

  return (
    <div className='fixed top-4 left-4 z-[2000] font-bold'>
      <motion.div
        initial={{opacity: 0 }}
        animate={{opacity: 1 }}
        exit={{opacity: 0 }}
        transition={{ duration: 0.9, type: 'spring', damping: 20 }}>
        <CrayonTextBox
          color='#ffffff00'
          bg='#ffffff00'
          textcolor='#fff'
          padding={20}
          paddingY={12}
          animated={true}
          text='여러 가지 물체가 10초 동안 이동한 거리'></CrayonTextBox>
      </motion.div>
    </div>
  )
}
