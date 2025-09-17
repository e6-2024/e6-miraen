import { useState, useRef, useEffect } from 'react';

export const useBgm = (mounted: boolean) => {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true);
  const [bgmReady, setBgmReady] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem('bgmEnabled');
      if (saved !== null) setBgmEnabled(JSON.parse(saved));
    } catch {}
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const el = new Audio('/sounds/6-1-2/6-1-2-BGM.mp3');
    el.loop = true;
    el.volume = 0.2;
    bgmRef.current = el;
    return () => {
      el.pause();
      bgmRef.current = null;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !bgmRef.current) return;
    try {
      localStorage.setItem('bgmEnabled', JSON.stringify(bgmEnabled));
    } catch {}
    if (bgmEnabled && bgmReady) {
      bgmRef.current.play().catch(() => {});
    } else {
      bgmRef.current.pause();
    }
  }, [bgmEnabled, bgmReady, mounted]);

  const toggleBgm = () => setBgmEnabled((v) => !v);

  return {
    bgmEnabled,
    setBgmReady,
    toggleBgm,
  };
};