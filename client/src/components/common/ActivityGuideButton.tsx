import React from 'react'

interface ActivityGuideButtonProps {
  onClick: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'success'
}

const ActivityGuideButton: React.FC<ActivityGuideButtonProps> = ({
  onClick,
  className = '',
  size = 'md',
  variant = 'success'
}) => {
  const sizeClasses = {
    sm: 'px-4 pt-2 pb-3 text-lg',
    md: 'px-6 pt-3 pb-4 text-xl',
    lg: 'px-8 pt-4 pb-5 text-2xl'
  }

  const variantClasses = {
    primary: {
      bg: 'bg-[#007BFF]',
      hoverBg: 'hover:bg-[#0056b3]',
      shadow: 'shadow-[inset_0px_-10px_10px_0px_rgba(0,50,150,0.50)]',
      hoverShadow: 'hover:shadow-[inset_0px_-10px_10px_0px_rgba(0,50,150,0.70)]',
      activeShadow: 'active:shadow-[inset_0px_-2px_2px_0px_rgba(0,50,150,0.50)]'
    },
    secondary: {
      bg: 'bg-[#6C757D]',
      hoverBg: 'hover:bg-[#545b62]',
      shadow: 'shadow-[inset_0px_-10px_10px_0px_rgba(50,50,50,0.50)]',
      hoverShadow: 'hover:shadow-[inset_0px_-10px_10px_0px_rgba(50,50,50,0.70)]',
      activeShadow: 'active:shadow-[inset_0px_-2px_2px_0px_rgba(50,50,50,0.50)]'
    },
    success: {
      bg: 'bg-[#28A745]',
      hoverBg: 'hover:bg-[#34ce57]',
      shadow: 'shadow-[inset_0px_-10px_10px_0px_rgba(0,100,0,0.50)]',
      hoverShadow: 'hover:shadow-[inset_0px_-10px_10px_0px_rgba(0,100,0,0.70)]',
      activeShadow: 'active:shadow-[inset_0px_-2px_2px_0px_rgba(0,100,0,0.50)]'
    }
  }

  const currentVariant = variantClasses[variant]
  const currentSize = sizeClasses[size]

  return (
    <button
      onClick={onClick}
      className={`
        ${currentSize}
        ${currentVariant.bg}
        ${currentVariant.hoverBg}
        ${currentVariant.shadow}
        ${currentVariant.hoverShadow}
        ${currentVariant.activeShadow}
        rounded-[20px]
        inline-flex
        justify-center
        items-center
        gap-2.5
        overflow-hidden
        active:scale-90
        active:translate-y-2
        transition-all
        duration-300
        ${className}
      `}
      aria-label='활동 방법 보기'
    >
      <div className='text-center justify-center text-white font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
        활동방법
      </div>
    </button>
  )
}

export default ActivityGuideButton