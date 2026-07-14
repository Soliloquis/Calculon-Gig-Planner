import React, { useState, useEffect } from 'react';
import { useProjectBudget } from './hooks/useProjectBudget';
import Dashboard from './components/Dashboard';
import Timeline from './components/Timeline';
import MonthDetail from './components/MonthDetail';
import CashFlowChart from './components/CashFlowChart';
import CategoriesEditor from './components/CategoriesEditor';
import ImportExport from './components/ImportExport';
import BigPictureView from './components/BigPictureView';
import RecurringExpenses from './components/RecurringExpenses';
import RecurringAnnualExpenses from './components/RecurringAnnualExpenses';
import { LOGO_BASE64 } from './assets/logoBase64';

export default function App() {
  const {
    project,
    timeline,
    annualSummary,
    summary,
    currencies,
    updateProjectMeta,
    addIncomeInjection,
    removeIncomeInjection,
    addExpense,
    updateExpense,
    removeExpense,
    toggleMonthClosed,
    updateMonthNotes,
    clearProjectData,
    loadProjectData,
    loadDemoData,
    addRecurringExpense,
    removeRecurringExpense,
    updateRecurringExpense,
    addRecurringAnnualExpense,
    removeRecurringAnnualExpense,
    updateRecurringAnnualExpense,
    addCategory,
    removeCategory,
    dragAndDrop
  } = useProjectBudget();

  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedMonthKey, setSelectedMonthKey] = useState('');

  // Default to first month
  useEffect(() => {
    if (timeline.length > 0 && !selectedMonthKey) {
      setSelectedMonthKey(timeline[0].month);
    }
  }, [timeline, selectedMonthKey]);

  const selectedMonthData = timeline.find(m => m.month === selectedMonthKey) || timeline[0];

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src={LOGO_BASE64} 
            alt="Calculon Logo" 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '6px', 
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
              objectFit: 'contain'
            }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '20px', lineHeight: '1.1' }}>Calculon</h1>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'transparent', border: 'none', padding: '0', alignSelf: 'flex-start', margin: '0' }}>
              The Gig Planner
            </span>
          </div>
        </div>

        {/* Today's Date Badge */}
        <div 
          className="today-date-badge" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            borderRadius: '99px',
            padding: '10px 24px',
            fontSize: '33px',
            fontWeight: '700',
            color: '#a5b4fc',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.12)'
          }}
          title="Current Date"
        >
          <span style={{ fontSize: '34px' }}>📅</span>
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        
        {/* Navigation Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            📅 Calendar Board
          </button>
          <button
            className={`tab-btn ${activeTab === 'bigpicture' ? 'active' : ''}`}
            onClick={() => setActiveTab('bigpicture')}
          >
            📊 Big Picture
          </button>
          <button
            className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            📈 Cash Flow Trend
          </button>
          <button
            className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            🎨 Categories
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings & Tools
          </button>
        </div>
      </header>

      {/* Top metrics dashboard */}
      <Dashboard
        summary={summary}
        timeline={timeline}
        annualSummary={annualSummary}
        selectedMonthKey={selectedMonthKey}
        onSelectMonth={setSelectedMonthKey}
        project={project}
        updateProjectMeta={updateProjectMeta}
      />

      {/* Main Workspace Content */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {activeTab === 'bigpicture' && (
          <BigPictureView
            timeline={timeline}
            annualSummary={annualSummary}
            summary={summary}
            project={project}
          />
        )}

        {activeTab === 'timeline' && (
          <>
            {/* Recurring Monthly Expenses Manager */}
            <RecurringExpenses
              recurringExpenses={project.recurringExpenses}
              categories={project.categories}
              currencySymbol={summary.currencySymbol}
              onAdd={addRecurringExpense}
              onRemove={removeRecurringExpense}
              onUpdate={updateRecurringExpense}
            />

            {/* Recurring Annual Expenses Manager */}
            <RecurringAnnualExpenses
              recurringAnnualExpenses={project.recurringAnnualExpenses}
              categories={project.categories}
              currencySymbol={summary.currencySymbol}
              onAdd={addRecurringAnnualExpense}
              onRemove={removeRecurringAnnualExpense}
              onUpdate={updateRecurringAnnualExpense}
            />

            {/* Horizontal Timeline Calendar Grid */}
            <Timeline
              timeline={timeline}
              selectedMonthKey={selectedMonthKey}
              onSelectMonth={setSelectedMonthKey}
              dragAndDrop={dragAndDrop}
              summary={summary}
              project={project}
            />

            {/* Split Categories Totals & Expense Editor */}
            <MonthDetail
              monthData={selectedMonthData}
              categories={project.categories}
              currencies={currencies}
              project={project}
              dragAndDrop={dragAndDrop}
              addIncomeInjection={addIncomeInjection}
              removeIncomeInjection={removeIncomeInjection}
              addExpense={addExpense}
              updateExpense={updateExpense}
              removeExpense={removeExpense}
              toggleMonthClosed={toggleMonthClosed}
              updateMonthNotes={updateMonthNotes}
            />
          </>
        )}

        {activeTab === 'chart' && (
          <>
            {/* SVG Projections Chart */}
            <CashFlowChart
              timeline={timeline}
              selectedMonthKey={selectedMonthKey}
              onSelectMonth={setSelectedMonthKey}
              summary={summary}
            />

            {/* Split Categories Totals & Expense Editor (interactive below chart) */}
            <MonthDetail
              monthData={selectedMonthData}
              categories={project.categories}
              currencies={currencies}
              project={project}
              dragAndDrop={dragAndDrop}
              addIncomeInjection={addIncomeInjection}
              removeIncomeInjection={removeIncomeInjection}
              addExpense={addExpense}
              updateExpense={updateExpense}
              removeExpense={removeExpense}
              toggleMonthClosed={toggleMonthClosed}
              updateMonthNotes={updateMonthNotes}
            />
          </>
        )}

        {activeTab === 'categories' && (
          <CategoriesEditor
            categories={project.categories}
            onAddCategory={addCategory}
            onRemoveCategory={removeCategory}
          />
        )}

        {activeTab === 'settings' && (
          <ImportExport
            project={project}
            currencies={currencies}
            updateProjectMeta={updateProjectMeta}
            clearProjectData={clearProjectData}
            loadProjectData={loadProjectData}
            loadDemoData={loadDemoData}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyBetween: 'center', alignItems: 'center', fontSize: '11px', color: 'var(--text-dim)' }}>
        <div>Calculon Project Budget Manager // Designed for multi-year side gig tracking.</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span>Auto-saving in browser</span>
          <span>•</span>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); loadDemoData(); }} 
            style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}
          >
            Load Seed Sandbox Demo
          </a>
        </div>
      </footer>
    </div>
  );
}
