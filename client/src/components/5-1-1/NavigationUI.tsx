import { useRef } from 'react';

export default function NavigationUI({ sceneIndex, onSceneChange, onPlayClick, isPlayButtonPressed }: {
  sceneIndex: number;
  onSceneChange: (index: number) => void;
  onPlayClick: () => void;
  isPlayButtonPressed: boolean;
}) {
  
  const currentAudiosRef = useRef<HTMLAudioElement[]>([]);
  
  const stopAllAudios = () => {
    currentAudiosRef.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    currentAudiosRef.current = [];
  };

  const stepAudioFiles = {
    0: ['/sounds/5-1-1/5-1-1-0_0626.MP3'],
    1: ['/sounds/5-1-1/5-1-1-A.MP3', '/sounds/5-1-1/5-1-1-2-1_lake-beach-waves-28492.mp3'],
    2: ['/sounds/5-1-1/5-1-1-B.MP3', '/sounds/5-1-1/5-1-1-3_forest-atmosphere-003localization-poland-329746.mp3'],
    3: ['/sounds/5-1-1/5-1-1-C.MP3', '/sounds/5-1-1/5-1-1-4_footfalls-35757.mp3'],
  };

  const playStepAudio = () => {
    stopAllAudios();
    
    const audioPaths = stepAudioFiles[sceneIndex as keyof typeof stepAudioFiles];
    
    audioPaths.forEach((audioPath, index) => {
      try {
        const audio = new Audio(audioPath);
        audio.volume = 0.7;
        
        currentAudiosRef.current.push(audio);
        
        setTimeout(() => {
          audio.play().catch(error => {
            console.log(`오디오 ${index + 1} 재생 실패:`, error.name);
          });
        }, index * 100);
        
      } catch (error) {
        console.log(`오디오 ${index + 1} 생성 실패:`, error);
      }
    });
  };

  const handleSceneChange = (index: number) => {
    stopAllAudios();
    onSceneChange(index);
  };

  const handlePlayClick = () => {
    playStepAudio();
    onPlayClick();
  };

  return (
    <div className="absolute flex flex-row left-1/2 top-4 transform -translate-x-1/2 z-10 justify-center items-center">
      <div className="flex items-center justify-center p-4 text-white z-10">
        {[1, 2, 3, 4].map((num) => (
          <>
            <button
              key={num-1}
              onClick={() => handleSceneChange(num-1)}
              className={`px-4 py-2 rounded-lg transition-all ${
                sceneIndex === num -1
                  ? 'bg-blue-500 shadow-lg' 
                  : 'bg-gray-700/80 hover:bg-gray-600'
              }`}
            >
              STEP {num}
            </button>
            {num < 4 && (
              <div className={`w-5 h-0.5 bg-white`} />
            )}
          </>
        ))}
      </div>

      <button
        onClick={handlePlayClick}
        className="w-20 h-20 relative ml-4 z-10 cursor-pointer transition-all duration-150 hover:scale-105"
      >
        <div className={`w-full h-full left-0 absolute bg-amber-700 rounded-full transition-all duration-150 ${
          isPlayButtonPressed ? 'top-0' : 'top-[5px]'
        }`}></div>
        
        <div className={`w-full h-full left-0 absolute bg-gradient-to-b from-amber-400 to-amber-600 rounded-full transition-all duration-150 ${
          isPlayButtonPressed ? 'top-[3px] scale-95' : 'top-0'
        }`}></div>
        
        <img 
          src='/img/icon/Polygon 1.svg' 
          alt="지층 아이콘" 
          className={`w-10 h-10 absolute ml-1 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
            isPlayButtonPressed ? 'scale-90' : 'scale-100'
          }`}
        />
      </button>
    </div>
  );
}