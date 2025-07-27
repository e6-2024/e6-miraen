import { useRef, useCallback, useEffect, useState } from 'react';
import NarrationManager from './NarrationManager';

export function useNarrationManager(narrationId: string) {
  const managerRef = useRef<NarrationManager>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const listenerRef = useRef<(isPlaying: boolean, playingNarrationId?: string, subtitle?: string) => void>();

  if (!managerRef.current) {
    managerRef.current = NarrationManager.getInstance();
  }

  const updatePlayingState = useCallback((isPlaying: boolean, playingNarrationId?: string, subtitle?: string) => {
    const isCurrentNarration = isPlaying && playingNarrationId === narrationId;
    setIsPlaying(isCurrentNarration);
    setCurrentSubtitle(isCurrentNarration ? (subtitle || '') : '');
  }, [narrationId]);

  useEffect(() => {
    const manager = managerRef.current!;
    listenerRef.current = updatePlayingState;
    
    manager.addListener(listenerRef.current);
    
    return () => {
      if (listenerRef.current) {
        manager.removeListener(listenerRef.current);
      }
    };
  }, [updatePlayingState]);

  const playNarration = useCallback(async (audioPath: string, subtitle: string, volume?: number) => {
    try {
      await managerRef.current!.playNarration(audioPath, narrationId, subtitle, volume);
    } catch (error) {
      console.error('나레이션 재생 중 오류:', error);
    }
  }, [narrationId]);

  const stopNarration = useCallback(() => {
    managerRef.current!.stopCurrentNarration();
  }, []);

  const isCurrentlyPlaying = useCallback(() => {
    return isPlaying;
  }, [isPlaying]);

  const isOtherNarrationPlaying = useCallback(() => {
    const manager = managerRef.current!;
    return manager.isPlayingNarration() && !isPlaying;
  }, [isPlaying]);

  const isAnyNarrationPlaying = useCallback(() => {
    return managerRef.current!.isPlayingNarration();
  }, []);

  return {
    playNarration,
    stopNarration,
    isCurrentlyPlaying,
    isOtherNarrationPlaying,
    isAnyNarrationPlaying,
    currentSubtitle
  };
}