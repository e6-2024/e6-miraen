import React, { useState, useEffect, useRef } from 'react';
import { PopupContent } from '@/types/5-2-3/types';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  content: PopupContent;
  onComplete?: () => void;
}

export const Popup: React.FC<PopupProps> = ({ isOpen, onClose, content, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);

      if (content.narrationPath) {
        audioRef.current = new Audio(content.narrationPath);
        audioRef.current.volume = 0.5;
        
        audioRef.current.load();
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .catch((error) => {
              const playOnClick = () => {
                if (audioRef.current) {
                  audioRef.current.play().catch(console.error);
                }
                document.removeEventListener('click', playOnClick);
              };
              document.addEventListener('click', playOnClick);
            });
        }
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [isOpen, content.narrationPath]);

  const handleConfirm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsVisible(false);
    setTimeout(() => {
      onClose();
      onComplete?.();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 flex items-center justify-center z-50 transition-all duration-300'>
      <div
        className={`bg-white rounded-xl shadow-lg max-w-md mx-4 relative transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
        <div className='p-6'>
          <h3 className='text-lg font-bold text-gray-900 mb-3'>{content.title}</h3>
          <p className='text-gray-600 text-m font-bold leading-relaxed mb-6'>{content.content}</p>
          <div className='flex justify-end'>
            <button
              onClick={handleConfirm}
              className='px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-light transition-all duration-200'>
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};