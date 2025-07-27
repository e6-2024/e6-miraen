class NarrationManager {
  private static instance: NarrationManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentNarrationId: string | null = null;
  private listeners: Set<(isPlaying: boolean, narrationId?: string, subtitle?: string) => void> = new Set();
  private backgroundMusicRef: HTMLAudioElement | null = null;

  private constructor() {}

  static getInstance(): NarrationManager {
    if (!NarrationManager.instance) {
      NarrationManager.instance = new NarrationManager();
    }
    return NarrationManager.instance;
  }

  setBackgroundMusic(audio: HTMLAudioElement) {
    this.backgroundMusicRef = audio;
  }

  addListener(callback: (isPlaying: boolean, narrationId?: string, subtitle?: string) => void) {
    this.listeners.add(callback);
  }

  removeListener(callback: (isPlaying: boolean, narrationId?: string, subtitle?: string) => void) {
    this.listeners.delete(callback);
  }

  private notifyListeners(isPlaying: boolean, narrationId?: string, subtitle?: string) {
    this.listeners.forEach(callback => callback(isPlaying, narrationId, subtitle));
  }

  stopCurrentNarration() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.currentNarrationId = null;
    this.notifyListeners(false);
  }

  async playNarration(audioPath: string, narrationId: string, subtitle: string, volume: number = 0.7): Promise<void> {
    this.stopCurrentNarration();

    try {
      const audio = new Audio(audioPath);
      audio.volume = volume;
      this.currentAudio = audio;
      this.currentNarrationId = narrationId;

      this.notifyListeners(true, narrationId, subtitle);

      const handleEnded = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.currentNarrationId = null;
          this.notifyListeners(false, narrationId);
        }
      };

      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.currentNarrationId = null;
          this.notifyListeners(false, narrationId);
        }
      });

      await audio.play();
    } catch (error) {
      console.log('나레이션 재생 실패:', error);
      this.notifyListeners(false, narrationId);
      throw error;
    }
  }

  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  isPlayingNarration(): boolean {
    if (!this.currentAudio) return false;
    if (this.currentAudio === this.backgroundMusicRef) return false;
    return !this.currentAudio.paused;
  }

  getCurrentNarrationId(): string | null {
    return this.currentNarrationId;
  }
}

export default NarrationManager;