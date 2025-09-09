class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioType: 'effect' | 'narration' | 'background' = 'effect';
  private backgroundMusic: HTMLAudioElement | null = null;
  private narrationEndCallback: (() => void) | null = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  stopCurrentAudio() {
    if (this.currentAudio && this.currentAudio !== this.backgroundMusic) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.narrationEndCallback) {
      this.narrationEndCallback();
      this.narrationEndCallback = null;
    }
  }

  playEffect(audioPath: string, volume: number = 0.7): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(audioPath);
        audio.volume = volume;
        
        audio.addEventListener('ended', () => {
          resolve();
        });

        audio.addEventListener('error', () => {
          reject(new Error(`Effect audio failed to load: ${audioPath}`));
        });

        audio.play().catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  playNarration(audioPath: string, volume: number = 1.0, onEnd?: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.currentAudioType === 'narration') {
          this.stopCurrentAudio();
        }

        const audio = new Audio(audioPath);
        audio.volume = volume;
        this.currentAudio = audio;
        this.currentAudioType = 'narration';
        
        if (onEnd) {
          this.narrationEndCallback = onEnd;
        }

        audio.addEventListener('ended', () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            if (this.narrationEndCallback) {
              this.narrationEndCallback();
              this.narrationEndCallback = null;
            }
          }
          resolve();
        });

        audio.addEventListener('error', () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            if (this.narrationEndCallback) {
              this.narrationEndCallback();
              this.narrationEndCallback = null;
            }
          }
          reject(new Error(`Narration audio failed to load: ${audioPath}`));
        });

        audio.play().catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  playBackgroundMusic(audioPath: string, volume: number = 0.3): HTMLAudioElement | null {
    try {
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
        this.backgroundMusic = null;
      }

      const audio = new Audio(audioPath);
      audio.volume = volume;
      audio.loop = true;
      this.backgroundMusic = audio;
      this.currentAudio = audio;
      this.currentAudioType = 'background';

      audio.addEventListener('error', () => {
        if (this.backgroundMusic === audio) {
          this.backgroundMusic = null;
        }
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      });

      return audio;
    } catch (error) {
      console.log('배경음악 생성 실패:', error);
      return null;
    }
  }

  setBackgroundMusic(audio: HTMLAudioElement) {
    this.backgroundMusic = audio;
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      if (this.currentAudio === this.backgroundMusic) {
        this.currentAudio = null;
      }
      this.backgroundMusic = null;
    }
  }

  playGeneralButton(audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3'): Promise<void> {
    return this.playEffect(audioPath, 0.5);
  }

  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  isNarrationPlaying(): boolean {
    return this.currentAudioType === 'narration' && this.isPlaying();
  }

  stopAll() {
    this.stopCurrentAudio();
    this.stopBackgroundMusic();
  }
}

export default AudioManager;