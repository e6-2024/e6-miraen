import React, { useEffect, useState } from 'react';
import NarrationManager from './NarrationManager';

const SubtitleDisplay: React.FC = () => {
  const [subtitle, setSubtitle] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const manager = NarrationManager.getInstance();
    
    const handleNarrationChange = (isPlaying: boolean, narrationId?: string, subtitle?: string) => {
      if (isPlaying && subtitle) {
        setSubtitle(subtitle);
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setTimeout(() => setSubtitle(''), 6000);
      }
    };

    manager.addListener(handleNarrationChange);

    return () => {
      manager.removeListener(handleNarrationChange);
    };
  }, []);

  if (!isVisible || !subtitle) {
    return null;
  }

  return (
    <div className="absolute z-[20000] bottom-32 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl">
      <div className="bg-black/90 backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-xl border border-white/20">
        <p className="text-lg text-center leading-relaxed font-bold">{subtitle}</p>
      </div>
    </div>
  );
};

export default SubtitleDisplay;