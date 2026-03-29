import React from 'react';

export default function SearchBar({ value, onChange, onClear, placeholder = 'Search...', isMobileView }) {
  return (
    <div style={{
      position: 'relative',
      flex: 1,
      minWidth: '200px',
    }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: isMobileView ? '10px 36px 10px 12px' : '12px 40px 12px 16px',
          border: '2px solid #0D0D0D',
          backgroundColor: 'transparent',
          fontFamily: '"Courier Prime", monospace',
          fontSize: isMobileView ? '13px' : '14px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {value && (
        <button
          onClick={onClear}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '18px',
            color: '#0D0D0D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
