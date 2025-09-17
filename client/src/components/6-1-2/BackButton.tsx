import { motion, AnimatePresence } from 'framer-motion';
import { CrayonTextButton } from '@/components/common/CrayonUIButton';

interface BackButtonProps {
  showIntro: boolean;
  onClick: () => void;
}

export function BackButton({ showIntro, onClick }: BackButtonProps) {
  return (
    <AnimatePresence>
      {!showIntro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className='absolute top-4 left-4 z-10 w-fit h-fit'>
          <CrayonTextButton
            ariaLabel='첫 화면으로 돌아가기'
            text='첫 화면으로'
            icon='arrow-left'
            iconPosition='left'
            width={170}
            height={75}
            iconSize={30}
            bg='#F3921C'
            color='#FFDBB0'
            textcolor='#FFFFFF'
            onClick={onClick}
            innerCircleVisible={false}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}