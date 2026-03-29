import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyles = () => {
    const base = {
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '14px 24px',
      backgroundColor: '#0D0D0D',
      color: '#F5F0E8',
      fontFamily: '"Courier Prime", monospace',
      fontSize: '14px',
      fontWeight: 'bold',
      border: '2px solid #0D0D0D',
      zIndex: 10000,
      minWidth: '280px',
      maxWidth: '90vw',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      animation: 'slideIn 0.3s ease-out',
    };

    switch (type) {
      case 'success':
        return { ...base, backgroundColor: '#22c55e', borderColor: '#22c55e', color: '#fff' };
      case 'error':
        return { ...base, backgroundColor: '#CC1400', borderColor: '#CC1400', color: '#fff' };
      case 'warning':
        return { ...base, backgroundColor: '#E8FF00', borderColor: '#E8FF00', color: '#0D0D0D' };
      default:
        return base;
    }
  };

  return (
    <div style={getStyles()} onClick={onClose}>
      {message}
    </div>
  );
}
