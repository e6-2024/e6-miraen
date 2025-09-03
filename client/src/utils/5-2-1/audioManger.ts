class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private volume: number = 0.5;

  async playAudio(audioPath: string, volume: number = this.volume): Promise<void> {
    try {
      this.stopCurrentAudio();
      
      const audio = new Audio(audioPath);
      audio.volume = volume;
      
      this.currentAudio = audio;
      
      const cleanup = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      };
      
      audio.addEventListener('ended', cleanup, { once: true });
      audio.addEventListener('error', cleanup, { once: true });
      
      await audio.play();
    } catch (error) {
      console.log(`오디오 재생 실패 (${audioPath}):`, error);
      this.currentAudio = null;
    }
  }

  stopCurrentAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  setDefaultVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isPlaying(): boolean {
    return this.currentAudio !== null;
  }
}

export const audioManager = new AudioManager();

export const playSound = (audioPath: string, volume?: number) => {
  return audioManager.playAudio(audioPath, volume);
};

export const stopSound = () => {
  audioManager.stopCurrentAudio();
};