import React, { useState, useMemo, useRef, useEffect } from 'react';

export default function CashFlowChart({ timeline, selectedMonthKey, onSelectMonth, summary }) {
  const [range, setRange] = useState('all'); // '12', '24', '36', 'all'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef(null);

  // SVG Chart Dimensions
  const chartHeight = 260;
  const paddingX = 75; // Increased left margin to make room for grid currency labels
  const paddingY = 35;
  
  // Base spacing per month if scrolling
  const minPointSpacing = 42;

  // Track parent wrapper width for responsive scaling
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    // Initial measure
    updateWidth();
    
    // Use ResizeObserver for accurate sizing on layout updates
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(containerRef.current);
    
    window.addEventListener('resize', updateWidth);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Create filtered timeline using a sliding window centered around the selected month
  const filteredTimeline = useMemo(() => {
    // Cap visible timeline at 10 years (120 months) when showing "All"
    let count = timeline.length;
    if (range === 'all') {
      count = Math.min(timeline.length, 120);
    } else {
      count = parseInt(range, 10);
    }

    if (timeline.length <= count) return timeline;

    const activeIdx = timeline.findIndex(m => m.month === selectedMonthKey);
    const safeIdx = activeIdx !== -1 ? activeIdx : 0;

    // Center the selected month in the visible range
    const half = Math.floor(count / 2);
    let start = safeIdx - half;
    if (start < 0) start = 0;
    if (start + count > timeline.length) {
      start = timeline.length - count;
    }

    return timeline.slice(start, start + count);
  }, [timeline, range, selectedMonthKey]);

  // Calculate dynamic chart width
  const chartWidth = useMemo(() => {
    const minCalculated = filteredTimeline.length * minPointSpacing + paddingX * 2;
    return Math.max(containerWidth, minCalculated);
  }, [filteredTimeline.length, minPointSpacing, paddingX, containerWidth]);

  // Calculate dynamic point spacing based on final chart width
  const pointSpacing = useMemo(() => {
    if (filteredTimeline.length <= 1) return 0;
    const usableWidth = chartWidth - paddingX * 2;
    return usableWidth / (filteredTimeline.length - 1);
  }, [filteredTimeline.length, chartWidth, paddingX]);

  // Scroll the chart to active month
  useEffect(() => {
    if (selectedMonthKey && containerRef.current) {
      const activeIdx = filteredTimeline.findIndex(m => m.month === selectedMonthKey);
      if (activeIdx !== -1) {
        const container = containerRef.current;
        const targetX = activeIdx * pointSpacing + paddingX;
        const containerWidthVal = container.clientWidth;
        
        container.scrollTo({
          left: targetX - containerWidthVal / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedMonthKey, filteredTimeline, pointSpacing]);

  // Calculate Y domain bounds (min & max balance)
  const yBounds = useMemo(() => {
    if (filteredTimeline.length === 0) return { min: 0, max: 10000 };
    
    let max = -Infinity;
    let min = 0; // always anchor to at least 0

    filteredTimeline.forEach(m => {
      const p = (m.cumulativePlanned && Number.isFinite(m.cumulativePlanned)) ? m.cumulativePlanned : 0;
      const f = (m.cumulativeForecast && Number.isFinite(m.cumulativeForecast)) ? m.cumulativeForecast : 0;
      if (p > max) max = p;
      if (f > max) max = f;
      if (p < min) min = p;
      if (f < min) min = f;
    });

    if (max === -Infinity) max = 10000;

    // Add some padding to domain bounds
    const diff = max - min;
    const padding = diff * 0.15 || 5000;
    
    return {
      min: min - padding / 2,
      max: max + padding
    };
  }, [filteredTimeline]);

  // Calculate coordinates for timeline
  const points = useMemo(() => {
    const { min, max } = yBounds;
    const rangeY = max - min || 1;
    const usableHeight = chartHeight - paddingY * 2;

    return filteredTimeline.map((m, index) => {
      const x = paddingX + index * pointSpacing;
      
      const rawPlanned = (m.cumulativePlanned && Number.isFinite(m.cumulativePlanned)) ? m.cumulativePlanned : 0;
      const rawForecast = (m.cumulativeForecast && Number.isFinite(m.cumulativeForecast)) ? m.cumulativeForecast : 0;

      // Calculate Y coords
      const plannedY = chartHeight - paddingY - ((rawPlanned - min) / rangeY) * usableHeight;
      const forecastY = chartHeight - paddingY - ((rawForecast - min) / rangeY) * usableHeight;
      
      // Zero-balance baseline coordinate
      const zeroY = chartHeight - paddingY - ((0 - min) / rangeY) * usableHeight;

      return {
        month: m.month,
        label: m.label,
        simpleLabel: m.simpleLabel,
        year: m.year,
        rawPlanned,
        rawForecast,
        x,
        plannedY,
        forecastY,
        zeroY,
        hasDeficit: m.hasDeficit
      };
    });
  }, [filteredTimeline, yBounds, pointSpacing, chartWidth]);

  // Construct SVG paths
  const paths = useMemo(() => {
    if (points.length === 0) return { plannedLine: '', forecastLine: '', forecastArea: '' };

    let plannedLine = `M ${points[0].x} ${points[0].plannedY}`;
    let forecastLine = `M ${points[0].x} ${points[0].forecastY}`;
    
    // Area path needs to close at the baseline coordinate
    let forecastArea = `M ${points[0].x} ${points[0].zeroY}`;
    
    points.forEach((p, idx) => {
      if (idx > 0) {
        plannedLine += ` L ${p.x} ${p.plannedY}`;
        forecastLine += ` L ${p.x} ${p.forecastY}`;
      }
      forecastArea += ` L ${p.x} ${p.forecastY}`;
    });

    // Close the area path along the bottom zero-line
    forecastArea += ` L ${points[points.length - 1].x} ${points[points.length - 1].zeroY} Z`;

    return { plannedLine, forecastLine, forecastArea };
  }, [points]);

  // Horizontal Gridline values
  const yGridLines = useMemo(() => {
    const { min, max } = yBounds;
    const step = (max - min) / 4;
    const lines = [];
    for (let i = 0; i <= 4; i++) {
      const val = min + step * i;
      const rangeY = max - min || 1;
      const y = chartHeight - paddingY - ((val - min) / rangeY) * (chartHeight - paddingY * 2);
      lines.push({ value: val, y });
    }
    return lines;
  }, [yBounds]);

  const formatCurrency = (val) => {
    return `${summary.currencySymbol}${Math.round(val).toLocaleString()}`;
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Cumulative Balance Forecast Trend</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Shows planned project cash balance vs actual forecasted balance over time.
          </p>
        </div>

        {/* Display Range Buttons */}
        <div className="tabs" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)', padding: '3px' }}>
          <button
            type="button"
            className={`tab-btn ${range === '12' ? 'active' : ''}`}
            onClick={() => setRange('12')}
            style={{ fontSize: '13px', padding: '6px 12px' }}
          >
            1 Year
          </button>
          <button
            type="button"
            className={`tab-btn ${range === '24' ? 'active' : ''}`}
            onClick={() => setRange('24')}
            style={{ fontSize: '13px', padding: '6px 12px' }}
          >
            2 Years
          </button>
          <button
            type="button"
            className={`tab-btn ${range === '36' ? 'active' : ''}`}
            onClick={() => setRange('36')}
            style={{ fontSize: '13px', padding: '6px 12px' }}
          >
            3 Years
          </button>
          <button
            type="button"
            className={`tab-btn ${range === 'all' ? 'active' : ''}`}
            onClick={() => setRange('all')}
            style={{ fontSize: '13px', padding: '6px 12px' }}
            title="Show all months, capped at 10 years max"
          >
            All
          </button>
        </div>
      </div>

      <div 
        className="chart-svg-wrapper" 
        ref={containerRef}
        style={{ position: 'relative', overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.4)' }}
      >
        <svg 
          width={chartWidth} 
          height={chartHeight}
          className="chart-svg"
          style={{ display: 'block' }}
        >
          <defs>
            {/* Forecast Gradient for Area Fill */}
            <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0.00" />
            </linearGradient>
            
            {/* Deficit Gradient for visual highlights */}
            <linearGradient id="deficitAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-danger)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--color-danger)" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* 1. Grid lines */}
          {yGridLines.map((line, idx) => (
            <g key={idx}>
              <line 
                x1={paddingX} 
                y1={line.y} 
                x2={chartWidth - paddingX} 
                y2={line.y} 
                className="chart-grid-line" 
              />
              <text 
                x={paddingX - 12} 
                y={line.y + 4} 
                fill="var(--text-dim)" 
                fontSize="10px"
                fontWeight="500"
                textAnchor="end"
              >
                {formatCurrency(line.value)}
              </text>
            </g>
          ))}

          {/* 2. Zero Danger Baseline */}
          {points.length > 0 && points[0].zeroY >= paddingY && points[0].zeroY <= chartHeight - paddingY && (
            <g>
              <line 
                x1={paddingX} 
                y1={points[0].zeroY} 
                x2={chartWidth - paddingX} 
                y2={points[0].zeroY} 
                className="chart-zero-line" 
              />
              <text 
                x={chartWidth - 140} 
                y={points[0].zeroY - 6} 
                fill="var(--color-danger)" 
                fontSize="10px"
                fontWeight="600"
              >
                ⚠️ DEFICIT THRESHOLD
              </text>
            </g>
          )}

          {/* 3. Year Columns dividers */}
          {points.map((p, idx) => {
            // Draw grid line for start of years
            const isYearStart = idx === 0 || p.year !== points[idx - 1].year;
            if (isYearStart) {
              return (
                <g key={`yr-${idx}`}>
                  <line 
                    x1={p.x} 
                    y1={paddingY} 
                    x2={p.x} 
                    y2={chartHeight - paddingY} 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeDasharray="2 2"
                  />
                  <text 
                    x={p.x + 6} 
                    y={paddingY - 10} 
                    fill="var(--text-muted)" 
                    fontSize="13px" 
                    fontWeight="600"
                  >
                    {p.year}
                  </text>
                </g>
              );
            }
            return null;
          })}

          {/* 4. Area path */}
          {paths.forecastArea && (
            <path d={paths.forecastArea} fill="url(#forecastAreaGrad)" />
          )}

          {/* 5. Trend Lines */}
          {paths.plannedLine && (
            <path d={paths.plannedLine} className="chart-line-planned" />
          )}
          {paths.forecastLine && (
            <path d={paths.forecastLine} className="chart-line-forecast" />
          )}

          {/* 6. Active Month highlighting vertical bar */}
          {selectedMonthKey && (
            (() => {
              const activePt = points.find(p => p.month === selectedMonthKey);
              if (activePt) {
                return (
                  <rect 
                    x={activePt.x - 16} 
                    y={paddingY} 
                    width={32} 
                    height={chartHeight - paddingY * 2} 
                    fill="rgba(99, 102, 241, 0.08)" 
                    rx={6}
                  />
                );
              }
            })()
          )}

          {/* 7. Plot Dots */}
          {points.map((p, idx) => {
            const isSelected = p.month === selectedMonthKey;
            return (
              <g key={idx}>
                {/* Planned Balance dots */}
                <circle 
                  cx={p.x} 
                  cy={p.plannedY} 
                  r={isSelected ? 5 : 3.5} 
                  className={`chart-dot planned ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectMonth(p.month)}
                  onMouseEnter={() => setHoveredPoint({ ...p, type: 'Planned', value: p.rawPlanned, y: p.plannedY })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                
                {/* Forecast Balance dots */}
                <circle 
                  cx={p.x} 
                  cy={p.forecastY} 
                  r={isSelected ? 6 : 4} 
                  className={`chart-dot forecast ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectMonth(p.month)}
                  onMouseEnter={() => setHoveredPoint({ ...p, type: 'Forecast', value: p.rawForecast, y: p.forecastY })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip overlay (scrolls absolute with chart container) */}
        {hoveredPoint && (
          <div 
            style={{
              position: 'absolute',
              top: `${hoveredPoint.y - 12}px`, 
              left: `${hoveredPoint.x}px`,
              pointerEvents: 'none',
              transform: 'translate(-50%, -100%)',
              zIndex: 100,
              background: 'var(--bg-panel-solid)',
              border: `1px solid ${hoveredPoint.hasDeficit ? 'var(--color-danger)' : 'var(--border-subtle)'}`,
              borderRadius: '8px',
              padding: '10px 14px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '12px'
            }}
          >
            <div style={{ fontWeight: '700', color: '#fff' }}>{hoveredPoint.label}</div>
            <div style={{ color: 'var(--color-primary)' }}>
              Planned: {formatCurrency(hoveredPoint.rawPlanned)}
            </div>
            <div style={{ color: 'var(--color-success)', fontWeight: '600' }}>
              Forecast: {formatCurrency(hoveredPoint.rawForecast)}
            </div>
            {hoveredPoint.hasDeficit && (
              <div style={{ color: 'var(--color-danger)', fontWeight: '700', fontSize: '13px', marginTop: '2px' }}>
                ⚠️ CASH DEFICIT
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legends */}
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'var(--color-primary)' }} />
          <span>Cumulative Planned Balance</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'var(--color-success)' }} />
          <span>Cumulative Forecasted Balance (Paid Actuals + Unpaid Planneds)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ border: '1px dashed var(--color-danger)', height: '2px', width: '20px', borderRadius: '0' }} />
          <span style={{ color: 'var(--color-danger)', fontWeight: '500' }}>Deficit Danger Zone ($0)</span>
        </div>
      </div>
    </div>
  );
}
