import React, { useState, useEffect, useReducer, useCallback, useMemo } from 'react';
import { transactionAPI, healthCheck, searchAPI } from './api';
import Toast from './components/Toast';
import SearchBar from './components/SearchBar';
import ExportButton from './components/ExportButton';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  { code: 'F', name: 'FOOD', color: '#0D0D0D' },
  { code: 'T', name: 'TRANSPORT', color: '#0D0D0D' },
  { code: 'U', name: 'UTILITIES', color: '#0D0D0D' },
  { code: 'E', name: 'ENTERTAINMENT', color: '#0D0D0D' },
  { code: 'H', name: 'HEALTH', color: '#0D0D0D' },
  { code: 'O', name: 'OTHER', color: '#0D0D0D' },
];

const INCOME_CATEGORIES = [
  { code: 'S', name: 'SALARY', color: '#0D0D0D' },
  { code: 'F', name: 'FREELANCE', color: '#0D0D0D' },
  { code: 'I', name: 'INVESTMENT', color: '#0D0D0D' },
  { code: 'G', name: 'GIFT', color: '#0D0D0D' },
  { code: 'R', name: 'RENTAL', color: '#0D0D0D' },
  { code: 'O', name: 'OTHER', color: '#0D0D0D' },
];

const CATEGORIES = [...EXPENSE_CATEGORIES];

const COLORS = {
  bg: '#F5F0E8',
  bgAlt: '#ECEAE0',
  text: '#0D0D0D',
  accentYellow: '#E8FF00',
  accentRed: '#CC1400',
  border: 'rgba(13, 13, 13, 0.15)',
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getMonthKey = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`;

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getMonthName = (month) => {
  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  return months[month];
};

// ─────────────────────────────────────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
  transactions: [],
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedCategory: null,
  sortColumn: 'date',
  sortDirection: 'desc',
  expandedRow: null,
  isFormOpen: false,
  pendingDelete: null,
  isLoading: true,
  error: null,
  isSubmitting: false,
  searchQuery: '',
  searchResults: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_TRANSACTIONS':
      return { ...state, transactions: action.payload, isLoading: false, searchResults: null };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions], isFormOpen: false, isSubmitting: false };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
        pendingDelete: null,
      };
    case 'SET_MONTH':
      return { ...state, currentMonth: action.payload.month, currentYear: action.payload.year, isLoading: true, searchResults: null };
    case 'SET_CATEGORY_FILTER':
      return { ...state, selectedCategory: state.selectedCategory === action.payload ? null : action.payload };
    case 'SET_SORT':
      return {
        ...state,
        sortColumn: action.payload,
        sortDirection: state.sortColumn === action.payload && state.sortDirection === 'asc' ? 'desc' : 'asc',
      };
    case 'EXPAND_ROW':
      return { ...state, expandedRow: state.expandedRow === action.payload ? null : action.payload };
    case 'OPEN_FORM':
      return { ...state, isFormOpen: true };
    case 'CLOSE_FORM':
      return { ...state, isFormOpen: false };
    case 'SET_PENDING_DELETE':
      return { ...state, pendingDelete: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'CLEAR_SEARCH':
      return { ...state, searchQuery: '', searchResults: null };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES (CSS-in-JS)
// ─────────────────────────────────────────────────────────────────────────────

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    fontFamily: '"Courier Prime", monospace',
    position: 'relative',
    overflow: 'hidden',
    overflowX: 'hidden',
  },
  grainOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    opacity: 0.03,
    zIndex: 1000,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  },
  gridPattern: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 999,
    backgroundImage: `radial-gradient(rgba(13, 13, 13, 0.08) 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
  },
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
  },
  sidebar: {
    width: '220px',
    borderRight: `3px solid ${COLORS.text}`,
    padding: '24px 16px',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto',
    backgroundColor: COLORS.bg,
    zIndex: 100,
  },
  sidebarTitle: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '24px',
    letterSpacing: '2px',
    marginBottom: '24px',
    borderBottom: `2px solid ${COLORS.text}`,
    paddingBottom: '8px',
  },
  categoryItem: {
    marginBottom: '16px',
    cursor: 'pointer',
    padding: '8px',
    transition: 'background-color 0.2s',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
  },
  categoryBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '0',
    backgroundColor: COLORS.text,
    color: COLORS.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '16px',
    border: `2px solid ${COLORS.text}`,
  },
  categoryName: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '16px',
    letterSpacing: '1px',
    flex: 1,
  },
  categoryAmount: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  categoryBar: {
    height: '8px',
    backgroundColor: `rgba(13, 13, 13, 0.15)`,
    marginTop: '4px',
    position: 'relative',
  },
  categoryBarFill: {
    height: '100%',
    backgroundColor: COLORS.text,
    transition: 'width 0.3s ease',
  },
  mainContent: {
    flex: 1,
    marginLeft: '220px',
    padding: '0',
    minWidth: 0, // Prevent flex overflow
  },
  header: {
    borderBottom: `3px solid ${COLORS.text}`,
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: COLORS.bg,
    flexWrap: 'wrap',
    gap: '8px',
  },
  headerTitle: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '72px',
    lineHeight: '1',
    letterSpacing: '4px',
    margin: 0,
  },
  headerMonth: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '24px',
    letterSpacing: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  monthNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  monthNavButton: {
    width: '32px',
    height: '32px',
    border: `2px solid ${COLORS.text}`,
    backgroundColor: 'transparent',
    fontFamily: '"Courier Prime", monospace',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  summaryBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '64px',
    padding: '24px 32px',
    borderBottom: `2px dashed rgba(13, 13, 13, 0.15)`,
    flexWrap: 'wrap',
  },
  summaryItem: {
    textAlign: 'center',
  },
  summaryValue: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '56px',
    lineHeight: '1',
    letterSpacing: '2px',
  },
  summaryLabel: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '10px',
    letterSpacing: '2px',
    marginTop: '4px',
    opacity: 0.7,
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    padding: '16px 32px',
    borderBottom: `2px solid ${COLORS.text}`,
    flexWrap: 'wrap',
  },
  filterStamp: {
    padding: '8px 16px',
    border: `2px solid ${COLORS.text}`,
    backgroundColor: 'transparent',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '14px',
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterStampActive: {
    backgroundColor: COLORS.accentYellow,
  },
  tableContainer: {
    padding: '0',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: '"Courier Prime", monospace',
  },
  tableHeader: {
    borderBottom: `3px solid ${COLORS.text}`,
  },
  tableHeaderCell: {
    padding: '12px 16px',
    textAlign: 'left',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '16px',
    letterSpacing: '1px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.2s',
  },
  tableRow: {
    borderBottom: `1px solid ${COLORS.border}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  tableRowAlt: {
    backgroundColor: COLORS.bgAlt,
  },
  tableRowHover: {
    backgroundColor: COLORS.accentYellow,
  },
  tableCell: {
    padding: '14px 16px',
    verticalAlign: 'middle',
  },
  dateCell: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '12px',
  },
  categoryCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  categoryBadgeSmall: {
    width: '22px',
    height: '22px',
    borderRadius: '0',
    backgroundColor: COLORS.text,
    color: COLORS.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '12px',
  },
  descriptionCell: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '13px',
  },
  amountCell: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  amountExpense: {
    color: COLORS.accentRed,
  },
  balanceCell: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    marginLeft: '8px',
  },
  expandedRow: {
    backgroundColor: COLORS.bgAlt,
    padding: '16px',
    borderTop: `2px solid ${COLORS.text}`,
  },
  expandedField: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px',
  },
  expandedLabel: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '12px',
    width: '100px',
    opacity: 0.7,
  },
  expandedInput: {
    flex: 1,
    border: 'none',
    borderBottom: `2px solid ${COLORS.text}`,
    backgroundColor: 'transparent',
    fontFamily: '"Courier Prime", monospace',
    fontSize: '14px',
    padding: '8px 0',
    outline: 'none',
  },
  saveButton: {
    padding: '10px 24px',
    border: `2px solid ${COLORS.text}`,
    backgroundColor: 'transparent',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '14px',
    letterSpacing: '1px',
    cursor: 'pointer',
    marginRight: '8px',
    transition: 'all 0.2s',
  },
  voidStamp: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-30deg)',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '72px',
    color: COLORS.accentRed,
    border: `4px solid ${COLORS.accentRed}`,
    padding: '8px 24px',
    opacity: 0.8,
    pointerEvents: 'none',
    zIndex: 10,
  },
  voidConfirm: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
  },
  voidLink: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '12px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  formPanel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '400px',
    height: '100vh',
    backgroundColor: COLORS.bg,
    borderLeft: `3px solid ${COLORS.text}`,
    zIndex: 200,
    padding: '32px',
    overflowY: 'auto',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s ease',
    WebkitOverflowScrolling: 'touch',
  },
  formPanelOpen: {
    transform: 'translateX(0)',
  },
  formOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(13, 13, 13, 0.3)',
    zIndex: 199,
  },
  formTitle: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '36px',
    marginBottom: '32px',
    borderBottom: `3px solid ${COLORS.text}`,
    paddingBottom: '8px',
  },
  formGroup: {
    marginBottom: '24px',
  },
  formLabel: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '14px',
    letterSpacing: '1px',
    marginBottom: '8px',
    display: 'block',
  },
  formInput: {
    width: '100%',
    border: 'none',
    borderBottom: `2px solid ${COLORS.text}`,
    backgroundColor: 'transparent',
    fontFamily: '"Courier Prime", monospace',
    fontSize: '16px',
    padding: '12px 0',
    outline: 'none',
    boxSizing: 'border-box',
  },
  formSelect: {
    width: '100%',
    border: 'none',
    borderBottom: `2px solid ${COLORS.text}`,
    backgroundColor: 'transparent',
    fontFamily: '"Courier Prime", monospace',
    fontSize: '16px',
    padding: '12px 0',
    outline: 'none',
    boxSizing: 'border-box',
  },
  typeToggle: {
    display: 'flex',
    gap: '0',
    marginBottom: '8px',
  },
  typeButton: {
    flex: 1,
    padding: '14px',
    border: `2px solid ${COLORS.text}`,
    backgroundColor: 'transparent',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '16px',
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderRadius: 0,
  },
  typeButtonActive: {
    backgroundColor: COLORS.text,
    color: COLORS.bg,
  },
  typeButtonExpense: {
    border: `2px solid ${COLORS.accentRed}`,
    color: COLORS.accentRed,
  },
  typeButtonExpenseActive: {
    border: `2px solid ${COLORS.accentRed}`,
    backgroundColor: COLORS.accentRed,
    color: COLORS.bg,
  },
  submitButton: {
    width: '100%',
    padding: '18px',
    border: `3px solid ${COLORS.text}`,
    backgroundColor: COLORS.text,
    color: COLORS.bg,
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '24px',
    letterSpacing: '2px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginTop: '16px',
  },
  submitButtonHover: {
    transform: 'scale(0.98) rotate(-1deg)',
  },
  addTransactionButton: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '64px',
    height: '64px',
    border: `3px solid ${COLORS.text}`,
    backgroundColor: COLORS.bg,
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '32px',
    cursor: 'pointer',
    zIndex: 150,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  emptyState: {
    padding: '80px 32px',
    textAlign: 'center',
  },
  emptyStateTitle: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyStateLink: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
    color: COLORS.text,
  },
  mobileSidebar: {
    display: 'none',
  },
  sortArrow: {
    marginLeft: '4px',
    opacity: 0.5,
  },
  loadingState: {
    padding: '80px 32px',
    textAlign: 'center',
  },
  loadingText: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '24px',
    letterSpacing: '2px',
  },
  errorState: {
    padding: '80px 32px',
    textAlign: 'center',
    color: COLORS.accentRed,
  },
  errorTitle: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '32px',
    marginBottom: '16px',
  },
  retryButton: {
    padding: '12px 24px',
    border: `2px solid ${COLORS.text}`,
    backgroundColor: 'transparent',
    fontFamily: '"Courier Prime", monospace',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '16px',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function CategoryBadge({ code, size = 'normal' }) {
  const badgeStyle = size === 'small' ? styles.categoryBadgeSmall : styles.categoryBadge;
  return (
    <div style={badgeStyle}>{code}</div>
  );
}

function Sidebar({ state, dispatch, categoryTotals }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const maxTotal = Math.max(...Object.values(categoryTotals.expense), 1);

  return (
    <aside style={styles.sidebar}>
      <div style={styles.sidebarTitle}>INDEX</div>
      {CATEGORIES.map((cat) => {
        const expenseTotal = categoryTotals.expense[cat.name] || 0;
        const percentage = (expenseTotal / maxTotal) * 100;
        const isSelected = state.selectedCategory === cat.name;

        return (
          <div
            key={cat.name}
            style={{
              ...styles.categoryItem,
              backgroundColor: isSelected ? COLORS.accentYellow : 'transparent',
              border: isSelected ? `2px solid ${COLORS.text}` : 'none',
            }}
            onClick={() => dispatch({ type: 'SET_CATEGORY_FILTER', payload: cat.name })}
            onMouseEnter={() => setHoveredCategory(cat.name)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div style={styles.categoryHeader}>
              <CategoryBadge code={cat.code} />
              <span style={styles.categoryName}>{cat.name}</span>
              <span style={{ ...styles.categoryAmount, color: COLORS.accentRed }}>
                -₹{formatCurrency(expenseTotal)}
              </span>
            </div>
            <div style={styles.categoryBar}>
              <div
                style={{
                  ...styles.categoryBarFill,
                  width: `${percentage}%`,
                  backgroundColor: hoveredCategory === cat.name ? COLORS.accentRed : COLORS.text,
                }}
              />
            </div>
          </div>
        );
      })}
    </aside>
  );
}

function SummaryBar({ income, expenses, balance, isMobileView }) {
  return (
    <div
      style={{
        ...styles.summaryBar,
        gap: isMobileView ? '16px' : styles.summaryBar.gap,
        padding: isMobileView ? '16px' : styles.summaryBar.padding,
        justifyContent: isMobileView ? 'space-between' : styles.summaryBar.justifyContent,
      }}
    >
      <div style={styles.summaryItem}>
        <div
          style={{
            ...styles.summaryValue,
            color: COLORS.text,
            fontSize: isMobileView ? '28px' : styles.summaryValue.fontSize,
          }}
        >
          ₹{formatCurrency(income)}
        </div>
        <div style={styles.summaryLabel}>INCOME</div>
      </div>
      <div style={styles.summaryItem}>
        <div
          style={{
            ...styles.summaryValue,
            color: COLORS.accentRed,
            fontSize: isMobileView ? '28px' : styles.summaryValue.fontSize,
          }}
        >
          ₹{formatCurrency(expenses)}
        </div>
        <div style={styles.summaryLabel}>EXPENSES</div>
      </div>
      <div style={styles.summaryItem}>
        <div
          style={{
            ...styles.summaryValue,
            fontSize: isMobileView ? '28px' : styles.summaryValue.fontSize,
            color: balance >= 0 ? COLORS.accentYellow : COLORS.accentRed,
            textShadow: balance >= 0 ? '0 0 1px #0D0D0D' : 'none',
          }}
        >
          ₹{formatCurrency(Math.abs(balance))}
        </div>
        <div style={styles.summaryLabel}>BALANCE</div>
      </div>
    </div>
  );
}

function FilterBar({ state, dispatch, isMobileView, transactions }) {
  const handleSearchChange = (query) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const handleSearchClear = () => {
    dispatch({ type: 'CLEAR_SEARCH' });
  };

  return (
    <div
      style={{
        ...styles.filterBar,
        padding: isMobileView ? '12px 10px' : styles.filterBar.padding,
        gap: isMobileView ? '8px' : styles.filterBar.gap,
        flexDirection: isMobileView ? 'column' : 'row',
        alignItems: isMobileView ? 'stretch' : 'center',
      }}
    >
      {/* Search Bar */}
      <SearchBar
        value={state.searchQuery}
        onChange={handleSearchChange}
        onClear={handleSearchClear}
        placeholder="Search transactions..."
        isMobileView={isMobileView}
      />
      
      {/* Export Button */}
      <ExportButton transactions={transactions} isMobileView={isMobileView} />
      
      {/* Category Filters - Scrollable on mobile */}
      <div
        style={{
          display: 'flex',
          gap: isMobileView ? '6px' : '8px',
          overflowX: isMobileView ? 'auto' : 'visible',
          paddingBottom: isMobileView ? '8px' : 0,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <button
          style={{
            ...styles.filterStamp,
            padding: isMobileView ? '7px 10px' : styles.filterStamp.padding,
            fontSize: isMobileView ? '12px' : styles.filterStamp.fontSize,
            ...(state.selectedCategory === null ? styles.filterStampActive : {}),
            flexShrink: 0,
          }}
          onClick={() => dispatch({ type: 'SET_CATEGORY_FILTER', payload: null })}
        >
          ALL
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            style={{
              ...styles.filterStamp,
              padding: isMobileView ? '7px 10px' : styles.filterStamp.padding,
              fontSize: isMobileView ? '12px' : styles.filterStamp.fontSize,
              ...(state.selectedCategory === cat.name ? styles.filterStampActive : {}),
              flexShrink: 0,
            }}
            onClick={() => dispatch({ type: 'SET_CATEGORY_FILTER', payload: cat.name })}
          >
            {cat.code} {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function TransactionTable({ state, dispatch, runningBalances, isMobileView }) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editForm, setEditForm] = useState({});

  const sortedTransactions = useMemo(() => {
    // Use search results if available, otherwise use regular transactions
    let filtered = state.searchResults !== null ? [...state.searchResults] : [...state.transactions];

    // Apply category filter only if not searching
    if (state.selectedCategory && state.searchResults === null) {
      filtered = filtered.filter(t => t.category === state.selectedCategory);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (state.sortColumn) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        default:
          comparison = 0;
      }
      return state.sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [state.transactions, state.searchResults, state.selectedCategory, state.sortColumn, state.sortDirection]);

  const handleSort = (column) => {
    dispatch({ type: 'SET_SORT', payload: column });
  };

  const getSortArrow = (column) => {
    if (state.sortColumn !== column) return '↕';
    return state.sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction.id);
    setEditForm({ ...transaction });
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await transactionAPI.update(editForm.id, editForm);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: updated });
      setEditingTransaction(null);
    } catch (error) {
      console.error('Failed to update transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update transaction' });
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditForm({});
  };

  const handleDeleteConfirm = async () => {
    try {
      await transactionAPI.delete(state.pendingDelete);
      dispatch({ type: 'DELETE_TRANSACTION', payload: state.pendingDelete });
    } catch (error) {
      // In serverless deployments or with Supabase, an already-deleted record can return 404/not found.
      // If the error message contains "not found", treat it as success (record is already deleted).
      if (error.status === 404 || (error.message && error.message.toLowerCase().includes('not found'))) {
        dispatch({ type: 'DELETE_TRANSACTION', payload: state.pendingDelete });
        return;
      }

      console.error('Failed to delete transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete transaction' });
      dispatch({ type: 'SET_PENDING_DELETE', payload: null });
    }
  };

  const handleDeleteCancel = () => {
    dispatch({ type: 'SET_PENDING_DELETE', payload: null });
  };

  const getCategoriesForType = (type) => {
    return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  };

  // Mobile card view for transactions
  const renderMobileCards = () => {
    if (sortedTransactions.length === 0) {
      return (
        <div style={{ ...styles.emptyState, padding: '40px 16px' }}>
          <div style={{ ...styles.emptyStateTitle, fontSize: '32px' }}>NO ENTRIES YET</div>
          <div
            style={styles.emptyStateLink}
            onClick={() => dispatch({ type: 'OPEN_FORM' })}
          >
            ADD YOUR FIRST TRANSACTION →
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '0 8px 8px' }}>
        {sortedTransactions.map((transaction, index) => {
          const categoryList = getCategoriesForType(transaction.type);
          const category = categoryList.find(c => c.name === transaction.category);
          const isExpense = transaction.type === 'expense';
          const isExpanded = state.expandedRow === transaction.id;
          const isPendingDelete = state.pendingDelete === transaction.id;
          const isEditing = editingTransaction === transaction.id;

          return (
            <div
              key={transaction.id}
              style={{
                backgroundColor: COLORS.bgAlt,
                border: `2px solid ${COLORS.text}`,
                marginBottom: '8px',
                position: 'relative',
              }}
            >
              {isPendingDelete && (
                <div style={{
                  ...styles.voidStamp,
                  fontSize: '48px',
                  top: '50%',
                  left: '50%',
                }}>VOID</div>
              )}

              {/* Card header - always visible */}
              <div
                style={{
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                }}
                onClick={() => !isPendingDelete && !isEditing && dispatch({ type: 'EXPAND_ROW', payload: transaction.id })}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <CategoryBadge code={category?.code || '?'} size="small" />
                    <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '14px' }}>
                      {transaction.category}
                    </span>
                  </div>
                  <div style={{ fontFamily: '"Courier Prime", monospace', fontSize: '12px', opacity: 0.7 }}>
                    {transaction.date}
                  </div>
                  <div style={{ fontFamily: '"Courier Prime", monospace', fontSize: '13px', marginTop: '4px' }}>
                    {transaction.description}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: '"Courier Prime", monospace',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: isExpense ? COLORS.accentRed : COLORS.text,
                  }}>
                    {isExpense ? '-' : '+'}₹{formatCurrency(transaction.amount)}
                  </div>
                  <button
                    style={{ ...styles.deleteButton, marginTop: '8px', opacity: 0.5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'SET_PENDING_DELETE', payload: transaction.id });
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && !isPendingDelete && (
                <div style={{ ...styles.expandedRow, borderTop: `2px solid ${COLORS.text}` }}>
                  {isEditing ? (
                    <>
                      <div style={styles.expandedField}>
                        <span style={styles.expandedLabel}>DATE</span>
                        <input
                          style={styles.expandedInput}
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        />
                      </div>
                      <div style={styles.expandedField}>
                        <span style={styles.expandedLabel}>TYPE</span>
                        <select
                          style={styles.expandedInput}
                          value={editForm.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const defaultCat = getCategoriesForType(newType)[0].name;
                            setEditForm({ ...editForm, type: newType, category: defaultCat });
                          }}
                        >
                          <option value="income">INCOME</option>
                          <option value="expense">EXPENSE</option>
                        </select>
                      </div>
                      <div style={styles.expandedField}>
                        <span style={styles.expandedLabel}>CATEGORY</span>
                        <select
                          style={styles.expandedInput}
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        >
                          {getCategoriesForType(editForm.type).map((cat) => (
                            <option key={cat.name} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.expandedField}>
                        <span style={styles.expandedLabel}>DESCRIPTION</span>
                        <input
                          style={styles.expandedInput}
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                      </div>
                      <div style={styles.expandedField}>
                        <span style={styles.expandedLabel}>AMOUNT</span>
                        <input
                          style={styles.expandedInput}
                          type="number"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                        <button style={{ ...styles.saveButton, flex: 1 }} onClick={handleSaveEdit}>
                          SAVE
                        </button>
                        <button
                          style={{ ...styles.saveButton, borderColor: COLORS.accentRed, color: COLORS.accentRed, flex: 1 }}
                          onClick={handleCancelEdit}
                        >
                          CANCEL
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={styles.expandedField}>
                        <span style={styles.expandedLabel}>TYPE</span>
                        <span style={{ fontFamily: '"Courier Prime", monospace', textTransform: 'uppercase' }}>
                          {transaction.type}
                        </span>
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <button
                          style={{ ...styles.saveButton, width: '100%' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(transaction);
                          }}
                        >
                          EDIT
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Delete confirmation */}
              {isPendingDelete && (
                <div style={{ padding: '12px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <span
                    style={{ ...styles.voidLink, color: COLORS.accentRed, fontWeight: 'bold' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConfirm();
                    }}
                  >
                    CONFIRM DELETE
                  </span>
                  <span
                    style={{ ...styles.voidLink, fontWeight: 'bold' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCancel();
                    }}
                  >
                    CANCEL
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Desktop table view
  const renderDesktopTable = () => {
    if (sortedTransactions.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateTitle}>NO ENTRIES YET</div>
          <div
            style={styles.emptyStateLink}
            onClick={() => dispatch({ type: 'OPEN_FORM' })}
          >
            ADD YOUR FIRST TRANSACTION →
          </div>
        </div>
      );
    }

    return (
      <table style={styles.table}>
        <thead style={styles.tableHeader}>
          <tr>
            <th
              style={styles.tableHeaderCell}
              onClick={() => handleSort('date')}
            >
              DATE <span style={styles.sortArrow}>{getSortArrow('date')}</span>
            </th>
            <th style={{ ...styles.tableHeaderCell, width: '50px' }}>#</th>
            <th
              style={styles.tableHeaderCell}
              onClick={() => handleSort('category')}
            >
              CATEGORY <span style={styles.sortArrow}>{getSortArrow('category')}</span>
            </th>
            <th
              style={styles.tableHeaderCell}
              onClick={() => handleSort('description')}
            >
              DESCRIPTION <span style={styles.sortArrow}>{getSortArrow('description')}</span>
            </th>
            <th
              style={{ ...styles.tableHeaderCell, textAlign: 'right' }}
              onClick={() => handleSort('amount')}
            >
              AMOUNT <span style={styles.sortArrow}>{getSortArrow('amount')}</span>
            </th>
            <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>BALANCE</th>
            <th style={{ ...styles.tableHeaderCell, width: '80px' }}></th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.map((transaction, index) => {
            const categoryList = getCategoriesForType(transaction.type);
            const category = categoryList.find(c => c.name === transaction.category);
            const isExpense = transaction.type === 'expense';
            const isAltRow = index % 2 === 1;
            const isExpanded = state.expandedRow === transaction.id;
            const isPendingDelete = state.pendingDelete === transaction.id;
            const isEditing = editingTransaction === transaction.id;
            const runningBalance = runningBalances[transaction.id] || 0;

            return (
              <React.Fragment key={transaction.id}>
                <tr
                  style={{
                    ...styles.tableRow,
                    ...(isAltRow ? styles.tableRowAlt : {}),
                    ...(hoveredRow === transaction.id && !isExpanded ? styles.tableRowHover : {}),
                    position: 'relative',
                  }}
                  onClick={() => !isPendingDelete && !isEditing && dispatch({ type: 'EXPAND_ROW', payload: transaction.id })}
                  onMouseEnter={() => setHoveredRow(transaction.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={{ ...styles.tableCell, position: 'relative' }}>
                    {isPendingDelete && <div style={styles.voidStamp}>VOID</div>}
                    <span style={styles.dateCell}>{transaction.date}</span>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={{ fontFamily: '"Courier Prime", monospace', fontSize: '12px' }}>{index + 1}</span>
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.categoryCell}>
                      <CategoryBadge code={category?.code || '?'} size="small" />
                      <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '14px' }}>
                        {transaction.category}
                      </span>
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={styles.descriptionCell}>{transaction.description}</span>
                  </td>
                  <td style={styles.tableCell}>
                    <div
                      style={{
                        ...styles.amountCell,
                        ...(isExpense ? styles.amountExpense : {}),
                      }}
                    >
                      {isExpense ? '-' : '+'}₹{formatCurrency(transaction.amount)}
                    </div>
                  </td>
                  <td style={styles.balanceCell}>₹{formatCurrency(runningBalance)}</td>
                  <td style={styles.tableCell}>
                    {!isPendingDelete && !isEditing && (
                      <button
                        style={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({ type: 'SET_PENDING_DELETE', payload: transaction.id });
                        }}
                        onMouseEnter={(e) => (e.target.style.opacity = 1)}
                        onMouseLeave={(e) => (e.target.style.opacity = 0.6)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    )}
                    {isPendingDelete && (
                      <div style={styles.voidConfirm}>
                        <span
                          style={{ ...styles.voidLink, color: COLORS.accentRed }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfirm();
                          }}
                        >
                          CONFIRM
                        </span>
                        <span
                          style={styles.voidLink}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCancel();
                          }}
                        >
                          CANCEL
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
                {isExpanded && !isPendingDelete && (
                  <tr>
                    <td colSpan={7} style={{ padding: 0, borderBottom: `2px solid ${COLORS.text}` }}>
                      <div style={{ ...styles.expandedRow, padding: '16px', backgroundColor: COLORS.bgAlt }}>
                        {isEditing ? (
                          <>
                            <div style={styles.expandedField}>
                              <span style={styles.expandedLabel}>DATE</span>
                              <input
                                style={styles.expandedInput}
                                type="date"
                                value={editForm.date}
                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              />
                            </div>
                            <div style={styles.expandedField}>
                              <span style={styles.expandedLabel}>TYPE</span>
                              <select
                                style={styles.expandedInput}
                                value={editForm.type}
                                onChange={(e) => {
                                  const newType = e.target.value;
                                  const defaultCat = getCategoriesForType(newType)[0].name;
                                  setEditForm({ ...editForm, type: newType, category: defaultCat });
                                }}
                              >
                                <option value="income">INCOME</option>
                                <option value="expense">EXPENSE</option>
                              </select>
                            </div>
                            <div style={styles.expandedField}>
                              <span style={styles.expandedLabel}>CATEGORY</span>
                              <select
                                style={styles.expandedInput}
                                value={editForm.category}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              >
                                {getCategoriesForType(editForm.type).map((cat) => (
                                  <option key={cat.name} value={cat.name}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div style={styles.expandedField}>
                              <span style={styles.expandedLabel}>DESCRIPTION</span>
                              <input
                                style={styles.expandedInput}
                                type="text"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              />
                            </div>
                            <div style={styles.expandedField}>
                              <span style={styles.expandedLabel}>AMOUNT</span>
                              <input
                                style={styles.expandedInput}
                                type="number"
                                value={editForm.amount}
                                onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div style={{ marginTop: '16px' }}>
                              <button style={styles.saveButton} onClick={handleSaveEdit}>
                                SAVE CHANGES
                              </button>
                              <button
                                style={{ ...styles.saveButton, borderColor: COLORS.accentRed, color: COLORS.accentRed }}
                                onClick={handleCancelEdit}
                              >
                                CANCEL
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={styles.expandedField}>
                              <span style={styles.expandedLabel}>DATE</span>
                              <span style={{ fontFamily: '"Courier Prime", monospace' }}>{transaction.date}</span>
                            </div>
                            <div style={styles.expandedField}>
                              <span style={styles.expandedLabel}>TYPE</span>
                              <span style={{ fontFamily: '"Courier Prime", monospace', textTransform: 'uppercase' }}>
                                {transaction.type}
                              </span>
                            </div>
                            <div style={styles.expandedField}>
                              <span style={styles.expandedLabel}>CATEGORY</span>
                              <span style={{ fontFamily: '"Courier Prime", monospace' }}>{transaction.category}</span>
                            </div>
                            <div style={styles.expandedField}>
                              <span style={styles.expandedLabel}>DESCRIPTION</span>
                              <span style={{ fontFamily: '"Courier Prime", monospace' }}>{transaction.description}</span>
                            </div>
                            <div style={styles.expandedField}>
                              <span style={styles.expandedLabel}>AMOUNT</span>
                              <span
                                style={{
                                  fontFamily: '"Courier Prime", monospace',
                                  color: isExpense ? COLORS.accentRed : COLORS.text,
                                }}
                              >
                                {isExpense ? '-' : '+'}₹{formatCurrency(transaction.amount)}
                              </span>
                            </div>
                            <div style={{ marginTop: '16px' }}>
                              <button
                                style={styles.saveButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(transaction);
                                }}
                              >
                                EDIT
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div style={styles.tableContainer}>
      {isMobileView ? renderMobileCards() : renderDesktopTable()}
    </div>
  );
}

function AddTransactionForm({ state, dispatch, onTransactionAdded, isMobileView, showToast }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: 'FOOD',
    description: '',
    amount: '',
    payment_method: 'cash',
    notes: '',
  });

  const getCategoriesForType = (type) => {
    return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  };

  const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'credit', label: 'Credit' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    dispatch({ type: 'SET_SUBMITTING', payload: true });

    const newTransaction = {
      date: formData.date,
      type: formData.type,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      month: getMonthKey(state.currentYear, state.currentMonth),
      payment_method: formData.payment_method,
      notes: formData.notes,
    };

    try {
      const created = await transactionAPI.create(newTransaction);
      dispatch({ type: 'ADD_TRANSACTION', payload: created });
      showToast('Transaction added successfully!', 'success');
      onTransactionAdded();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        category: 'FOOD',
        description: '',
        amount: '',
        payment_method: 'cash',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to create transaction:', error);
      showToast('Failed to add transaction', 'error');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create transaction' });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  const currentCategories = getCategoriesForType(formData.type);

  return (
    <>
      {state.isFormOpen && (
        <div
          style={{
            ...styles.formOverlay,
            zIndex: isMobileView ? 199 : styles.formOverlay.zIndex,
          }}
          onClick={() => dispatch({ type: 'CLOSE_FORM' })}
        />
      )}
      <div
        style={{
          ...styles.formPanel,
          width: isMobileView ? '100%' : styles.formPanel.width,
          padding: isMobileView ? '20px 16px 120px' : styles.formPanel.padding,
          ...(state.isFormOpen ? styles.formPanelOpen : {}),
        }}
      >
        {/* Close button for mobile */}
        {isMobileView && (
          <button
            onClick={() => dispatch({ type: 'CLOSE_FORM' })}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: `2px solid ${COLORS.text}`,
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        )}
        <h2
          style={{
            ...styles.formTitle,
            fontSize: isMobileView ? '30px' : styles.formTitle.fontSize,
            marginBottom: isMobileView ? '20px' : styles.formTitle.marginBottom,
            paddingRight: isMobileView ? '44px' : 0,
          }}
        >
          NEW ENTRY
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>DATE</label>
            <input
              style={styles.formInput}
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>TYPE</label>
            <div style={styles.typeToggle}>
              <button
                type="button"
                style={{
                  ...styles.typeButton,
                  ...(formData.type === 'income' ? styles.typeButtonActive : {}),
                }}
                onClick={() => {
                  setFormData({ ...formData, type: 'income', category: 'SALARY' });
                }}
              >
                INCOME
              </button>
              <button
                type="button"
                style={{
                  ...styles.typeButton,
                  ...(formData.type === 'expense' ? styles.typeButtonExpenseActive : styles.typeButtonExpense),
                }}
                onClick={() => {
                  setFormData({ ...formData, type: 'expense', category: 'FOOD' });
                }}
              >
                EXPENSE
              </button>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={{ ...styles.formLabel, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>CATEGORY</span>
              <span style={{ fontSize: '11px', opacity: 0.6, fontFamily: '"Courier Prime", monospace' }}>
                {formData.type === 'income' ? '💰 Income Source' : '💸 Expense Type'}
              </span>
            </label>
            <select
              style={styles.formSelect}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {currentCategories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>DESCRIPTION</label>
            <input
              style={styles.formInput}
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description..."
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>AMOUNT</label>
            <input
              style={styles.formInput}
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>PAYMENT METHOD</label>
            <select
              style={styles.formSelect}
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>NOTES (OPTIONAL)</label>
            <textarea
              style={{
                ...styles.formInput,
                minHeight: '80px',
                resize: 'vertical',
              }}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
            />
          </div>

          <button
            type="submit"
            disabled={state.isSubmitting}
            style={{
              ...styles.submitButton,
              ...(state.isSubmitting ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
            }}
            onMouseEnter={(e) => {
              if (!state.isSubmitting) e.target.style.transform = 'scale(0.98) rotate(-1deg)';
            }}
            onMouseLeave={(e) => {
              if (!state.isSubmitting) e.target.style.transform = 'none';
            }}
          >
            {state.isSubmitting ? 'STAMPING...' : 'STAMP IT'}
          </button>
        </form>
      </div>
    </>
  );
}

function MobileSidebar({ state, dispatch, categoryTotals }) {
  const maxTotal = Math.max(...Object.values(categoryTotals.expense), 1);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: COLORS.bg,
      borderTop: `3px solid ${COLORS.text}`,
      padding: '8px 0',
      display: 'flex',
      justifyContent: 'flex-start',
      gap: '4px',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      zIndex: 200,
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}>
      {/* All categories button */}
      <button
        onClick={() => dispatch({ type: 'SET_CATEGORY_FILTER', payload: null })}
        style={{
          background: 'none',
          border: `2px solid ${COLORS.text}`,
          backgroundColor: state.selectedCategory === null ? COLORS.accentYellow : 'transparent',
          padding: '6px 10px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          minWidth: '50px',
          flexShrink: 0,
          marginLeft: '8px',
        }}
      >
        <span style={{ fontSize: '14px', fontFamily: '"Bebas Neue", sans-serif' }}>ALL</span>
      </button>
      {CATEGORIES.map((cat) => {
        const expenseTotal = categoryTotals.expense[cat.name] || 0;
        const isSelected = state.selectedCategory === cat.name;

        return (
          <button
            key={cat.name}
            onClick={() => dispatch({ type: 'SET_CATEGORY_FILTER', payload: cat.name })}
            style={{
              background: 'none',
              border: `2px solid ${COLORS.text}`,
              backgroundColor: isSelected ? COLORS.accentYellow : 'transparent',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              minWidth: '50px',
              flexShrink: 0,
            }}
          >
            <CategoryBadge code={cat.code} size="small" />
            <span style={{ fontSize: '7px', fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.5px' }}>{cat.name}</span>
          </button>
        );
      })}
      {/* Spacer for the + button */}
      <div style={{ width: '70px', flexShrink: 0 }} />
    </div>
  );
}

function LoadingState() {
  return (
    <div style={styles.loadingState}>
      <div style={styles.loadingText}>LOADING LEDGER...</div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div style={styles.errorState}>
      <div style={styles.errorTitle}>⚠ ERROR</div>
      <div style={{ marginBottom: '16px' }}>{error}</div>
      <button style={styles.retryButton} onClick={onRetry}>
        RETRY
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [formHovered, setFormHovered] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [dbConnected, setDbConnected] = useState(null); // null = checking, true = connected, false = error
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });
  const [toast, setToast] = useState(null); // { message, type }

  useEffect(() => {
    const updateViewport = () => setIsMobileView(window.innerWidth <= 768);

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Health check on initial load
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await healthCheck();
        setDbConnected(health !== null);
        if (health === null) {
          setApiError('Database connection failed. Please check your Supabase configuration.');
        }
      } catch (error) {
        setDbConnected(false);
        setApiError('Database connection failed. Please check your Supabase configuration.');
      }
    };

    checkHealth();
  }, []);

  // Load transactions when month/year changes
  useEffect(() => {
    const loadTransactions = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const monthKey = getMonthKey(state.currentYear, state.currentMonth);
        const transactions = await transactionAPI.getAll(monthKey);
        dispatch({ type: 'LOAD_TRANSACTIONS', payload: transactions });
        setApiError(null);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        setApiError(error.message);
      }
    };

    loadTransactions();
  }, [state.currentYear, state.currentMonth]);

  // Search functionality with debounce
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (state.searchQuery && state.searchQuery.trim().length >= 2) {
        try {
          const monthKey = getMonthKey(state.currentYear, state.currentMonth);
          const results = await searchAPI.search(state.searchQuery, monthKey);
          dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
        } catch (error) {
          console.error('Search failed:', error);
        }
      } else if (state.searchQuery === '') {
        dispatch({ type: 'CLEAR_SEARCH' });
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [state.searchQuery, state.currentYear, state.currentMonth]);

  // Calculate category totals
  const categoryTotals = useMemo(() => {
    const income = {};
    const expense = {};

    CATEGORIES.forEach((cat) => {
      income[cat.name] = 0;
      expense[cat.name] = 0;
    });

    state.transactions.forEach((t) => {
      if (t.type === 'income') {
        income[t.category] = (income[t.category] || 0) + t.amount;
      } else {
        expense[t.category] = (expense[t.category] || 0) + t.amount;
      }
    });

    return { income, expense };
  }, [state.transactions]);

  // Calculate summary totals
  const summary = useMemo(() => {
    const income = state.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = state.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;

    return { income, expenses, balance };
  }, [state.transactions]);

  // Calculate running balances for each transaction
  const runningBalances = useMemo(() => {
    const balances = {};
    let runningBalance = 0;

    // Sort by date ASC for correct running balance calculation
    // (oldest transactions first, so balance accumulates correctly)
    const sorted = [...state.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach((t) => {
      if (t.type === 'income') {
        runningBalance += t.amount;
      } else {
        runningBalance -= t.amount;
      }
      balances[t.id] = runningBalance;
    });

    return balances;
  }, [state.transactions]);

  const handlePrevMonth = useCallback(() => {
    let newMonth = state.currentMonth - 1;
    let newYear = state.currentYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    dispatch({ type: 'SET_MONTH', payload: { month: newMonth, year: newYear } });
  }, [state.currentMonth, state.currentYear]);

  const handleNextMonth = useCallback(() => {
    let newMonth = state.currentMonth + 1;
    let newYear = state.currentYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    dispatch({ type: 'SET_MONTH', payload: { month: newMonth, year: newYear } });
  }, [state.currentMonth, state.currentYear]);

  const isCurrentMonth = () => {
    const now = new Date();
    return state.currentYear === now.getFullYear() && state.currentMonth === now.getMonth();
  };

  const handleRetry = () => {
    setApiError(null);
    dispatch({ type: 'SET_LOADING', payload: true });
    const monthKey = getMonthKey(state.currentYear, state.currentMonth);
    transactionAPI.getAll(monthKey)
      .then(transactions => {
        dispatch({ type: 'LOAD_TRANSACTIONS', payload: transactions });
      })
      .catch(error => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        setApiError(error.message);
      });
  };

  const handleTransactionAdded = () => {
    // Reload transactions to ensure data consistency
    const monthKey = getMonthKey(state.currentYear, state.currentMonth);
    transactionAPI.getAll(monthKey)
      .then(transactions => {
        dispatch({ type: 'LOAD_TRANSACTIONS', payload: transactions });
      })
      .catch(console.error);
  };

  if (dbConnected === null) {
    // Still checking health
    return (
      <div style={styles.app}>
        <div style={styles.grainOverlay} />
        <div style={styles.gridPattern} />
        <LoadingState />
      </div>
    );
  }

  if (apiError && state.transactions.length === 0) {
    return (
      <div style={styles.app}>
        <div style={styles.grainOverlay} />
        <div style={styles.gridPattern} />
        <ErrorState error={apiError} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* Grain texture overlay */}
      <div style={styles.grainOverlay} />

      {/* Dot grid pattern */}
      <div style={styles.gridPattern} />

      <div style={styles.container}>
        {/* Desktop Sidebar */}
        {!isMobileView && <Sidebar state={state} dispatch={dispatch} categoryTotals={categoryTotals} />}

        {/* Main Content */}
        <main
          style={{
            ...styles.mainContent,
            marginLeft: isMobileView ? 0 : styles.mainContent.marginLeft,
            paddingBottom: isMobileView ? '100px' : 0,
            width: isMobileView ? '100%' : 'auto',
          }}
        >
          {/* Header */}
          <header
            style={{
              ...styles.header,
              padding: isMobileView ? '14px 16px' : styles.header.padding,
              flexDirection: isMobileView ? 'column' : 'row',
              alignItems: isMobileView ? 'flex-start' : styles.header.alignItems,
              gap: isMobileView ? '12px' : 0,
            }}
          >
            <h1
              style={{
                ...styles.headerTitle,
                fontSize: isMobileView ? '48px' : styles.headerTitle.fontSize,
                letterSpacing: isMobileView ? '2px' : styles.headerTitle.letterSpacing,
              }}
            >
              LEDGER
            </h1>

            <div
              style={{
                ...styles.headerMonth,
                width: isMobileView ? '100%' : 'auto',
                justifyContent: isMobileView ? 'space-between' : 'flex-start',
                fontSize: isMobileView ? '18px' : styles.headerMonth.fontSize,
              }}
            >
              <div style={styles.monthNav}>
                <button
                  style={styles.monthNavButton}
                  onClick={handlePrevMonth}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = COLORS.text)}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                  ←
                </button>
              </div>
              <span>
                {getMonthName(state.currentMonth)} {state.currentYear}
              </span>
              <div style={styles.monthNav}>
                <button
                  onClick={handleNextMonth}
                  disabled={isCurrentMonth()}
                  onMouseEnter={(e) => {
                    if (!isCurrentMonth()) e.target.style.backgroundColor = COLORS.text;
                  }}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                  style={{
                    ...styles.monthNavButton,
                    opacity: isCurrentMonth() ? 0.3 : 1,
                    cursor: isCurrentMonth() ? 'default' : 'pointer',
                  }}
                >
                  →
                </button>
              </div>
            </div>
          </header>

          {/* Summary Bar */}
          <SummaryBar
            income={summary.income}
            expenses={summary.expenses}
            balance={summary.balance}
            isMobileView={isMobileView}
          />

          {/* Filter Bar */}
          <FilterBar 
            state={state} 
            dispatch={dispatch} 
            isMobileView={isMobileView} 
            transactions={state.transactions}
          />

          {/* Transaction Table */}
          <TransactionTable
            state={state}
            dispatch={dispatch}
            runningBalances={runningBalances}
            isMobileView={isMobileView}
          />
        </main>
      </div>

      {/* Add Transaction Button */}
      <button
        style={{
          ...styles.addTransactionButton,
          width: isMobileView ? '56px' : styles.addTransactionButton.width,
          height: isMobileView ? '56px' : styles.addTransactionButton.height,
          fontSize: isMobileView ? '28px' : styles.addTransactionButton.fontSize,
          right: isMobileView ? '16px' : styles.addTransactionButton.right,
          bottom: isMobileView ? '108px' : styles.addTransactionButton.bottom,
          borderRadius: isMobileView ? '50%' : 0,
          ...(formHovered ? { backgroundColor: COLORS.text, color: COLORS.bg } : {}),
        }}
        onClick={() => dispatch({ type: 'OPEN_FORM' })}
        onMouseEnter={() => setFormHovered(true)}
        onMouseLeave={() => setFormHovered(false)}
      >
        +
      </button>

      {/* Add Transaction Form Panel */}
      <AddTransactionForm
        state={state}
        dispatch={dispatch}
        onTransactionAdded={handleTransactionAdded}
        isMobileView={isMobileView}
        showToast={(message, type) => setToast({ message, type })}
      />

      {/* Mobile Sidebar (Bottom Tab Bar) */}
      {isMobileView && (
        <MobileSidebar state={state} dispatch={dispatch} categoryTotals={categoryTotals} />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* SVG Filters for noise */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
      </svg>
    </div>
  );
}

export default App;
