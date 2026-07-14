import React, { useMemo } from 'react';

export default function BigPictureView({ timeline, annualSummary, summary, project }) {
  const { currencySymbol, totalIncome, totalPlannedExpenses, totalActualSpent, currentBalance } = summary;

  const formatVal = (val) => {
    return `${currencySymbol}${Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  // Compile detailed annual reports for each year
  const detailedYears = useMemo(() => {
    return annualSummary.map(yearSummary => {
      const yearMonths = timeline.filter(m => m.year === yearSummary.year);
      
      // 1. Gather all projected recurring annual expenses in this year
      const annualExpenses = [];
      yearMonths.forEach(m => {
        (m.expenses || []).forEach(exp => {
          if (exp.recurringSourceId && exp.recurringSourceId.startsWith('rec_ann_')) {
            annualExpenses.push({
              ...exp,
              monthLabel: m.simpleLabel
            });
          }
        });
      });

      // 2. Gather category totals for this year
      const categoryTotalsMap = {};
      let maxCatCost = 0;
      yearMonths.forEach(m => {
        (m.expenses || []).forEach(exp => {
          const cost = exp.actualAmount !== undefined ? exp.actualAmount : exp.plannedAmount;
          if (!categoryTotalsMap[exp.category]) {
            categoryTotalsMap[exp.category] = 0;
          }
          categoryTotalsMap[exp.category] += cost;
        });
      });

      const categoryTotalsList = Object.entries(categoryTotalsMap).map(([catId, amount]) => {
        const catInfo = project.categories.find(c => c.id === catId) || { name: catId, icon: '📦', color: '#6b7280' };
        if (amount > maxCatCost) maxCatCost = amount;
        return {
          id: catId,
          amount,
          ...catInfo
        };
      }).sort((a, b) => b.amount - a.amount);

      const baseFunding = yearSummary.totalIncome - yearSummary.injections;
      const annualMargin = yearSummary.totalIncome - yearSummary.effectiveExpenses;

      return {
        year: yearSummary.year,
        baseFunding,
        injections: yearSummary.injections,
        netFunding: yearSummary.totalIncome,
        outflow: yearSummary.effectiveExpenses,
        margin: annualMargin,
        annualExpenses,
        categoryTotalsList,
        maxCatCost
      };
    });
  }, [annualSummary, timeline, project.categories]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Overview Metrics Header Card */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>📊 Project Big Picture Overview</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Multi-year cost analysis, annual recurring outflows, and rollover margins.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="metric-card" style={{ background: 'rgba(30, 41, 67, 0.3)', border: '1px solid var(--border-subtle)', padding: '14px 18px', borderRadius: '10px' }}>
            <span className="metric-label" style={{ fontSize: '13px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Total Timeline Funding</span>
            <span className="metric-val" style={{ fontSize: '20px', fontWeight: '700', display: 'block', marginTop: '4px' }}>{formatVal(totalIncome)}</span>
          </div>
          <div className="metric-card" style={{ background: 'rgba(30, 41, 67, 0.3)', border: '1px solid var(--border-subtle)', padding: '14px 18px', borderRadius: '10px' }}>
            <span className="metric-label" style={{ fontSize: '13px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Total Planned Expenses</span>
            <span className="metric-val" style={{ fontSize: '20px', fontWeight: '700', display: 'block', marginTop: '4px', color: 'var(--color-primary)' }}>{formatVal(totalPlannedExpenses)}</span>
          </div>
          <div className="metric-card" style={{ background: 'rgba(30, 41, 67, 0.3)', border: '1px solid var(--border-subtle)', padding: '14px 18px', borderRadius: '10px' }}>
            <span className="metric-label" style={{ fontSize: '13px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Total Spent To-Date</span>
            <span className="metric-val" style={{ fontSize: '20px', fontWeight: '700', display: 'block', marginTop: '4px', color: 'var(--color-success)' }}>{formatVal(totalActualSpent)}</span>
          </div>
          <div className="metric-card" style={{ background: 'rgba(30, 41, 67, 0.3)', border: '1px solid var(--border-subtle)', padding: '14px 18px', borderRadius: '10px' }}>
            <span className="metric-label" style={{ fontSize: '13px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Final Projected Balance</span>
            <span className="metric-val" style={{ fontSize: '20px', fontWeight: '700', display: 'block', marginTop: '4px', color: currentBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {formatVal(currentBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Flex Grid of Vertical Year Cards */}
      <div 
        style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          paddingBottom: '16px',
          alignItems: 'stretch',
          scrollbarWidth: 'thin'
        }}
      >
        {detailedYears.map(year => {
          const isSurplus = year.margin >= 0;
          
          // Calculate slices for the SVG donut chart
          let accumulatedPercent = 0;
          const slices = year.categoryTotalsList.map(cat => {
            const percent = year.outflow > 0 ? (cat.amount / year.outflow) : 0;
            const strokeDasharray = `${percent * 219.91} 219.91`;
            const strokeDashoffset = -accumulatedPercent * 219.91;
            accumulatedPercent += percent;
            return {
              ...cat,
              percent,
              strokeDasharray,
              strokeDashoffset
            };
          });

          return (
            <div
              key={year.year}
              className="glass-panel"
              style={{
                width: '340px',
                minWidth: '340px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'rgba(17, 24, 39, 0.65)',
                border: isSurplus ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              {/* Year Card Header */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  borderBottom: '1px solid var(--border-subtle)', 
                  paddingBottom: '10px' 
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Year {year.year}</h3>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: isSurplus ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: isSurplus ? 'var(--color-success)' : 'var(--color-danger)',
                    border: isSurplus ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                  }}
                >
                  {isSurplus ? 'Surplus' : 'Deficit'}
                </span>
              </div>

              {/* Vertical Metrics Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0, 0, 0, 0.15)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Base Funding</span>
                  <span style={{ fontWeight: '500', color: '#e2e8f0' }}>{formatVal(year.baseFunding)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Injections</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: '500' }}>
                    {year.injections > 0 ? `+${formatVal(year.injections)}` : '—'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Net Funding</span>
                  <span style={{ fontWeight: '600', color: '#fff' }}>{formatVal(year.netFunding)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '4px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Annual Outflow</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: '500' }}>{formatVal(year.outflow)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontWeight: '700', color: '#fff' }}>Annual Margin</span>
                  <span style={{ fontWeight: '800', color: isSurplus ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {isSurplus ? '+' : ''}{formatVal(year.margin)}
                  </span>
                </div>
              </div>

              {/* Recurring Annual Expenses Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🗓️ Recurring Annual Scheduled
                </span>
                
                {year.annualExpenses.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {year.annualExpenses.map(exp => (
                      <div 
                        key={exp.id} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          fontSize: '13px', 
                          background: 'rgba(30, 41, 67, 0.25)', 
                          padding: '6px 10px', 
                          borderRadius: '6px', 
                          border: '1px solid rgba(255,255,255,0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: exp.isPaid ? 'var(--color-success)' : 'var(--text-dim)', fontSize: '10px' }}>
                            {exp.isPaid ? '●' : '○'}
                          </span>
                          <span style={{ color: '#fff', fontWeight: '500' }}>{exp.description}</span>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                          {formatVal(exp.actualAmount !== undefined ? exp.actualAmount : exp.plannedAmount)} ({exp.monthLabel})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic', padding: '2px 0' }}>
                    No recurring annual expenses projected.
                  </div>
                )}
              </div>

              {/* Year Category Breakdowns (SVG Donut Chart) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📊 Year Category breakdown
                </span>

                {slices.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                    {/* SVG Donut Chart wrapper (centered, scaled up) */}
                    <div style={{ position: 'relative', width: '260px', height: '260px', flexShrink: 0 }}>
                      <svg width="260" height="260" viewBox="0 0 100 100">
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="35" 
                          fill="transparent" 
                          stroke="rgba(255,255,255,0.05)" 
                          strokeWidth="10" 
                        />
                        {slices.map((slice) => (
                          <circle
                            key={slice.id}
                            cx="50"
                            cy="50"
                            r="35"
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth="10"
                            strokeDasharray={slice.strokeDasharray}
                            strokeDashoffset={slice.strokeDashoffset}
                            transform="rotate(-90 50 50)"
                            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                          />
                        ))}
                      </svg>
                      {/* Total Centered Labels Overlay (scaled up) */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                          lineHeight: '1.2'
                        }}
                      >
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Outflow</span>
                        <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>
                          {formatVal(year.outflow)}
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend (spans full width below chart) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                      {slices.map(slice => (
                        <div key={slice.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <span 
                              style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                background: slice.color, 
                                flexShrink: 0 
                              }} 
                            />
                            <span 
                              style={{ 
                                color: '#e2e8f0', 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis' 
                              }}
                              title={`${slice.icon} ${slice.name}`}
                            >
                              {slice.icon} {slice.name}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span style={{ color: 'var(--text-dim)', fontSize: '12px', fontWeight: '600' }}>
                              {Math.round(slice.percent * 100)}%
                            </span>
                            <span style={{ fontWeight: '700', color: '#fff' }}>
                              {formatVal(slice.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic', padding: '2px 0' }}>
                    No expenses logged for this year.
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
