import React, { useState } from 'react';
import SummaryPopup from './SummaryPopup'; // 팝업 컴포넌트 import

function ControlButtons({ 
  showObservationLines, 
  setShowObservationLines, 
  timeData, 
  currentData, 
  onTimeSelect 
}) {
  const [showTimeButtons, setShowTimeButtons] = useState(false);
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  
  // 특정 시각들
  const targetTimes = ['09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30'];
  
  // timeData에서 해당 시각의 데이터 찾기
  const findDataByTime = (targetTime) => {
    return timeData?.find(data => data.time === targetTime);
  };

  const handleObservationClick = () => {
    if (showTimeButtons) {
      // 시간 간격 모드 종료 - 돌아가기
      setShowTimeButtons(false);
      setShowObservationLines(false);
      if (onTimeSelect) {
        onTimeSelect(null);
      }
    } else {
      // 시간 간격 모드 시작
      setShowObservationLines(true);
      setShowTimeButtons(true);
    }
  };

  const handleTimeClick = (time) => {
    const data = findDataByTime(time);
    if (data) {
      // 부모 컴포넌트에 선택된 시각 전달 (3D 모델 업데이트용)
      if (onTimeSelect) {
        onTimeSelect(data);
      }
    }
  };

  const handleSummaryClick = () => {
    setShowSummaryPopup(true);
  };

  return (
    <>
      <div className='absolute top-4 right-4 z-10 flex flex-col items-end gap-3'>
        {/* 시각 선택 패널 - 시간 간격 모드일 때만 표시 */}
        {showTimeButtons && (
          <div className="bg-white rounded-lg p-4 shadow-lg border mb-2">
            <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">시각 선택</h3>
            
            <div className="grid grid-cols-2 gap-2">
              {targetTimes.map((time) => {
                const data = findDataByTime(time);
                return (
                  <button
                    key={time}
                    onClick={() => handleTimeClick(time)}
                    disabled={!data}
                    className={`py-2 px-3 rounded text-sm font-semibold transition-colors duration-200 ${
                      data
                        ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 메인 컨트롤 버튼들 */}
        <button
          onClick={handleObservationClick}
          className={`px-6 py-3 rounded-lg font-light transition-all duration-200 shadow-lg ${
            showTimeButtons
              ? 'bg-gray-600 text-white hover:bg-gray-700'
              : showObservationLines
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-300'
          }`}
        >
          {showTimeButtons ? '돌아가기' : '일정 시간 간격 관측 자료 확인하기'}
        </button>
        
        <button
          onClick={handleSummaryClick}
          className='px-6 py-3 bg-green-500 text-white rounded-lg font-light hover:bg-green-600 transition-all duration-200 shadow-lg'
        >
          정리하기
        </button>
      </div>

      {/* 정리하기 팝업 */}
      <SummaryPopup 
        isOpen={showSummaryPopup} 
        onClose={() => setShowSummaryPopup(false)} 
      />
    </>
  );
}

export default ControlButtons;