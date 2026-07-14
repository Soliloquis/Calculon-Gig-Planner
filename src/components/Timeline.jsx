import React, { useState, useRef, useEffect } from 'react';

export default function Timeline({ timeline, selectedMonthKey, onSelectMonth, dragAndDrop, summary, project }) {
  const [dragOverCell, setDragOverCell] = useState(null); // 'monthKey-day'
  const scrollContainerRef = useRef(null);
  
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayDay = today.getDate();
  const todayMonthKey = `${todayYear}-${todayMonth}`;

  // Scroll active month into view on load
  useEffect(() => {
    if (selectedMonthKey && scrollContainerRef.current) {
      const activeBoard = scrollContainerRef.current.querySelector(`.month-board[data-key="${selectedMonthKey}"]`);
      if (activeBoard) {
        const container = scrollContainerRef.current;
        const boardOffset = activeBoard.offsetLeft;
        const boardWidth = activeBoard.clientWidth;
        const containerWidth = container.clientWidth;
        
        container.scrollTo({
          left: boardOffset - containerWidth / 2 + boardWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedMonthKey]);

  const handleDragEnter = (e, cellId) => {
    e.preventDefault();
    setDragOverCell(cellId);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e, monthKey, day) => {
    setDragOverCell(null);
    dragAndDrop.onDrop(e, monthKey, day);
  };

  const formatCostText = (val) => {
    if (val >= 1000) {
      const kVal = val / 1000;
      return kVal % 1 === 0 ? `${kVal}k` : `${kVal.toFixed(1)}k`;
    }
    return String(val);
  };

  // Weekdays header array
  const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="timeline-section glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Project Timeline Boards ({timeline.length} Months)</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            📅 Click a month to inspect breakdowns. Drag a colored expense pill and drop it on any day cell to reschedule.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft -= 320;
            }}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            ◀ Left
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft += 320;
            }}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            Right ▶
          </button>
        </div>
      </div>

      <div className="timeline-scroll-container" ref={scrollContainerRef}>
        {timeline.map(month => {
          const isActive = month.month === selectedMonthKey;
          const isDeficit = month.hasDeficit;

          // Parse calendar parameters for this month
          const [yearStr, monthStr] = month.month.split('-');
          const year = parseInt(yearStr, 10);
          const monthIndex = parseInt(monthStr, 10) - 1;
          
          // Day of week index for Day 1 (0 = Sunday, 6 = Saturday)
          const firstDayIndex = new Date(year, monthIndex, 1).getDay();
          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

          // Construct calendar grid cells
          const cells = [];
          
          // 1. Offset blank cells
          for (let i = 0; i < firstDayIndex; i++) {
            cells.push({ isEmpty: true });
          }
          
          // 2. Calendar day cells
          for (let day = 1; day <= daysInMonth; day++) {
            const dayExpenses = month.expenses.filter(e => e.day === day);
            cells.push({
              isEmpty: false,
              day,
              expenses: dayExpenses
            });
          }

          // Format month name header
          const dateObj = new Date(year, monthIndex, 1);
          const monthHeaderLabel = dateObj.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase();

          return (
            <div
              key={month.month}
              className={`month-board ${isActive ? 'active' : ''} ${isDeficit ? 'deficit' : 'healthy'}`}
              onClick={() => onSelectMonth(month.month)}
              data-key={month.month}
            >
              {/* Header: Name & Month Expenses */}
              <div className="month-board-header">
                <div className="month-board-name">{monthHeaderLabel}</div>
                <div className="month-board-cost">
                  {summary.currencySymbol}{Math.round(month.effectiveExpenses).toLocaleString()}
                </div>
              </div>

              {/* Mini Calendar Days Grid */}
              <div className="calendar-grid">
                {/* Weekday Initials */}
                <div className="calendar-weekdays">
                  {WEEKDAYS.map((dayLabel, idx) => (
                    <div key={idx} className="weekday-header">{dayLabel}</div>
                  ))}
                </div>

                {/* Day Cells */}
                <div className="calendar-days-grid">
                  {cells.map((cell, idx) => {
                    if (cell.isEmpty) {
                      return <div key={`empty-${idx}`} className="day-cell empty" />;
                    }

                    const cellId = `${month.month}-${cell.day}`;
                    const isOver = cellId === dragOverCell;
                    const isToday = month.month === todayMonthKey && cell.day === todayDay;

                    return (
                      <div
                        key={`day-${cell.day}`}
                        className={`day-cell ${isOver ? 'drag-over' : ''} ${isToday ? 'current-day' : ''}`}
                        onDragOver={(e) => dragAndDrop.onDragOver(e)}
                        onDragEnter={(e) => handleDragEnter(e, cellId)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, month.month, cell.day)}
                        title={`Day ${cell.day} - ${month.label}${isToday ? ' (Today)' : ''}`}
                      >
                        <span className="day-cell-number">{cell.day}</span>
                        
                        {/* Render daily expenses stacked */}
                        {cell.expenses.map(exp => {
                          const cat = project.categories.find(c => c.id === exp.category) || { color: '#6b7280', icon: '📦' };
                          const costVal = exp.isPaid ? exp.actualAmount : exp.plannedAmount;
                          return (
                            <div
                              key={exp.id}
                              className="expense-block-pill"
                              draggable="true"
                              onDragStart={(e) => dragAndDrop.onDragStart(e, exp.id, month.month)}
                              onDragEnd={(e) => dragAndDrop.onDragEnd(e)}
                              style={{ backgroundColor: cat.color }}
                              title={`${exp.description}: ${summary.currencySymbol}${costVal}`}
                            >
                              {cat.icon} {formatCostText(costVal)}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
