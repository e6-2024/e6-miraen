import React, { useState, useRef } from 'react';
import { Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';

// 컨트롤 패널 컴포넌트
const LightingControlPanel = ({ 
  lightingConfig, 
  environmentConfig, 
  skyConfig, 
  shadowConfig,
  onLightingChange, 
  onEnvironmentChange, 
  onSkyChange,
  onShadowChange,
  visible = true 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!visible) return null;

  const handleChange = (category, key, value) => {
    if (category === 'lighting') {
      onLightingChange({ ...lightingConfig, [key]: value });
    } else if (category === 'environment') {
      onEnvironmentChange({ ...environmentConfig, [key]: value });
    } else if (category === 'sky') {
      onSkyChange({ ...skyConfig, [key]: value });
    } else if (category === 'shadow') {
      onShadowChange({ ...shadowConfig, [key]: value });
    }
  };

  const presets = [
    'apartment', 'city', 'dawn', 'forest', 'lobby', 'night', 'park', 'studio', 'sunset', 'warehouse'
  ];

  return (
    <div className="fixed top-4 left-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">3D Environment Controls</h3>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-600"
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Directional Light 1 Controls */}
          <div className="border-b border-gray-700 pb-3">
            <h4 className="font-semibold text-yellow-400 mb-2">Main Light (Directional)</h4>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label>X: {lightingConfig.position[0]}</label>
              <input 
                type="range" 
                min="-20" 
                max="20" 
                step="0.1"
                value={lightingConfig.position[0]}
                onChange={(e) => handleChange('lighting', 'position', [parseFloat(e.target.value), lightingConfig.position[1], lightingConfig.position[2]])}
                className="col-span-2"
              />
              
              <label>Y: {lightingConfig.position[1]}</label>
              <input 
                type="range" 
                min="0" 
                max="30" 
                step="0.1"
                value={lightingConfig.position[1]}
                onChange={(e) => handleChange('lighting', 'position', [lightingConfig.position[0], parseFloat(e.target.value), lightingConfig.position[2]])}
                className="col-span-2"
              />
              
              <label>Z: {lightingConfig.position[2]}</label>
              <input 
                type="range" 
                min="-20" 
                max="20" 
                step="0.1"
                value={lightingConfig.position[2]}
                onChange={(e) => handleChange('lighting', 'position', [lightingConfig.position[0], lightingConfig.position[1], parseFloat(e.target.value)])}
                className="col-span-2"
              />
              
              <label>Intensity: {lightingConfig.intensity}</label>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.01"
                value={lightingConfig.intensity}
                onChange={(e) => handleChange('lighting', 'intensity', parseFloat(e.target.value))}
                className="col-span-2"
              />

              <label>Color:</label>
              <input 
                type="color" 
                value={lightingConfig.color}
                onChange={(e) => handleChange('lighting', 'color', e.target.value)}
                className="col-span-2 h-6"
              />
            </div>
          </div>

          {/* Secondary Light Controls */}
          <div className="border-b border-gray-700 pb-3">
            <h4 className="font-semibold text-blue-400 mb-2">Fill Light</h4>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label>X: {lightingConfig.secondaryPosition[0]}</label>
              <input 
                type="range" 
                min="-50" 
                max="50" 
                step="1"
                value={lightingConfig.secondaryPosition[0]}
                onChange={(e) => handleChange('lighting', 'secondaryPosition', [parseFloat(e.target.value), lightingConfig.secondaryPosition[1], lightingConfig.secondaryPosition[2]])}
                className="col-span-2"
              />
              
              <label>Y: {lightingConfig.secondaryPosition[1]}</label>
              <input 
                type="range" 
                min="0" 
                max="50" 
                step="1"
                value={lightingConfig.secondaryPosition[1]}
                onChange={(e) => handleChange('lighting', 'secondaryPosition', [lightingConfig.secondaryPosition[0], parseFloat(e.target.value), lightingConfig.secondaryPosition[2]])}
                className="col-span-2"
              />
              
              <label>Z: {lightingConfig.secondaryPosition[2]}</label>
              <input 
                type="range" 
                min="-50" 
                max="50" 
                step="1"
                value={lightingConfig.secondaryPosition[2]}
                onChange={(e) => handleChange('lighting', 'secondaryPosition', [lightingConfig.secondaryPosition[0], lightingConfig.secondaryPosition[1], parseFloat(e.target.value)])}
                className="col-span-2"
              />
              
              <label>Intensity: {lightingConfig.secondaryIntensity}</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={lightingConfig.secondaryIntensity}
                onChange={(e) => handleChange('lighting', 'secondaryIntensity', parseFloat(e.target.value))}
                className="col-span-2"
              />

              <label>Color:</label>
              <input 
                type="color" 
                value={lightingConfig.secondaryColor}
                onChange={(e) => handleChange('lighting', 'secondaryColor', e.target.value)}
                className="col-span-2 h-6"
              />
            </div>
          </div>

          {/* Shadow Controls */}
          <div className="border-b border-gray-700 pb-3">
            <h4 className="font-semibold text-gray-400 mb-2">Shadows</h4>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label>Enable:</label>
              <input 
                type="checkbox" 
                checked={shadowConfig.enabled}
                onChange={(e) => handleChange('shadow', 'enabled', e.target.checked)}
                className="col-span-2"
              />
              
              <label>Opacity: {shadowConfig.opacity}</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={shadowConfig.opacity}
                onChange={(e) => handleChange('shadow', 'opacity', parseFloat(e.target.value))}
                className="col-span-2"
              />

              <label>Bias: {shadowConfig.bias}</label>
              <input 
                type="range" 
                min="-0.01" 
                max="0.01" 
                step="0.0001"
                value={shadowConfig.bias}
                onChange={(e) => handleChange('shadow', 'bias', parseFloat(e.target.value))}
                className="col-span-2"
              />

              <label>Normal Bias: {shadowConfig.normalBias}</label>
              <input 
                type="range" 
                min="0" 
                max="0.1" 
                step="0.001"
                value={shadowConfig.normalBias}
                onChange={(e) => handleChange('shadow', 'normalBias', parseFloat(e.target.value))}
                className="col-span-2"
              />
            </div>
          </div>

          {/* Environment Controls */}
          <div className="border-b border-gray-700 pb-3">
            <h4 className="font-semibold text-green-400 mb-2">Environment</h4>
            
            <div className="space-y-2 text-xs">
              <div>
                <label className="block mb-1">Preset:</label>
                <select 
                  value={environmentConfig.preset}
                  onChange={(e) => handleChange('environment', 'preset', e.target.value)}
                  className="w-full bg-gray-800 p-1 rounded"
                >
                  {presets.map(preset => (
                    <option key={preset} value={preset}>{preset}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <label>Intensity: {environmentConfig.intensity}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="3" 
                  step="0.1"
                  value={environmentConfig.intensity}
                  onChange={(e) => handleChange('environment', 'intensity', parseFloat(e.target.value))}
                  className="col-span-2"
                />

                <label>Rotation: {environmentConfig.rotation}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="6.28" 
                  step="0.1"
                  value={environmentConfig.rotation}
                  onChange={(e) => handleChange('environment', 'rotation', parseFloat(e.target.value))}
                  className="col-span-2"
                />
              </div>
            </div>
          </div>

          {/* Sky Controls */}
          <div className="pb-3">
            <h4 className="font-semibold text-cyan-400 mb-2">Sky</h4>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label>Sun X: {skyConfig.sunPosition[0]}</label>
              <input 
                type="range" 
                min="-2" 
                max="2" 
                step="0.01"
                value={skyConfig.sunPosition[0]}
                onChange={(e) => handleChange('sky', 'sunPosition', [parseFloat(e.target.value), skyConfig.sunPosition[1], skyConfig.sunPosition[2]])}
                className="col-span-2"
              />
              
              <label>Sun Y: {skyConfig.sunPosition[1]}</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={skyConfig.sunPosition[1]}
                onChange={(e) => handleChange('sky', 'sunPosition', [skyConfig.sunPosition[0], parseFloat(e.target.value), skyConfig.sunPosition[2]])}
                className="col-span-2"
              />
              
              <label>Sun Z: {skyConfig.sunPosition[2]}</label>
              <input 
                type="range" 
                min="-2" 
                max="2" 
                step="0.01"
                value={skyConfig.sunPosition[2]}
                onChange={(e) => handleChange('sky', 'sunPosition', [skyConfig.sunPosition[0], skyConfig.sunPosition[1], parseFloat(e.target.value)])}
                className="col-span-2"
              />

              <label>Inclination: {skyConfig.inclination}</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={skyConfig.inclination}
                onChange={(e) => handleChange('sky', 'inclination', parseFloat(e.target.value))}
                className="col-span-2"
              />

              <label>Azimuth: {skyConfig.azimuth}</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={skyConfig.azimuth}
                onChange={(e) => handleChange('sky', 'azimuth', parseFloat(e.target.value))}
                className="col-span-2"
              />

              <label>Rayleigh: {skyConfig.rayleigh}</label>
              <input 
                type="range" 
                min="0" 
                max="4" 
                step="0.1"
                value={skyConfig.rayleigh}
                onChange={(e) => handleChange('sky', 'rayleigh', parseFloat(e.target.value))}
                className="col-span-2"
              />

              <label>Turbidity: {skyConfig.turbidity}</label>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="0.1"
                value={skyConfig.turbidity}
                onChange={(e) => handleChange('sky', 'turbidity', parseFloat(e.target.value))}
                className="col-span-2"
              />

              <label>Mie Coeff: {skyConfig.mieCoefficient}</label>
              <input 
                type="range" 
                min="0" 
                max="0.1" 
                step="0.001"
                value={skyConfig.mieCoefficient}
                onChange={(e) => handleChange('sky', 'mieCoefficient', parseFloat(e.target.value))}
                className="col-span-2"
              />

              <label>Mie Dir G: {skyConfig.mieDirectionalG}</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={skyConfig.mieDirectionalG}
                onChange={(e) => handleChange('sky', 'mieDirectionalG', parseFloat(e.target.value))}
                className="col-span-2"
              />
            </div>
          </div>

          {/* Export/Import Configuration */}
          <div className="pt-3 border-t border-gray-700">
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const config = { lightingConfig, environmentConfig, skyConfig, shadowConfig };
                  navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                  alert('Configuration copied to clipboard!');
                }}
                className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-500"
              >
                Copy Config
              </button>
              <button 
                onClick={() => {
                  const config = { lightingConfig, environmentConfig, skyConfig, shadowConfig };
                  console.log('3D Environment Configuration:', config);
                }}
                className="bg-green-600 px-3 py-1 rounded text-sm hover:bg-green-500"
              >
                Log Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 메인 컴포넌트 예시
const Scene3DWithControls = () => {
  const [lightingConfig, setLightingConfig] = useState({
    position: [8, 9, 8],
    intensity: 0.2,
    color: '#FFF8DC',
    secondaryPosition: [-20, 30, 20],
    secondaryIntensity: 0.1,
    secondaryColor: '#E6F3FF'
  });

  const [environmentConfig, setEnvironmentConfig] = useState({
    preset: 'apartment',
    intensity: 1.0,
    rotation: Math.PI / 2
  });

  const [skyConfig, setSkyConfig] = useState({
    sunPosition: [-1, 0.09, -1],
    inclination: 0.49,
    azimuth: 0.25,
    rayleigh: 1.2,
    turbidity: 1,
    mieCoefficient: 0.008,
    mieDirectionalG: 0.85
  });

  const [shadowConfig, setShadowConfig] = useState({
    enabled: true,
    opacity: 0.2,
    bias: -0.001,
    normalBias: 0.02
  });

  return (
    <div className="w-full h-screen bg-gray-100 relative">
      <LightingControlPanel 
        lightingConfig={lightingConfig}
        environmentConfig={environmentConfig}
        skyConfig={skyConfig}
        shadowConfig={shadowConfig}
        onLightingChange={setLightingConfig}
        onEnvironmentChange={setEnvironmentConfig}
        onSkyChange={setSkyConfig}
        onShadowChange={setShadowConfig}
        visible={true}
      />
      
      {/* 여기에 실제 3D Scene 컨텐츠가 들어갑니다 */}
      <div className="w-full h-full bg-gradient-to-b from-blue-200 to-green-200 flex items-center justify-center">
        <div className="text-center text-gray-700">
          <h2 className="text-2xl font-bold mb-4">3D Scene Preview</h2>
          <p className="mb-2">실제 Three.js Scene은 여기에 렌더링됩니다</p>
          <div className="bg-white p-4 rounded-lg shadow-md inline-block">
            <h3 className="font-semibold mb-2">현재 설정:</h3>
            <div className="text-sm space-y-1 text-left">
              <div>Main Light: ({lightingConfig.position.join(', ')})</div>
              <div>Environment: {environmentConfig.preset}</div>
              <div>Sun Position: ({skyConfig.sunPosition.join(', ')})</div>
              <div>Shadows: {shadowConfig.enabled ? 'On' : 'Off'}</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            좌측 패널에서 라이팅과 환경을 실시간으로 조정할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default Scene3DWithControls;