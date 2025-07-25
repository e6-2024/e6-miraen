class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioType: 'effect' | 'narration' | 'component' = 'effect';
  private currentComponentId: string | null = null;
  private componentAudios: Map<string, HTMLAudioElement> = new Map();
  private narrationEndCallback: (() => void) | null = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.currentComponentId = null;
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

  playNarration(audioPath: string, volume: number = 0.7, onEnd?: () => void): Promise<void> {
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

  playComponentSound(audioPath: string, componentId: string, volume: number = 0.7, loop: boolean = false): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      try {
        if (this.componentAudios.has(componentId)) {
          const existingAudio = this.componentAudios.get(componentId);
          if (existingAudio) {
            existingAudio.pause();
            existingAudio.currentTime = 0;
            this.componentAudios.delete(componentId);
          }
        }

        const audio = new Audio(audioPath);
        audio.volume = volume;
        audio.loop = loop;
        
        this.componentAudios.set(componentId, audio);
        
        if (loop) {
          this.currentAudio = audio;
          this.currentAudioType = 'component';
          this.currentComponentId = componentId;
        }

        audio.addEventListener('ended', () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            this.currentComponentId = null;
          }
          this.componentAudios.delete(componentId);
        });

        audio.addEventListener('error', () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            this.currentComponentId = null;
          }
          this.componentAudios.delete(componentId);
          reject(new Error(`Component audio failed to load: ${audioPath}`));
        });

        audio.play().then(() => resolve(audio)).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  stopComponentSound(componentId: string) {
    if (this.componentAudios.has(componentId)) {
      const audio = this.componentAudios.get(componentId);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        this.componentAudios.delete(componentId);
        
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.currentComponentId = null;
        }
      }
    }
  }

  playGeneralButton(audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3'): Promise<void> {
    return this.playEffect(audioPath, 0.5);
  }

  stopAll() {
    this.stopCurrentAudio();
    
    this.componentAudios.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.componentAudios.clear();
  }
}

export default AudioManager;