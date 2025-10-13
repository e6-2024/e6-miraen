// AudioManager.ts - 전역 오디오 관리 클래스
class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioType: 'effect' | 'narration' | 'component' = 'effect';
  private currentComponentId: string | null = null;
  private componentAudios: Map<string, HTMLAudioElement> = new Map();

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // 현재 재생 중인 오디오 중지
  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.currentComponentId = null;
  }

  // 효과음 재생 (다른 효과음과 중첩 가능하지만 나레이션/컴포넌트 사운드는 중지)
  playEffect(audioPath: string, volume: number = 0.2): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 나레이션이나 컴포넌트 사운드가 재생 중이면 중지하지 않음 (효과음은 짧으므로)
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

  // 나레이션 재생 (기존 나레이션 중지 후 재생)
  playNarration(audioPath: string, volume: number = 0.7): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 기존 나레이션이 있으면 중지
        if (this.currentAudioType === 'narration') {
          this.stopCurrentAudio();
        }

        const audio = new Audio(audioPath);
        audio.volume = volume;
        this.currentAudio = audio;
        this.currentAudioType = 'narration';

        audio.addEventListener('ended', () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          resolve();
        });

        audio.addEventListener('error', () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          reject(new Error(`Narration audio failed to load: ${audioPath}`));
        });

        audio.play().catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 컴포넌트 사운드 재생 (같은 타입의 컴포넌트 사운드만 중지)
  playComponentSound(audioPath: string, componentId: string, volume: number = 0.7, loop: boolean = false): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      try {
        // 같은 컴포넌트의 기존 사운드가 있으면 중지
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
        
        // 컴포넌트 오디오 맵에 저장
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

  // 특정 컴포넌트 사운드 중지
  stopComponentSound(componentId: string) {
    if (this.componentAudios.has(componentId)) {
      const audio = this.componentAudios.get(componentId);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        this.componentAudios.delete(componentId);
        
        // 현재 오디오가 중지된 컴포넌트의 오디오라면 현재 오디오도 null로 설정
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.currentComponentId = null;
        }
      }
    }
  }

  // 일반 버튼 클릭 효과음 재생 (기본 효과음)
  playGeneralButton(audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3'): Promise<void> {
    return this.playEffect(audioPath, 0.5);
  }

  // 모든 오디오 중지
  stopAll() {
    this.stopCurrentAudio();
    
    // 모든 컴포넌트 오디오 중지
    this.componentAudios.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.componentAudios.clear();
  }
}

export default AudioManager;