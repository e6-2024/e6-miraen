import { BeakerState, TomatoState } from '@/types/5-1-3/types'

interface BeakerControlPanelProps {
  beaker: BeakerState & {
    startExperiment: () => void
    stopExperiment: () => void
    reset: () => void
  }
  tomato: TomatoState & {
    dropTomato: () => void
    reset: () => void
  }
  spoon: {
    cleanup: () => void
  }
  side: 'left' | 'right'
  spoonsCount: number
}

export function BeakerControlPanel({ beaker, tomato, spoon, side, spoonsCount }: BeakerControlPanelProps) {
  const isLeft = side === 'left'
  const sideClass = isLeft ? 'left-4' : 'right-4'
  const bgColor = isLeft ? 'bg-blue-50/90' : 'bg-green-50/90'
  const borderColor = isLeft ? 'border-blue-200' : 'border-green-200'
  const titleColor = isLeft ? 'text-blue-800' : 'text-green-800'
  const labelBgColor = isLeft ? 'bg-blue-100' : 'bg-green-100'
  const labelTextColor = isLeft ? 'text-blue-700' : 'text-green-700'
  const primaryButtonColor = isLeft ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
  const sideLabel = isLeft ? '왼쪽' : '오른쪽'

  const handleReset = () => {
    beaker.reset()
    tomato.reset()
    spoon.cleanup()
  }

  return (
    <div className={`absolute bottom-4 z-10 ${bgColor} backdrop-blur-sm rounded-lg p-4 shadow-lg border ${borderColor} w-48 ${sideClass}`}>
      <h3 className={`text-lg font-bold ${titleColor} mb-3`}>{sideLabel} 비커</h3>
      <div className={`mb-3 p-3 ${labelBgColor} rounded-lg`}>
        <div className={`text-sm ${labelTextColor} font-light`}>
          <div>
            투입량: <span className='font-bold'>{spoonsCount}스푼</span>
          </div>
        </div>
      </div>

      {beaker.isExperimentRunning && (
        <div className='mb-3 p-2 bg-yellow-100 border font-light border-yellow-300 rounded text-sm text-yellow-800'>
          {beaker.isDropping ? `${beaker.currentSpoon}번째 스푼 용해 중...` : '다음 스푼 준비 중...'}
        </div>
      )}

      {beaker.isCompleted && !tomato.isDropped && (
        <div className='mb-3 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800 font-light'>
          ✅ 설탕이 용해되었어요! 이제 토마토를 떨어뜨려보세요.
        </div>
      )}

      <div className='flex flex-col gap-2'>
        <div className='flex gap-2'>
          <button
            onClick={beaker.startExperiment}
            disabled={beaker.isExperimentRunning || beaker.isCompleted}
            className={`w-full px-3 py-2 ${primaryButtonColor} text-white rounded font-light disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm`}>
            설탕 실험
          </button>
          <button
            onClick={beaker.stopExperiment}
            disabled={!beaker.isExperimentRunning}
            className='w-full px-3 py-2 bg-red-500 text-white rounded font-light hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm'>
            중지
          </button>
        </div>

        {beaker.isCompleted && (
          <button
            onClick={tomato.dropTomato}
            disabled={tomato.isDropped}
            className='px-3 py-2 bg-purple-500 text-white rounded font-light hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm'>
            🍅 토마토 떨어뜨리기
          </button>
        )}

        <button
          onClick={handleReset}
          disabled={beaker.isExperimentRunning}
          className='px-3 py-2 bg-gray-500 text-white rounded font-light hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm'>
          초기화
        </button>
      </div>
    </div>
  )
}