import { useCallback, useRef } from 'react';
import { OpticalMode, LensType } from '@/types/5-1-2/types';
import { getAudioPath } from '@/utils/5-1-2/utils';

export const useAudio = () => {
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
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

  const playBackgroundMusic = useCallback(() => {
    try {
      const audio = new Audio('/sounds/5-1-2/5-1-2-A.MP3');
      audio.loop = false;
      audio.volume = 0.3;
      audio.play().catch((error) => {
        console.log('배경음악 재생 실패:', error.name);
      });
      backgroundAudioRef.current = audio;
    } catch (error) {
      console.log('배경음악 생성 실패:', error);
    }
  }, []);

  const playNarration = useCallback((mode: OpticalMode, lensType?: LensType) => {
    const audioPath = getAudioPath(mode, lensType);
    if (!audioPath) return;

    // 기존 나레이션 정지
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.currentTime = 0;
    }

    try {
      const audio = new Audio(audioPath);
      audio.volume = 0.3;
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
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
    }
    stopNarration();
  }, [stopNarration]);

  return {
    playSound,
    playBackgroundMusic,
    playNarration,
    stopNarration,
    cleanup
  };
};