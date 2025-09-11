import { useCallback, useRef } from 'react';

export const useAudio = () => {
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const loopingAudioRef = useRef<HTMLAudioElement | null>(null);
  const cookingSoundRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((audioPath: string, volume: number = 0.7, loop: boolean = false) => {
    try {
      const audio = new Audio(audioPath);
      audio.volume = volume;
      audio.loop = loop;
      
      if (loop) {
        if (loopingAudioRef.current) {
          loopingAudioRef.current.pause();
          loopingAudioRef.current.currentTime = 0;
        }
        loopingAudioRef.current = audio;
        
        // 요리 소리인 경우 별도 ref에도 저장
        if (audioPath.includes('food-cooking')) {
          cookingSoundRef.current = audio;
        }
      }
      
      audio.play().catch((error) => {
        console.log('오디오 재생 실패:', error.name);
      });
    } catch (error) {
      console.log('오디오 생성 실패:', error);
    }
  }, []);

  const playNarration = useCallback((audioPath: string) => {
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

  const stopLoopingAudio = useCallback(() => {
    if (loopingAudioRef.current) {
      loopingAudioRef.current.pause();
      loopingAudioRef.current.currentTime = 0;
      loopingAudioRef.current = null;
    }
  }, []);

  const stopCookingSound = useCallback(() => {
    if (cookingSoundRef.current) {
      cookingSoundRef.current.pause();
      cookingSoundRef.current.currentTime = 0;
      cookingSoundRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopNarration();
    stopLoopingAudio();
    stopCookingSound();
  }, [stopNarration, stopLoopingAudio, stopCookingSound]);

  return {
    playSound,
    playNarration,
    stopNarration,
    stopLoopingAudio,
    stopCookingSound,
    cleanup
  };
};