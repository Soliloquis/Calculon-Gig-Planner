import React from 'react';

export default function BigPictureModal({ isOpen, onClose, annualSummary, summary }) {
  if (!isOpen) return null;

  const { currencySymbol, totalIncome, totalPlannedExpenses, totalActualSpent, currentBalance } = summary;

  const formatVal = (val) => {
    return `${currencySymbol}${Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" style={{ width: '850px', padding: '24px' }}>
        {/* Close Icon */}
        <button className="modal-close-btn" onClick={onClose} title="Close window">
          ✕
        </button>

        {/* Modal Header */}
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>📊 Project Big Picture Overview</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Calendar year cost breakdowns and cumulative rollover forecasting.
            </p>
          </div>
        </div>

        {/* Project Metrics Summary Row */}
        <div className="modal-summary-row" style={{ marginTop: '4px' }}>
          <div className="modal-summary-cell">
            <span className="modal-summary-label">Total Timeline Funding</span>
            <span className="modal-summary-val">{formatVal(totalIncome)}</span>
          </div>
          <div className="modal-summary-cell">
            <span className="modal-summary-label">Total Planned Expenses</span>
            <span className="modal-summary-val" style={{ color: 'var(--color-primary)' }}>{formatVal(totalPlannedExpenses)}</span>
          </div>
          <div className="modal-summary-cell">
            <span className="modal-summary-label">Total Spent To-Date</span>
            <span className="modal-summary-val" style={{ color: 'var(--color-success)' }}>{formatVal(totalActualSpent)}</span>
          </div>
          <div className="modal-summary-cell">
            <span className="modal-summary-label">Final Projected Balance</span>
            <span className={`modal-summary-val ${currentBalance >= 0 ? 'positive' : 'negative'}`}>
              {formatVal(currentBalance)}
            </span>
          </div>
        </div>

        {/* Spacious and highly readable Annual Projections Table */}
        <div style={{ overflowX: 'auto', marginTop: '8px' }}>
          <table className="big-picture-table">
            <thead>
              <tr>
                <th>Calendar Year</th>
                <th style={{ textAlign: 'right' }}>Base Funding</th>
                <th style={{ textAlign: 'right' }}>Injections</th>
                <th style={{ textAlign: 'right' }}>Net Annual Funding</th>
                <th style={{ textAlign: 'right' }}>Planned & Actual Outflow</th>
                <th style={{ textAlign: 'right' }}>Annual Margin</th>
              </tr>
            </thead>
            <tbody>
              {annualSummary.map(year => {
                const baseFunding = year.totalIncome - year.injections;
                const annualSurplus = year.totalIncome - year.effectiveExpenses;
                return (
                  <tr key={year.year}>
                    <td style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>
                      Year {year.year}
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatVal(baseFunding)}</td>
                    <td style={{ textAlign: 'right', color: year.injections > 0 ? 'var(--color-success)' : 'var(--text-dim)' }}>
                      {year.injections > 0 ? `+${formatVal(year.injections)}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatVal(year.totalIncome)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-primary)' }}>{formatVal(year.effectiveExpenses)}</td>
                    <td 
                      style={{ 
                        textAlign: 'right', 
                        fontWeight: '700', 
                        color: annualSurplus >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                      }}
                    >
                      {annualSurplus >= 0 ? '+' : ''}{formatVal(annualSurplus)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Close Button Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '8px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}
