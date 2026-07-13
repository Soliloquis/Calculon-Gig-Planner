import React, { useState } from 'react';

export default function MonthDetail({
  monthData,
  categories,
  currencies,
  project,
  dragAndDrop,
  addIncomeInjection,
  removeIncomeInjection,
  addExpense,
  updateExpense,
  removeExpense,
  toggleMonthClosed,
  updateMonthNotes
}) {
  const [newInjDesc, setNewInjDesc] = useState('');
  const [newInjAmount, setNewInjAmount] = useState('');

  const [newExpDay, setNewExpDay] = useState('1');
  const [newExpCat, setNewExpCat] = useState('assets');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpPlanned, setNewExpPlanned] = useState('');

  if (!monthData) {
    return (
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Select a month from the timeline grid above to view details and totals.</p>
      </div>
    );
  }

  const {
    month,
    label,
    allocatedIncome,
    injections,
    totalInjections,
    totalIncome,
    expenses,
    plannedExpenses,
    actualExpenses,
    effectiveExpenses,
    monthlySurplus,
    notes,
    isClosed
  } = monthData;

  const currentCurrency = currencies.find(c => c.code === project.currency) || { symbol: '$', code: 'USD' };
  const currencySymbol = currentCurrency.symbol;

  const handleAddInjection = (e) => {
    e.preventDefault();
    if (!newInjAmount) return;
    addIncomeInjection(month, newInjDesc || 'Cash Injection', Number(newInjAmount));
    setNewInjDesc('');
    setNewInjAmount('');
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpDesc || !newExpPlanned) return;
    addExpense(month, {
      day: Number(newExpDay) || 1,
      category: newExpCat,
      description: newExpDesc,
      plannedAmount: Number(newExpPlanned),
      actualAmount: Number(newExpPlanned),
      isPaid: false
    });
    setNewExpDesc('');
    setNewExpPlanned('');
    // Reset to Day 1
    setNewExpDay('1');
  };

  // Compute category totals for this month dynamically
  const categoryTotals = categories.map(cat => {
    const total = expenses
      .filter(e => e.category === cat.id)
      .reduce((sum, e) => {
        return sum + (e.isPaid ? (e.actualAmount || 0) : (e.plannedAmount || 0));
      }, 0);
    return {
      ...cat,
      total
    };
  });

  const formatVal = (val) => {
    return `${currencySymbol}${Number(val || 0).toLocaleString()}`;
  };

  const formatInputVal = (val) => {
    return val === undefined || val === null ? '' : val;
  };

  // Sort expenses by day for chronological listing
  const sortedExpenses = [...expenses].sort((a, b) => (a.day || 1) - (b.day || 1));

  return (
    <div className="workspace-split">
      
      {/* COLUMN 1: CATEGORY TOTALS & MONTH HEALTH (LEFT) */}
      <div className="workspace-column">
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{label} Totals</h2>
          </div>

          {/* Month Cash Surplus / Details Display */}
          <div className="totals-summary-stats">
            <div className="totals-stat-row">
              <span style={{ color: 'var(--text-muted)' }}>Base Funding:</span>
              <span>{formatVal(allocatedIncome)}</span>
            </div>
            {totalInjections > 0 && (
              <div className="totals-stat-row">
                <span style={{ color: 'var(--text-muted)' }}>Injections:</span>
                <span style={{ color: 'var(--color-success)' }}>+{formatVal(totalInjections)}</span>
              </div>
            )}
            <div className="totals-stat-row">
              <span style={{ color: 'var(--text-muted)' }}>Total Expenses:</span>
              <span>{formatVal(effectiveExpenses)}</span>
            </div>
            <div className={`totals-stat-row surplus ${monthlySurplus >= 0 ? 'positive' : 'negative'}`}>
              <span>Month Surplus:</span>
              <span>{formatVal(monthlySurplus)}</span>
            </div>
          </div>

          {/* Category-wise totals */}
          <div style={{ marginTop: '4px' }}>
            <h4 style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Category Breakdowns
            </h4>
            <div className="category-totals-list">
              {categoryTotals.map(cat => (
                <div key={cat.id} className="category-total-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                    <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>{cat.name.split(' ')[0]}</span>
                  </div>
                  <span className="category-total-val" style={{ color: cat.total > 0 ? cat.color : 'var(--text-dim)' }}>
                    {formatVal(cat.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Lock status toggle */}
          <button
            className={`btn ${isClosed ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => toggleMonthClosed(month)}
            style={{ width: '100%', fontSize: '11px', padding: '6px 12px', marginTop: '4px' }}
          >
            {isClosed ? '🔓 Unlock Planning' : '🔒 Finalize / Lock Month'}
          </button>
        </div>
      </div>

      {/* COLUMN 2: DETAILED EXPENSE LIST & FORMS (RIGHT) */}
      <div className="workspace-column">
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Section: One-time Injections */}
          <div className="injections-container">
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
              ➕ One-Time Cash Injections (e.g. Sales, Savings)
            </h4>
            
            {injections.length > 0 && (
              <div className="injections-list">
                {injections.map(inj => (
                  <div key={inj.id} className="injection-item">
                    <span>{inj.description}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="injection-amount">+{formatVal(inj.amount)}</span>
                      {!isClosed && (
                        <button
                          className="btn-icon delete"
                          onClick={() => removeIncomeInjection(month, inj.id)}
                          title="Delete injection"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isClosed && (
              <form onSubmit={handleAddInjection} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Inflow description"
                  style={{ flex: 1 }}
                  value={newInjDesc}
                  onChange={(e) => setNewInjDesc(e.target.value)}
                />
                <div className="input-wrapper" style={{ width: '110px' }}>
                  <span className="input-prefix" style={{ fontSize: '11px', left: '8px' }}>{currencySymbol}</span>
                  <input
                    type="number"
                    className="form-input has-prefix"
                    placeholder="Amount"
                    style={{ paddingLeft: '18px' }}
                    value={newInjAmount}
                    onChange={(e) => setNewInjAmount(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" type="submit">Add</button>
              </form>
            )}
          </div>

          {/* Section: Expenses List */}
          <div className="expenses-container">
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
              📋 Expense Items
            </h4>

            {/* Column Headers */}
            <div className="expenses-table-header">
              <span>Day</span>
              <span>Category</span>
              <span>Description</span>
              <span>Planned</span>
              <span>Actual</span>
              <span>Paid</span>
            </div>

            {/* Row entries list */}
            <div className="expenses-list">
              {sortedExpenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', border: '1px dashed var(--border-subtle)', borderRadius: '8px', fontSize: '12px' }}>
                  No expenses registered for this month.
                </div>
              ) : (
                sortedExpenses.map(exp => {
                  const cat = categories.find(c => c.id === exp.category) || categories[categories.length - 1];
                  return (
                    <div
                      key={exp.id}
                      className={`expense-row ${exp.isPaid ? 'paid' : ''}`}
                      style={{ borderLeft: `3px solid ${cat.color}` }}
                    >
                      {/* Day select dropdown */}
                      <div>
                        {isClosed || exp.recurringSourceId ? (
                          <span style={{ fontSize: '12px', fontWeight: '600' }}>Day {exp.day}</span>
                        ) : (
                          <select
                            value={exp.day}
                            onChange={(e) => updateExpense(month, exp.id, { day: Number(e.target.value) })}
                            style={{
                              background: 'rgba(15, 23, 42, 0.6)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              color: '#fff',
                              fontSize: '11px',
                              padding: '2px 4px',
                              width: '40px',
                              fontFamily: 'var(--font-sans)'
                            }}
                          >
                            {Array.from({ length: 31 }).map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Category badge */}
                      <div>
                        {isClosed || exp.recurringSourceId ? (
                          <span className="category-badge" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                            {cat.icon} {cat.name.split(' ')[0]}
                          </span>
                        ) : (
                          <select
                            value={exp.category}
                            onChange={(e) => updateExpense(month, exp.id, { category: e.target.value })}
                            style={{
                              background: 'rgba(15, 23, 42, 0.6)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              color: '#fff',
                              fontSize: '11px',
                              padding: '2px 4px',
                              width: '76px',
                              fontFamily: 'var(--font-sans)'
                            }}
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.icon} {c.name.split(' ')[0]}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Description */}
                      <input
                        type="text"
                        value={exp.description}
                        disabled={isClosed || !!exp.recurringSourceId}
                        className="form-input"
                        style={{
                          padding: (isClosed || exp.recurringSourceId) ? '3px 0' : '3px 6px',
                          background: (isClosed || exp.recurringSourceId) ? 'transparent' : 'rgba(15, 23, 42, 0.2)',
                          border: (isClosed || exp.recurringSourceId) ? 'none' : '1px solid var(--border-subtle)',
                          color: exp.recurringSourceId ? 'var(--text-muted)' : 'inherit',
                          fontWeight: exp.recurringSourceId ? '500' : 'normal'
                        }}
                        onChange={(e) => updateExpense(month, exp.id, { description: e.target.value })}
                      />

                      {/* Planned Amount */}
                      <div className="input-wrapper">
                        {!(isClosed || exp.recurringSourceId) && <span className="input-prefix" style={{ fontSize: '10px', left: '6px' }}>{currencySymbol}</span>}
                        <input
                          type="number"
                          value={formatInputVal(exp.plannedAmount)}
                          disabled={isClosed || !!exp.recurringSourceId}
                          className="form-input"
                          style={{
                            padding: (isClosed || exp.recurringSourceId) ? '3px 0' : '3px 4px 3px 14px',
                            textAlign: (isClosed || exp.recurringSourceId) ? 'right' : 'left',
                            background: (isClosed || exp.recurringSourceId) ? 'transparent' : 'rgba(15, 23, 42, 0.2)',
                            border: (isClosed || exp.recurringSourceId) ? 'none' : '1px solid var(--border-subtle)'
                          }}
                          onChange={(e) => updateExpense(month, exp.id, { plannedAmount: e.target.value })}
                        />
                      </div>

                      {/* Actual Amount */}
                      <div className="input-wrapper">
                        {!isClosed && <span className="input-prefix" style={{ fontSize: '10px', left: '6px' }}>{currencySymbol}</span>}
                        <input
                          type="number"
                          value={formatInputVal(exp.actualAmount)}
                          disabled={isClosed}
                          className="form-input"
                          style={{
                            padding: isClosed ? '3px 0' : '3px 4px 3px 14px',
                            textAlign: isClosed ? 'right' : 'left',
                            background: isClosed ? 'transparent' : 'rgba(15, 23, 42, 0.2)',
                            border: isClosed ? 'none' : '1px solid var(--border-subtle)'
                          }}
                          onChange={(e) => updateExpense(month, exp.id, { actualAmount: e.target.value })}
                        />
                      </div>

                      {/* Checkbox and delete action */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          className={`custom-checkbox ${exp.isPaid ? 'checked' : ''}`}
                          onClick={() => !isClosed && updateExpense(month, exp.id, { isPaid: !exp.isPaid })}
                          style={{ pointerEvents: isClosed ? 'none' : 'auto' }}
                          title={exp.isPaid ? 'Paid' : 'Unpaid'}
                        />
                        {!isClosed && (
                          <button
                            className="btn-icon delete"
                            onClick={() => removeExpense(month, exp.id)}
                            title="Delete expense"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Add Expense Form */}
            {!isClosed && (
              <form onSubmit={handleAddExpense} className="quick-add-form">
                {/* Day selector */}
                <div className="form-group">
                  <label>Day</label>
                  <select
                    className="form-input"
                    value={newExpDay}
                    onChange={(e) => setNewExpDay(e.target.value)}
                    style={{ padding: '5px' }}
                  >
                    {Array.from({ length: 31 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="form-input"
                    value={newExpCat}
                    onChange={(e) => setNewExpCat(e.target.value)}
                    style={{ padding: '5px' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Asset Pack Buyout"
                    value={newExpDesc}
                    onChange={(e) => setNewExpDesc(e.target.value)}
                  />
                </div>

                {/* Cost */}
                <div className="form-group">
                  <label>Planned Cost</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">{currencySymbol}</span>
                    <input
                      type="number"
                      className="form-input has-prefix"
                      placeholder="Cost"
                      value={newExpPlanned}
                      onChange={(e) => setNewExpPlanned(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button className="btn btn-primary" type="submit" style={{ height: '30px', padding: '0 8px', marginTop: '14px' }}>
                  Add
                </button>
              </form>
            )}
          </div>

          {/* Monthly notes logger */}
          <div className="form-group">
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>📝 Month Notes & Log</label>
            <textarea
              className="form-input"
              placeholder="Record notes, contract details, or delays for this month..."
              disabled={isClosed}
              rows={2}
              style={{ resize: 'vertical' }}
              value={notes}
              onChange={(e) => updateMonthNotes(month, e.target.value)}
            />
          </div>

        </div>
      </div>

    </div>
  );
}
