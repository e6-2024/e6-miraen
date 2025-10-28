import { CrayonTextBox } from '@/components/common/CrayonTextBox';

interface NarrationSubtitleProps {
  visible: boolean;
  text: string;
}

export function NarrationSubtitle({ visible, text }: NarrationSubtitleProps) {
  if (!visible) return null;

  return (
    <div className='fixed bottom-[120px] left-1/2 transform -translate-x-1/2 z-[2000] font-bold max-w-[80vw] animate-in slide-in-from-bottom-5 fade-in duration-400'>
      <CrayonTextBox 
        color='#10B981' 
        bg='#FFF'
        textcolor='#333'
        padding={40}
        width={200}
        paddingY={12}
        animated={true}
      >
        {text}
      </CrayonTextBox>
    </div>
  );
}