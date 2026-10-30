import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export function MonthSelector({
  selectedYear,
  selectedMonth,
  onSelectMonth,
  availableMonths = []
}) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentCalendarDate = new Date();
  const currentCalendarYear = currentCalendarDate.getFullYear();
  const currentCalendarMonth = currentCalendarDate.getMonth() + 1;

  // Ensure the currently selected month is included in the dropdown options
  const displayMonths = React.useMemo(() => {
    if (!selectedYear || !selectedMonth) return availableMonths;
    const exists = availableMonths.some(
      (m) => Number(m.year) === Number(selectedYear) && Number(m.month) === Number(selectedMonth)
    );
    if (!exists) {
      return [
        {
          year: selectedYear,
          month: selectedMonth,
          label: `${monthNames[selectedMonth - 1]} ${selectedYear}`,
          count: 0
        },
        ...availableMonths
      ];
    }
    return availableMonths;
  }, [availableMonths, selectedYear, selectedMonth, monthNames]);

  // Find index of currently selected month in displayMonths
  const currentIndex = displayMonths.findIndex(
    (m) => Number(m.year) === Number(selectedYear) && Number(m.month) === Number(selectedMonth)
  );

  const canGoPrevious = currentIndex >= 0 && currentIndex < displayMonths.length - 1;
  const canGoNext = currentIndex > 0;

  const handlePrevious = () => {
    if (canGoPrevious) {
      const prev = displayMonths[currentIndex + 1];
      onSelectMonth(prev.year, prev.month);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      const next = displayMonths[currentIndex - 1];
      onSelectMonth(next.year, next.month);
    }
  };

  const isCurrentMonth =
    Number(selectedYear) === currentCalendarYear && Number(selectedMonth) === currentCalendarMonth;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-full)',
        padding: '4px 10px',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' }}>
        <Calendar size={15} color="#818cf8" />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
          Month:
        </span>
      </div>

      {/* Dropdown for Month Selection */}
      <select
        id="month-selector-dropdown"
        aria-label="Select active timeframe month"
        value={`${selectedYear}-${selectedMonth}`}
        onChange={(e) => {
          const [yr, mo] = e.target.value.split('-').map(Number);
          onSelectMonth(yr, mo);
        }}
        style={{
          backgroundColor: 'transparent',
          color: '#38bdf8',
          border: 'none',
          outline: 'none',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: '4px'
        }}
      >
        {displayMonths.map((m) => (
          <option
            key={`${m.year}-${m.month}`}
            value={`${m.year}-${m.month}`}
            style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
          >
            {m.label || `${monthNames[m.month - 1]} ${m.year}`} ({m.count} txns)
          </option>
        ))}
      </select>

      {/* Prev / Next Arrows */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className="icon-btn"
          style={{ width: '24px', height: '24px', opacity: canGoPrevious ? 1 : 0.3 }}
          title="Previous Recorded Month"
          aria-label="Previous Month"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className="icon-btn"
          style={{ width: '24px', height: '24px', opacity: canGoNext ? 1 : 0.3 }}
          title="Next Recorded Month"
          aria-label="Next Month"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Quick Jump to Current Calendar Month if different */}
      {!isCurrentMonth && (
        <button
          onClick={() => onSelectMonth(currentCalendarYear, currentCalendarMonth)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            padding: '2px 8px',
            borderRadius: '999px',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            cursor: 'pointer',
            fontWeight: 600
          }}
          title={`Jump to Current Calendar Month (${monthNames[currentCalendarMonth - 1]} ${currentCalendarYear})`}
        >
          <Clock size={11} />
          <span>Jump to Today</span>
        </button>
      )}
    </div>
  );
}
