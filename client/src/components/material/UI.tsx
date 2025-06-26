import React from 'react';

interface Props {
  onChange: (level: number) => void;
}

export default function UI({ onChange }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 10,
      }}
    >
      <button onClick={() => onChange(0)}>Level 0 - 큰 구멍</button>
      <button onClick={() => onChange(1)}>Level 1 - 작은 구멍</button>
      <button onClick={() => onChange(2)}>Level 2 - 중간 구멍</button>
    </div>
  );
}
