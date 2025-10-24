import { CleaningToolType, SplashType, GamePhase, missions, solutions } from '../../types/6-1-1/types'
import { motion, AnimatePresence } from 'framer-motion'
import { CrayonTextBox } from '../common/CrayonTextBox'
import { CrayonTextButton } from '../common/CrayonUIButton'

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
      className='absolute top-[400px] left-0 z-10'
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}>
      <div className='absolute bottom-4 left-4 z-10'>
        <CrayonTextBox textcolor='#333' textAlign='center' bg='#FFFFFF' color='#01A7A2' padding={20} animated={true}>
          <div className='text-lg font-bold mb-3 text-center text-gray-800'>용액 선택</div>
          <div className='flex w-[380px] font-light gap-3 text-black whitespace-nowrap'>
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
                <div className='flex items-center justify-center'>
                  {<img className='h-[130px]' src={solution.img} alt={solution.name} />}
                </div>
                {solution.name}
              </button>
            ))}
          </div>
        </CrayonTextBox>
      </div>
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

  // 정답인지 확인 (오답이면 게이지 안 보임)
  const isCorrectSolution = !currentMission || !selectedSolution || 
    selectedSolution === missions[currentMission].correctSolution

  return (
    <>
      {showMessage && (
        <div className='absolute bottom-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none'>
          <CrayonTextBox textcolor='#333' textAlign='center' bg='#FFFFFF' color='#01A7A2' padding={20} animated={true}>
            <div className='text-xl font-bold'>{showMessage}</div>
          </CrayonTextBox>
        </div>
      )}

      {/* 정답일 때만 게이지 표시 */}
      {gamePhase === 'wiping' && isCorrectSolution && (
        <div className='absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none'>
          <CrayonTextBox textcolor='#333' textAlign='center' bg='#FFFFFF' color='#01A7A2' padding={20} animated={true}>
            <div className='text-lg font-bold'>
              {material} ({Math.round(wipingProgress)} %)
            </div>
          </CrayonTextBox>
        </div>
      )}
    </>
  )
}
