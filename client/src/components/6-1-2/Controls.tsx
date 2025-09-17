import { ViewMode, VehicleId, AnimationState } from '@/types/6-1-2/types';
import { VEHICLES } from '@/utils/6-1-2/utils';
import { CrayonTextButton } from '@/components/common/CrayonUIButton';
import { CrayonTextBox } from '@/components/common/CrayonTextBox';

interface ControlsProps {
  animationState: AnimationState;
  viewMode: ViewMode;
  selectedVehicle: VehicleId;
  showResult: boolean;
  onToggleAnimation: () => void;
  onResetAnimation: () => void;
  onShowResult: () => void;
  onBackToAnimation: () => void;
  onViewChange: (mode: ViewMode) => void;
  onVehicleSelect: (vehicleId: VehicleId) => void;
}

const VIEW_BUTTONS: Array<{
  name: string;
  mode: ViewMode;
}> = [
  {
    name: '시작점에서 관찰하기',
    mode: 'start',
  },
  {
    name: '1인칭 시점으로 관찰하기',
    mode: 'firstPerson',
  },
  {
    name: '자유롭게 관찰하기',
    mode: 'free',
  },
];

export function Controls({
  animationState,
  viewMode,
  selectedVehicle,
  showResult,
  onToggleAnimation,
  onResetAnimation,
  onShowResult,
  onBackToAnimation,
  onViewChange,
  onVehicleSelect,
}: ControlsProps) {
  const { isPlaying, isPaused, isCompleted } = animationState;

  return (
    <>
      {showResult ? (
        <div className='absolute top-3 right-3 z-10'>
          <CrayonTextButton
            text='다시 돌아가기'
            onClick={onBackToAnimation}
            width={170}
            height={60}
            bg='#6B7280'
            color='#D1D5DB'
            textcolor='#FFFFFF'
          />
        </div>
      ) : (
        <>
          <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-4'>
            {!isCompleted && (
              <CrayonTextButton
                text={
                  isPlaying && !isPaused
                    ? '일시정지'
                    : isPaused
                    ? '재생하기'
                    : '운동 시작하기'
                }
                onClick={onToggleAnimation}
                width={200}
                height={70}
                bg={isPlaying && !isPaused ? '#EAB308' : '#10B981'}
                color={isPlaying && !isPaused ? '#FEF3C7' : '#D1FAE5'}
                textcolor='#FFFFFF'
              />
            )}

            {(isPlaying || isPaused || isCompleted) && (
              <CrayonTextButton
                text='처음으로'
                onClick={onResetAnimation}
                width={150}
                height={70}
                bg='#6B7280'
                color='#D1D5DB'
                textcolor='#FFFFFF'
              />
            )}

            {isCompleted && (
              <CrayonTextButton
                text='빠르기 비교하기'
                onClick={onShowResult}
                width={200}
                height={70}
                bg='#8B5CF6'
                color='#DDD6FE'
                textcolor='#FFFFFF'
              />
            )}
          </div>

          {(isPlaying || isCompleted) && (
            <div className='absolute top-6 left-6 z-10'>
              <CrayonTextBox color='#F3921C' bg='#FFF' animated={true}>
                <h3 className='text-sm font-bold text-gray-700 mb-3'>관찰 시점을 고르세요</h3>
                <div className='flex flex-col'>
                  {VIEW_BUTTONS.map((button, idx) => (
                    <CrayonTextButton
                      key={idx}
                      text={button.name}
                      onClick={() => onViewChange(button.mode)}
                      width={220}
                      height={60}
                      bg={viewMode === button.mode ? '#F97316' : '#F3F4F6'}
                      color={viewMode === button.mode ? '#FED7AA' : '#E5E7EB'}
                      textcolor={viewMode === button.mode ? '#FFFFFF' : '#374151'}
                    />
                  ))}
                </div>
              </CrayonTextBox>
            </div>
          )}

          {viewMode === 'firstPerson' && (
            <div className='absolute top-6 right-6 z-10'>
              <CrayonTextBox color='#52AE46' bg='#FFF' animated={true}>
                <h4 className='text-sm font-bold text-gray-700 mb-3'>🚗 관찰하기</h4>
                <div className='grid grid-cols-1 gap-2 min-w-[160px]'>
                  {VEHICLES.map((vehicle) => (
                    <CrayonTextButton
                      key={vehicle.id}
                      text={vehicle.name}
                      onClick={() => onVehicleSelect(vehicle.id)}
                      width={180}
                      height={45}
                      bg={selectedVehicle === vehicle.id ? '#3B82F6' : '#F3F4F6'}
                      color={selectedVehicle === vehicle.id ? '#DBEAFE' : '#E5E7EB'}
                      textcolor={selectedVehicle === vehicle.id ? '#FFFFFF' : '#374151'}
                    />
                  ))}
                </div>
              </CrayonTextBox>
            </div>
          )}
        </>
      )}
    </>
  );
}