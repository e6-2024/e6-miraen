import { CleaningToolType, SplashType, GamePhase, missions, solutions } from '../../types/6-1-1/types'
import { motion, AnimatePresence } from 'framer-motion'
import { CrayonTextBox } from '../common/CrayonTextBox'
import { CrayonTextButton } from '../common/CrayonUIButton'

interface CleaningProgressUIProps {
  cleaningProgress: Record<SplashType, number>
  showIntro: boolean
  isZoomed: boolean
}

export function CleaningProgressUI({
  cleaningProgress,
  completedMissions,
  showIntro,
  isZoomed,
  onReset,
}: {
  cleaningProgress: Record<SplashType, number>
  completedMissions: Record<SplashType, boolean>
  showIntro: boolean
  isZoomed: boolean
  onReset: (missionId: SplashType) => void
}) {
  if (showIntro || isZoomed) return null

  const missionList = [
    { id: 'splash01' as const, name: '도마', color: '#2985ee' },
    { id: 'splash02' as const, name: '유리창', color: '#25e5c2' },
    { id: 'splash03' as const, name: '변기', color: '#129d3a' },
    { id: 'splash04' as const, name: '욕실', color: '#ff6b6b' },
  ]

  return (
    <CrayonTextBox
      color='#01A7A2'
      bg='#FFF'
      className='w-[300px] z-[200] bottom-4 left-4'
      padding={12}
      paddingY={20}
      position='absolute'>
      <h3 className='text-lg font-bold mb-3 text-gray-800'>청소 진행도</h3>
      <div className='space-y-3 font-light'>
        {missionList.map((mission) => {
          const progress = cleaningProgress[mission.id]
          const isCompleted = completedMissions[mission.id]

          return (
            <div key={mission.id}>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-700'>{mission.name}</span>
                <span className='text-xs text-gray-500'>{isCompleted ? '완료' : `${Math.round(progress)} %`}</span>
              </div>

              {/* 프로그레스 바 */}
              <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                <div
                  className='h-2 rounded-full transition-all duration-300'
                  style={{
                    width: `${progress}%`,
                    backgroundColor: mission.color,
                  }}
                />
              </div>

              {isCompleted && (
                <CrayonTextButton
                  ariaLabel='다시 하기'
                  text='다시 하기'
                  width={120}
                  height={48}
                  // @ts-ignore
                  textSize={12}
                  bg='#F3F4F6'
                  color='#D1D5DB'
                  textcolor='#374151'
                  className='w-full top-2 active:scale-95 transition-all duration-200'
                  onClick={() => onReset(mission.id)}
                  innerCircleVisible={false}
                />
              )}
            </div>
          )
        })}
      </div>
    </CrayonTextBox>
  )
}

interface SolutionSelectorProps {
  gamePhase: GamePhase
  showIntro: boolean
  selectedSolution: CleaningToolType
  onSolutionSelect: (solutionId: CleaningToolType) => void
  onButtonClick?: () => void
  isDisabled?: boolean
}

export function SolutionSelector({
  gamePhase,
  showIntro,
  selectedSolution,
  onSolutionSelect,
  onButtonClick,
  isDisabled = false,
}: SolutionSelectorProps) {
  if (gamePhase !== 'solution_choice' || showIntro) return null

  const solutions = [
    { id: 'vinegar', name: '식초', color: '#ff9999', img: '/img/6-1-1/vinegar.png' },
    { id: 'spray', name: '유리 세정제', color: '#99ccff', img: '/img/6-1-1/glass_cleaner.png' },
    { id: 'toilet_cleaner', name: '변기용 세제', color: '#99ff99', img: '/img/6-1-1/toilet_cleaner.png' },
    { id: 'bleach', name: '표백제', color: '#ffff99', img: '/img/6-1-1/bleach.png' },
  ]

  return (
    <motion.div
      className='absolute top-[110px] left-4 z-10'
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}>
      <CrayonTextBox textcolor='#333' textAlign='center' bg='#FFFFFF' color='#01A7A2' width={430} padding={20} paddingY={20}>
        <div className='text-lg font-bold mb-3 text-center text-gray-800'>용액 선택</div>
        <div className='flex font-light gap-3 text-black whitespace-nowrap text-lg'>
          {solutions.map((solution) => (
            <button
              key={solution.id}
              onClick={() => {
                if (!isDisabled) {
                  onSolutionSelect(solution.id as CleaningToolType)
                  onButtonClick?.()
                }
              }}
              disabled={isDisabled}>
              {<img src={solution.img} alt={solution.name} />}
              {solution.name}
            </button>
          ))}
        </div>
      </CrayonTextBox>
    </motion.div>
  )
}

interface GameMessagesProps {
  showMessage: string
  showIntro: boolean
  gamePhase: GamePhase
  sprayCount: number
}

export function GameMessages({
  showMessage,
  showIntro,
  gamePhase,
  wipingProgress,
  material,
  selectedSolution,
  currentMission,
}: {
  showMessage: string
  showIntro: boolean
  gamePhase: GamePhase
  wipingProgress: number
  material: string
  selectedSolution: CleaningToolType
  currentMission: SplashType | null
}) {
  if (showIntro) return null

  const isCorrectSolution =
    !currentMission || !selectedSolution || selectedSolution === missions[currentMission].correctSolution

  return (
    <>
      {showMessage && (
        <div className='absolute bottom-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none'>
          <CrayonTextBox
            textcolor='#333'
            textAlign='center'
            bg='#FFFFFF'
            color='#01A7A2'
            padding={40}
            paddingY={12}>
            <div className='text-2xl font-bold'>{showMessage}</div>
          </CrayonTextBox>
        </div>
      )}

      {gamePhase === 'wiping' && (
        <div className='absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none'>
          <CrayonTextBox
            textcolor='#333'
            textAlign='center'
            bg='#FFFFFF'
            color='#01A7A2'
            padding={40}
            paddingY={12}>
            <div className='text-2xl font-bold'>
              {material} ({Math.round(wipingProgress)} %)
            </div>
          </CrayonTextBox>
        </div>
      )}
    </>
  )
}
