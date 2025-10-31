import { CleaningToolType, SplashType, GamePhase, missions, solutions } from '../../types/6-1-1/types'
import { motion, AnimatePresence } from 'framer-motion'
import { CrayonTextBox } from '../common/CrayonTextBox'
import { CrayonTextButton } from '../common/CrayonUIButton'

interface CleaningProgressUIProps {
  cleaningProgress: Record<SplashType, number>
  showIntro: boolean
  isZoomed: boolean
}

type Mission = {
  id: SplashType
  name: string
  color: string
}

const missionList: Mission[] = [
  { id: 'splash01', name: '도마', color: '#F3921C' },
  { id: 'splash02', name: '유리창', color: '#4E9F3D' },
  { id: 'splash03', name: '변기', color: '#6C63FF'},
  { id: 'splash04', name: '욕실', color: '#9B1CDF' },
]

function ProgressRing({
  value,
  size = 60,
  stroke = 6,
  color = '#2985ee',
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (clamped / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className='shrink-0 font-light'>
      <circle cx={size / 2} cy={size / 2} r={radius} stroke='#E5E7EB' strokeWidth={stroke} fill='none' />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap='round'
        fill='none'
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x='50%'
        y='50%'
        dominantBaseline='middle'
        textAnchor='middle'
        fontSize='12'
        fill='#374151'
        style={{ fontWeight: 700 }}>
        {Math.round(clamped)} %
      </text>
    </svg>
  )
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

  return (
    <CrayonTextBox
      color='#01A7A2'
      bg='#FFF'
      className='z-[200] left-1/2 bottom-4 -translate-x-1/2 max-w-[980px]'
      padding={32}
      paddingY={16}
      position='absolute'>
      <div className='mb-5'>
        <h3 className='text-2xl font-bold'>청소 진행도</h3>
      </div>
      <div className='flex gap-6 overflow-x-auto no-scrollbar flex-wrap md:flex-nowrap'>
        {missionList.map((mission) => {
          const progress = cleaningProgress[mission.id] ?? 0
          const isCompleted = !!completedMissions[mission.id]

          return (
            <article key={mission.id} className='min-w-[160px]'>
              <div className='flex justify-between gap-4 mb-3'>
                <div className='flex-row justify-start'>
                  <h4 className='text-xl font-light text-left mx-2'>{mission.name}</h4>
                  <CrayonTextButton
                    ariaLabel={`${mission.name} 다시 하기`}
                    text='다시 하기'
                    width={100}
                    height={40}
                    // @ts-ignore
                    textSize={14}
                    bg='#F3F4F6'
                    color='#F3F4F6'
                    textcolor='#374151'
                    onClick={() => onReset(mission.id)}
                    innerCircleVisible={false}
                  />
                </div>
                <ProgressRing value={progress} color={mission.color} />
              </div>
            </article>
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
      <CrayonTextBox
        textcolor='#333'
        textAlign='center'
        bg='#FFFFFF'
        color='#01A7A2'
        width={460}
        padding={20}
        paddingY={20}>
        <div className='text-2xl font-bold text-center text-gray-800'>용액 선택</div>
        <div className='flex justify-center items-end font-light gap-3 text-black whitespace-nowrap text-xl'>
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
          <CrayonTextBox textcolor='#333' textAlign='center' bg='#FFFFFF' color='#01A7A2' padding={40} paddingY={12}>
            <div className='text-2xl font-bold'>{showMessage}</div>
          </CrayonTextBox>
        </div>
      )}

      {gamePhase === 'wiping' && (
        <div className='absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none'>
          <CrayonTextBox textcolor='#333' textAlign='center' bg='#FFFFFF' color='#01A7A2' padding={40} paddingY={12}>
            <div className='text-2xl font-bold'>
              {material} ({Math.round(wipingProgress)} %)
            </div>
          </CrayonTextBox>
        </div>
      )}
    </>
  )
}
