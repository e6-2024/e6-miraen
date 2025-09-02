import { useCallback, useRef } from 'react';
import { OpticalMode, LensType } from '@/types/5-1-2/types';
import { getAudioPath } from '@/utils/5-1-2/utils';

export const useAudio = () => {
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((audioPath: string, volume: number = 0.7) => {
    try {
      const audio = new Audio(audioPath);
      audio.volume = volume;
      audio.play().catch((error) => {
        console.log('오디오 재생 실패:', error.name);
      });
    } catch (error) {
      console.log('오디오 생성 실패:', error);
    }
  }, []);

  const playNarration = useCallback((pathOrMode: string | OpticalMode, lensType?: LensType) => {
    let audioPath: string;
    
    if (typeof pathOrMode === 'string') {
      audioPath = pathOrMode;
    } else {
      audioPath = getAudioPath(pathOrMode, lensType);
    }
    
    if (!audioPath) return;

    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.currentTime = 0;
    }

    try {
      const audio = new Audio(audioPath);
      audio.volume = 1.0;
      audio.loop = false; 
      audio.play().catch((error) => {
        console.log('나레이션 재생 실패:', error.name);
      });
      narrationAudioRef.current = audio;
    } catch (error) {
      console.log('나레이션 생성 실패:', error);
    }
  }, []);

  const stopNarration = useCallback(() => {
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.currentTime = 0;
      narrationAudioRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopNarration();
  }, [stopNarration]);

  return {
    playSound,
    playNarration,
    stopNarration,
    cleanup
  };
};