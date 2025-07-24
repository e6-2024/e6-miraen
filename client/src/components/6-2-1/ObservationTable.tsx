import React from 'react'

function ObservationTable({ currentData }) {
  return (
    <div className='absolute bottom-4 left-4 z-10 bg-white bg-opacity-95 p-6 rounded-xl shadow-2xl border-2 border-blue-200'>
      <h3 className='font-bold mb-4 text-lg text-gray-800 text-center bg-blue-50 py-2 px-4 rounded-lg'>
        관측 자료
      </h3>
      <table className='text-base w-full border-collapse min-w-[280px]'>
        <thead>
          <tr>
            <th className='text-center border-2 border-gray-600 py-3 px-4 bg-sky-100 font-light'>
              시각
            </th>
            <th className='text-center border-2 border-gray-600 py-3 px-4 bg-white font-light'>
              {currentData.time}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className='py-3 px-4 border-2 border-gray-600 text-center bg-sky-100 font-light'>
              태양 방위각
            </td>
            <td className='border-2 border-gray-600 text-center py-3 px-4 bg-white font-light'>
              {currentData.azimuth}°
            </td>
          </tr>
          <tr>
            <td className='py-3 px-4 border-2 border-gray-600 text-center bg-sky-100 font-light'>
              태양 고도
            </td>
            <td className='border-2 border-gray-600 text-center py-3 px-4 bg-white font-light'>
              {currentData.altitude}°
            </td>
          </tr>
          <tr>
            <td className='py-3 px-4 border-2 border-gray-600 text-center bg-sky-100 font-light'>
              그림자 길이
            </td>
            <td className='border-2 border-gray-600 text-center py-3 px-4 bg-white font-light'>
              {currentData.shadowLength} cm
            </td>
          </tr>
          <tr>
            <td className='py-3 px-4 border-2 border-gray-600 text-center bg-sky-100 font-light'>
              기온
            </td>
            <td className='py-3 px-4 border-2 border-gray-600 text-center bg-white font-light'>
              {currentData.temperature}°C
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default ObservationTable