import React, { useState, useCallback } from 'react'
import * as THREE from 'three'

interface DeveloperControlsProps {
  pathPoints: THREE.Vector3[]
  onPathChange: (newPoints: THREE.Vector3[]) => void
  isEditorVisible: boolean
  onToggleEditor: () => void
}

export function DeveloperControls({
  pathPoints,
  onPathChange,
  isEditorVisible,
  onToggleEditor,
}: DeveloperControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPointIndex, setSelectedPointIndex] = useState(0)
  const [copiedPosition, setCopiedPosition] = useState<{ x: number; y: number; z: number } | null>(null)

  const handlePointSelect = useCallback((index: number) => {
    setSelectedPointIndex(index)
  }, [])

  const handlePositionChange = useCallback(
    (axis: 'x' | 'y' | 'z', value: number) => {
      const newPoints = [...pathPoints]
      const currentPoint = newPoints[selectedPointIndex].clone()

      switch (axis) {
        case 'x':
          currentPoint.x = value
          break
        case 'y':
          currentPoint.y = value
          break
        case 'z':
          currentPoint.z = value
          break
      }

      newPoints[selectedPointIndex] = currentPoint
      onPathChange(newPoints)
    },
    [pathPoints, selectedPointIndex, onPathChange],
  )

  const handleCopyPosition = useCallback(() => {
    const point = pathPoints[selectedPointIndex]
    setCopiedPosition({
      x: parseFloat(point.x.toFixed(2)),
      y: parseFloat(point.y.toFixed(2)),
      z: parseFloat(point.z.toFixed(2)),
    })
  }, [pathPoints, selectedPointIndex])

  const handlePastePosition = useCallback(() => {
    if (!copiedPosition) return
    const newPoints = [...pathPoints]
    newPoints[selectedPointIndex] = new THREE.Vector3(copiedPosition.x, copiedPosition.y, copiedPosition.z)
    onPathChange(newPoints)
  }, [copiedPosition, pathPoints, selectedPointIndex, onPathChange])

  const handleAddPoint = useCallback(() => {
    const newPoints = [...pathPoints]
    const lastPoint = pathPoints[pathPoints.length - 1]
    const newPoint = new THREE.Vector3(lastPoint.x + 1, lastPoint.y + 1, lastPoint.z)
    newPoints.push(newPoint)
    onPathChange(newPoints)
  }, [pathPoints, onPathChange])

  const handleRemovePoint = useCallback(() => {
    if (pathPoints.length <= 2) return
    const newPoints = [...pathPoints]
    newPoints.splice(selectedPointIndex, 1)
    onPathChange(newPoints)

    if (selectedPointIndex >= newPoints.length) {
      setSelectedPointIndex(newPoints.length - 1)
    }
  }, [pathPoints, selectedPointIndex, onPathChange])

  const handleResetPath = useCallback(() => {
    const defaultPoints = [
      new THREE.Vector3(-1.407, -2.368, -2.428),
      new THREE.Vector3(-0.369, -0.214, -0.498),
      new THREE.Vector3(-0.252, 1.52, -0.191),
      new THREE.Vector3(-0.303, 2.91, -0.136),
      new THREE.Vector3(-0.302, 4.396, -0.173),
      new THREE.Vector3(-0.295, 6.28, -0.306),
      new THREE.Vector3(-0.244, 7.28, -0.337),
      new THREE.Vector3(-0.19, 8.28, -0.179),
      new THREE.Vector3(-0.183, 8.917, -0.325),
      new THREE.Vector3(-0.283, 9.417, -0.125),
    ]
    onPathChange(defaultPoints)
    setSelectedPointIndex(0)
  }, [onPathChange])

  const handleExportPath = useCallback(() => {
    const pathData = pathPoints.map((point) => ({
      x: parseFloat(point.x.toFixed(3)),
      y: parseFloat(point.y.toFixed(3)),
      z: parseFloat(point.z.toFixed(3)),
    }))

    const exportString = JSON.stringify(pathData, null, 2)
    console.log('Water Path Points:', exportString)

    navigator.clipboard
      .writeText(exportString)
      .then(() => {
        alert('Path points copied to clipboard!')
      })
      .catch(() => {
        alert('Path points logged to console')
      })
  }, [pathPoints])

  if (!isExpanded) {
    return (
      <div className='fixed top-40 left-12 z-50'>
        <button
          onClick={() => setIsExpanded(true)}
          className='bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors'>
          🔧 Dev Tools
        </button>
      </div>
    )
  }

  const selectedPoint = pathPoints[selectedPointIndex]

  return (
    <div className='fixed top-4 left-4 z-50 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-xs'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-bold'>Water Path Editor</h3>
        <button onClick={() => setIsExpanded(false)} className='text-gray-400 hover:text-white'>
          ✕
        </button>
      </div>

      <div className='space-y-4'>
        {/* Editor Toggle */}
        <div>
          <label className='block text-sm font-medium mb-2'>
            <input type='checkbox' checked={isEditorVisible} onChange={onToggleEditor} className='mr-2' />
            Show Point Editor
          </label>
        </div>

        {/* Point Selection */}
        <div>
          <label className='block text-sm font-medium mb-2'>Selected Point: {selectedPointIndex}</label>
          <select
            value={selectedPointIndex}
            onChange={(e) => handlePointSelect(parseInt(e.target.value))}
            className='w-full bg-gray-700 text-white p-2 rounded'>
            {pathPoints.map((_, index) => (
              <option key={index} value={index}>
                Point {index} {index === 0 ? '(Root)' : index === pathPoints.length - 1 ? '(Leaf)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Position Controls */}
        {selectedPoint && (
          <div className='space-y-3'>
            <div className='text-sm font-medium text-gray-200 mb-2'>Position Controls</div>

            {/* Direct Input Fields */}
            <div className='grid grid-cols-3 gap-2'>
              <div>
                <label className='block text-xs text-gray-300 mb-1'>X</label>
                <input
                  type='number'
                  step='0.1'
                  value={selectedPoint.x.toFixed(2)}
                  onChange={(e) => handlePositionChange('x', parseFloat(e.target.value) || 0)}
                  className='w-full bg-gray-700 text-white p-1 rounded text-sm'
                />
              </div>
              <div>
                <label className='block text-xs text-gray-300 mb-1'>Y</label>
                <input
                  type='number'
                  step='0.1'
                  value={selectedPoint.y.toFixed(2)}
                  onChange={(e) => handlePositionChange('y', parseFloat(e.target.value) || 0)}
                  className='w-full bg-gray-700 text-white p-1 rounded text-sm'
                />
              </div>
              <div>
                <label className='block text-xs text-gray-300 mb-1'>Z</label>
                <input
                  type='number'
                  step='0.1'
                  value={selectedPoint.z.toFixed(2)}
                  onChange={(e) => handlePositionChange('z', parseFloat(e.target.value) || 0)}
                  className='w-full bg-gray-700 text-white p-1 rounded text-sm'
                />
              </div>
            </div>

            {/* Fine Control Buttons */}
            <div className='space-y-2'>
              <div className='text-xs text-gray-300'>Fine Adjustments (±0.1)</div>
              <div className='grid grid-cols-3 gap-2'>
                <div className='flex flex-col gap-1'>
                  <button
                    onClick={() => handlePositionChange('x', selectedPoint.x + 0.1)}
                    className='bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors'>
                    X +
                  </button>
                  <button
                    onClick={() => handlePositionChange('x', selectedPoint.x - 0.1)}
                    className='bg-red-800 hover:bg-red-900 px-2 py-1 rounded text-xs transition-colors'>
                    X -
                  </button>
                </div>
                <div className='flex flex-col gap-1'>
                  <button
                    onClick={() => handlePositionChange('y', selectedPoint.y + 0.1)}
                    className='bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs transition-colors'>
                    Y +
                  </button>
                  <button
                    onClick={() => handlePositionChange('y', selectedPoint.y - 0.1)}
                    className='bg-green-800 hover:bg-green-900 px-2 py-1 rounded text-xs transition-colors'>
                    Y -
                  </button>
                </div>
                <div className='flex flex-col gap-1'>
                  <button
                    onClick={() => handlePositionChange('z', selectedPoint.z + 0.1)}
                    className='bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors'>
                    Z +
                  </button>
                  <button
                    onClick={() => handlePositionChange('z', selectedPoint.z - 0.1)}
                    className='bg-blue-800 hover:bg-blue-900 px-2 py-1 rounded text-xs transition-colors'>
                    Z -
                  </button>
                </div>
              </div>
            </div>

            {/* Preset Movement Buttons */}
            <div className='space-y-2'>
              <div className='text-xs text-gray-300'>Quick Moves (±1.0)</div>
              <div className='grid grid-cols-2 gap-1'>
                <button
                  onClick={() => handlePositionChange('y', selectedPoint.y + 1)}
                  className='bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs transition-colors'>
                  Up ↑
                </button>
                <button
                  onClick={() => handlePositionChange('y', selectedPoint.y - 1)}
                  className='bg-yellow-800 hover:bg-yellow-900 px-2 py-1 rounded text-xs transition-colors'>
                  Down ↓
                </button>
                <button
                  onClick={() => handlePositionChange('x', selectedPoint.x - 1)}
                  className='bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs transition-colors'>
                  Left ←
                </button>
                <button
                  onClick={() => handlePositionChange('x', selectedPoint.x + 1)}
                  className='bg-purple-800 hover:bg-purple-900 px-2 py-1 rounded text-xs transition-colors'>
                  Right →
                </button>
              </div>
            </div>

            {/* Copy/Paste Position */}
            <div className='flex gap-2'>
              <button
                onClick={handleCopyPosition}
                className='bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs transition-colors flex-1'>
                Copy Pos
              </button>
              <button
                onClick={handlePastePosition}
                disabled={!copiedPosition}
                className='bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 px-2 py-1 rounded text-xs transition-colors flex-1'>
                Paste Pos
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex gap-2 flex-wrap'>
          <button
            onClick={handleAddPoint}
            className='bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors'>
            Add Point
          </button>
          <button
            onClick={handleRemovePoint}
            disabled={pathPoints.length <= 2}
            className='bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm transition-colors'>
            Remove Point
          </button>
          <button
            onClick={handleResetPath}
            className='bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors'>
            Reset Path
          </button>
          <button
            onClick={handleExportPath}
            className='bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors'>
            Export Path
          </button>
        </div>

        <div className='text-xs text-gray-400 mt-2'>Total Points: {pathPoints.length}</div>
      </div>
    </div>
  )
}
