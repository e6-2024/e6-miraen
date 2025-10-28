import { CrayonTextBox } from '@/components/common/CrayonTextBox';

interface NarrationSubtitleProps {
  visible: boolean;
  text: string;
}

export function NarrationSubtitle({ visible, text }: NarrationSubtitleProps) {
  if (!visible) return null;
  const isLongSpeedText = text.includes('기차의 속력은 28 m/s');

  return (
    <div className='fixed bottom-[130px] left-1/2 transform -translate-x-1/2 z-[2000] font-bold max-w-[120vw] animate-in slide-in-from-bottom-5 fade-in duration-400'>
      <CrayonTextBox 
        color='#10B981' 
        bg='#FFF'
        textcolor='#333'
        padding={20}
        paddingY={12}
        animated={true}
      >
        <span className={isLongSpeedText ? 'text-lg md:text-xl leading-tight' : ''}>
          {text}
        </span>
      </CrayonTextBox>
    </div>
  );
}