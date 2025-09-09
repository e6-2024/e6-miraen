import { useCallback, useRef } from 'react';
import { getAudioPath } from '@/utils/6-2-1/utils';
import NarrationManager from '@/components/6-2-1/NarrationManager';

export const useAudio = () => {
  const effectAudioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((audioPath: string, volume: number = 0.7) => {
    try {
      const audio = new Audio(audioPath);
      audio.volume = volume;
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name);
      });
    } catch (error) {
      console.log('효과음 생성 실패:', error);
    }
  }, []);

  const playNarration = useCallback(async (pathOrAction: string, volume: number = 1.0) => {
    let audioPath: string;
    
    if (pathOrAction.includes('/')) {
      audioPath = pathOrAction;
    } else {
      audioPath = getAudioPath(pathOrAction);
    }
    
    if (!audioPath) return;

    try {
      const narrationManager = NarrationManager.getInstance();
      await narrationManager.playNarration(
        audioPath, 
        'legacy-narration', 
        '나레이션이 재생됩니다.',
        volume
      );
    } catch (error) {
      console.log('나레이션 재생 실패:', error);
    }
  }, []);

  const stopNarration = useCallback(() => {
    const narrationManager = NarrationManager.getInstance();
    narrationManager.stopCurrentNarration();
  }, []);

  const playBackgroundMusic = useCallback((audioPath: string = '/sounds/6-2-1/6-2-1-bg.mp3', volume: number = 0.3) => {
    try {
      const audio = new Audio(audioPath);
      audio.volume = volume;
      audio.loop = true;
      audio.play().catch((error) => {
        console.log('배경음악 재생 실패:', error.name);
      });
      return audio;
    } catch (error) {
      console.log('배경음악 생성 실패:', error);
      return null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopNarration();
    if (effectAudioRef.current) {
      effectAudioRef.current.pause();
      effectAudioRef.current.currentTime = 0;
      effectAudioRef.current = null;
    }
  }, [stopNarration]);

  return {
    playSound,
    playNarration,
    stopNarration,
    playBackgroundMusic,
    cleanup
  };
};