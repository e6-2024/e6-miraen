import { CleaningToolType, SplashType, GamePhase, missions, solutions } from '../../types/6-1-1'

interface BackButtonProps {
  isZoomed: boolean
  showIntro: boolean
  onBack: () => void
  onButtonClick: () => void
  isAnimating: boolean
}

export function BackButton({ isZoomed, showIntro, onBack, onButtonClick, isAnimating }: BackButtonProps) {
  if (!isZoomed || showIntro) return null

  return (
    <div className='absolute top-4 left-4 z-10'>
      <button
        onClick={() => {
          onBack()
          onButtonClick()
        }}
        disabled={isAnimating}
        className='bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 font-light text-white px-4 py-2 rounded-lg shadow-lg transition-colors'>
        🏠 돌아가기
      </button>
    </div>
  )
}

interface WipingProgressUIProps {
  currentMission: SplashType | null
  wipingProgress: number
  wipingIntensity: number
  gamePhase: GamePhase
  showIntro: boolean
}
export function WipingProgressUI({
  currentMission,
  wipingProgress,
  wipingIntensity,
  gamePhase,
  showIntro,
}: WipingProgressUIProps) {
  if (gamePhase !== 'wiping' || showIntro || !currentMission) return null

  const mission = missions[currentMission]

  return (
    <div className='absolute top-5 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none'>
      <div className='bg-white bg-opacity-95 p-6 rounded-xl shadow-lg border-2 border-gray-200'>
        <div className='text-center'>
          <div className={`text-4xl font-bold mb-2 ${wipingProgress >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
            {Math.round(wipingProgress)} %
          </div>

          <div className='text-sm text-gray-600 mb-2'>
            {wipingProgress >= 100 ? <div className='text-green-600 font-bold animate-bounce'>✨ 완료!</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

// 청소 진행도 UI
interface CleaningProgressUIProps {
  cleaningProgress: Record<SplashType, number>
  showIntro: boolean
  isZoomed: boolean
}

export function CleaningProgressUI({ cleaningProgress, showIntro, isZoomed }: CleaningProgressUIProps) {
  if (showIntro || isZoomed) return null

  return (
    <div className='absolute bottom-4 left-4 z-10 font-light'>
      <div className='bg-white bg-opacity-95 p-4 rounded-xl shadow-lg border-2 border-gray-200'>
        <div className='text-lg font-bold mb-3 text-center text-gray-800'>🧹 청소 진행도</div>
        <div className='space-y-3'>
          {Object.entries(missions).map(([key, mission]) => {
            const progress = cleaningProgress[key as SplashType]
            return (
              <div key={key} className='flex items-center gap-3'>
                <span className='font-bold w-8'>{mission.emoji}</span>
                <div className='flex-1'>
                  <div className='flex justify-between text-sm mb-1'>
                    <span>{mission.name}</span>
                    <span className={progress <= 0 ? 'text-green-600 font-bold' : 'text-gray-600'}>
                      {progress <= 0 ? '완료!' : `${Math.round(100 - progress)} %`}
                    </span>
                  </div>
                  <div className='w-32 bg-gray-200 rounded-full h-3 overflow-hidden'>
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        progress <= 0 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(0, 100 - progress)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {Object.values(cleaningProgress).every((progress) => progress <= 0) && (
          <div className='mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center'>
            <div className='text-green-800 font-bold text-lg'>🎉 모든 청소 완료! 🎉</div>
            <div className='text-green-600 text-sm'>방이 깨끗해졌습니다!</div>
          </div>
        )}
      </div>
    </div>
  )
}

// 용액 선택 UI
interface SolutionSelectorProps {
  gamePhase: GamePhase
  showIntro: boolean
  selectedSolution: CleaningToolType
  onSolutionSelect: (solutionId: CleaningToolType) => void
  onButtonClick: () => void
}

export function SolutionSelector({
  gamePhase,
  showIntro,
  selectedSolution,
  onSolutionSelect,
  onButtonClick,
}: SolutionSelectorProps) {
  if (gamePhase !== 'solution_choice' || showIntro) return null

  return (
    <div className='absolute bottom-4 right-4 z-10'>
      <div className='bg-white bg-opacity-95 p-4 rounded-xl shadow-lg border-2 border-gray-200'>
        <div className='text-lg font-bold mb-3 text-center text-gray-800'>용액 선택</div>
        <div className='grid grid-cols-2 gap-3'>
          {solutions.map((solution) => (
            <button
              key={solution.id + solution.name}
              onClick={() => {
                onSolutionSelect(solution.id as CleaningToolType)
                onButtonClick()
              }}
              className={`
                px-4 py-3 rounded-lg font-bold text-white shadow-lg 
                hover:scale-105 active:scale-95 transition-all text-black
                ${selectedSolution === solution.id ? 'ring-4 ring-yellow-400' : ''}
              `}
              style={{ backgroundColor: solution.color }}>
              {solution.img && <img src={solution.img} alt={solution.name} className='w-24 h-24 object-contain' />}
              {solution.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// 게임 메시지들
interface GameMessagesProps {
  showMessage: string
  showIntro: boolean
  gamePhase: GamePhase
  sprayCount: number
}

export function GameMessages({ showMessage, showIntro, gamePhase, sprayCount }: GameMessagesProps) {
  if (showIntro) return null

  return (
    <>
      {/* 중앙 메시지 */}
      {showMessage && (
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none'>
          <div className='bg-black bg-opacity-70 text-white px-6 py-4 rounded-xl text-center'>
            <div className='text-xl font-bold'>{showMessage}</div>
          </div>
        </div>
      )}

      {/* 스프레이 안내 */}
      {gamePhase === 'spraying' && (
        <div className='absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none'>
          <div className='bg-blue-600 bg-opacity-90 text-white px-6 py-4 rounded-xl text-center'>
            <div className='text-lg font-bold'>🖱️ 클릭해서 용액을 뿌리세요! ({sprayCount}/3)</div>
          </div>
        </div>
      )}

      {/* 와이핑 안내 */}
      {gamePhase === 'wiping' && (
        <div className='absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none'>
          <div className='bg-green-600 bg-opacity-90 text-white px-6 py-4 rounded-xl text-center'>
            <div className='text-lg font-bold'>🧽 마우스를 움직여서 도마를 닦아주세요!</div>
          </div>
        </div>
      )}
    </>
  )
}
