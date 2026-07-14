import React from 'react';

export default function Dashboard({
  summary,
  timeline,
  annualSummary,
  selectedMonthKey,
  onSelectMonth,
  project,
  updateProjectMeta
}) {
  const {
    totalAllocatedIncome,
    totalInjections,
    totalIncome,
    totalPlannedExpenses,
    totalActualSpent,
    currentBalance,
    deficitsCount,
    currencySymbol
  } = summary;

  const formatVal = (val) => {
    return `${currencySymbol}${Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const deficitMonths = timeline.filter(m => m.hasDeficit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. Global Deficits Alert */}
      {deficitsCount > 0 && (
        <div className="timeline-deficits-alert">
          <div>
            <strong>⚠️ Cash Flow Deficits:</strong> There are <strong>{deficitsCount}</strong> months projected to hit a negative balance. Reschedule future expenses or increase base funding.
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Jump to:</span>
            {deficitMonths.slice(0, 6).map(m => (
              <button
                key={m.month}
                onClick={() => onSelectMonth(m.month)}
                style={{
                  background: 'rgba(244, 63, 94, 0.25)',
                  border: '1px solid rgba(244, 63, 94, 0.5)',
                  borderRadius: '4px',
                  color: '#fff',
                  padding: '3px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {m.simpleLabel} '{String(m.year).slice(-2)}
              </button>
            ))}
            {deficitMonths.length > 6 && (
              <span style={{ fontSize: '12px' }}>+{deficitMonths.length - 6} more</span>
            )}
          </div>
        </div>
      )}

      {/* 2. Top-level KPIs Dashboard */}
      <div className="metrics-grid">
        {/* Project-wide flat funding card */}
        <div className="metric-card">
          <div className="metric-label">Flat Monthly Allocation</div>
          <div className="input-wrapper" style={{ margin: '4px 0' }}>
            <span className="input-prefix" style={{ color: 'var(--text-main)', fontSize: '18px', left: '0' }}>{currencySymbol}</span>
            <input
              type="number"
              className="form-input"
              value={project.defaultMonthlyAllocation}
              onChange={(e) => updateProjectMeta({ defaultMonthlyAllocation: Number(e.target.value) || 0 })}
              style={{
                fontSize: '18px',
                fontWeight: '700',
                padding: '2px 2px 2px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '0',
                width: '120px',
                color: '#fff'
              }}
            />
          </div>
          <div className="metric-sub">Project-wide flat allocation</div>
        </div>

        {/* Total Project Costs (Planned vs Spent) */}
        <div className="metric-card">
          <div className="metric-label">Total Planned Expenses</div>
          <div className="metric-value" style={{ color: 'var(--color-primary)' }}>
            {formatVal(totalPlannedExpenses)}
          </div>
          <div className="metric-sub">Timeline planned project cost</div>
        </div>

        <div className="metric-card success">
          <div className="metric-label">Actual Spent To-Date</div>
          <div className="metric-value" style={{ color: 'var(--color-success)' }}>
            {formatVal(totalActualSpent)}
          </div>
          <div className="metric-sub">Closed months + paid items</div>
        </div>

        {/* Projections Card */}
        <div className={`metric-card ${currentBalance < 0 ? 'danger' : 'success'}`}>
          <div className="metric-label">Projected Final Balance</div>
          <div className={`metric-value ${currentBalance < 0 ? 'pulse-animation' : ''}`} style={{ color: currentBalance < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {formatVal(currentBalance)}
          </div>
          <div className="metric-sub">
            {currentBalance < 0 ? '🔴 Over budget deficit' : '🟢 Solved & funded cashflow'}
          </div>
        </div>
      </div>

    </div>
  );
}
