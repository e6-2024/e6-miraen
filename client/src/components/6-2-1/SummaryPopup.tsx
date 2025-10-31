import React, { useState, useRef, useEffect } from 'react'
import { CrayonTextBox } from '../common/CrayonTextBox'
import { useNarrationManager } from './useNarrationManager'

const SummaryPopup = ({ isOpen, onClose }) => {
  const { playNarration, stopNarration } = useNarrationManager('summary-popup')

  const [activeGraphs, setActiveGraphs] = useState({
    altitude: false,
    shadowLength: false,
    temperature: false,
  })

  const toggleGraph = async (graphType) => {
    stopNarration()

    const wasActive = activeGraphs[graphType]

    const newActiveGraphs = {
      ...activeGraphs,
      [graphType]: !wasActive,
    }

    setActiveGraphs(newActiveGraphs)
  }

  const handleClose = () => {
    stopNarration()
    setActiveGraphs({
      altitude: false,
      shadowLength: false,
      temperature: false,
    })
    onClose()
  }

  useEffect(() => {
    if (!isOpen) {
      setActiveGraphs({
        altitude: false,
        shadowLength: false,
        temperature: false,
      })
    }
  }, [isOpen])

  const getExplanationText = () => {
    const explanations = []

    if (activeGraphs.altitude) {
      explanations.push('태양 고도가 높아지면 기온은 높아집니다.')
    }

    if (activeGraphs.altitude && activeGraphs.shadowLength) {
      explanations.push('태양 고도가 높아지면 그림자 길이는 짧아지고, 태양 고도가 낮아지면 그림자 길이는 길어집니다.')
    }

    if (activeGraphs.altitude && activeGraphs.temperature) {
      explanations.push('기온이 가장 높은 시각은 태양 고도가 가장 높은 시각보다 늦습니다.')
    }

    return explanations
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <CrayonTextBox bg='#fff' color='#01A7A2' textcolor='#333' animated={false} padding={40} paddingY={16}>
        <div className='rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-bold text-gray-800'>정리하기</h2>
            <button
              onClick={handleClose}
              className='text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center'>
              ×
            </button>
          </div>

          <div className='relative flex justify-center items-center mb-6'>
            <img src='/img/graph/graph0.png' alt='기본 좌표' className='w-[50%] h-auto' />

            {activeGraphs.altitude && (
              <img
                src='/img/graph/graph1.png'
                alt='태양 고도 그래프'
                className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[50%] h-auto'
              />
            )}

            {activeGraphs.shadowLength && (
              <img
                src='/img/graph/graph2.png'
                alt='그림자 길이 그래프'
                className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[50%] h-auto'
              />
            )}

            {activeGraphs.temperature && (
              <img
                src='/img/graph/graph3.png'
                alt='기온 그래프'
                className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[50%] h-auto'
              />
            )}
          </div>

          <div className='flex flex-wrap gap-3 justify-center mb-6'>
            <button
              onClick={() => toggleGraph('altitude')}
              className={`px-6 py-3 rounded-full font-light transition-all duration-200 ${
                activeGraphs.altitude
                  ? 'bg-orange-400 text-white shadow-lg'
                  : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
              }`}>
              태양 고도 그래프
            </button>

            <button
              onClick={() => toggleGraph('shadowLength')}
              className={`px-6 py-3 rounded-full font-light transition-all duration-200 ${
                activeGraphs.shadowLength
                  ? 'bg-orange-400 text-white shadow-lg'
                  : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
              }`}>
              그림자 길이 그래프
            </button>

            <button
              onClick={() => toggleGraph('temperature')}
              className={`px-6 py-3 rounded-full font-light transition-all duration-200 ${
                activeGraphs.temperature
                  ? 'bg-orange-400 text-white shadow-lg'
                  : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
              }`}>
              기온 그래프
            </button>
          </div>

          <div className='bg-green-50 rounded-lg text-left p-4 min-h-[100px]'>
            {getExplanationText().length > 0 ? (
              <div className='space-y-3'>
                {getExplanationText().map((text, index) => (
                  <div key={index} className='flex font-light items-start'>
                    <span className='text-green-600 mr-2 mt-1'>•</span>
                    <p className='text-gray-800 leading-relaxed'>{text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center h-full'>
                <p className='text-gray-500 font-light text-center'>
                  위의 그래프 버튼을 클릭하여 그래프를 확인해 보세요.
                </p>
              </div>
            )}
          </div>

          <div className='mt-6 text-center'>
            <p className='text-sm font-light text-gray-600'>
              각 그래프를 선택하여 태양의 위치와 그림자, 기온의 관계를 알아보세요.
            </p>
          </div>
        </div>
      </CrayonTextBox>
    </div>
  )
}

export default SummaryPopup
