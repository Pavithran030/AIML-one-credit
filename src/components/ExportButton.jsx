import React, { useState } from 'react';

export default function ExportButton({ transactions, isMobileView }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleExportCSV = () => {
    if (transactions && transactions.length > 0) {
      const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Notes', 'Tags'];
      const rows = transactions.map(t => [
        t.date,
        t.type,
        t.category,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.amount,
        t.payment_method || '',
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        t.tags || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ledger_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      setShowMenu(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          padding: isMobileView ? '8px 12px' : '10px 16px',
          border: '2px solid #0D0D0D',
          backgroundColor: 'transparent',
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: isMobileView ? '12px' : '14px',
          letterSpacing: '1px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#0D0D0D'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        {isMobileView ? 'EXPORT' : 'EXPORT'}
      </button>
      
      {showMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setShowMenu(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: '#F5F0E8',
              border: '2px solid #0D0D0D',
              zIndex: 1000,
              minWidth: '160px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <button
              onClick={handleExportCSV}
              disabled={!transactions || transactions.length === 0}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                fontFamily: '"Courier Prime", monospace',
                fontSize: '13px',
                textAlign: 'left',
                cursor: (!transactions || transactions.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (!transactions || transactions.length === 0) ? 0.5 : 1,
                transition: 'background-color 0.2s',
                borderBottom: '1px solid rgba(13,13,13,0.15)',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#E8FF00'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              📄 Export CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}
