import { useState, useEffect, useMemo } from 'react';

// Default categories with modern colors
const DEFAULT_CATEGORIES = [
  { id: 'assets', name: 'Art & Assets', color: '#10b981', icon: '🎨' },
  { id: 'software', name: 'Software & Tools', color: '#6366f1', icon: '💻' },
  { id: 'hardware', name: 'Hardware & Equip', color: '#f59e0b', icon: '🖥️' },
  { id: 'services', name: 'Services & Subscriptions', color: '#3b82f6', icon: '☁️' },
  { id: 'marketing', name: 'Marketing & Promo', color: '#ec4899', icon: '📢' },
  { id: 'team', name: 'Contractors & Team', color: '#8b5cf6', icon: '👥' },
  { id: 'other', name: 'Other / Buffer', color: '#6b7280', icon: '📦' }
];

const CURRENCY_LIST = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' }
];

const detectDefaultCurrency = () => {
  try {
    const locale = navigator.language || 'en-US';
    const region = locale.split('-')[1]?.toUpperCase();
    const regionToCurrency = {
      US: 'USD', GB: 'GBP', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
      JP: 'JPY', CA: 'CAD', AU: 'AUD', CH: 'CHF', CN: 'CNY', IN: 'INR', NZ: 'NZD',
      BR: 'BRL', MX: 'MXN', ZA: 'ZAR', SG: 'SGD', HK: 'HKD', KR: 'KRW'
    };
    return (region && regionToCurrency[region]) || 'USD';
  } catch (e) {
    return 'USD';
  }
};

const getCurrencySymbol = (code) => {
  return CURRENCY_LIST.find(c => c.code === code)?.symbol || '$';
};

const LOCAL_STORAGE_KEY = 'calculon_budget_project';

export const useProjectBudget = () => {
  const [project, setProject] = useState(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn('localStorage is blocked or unavailable in this environment:', e);
    }
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved budget data, starting fresh', e);
      }
    }
    
    const today = new Date();
    const startYear = today.getFullYear();
    const startMonth = String(today.getMonth() + 1).padStart(2, '0');
    
    return {
      projectName: 'Indie Game Project Calculon',
      startDate: `${startYear}-${startMonth}`,
      durationMonths: 72, // 6 years
      defaultMonthlyAllocation: 1800, // project-wide flat monthly funding
      months: {},
      categories: DEFAULT_CATEGORIES,
      currency: detectDefaultCurrency(),
      recurringExpenses: [],
      recurringAnnualExpenses: []
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.warn('localStorage is blocked or unavailable in this environment:', e);
    }
  }, [project]);

  const getMonthKeys = () => {
    const [startYearStr, startMonthStr] = project.startDate.split('-');
    const startYear = parseInt(startYearStr, 10);
    const startMonth = parseInt(startMonthStr, 10) - 1;
    
    const keys = [];
    for (let i = 0; i < project.durationMonths; i++) {
      const date = new Date(startYear, startMonth + i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      keys.push(`${year}-${month}`);
    }
    return keys;
  };

  // Rollover calculations
  const timeline = getMonthKeys().reduce((acc, monthKey, index) => {
    const monthData = project.months[monthKey] || {
      injections: [],
      notes: '',
      expenses: [],
      isClosed: false
    };

    const prevMonth = index > 0 ? acc[index - 1] : null;

    // Funding is flat and project-wide
    const baseAllocation = Number.isFinite(Number(project.defaultMonthlyAllocation)) ? Number(project.defaultMonthlyAllocation) : 0;
    const totalInjections = (monthData.injections || []).reduce((sum, item) => {
      const amt = Number(item.amount);
      return sum + (Number.isFinite(amt) ? amt : 0);
    }, 0);
    const totalIncome = baseAllocation + totalInjections;

    // Resolve month expenses: combine custom specific items with templates (excluding locally deleted ones)
    const customExpenses = monthData.expenses || [];
    const customSpecific = customExpenses.filter(e => !e.recurringSourceId);
    
    const projectedMonthly = (project.recurringExpenses || []).filter(re => {
      if (!re.endsAt) return true;
      return monthKey <= re.endsAt;
    }).map(re => {
      const override = customExpenses.find(e => e.recurringSourceId === re.id);
      if (override) {
        return override;
      }
      return {
        id: `${re.id}_${monthKey}`,
        recurringSourceId: re.id,
        day: re.day,
        category: re.category,
        description: re.description,
        plannedAmount: Number(re.plannedAmount) || 0,
        actualAmount: Number(re.plannedAmount) || 0,
        isPaid: false
      };
    }).filter(e => !e.isExcluded);

    const projectedAnnual = (project.recurringAnnualExpenses || []).filter(re => {
      if (re.endsAt && monthKey > re.endsAt) return false;
      const monthPart = parseInt(monthKey.split('-')[1], 10);
      return monthPart === Number(re.month);
    }).map(re => {
      const override = customExpenses.find(e => e.recurringSourceId === re.id);
      if (override) {
        return override;
      }
      return {
        id: `${re.id}_${monthKey}`,
        recurringSourceId: re.id,
        day: re.day,
        category: re.category,
        description: re.description,
        plannedAmount: Number(re.plannedAmount) || 0,
        actualAmount: Number(re.plannedAmount) || 0,
        isPaid: false
      };
    }).filter(e => !e.isExcluded);

    const recurringExpenses = [...projectedMonthly, ...projectedAnnual];
    const allExpenses = [...customSpecific, ...recurringExpenses];

    const plannedExpenses = allExpenses.reduce((sum, e) => {
      const amt = Number(e.plannedAmount);
      return sum + (Number.isFinite(amt) ? amt : 0);
    }, 0);
    const actualExpenses = allExpenses.reduce((sum, e) => {
      const amt = Number(e.actualAmount);
      return sum + (Number.isFinite(amt) ? amt : 0);
    }, 0);
    const effectiveExpenses = allExpenses.reduce((sum, e) => {
      const plannedAmt = Number(e.plannedAmount);
      const actualAmt = Number(e.actualAmount);
      const resolvedAmt = e.isPaid 
        ? (Number.isFinite(actualAmt) ? actualAmt : 0) 
        : (Number.isFinite(plannedAmt) ? plannedAmt : 0);
      return sum + resolvedAmt;
    }, 0);

    const monthlySurplus = totalIncome - effectiveExpenses;

    const netPlanned = totalIncome - plannedExpenses;
    const netEffective = totalIncome - effectiveExpenses;

    const prevCumulativePlanned = prevMonth ? prevMonth.cumulativePlanned : 0;
    const prevCumulativeForecast = prevMonth ? prevMonth.cumulativeForecast : 0;

    const cumulativePlanned = prevCumulativePlanned + netPlanned;
    const cumulativeForecast = prevCumulativeForecast + netEffective;

    const [year, monthNum] = monthKey.split('-');
    const dateObj = new Date(parseInt(year, 10), parseInt(monthNum, 10) - 1, 1);
    const label = dateObj.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const simpleLabel = dateObj.toLocaleDateString(undefined, { month: 'short' });

    acc.push({
      month: monthKey,
      label,
      simpleLabel,
      year: parseInt(year, 10),
      allocatedIncome: baseAllocation,
      injections: monthData.injections || [],
      totalInjections,
      totalIncome,
      expenses: allExpenses,
      plannedExpenses,
      actualExpenses,
      effectiveExpenses,
      monthlySurplus,
      netPlanned,
      netEffective,
      cumulativePlanned,
      cumulativeForecast,
      notes: monthData.notes || '',
      isClosed: !!monthData.isClosed,
      hasDeficit: cumulativePlanned < 0 || cumulativeForecast < 0
    });

    return acc;
  }, []);

  // Compute annual costs & income breakdown
  const annualSummary = useMemo(() => {
    const yearsMap = {};
    timeline.forEach(m => {
      if (!yearsMap[m.year]) {
        yearsMap[m.year] = {
          year: m.year,
          plannedExpenses: 0,
          effectiveExpenses: 0,
          totalIncome: 0,
          injections: 0
        };
      }
      yearsMap[m.year].plannedExpenses += m.plannedExpenses;
      yearsMap[m.year].effectiveExpenses += m.effectiveExpenses;
      yearsMap[m.year].totalIncome += m.totalIncome;
      yearsMap[m.year].injections += m.totalInjections;
    });
    return Object.values(yearsMap).sort((a, b) => a.year - b.year);
  }, [timeline]);

  const summary = {
    totalAllocatedIncome: timeline.reduce((sum, m) => sum + m.allocatedIncome, 0),
    totalInjections: timeline.reduce((sum, m) => sum + m.totalInjections, 0),
    totalIncome: timeline.reduce((sum, m) => sum + m.totalIncome, 0),
    totalPlannedExpenses: timeline.reduce((sum, m) => sum + m.plannedExpenses, 0),
    totalActualSpent: timeline.reduce((sum, m) => sum + m.actualExpenses, 0),
    currentBalance: timeline.length > 0 ? timeline[timeline.length - 1].cumulativeForecast : 0,
    deficitsCount: timeline.filter(m => m.hasDeficit).length,
    closedMonthsCount: timeline.filter(m => m.isClosed).length,
    currencySymbol: getCurrencySymbol(project.currency)
  };

  const updateProjectMeta = (fields) => {
    setProject(prev => ({
      ...prev,
      ...fields
    }));
  };

  const addIncomeInjection = (monthKey, description, amount) => {
    setProject(prev => {
      const nextMonths = { ...prev.months };
      if (!nextMonths[monthKey]) {
        nextMonths[monthKey] = { injections: [], expenses: [], notes: '', isClosed: false };
      }
      const mData = { ...nextMonths[monthKey] };
      mData.injections = [...(mData.injections || []), {
        id: 'inj_' + Math.random().toString(36).substr(2, 9),
        description: description || 'Extra income',
        amount: Number(amount) || 0
      }];
      nextMonths[monthKey] = mData;
      return { ...prev, months: nextMonths };
    });
  };

  const removeIncomeInjection = (monthKey, injectionId) => {
    setProject(prev => {
      const nextMonths = { ...prev.months };
      if (nextMonths[monthKey]) {
        const mData = { ...nextMonths[monthKey] };
        mData.injections = (mData.injections || []).filter(item => item.id !== injectionId);
        nextMonths[monthKey] = mData;
      }
      return { ...prev, months: nextMonths };
    });
  };

  const addExpense = (monthKey, expenseData) => {
    setProject(prev => {
      const nextMonths = { ...prev.months };
      if (!nextMonths[monthKey]) {
        nextMonths[monthKey] = { injections: [], expenses: [], notes: '', isClosed: false };
      }
      const mData = { ...nextMonths[monthKey] };
      mData.expenses = [...(mData.expenses || []), {
        id: 'exp_' + Math.random().toString(36).substr(2, 9),
        day: Number(expenseData.day) || 1,
        category: expenseData.category || 'other',
        description: expenseData.description || 'New expense',
        plannedAmount: Number(expenseData.plannedAmount) || 0,
        actualAmount: Number(expenseData.actualAmount) || 0,
        isPaid: !!expenseData.isPaid
      }];
      nextMonths[monthKey] = mData;
      return { ...prev, months: nextMonths };
    });
  };

  const updateExpense = (monthKey, expenseId, updates) => {
    setProject(prev => {
      const nextMonths = { ...prev.months };
      if (!nextMonths[monthKey]) {
        nextMonths[monthKey] = { injections: [], expenses: [], notes: '', isClosed: false };
      }
      const mData = { ...nextMonths[monthKey] };
      mData.expenses = mData.expenses || [];
      
      const existingIdx = mData.expenses.findIndex(exp => exp.id === expenseId);
      if (existingIdx !== -1) {
        // Edit existing custom specific expense or custom override
        mData.expenses = mData.expenses.map((exp, idx) => {
          if (idx === existingIdx) {
            const plannedAmount = updates.plannedAmount !== undefined ? Number(updates.plannedAmount) : exp.plannedAmount;
            const actualAmount = updates.actualAmount !== undefined ? Number(updates.actualAmount) : exp.actualAmount;
            const day = updates.day !== undefined ? Number(updates.day) : exp.day;
            return {
              ...exp,
              ...updates,
              day,
              plannedAmount,
              actualAmount
            };
          }
          return exp;
        });
      } else {
        // It's a recurring template item that has not been overridden in this month yet.
        let template = (prev.recurringExpenses || []).find(re => expenseId.startsWith(re.id));
        if (!template) {
          template = (prev.recurringAnnualExpenses || []).find(re => expenseId.startsWith(re.id));
        }
        if (template) {
          const plannedAmount = updates.plannedAmount !== undefined ? Number(updates.plannedAmount) : template.plannedAmount;
          const actualAmount = updates.actualAmount !== undefined ? Number(updates.actualAmount) : template.plannedAmount;
          const day = updates.day !== undefined ? Number(updates.day) : template.day;
          
          const newOverride = {
            id: expenseId,
            recurringSourceId: template.id,
            day,
            category: updates.category || template.category,
            description: updates.description || template.description,
            plannedAmount,
            actualAmount,
            isPaid: false,
            ...updates
          };
          mData.expenses = [...mData.expenses, newOverride];
        }
      }
      
      nextMonths[monthKey] = mData;
      return { ...prev, months: nextMonths };
    });
  };

  const removeExpense = (monthKey, expenseId) => {
    setProject(prev => {
      const nextMonths = { ...prev.months };
      if (!nextMonths[monthKey]) {
        nextMonths[monthKey] = { injections: [], expenses: [], notes: '', isClosed: false };
      }
      const mData = { ...nextMonths[monthKey] };
      mData.expenses = mData.expenses || [];
      
      const existingIdx = mData.expenses.findIndex(exp => exp.id === expenseId);
      if (existingIdx !== -1) {
        const target = mData.expenses[existingIdx];
        if (target.recurringSourceId) {
          // If it is a template override, mark it as excluded locally
          mData.expenses = mData.expenses.map(e => e.id === expenseId ? { ...e, isExcluded: true } : e);
        } else {
          // If it is custom, filter it out completely
          mData.expenses = mData.expenses.filter(exp => exp.id !== expenseId);
        }
      } else {
        // If it is a template not yet overridden, create an override marked as isExcluded
        let template = (prev.recurringExpenses || []).find(re => expenseId.startsWith(re.id));
        if (!template) {
          template = (prev.recurringAnnualExpenses || []).find(re => expenseId.startsWith(re.id));
        }
        if (template) {
          mData.expenses = [...mData.expenses, {
            id: expenseId,
            recurringSourceId: template.id,
            day: template.day,
            category: template.category,
            description: template.description,
            plannedAmount: template.plannedAmount,
            actualAmount: template.plannedAmount,
            isPaid: false,
            isExcluded: true
          }];
        }
      }
      
      nextMonths[monthKey] = mData;
      return { ...prev, months: nextMonths };
    });
  };

  const moveExpense = (expenseId, sourceMonthKey, targetMonthKey, targetDay) => {
    setProject(prev => {
      const nextMonths = { ...prev.months };
      
      // Get source month data
      if (!nextMonths[sourceMonthKey]) {
        nextMonths[sourceMonthKey] = { injections: [], expenses: [], notes: '', isClosed: false };
      }
      const sourceMonth = { ...nextMonths[sourceMonthKey] };
      sourceMonth.expenses = sourceMonth.expenses || [];
      
      // Resolve expense in source
      let expenseToMove = sourceMonth.expenses.find(e => e.id === expenseId);
      if (!expenseToMove) {
        let template = (prev.recurringExpenses || []).find(re => expenseId.startsWith(re.id));
        if (!template) {
          template = (prev.recurringAnnualExpenses || []).find(re => expenseId.startsWith(re.id));
        }
        if (template) {
          expenseToMove = {
            id: expenseId,
            recurringSourceId: template.id,
            day: template.day,
            category: template.category,
            description: template.description,
            plannedAmount: template.plannedAmount,
            actualAmount: template.plannedAmount,
            isPaid: false
          };
        }
      }
      
      if (!expenseToMove) return prev;
      
      // If dragging across months
      if (sourceMonthKey !== targetMonthKey) {
        // Exclude/remove from source
        if (expenseToMove.recurringSourceId) {
          const existingOverride = sourceMonth.expenses.find(e => e.id === expenseId);
          if (existingOverride) {
            sourceMonth.expenses = sourceMonth.expenses.map(e => e.id === expenseId ? { ...e, isExcluded: true } : e);
          } else {
            sourceMonth.expenses = [...sourceMonth.expenses, { ...expenseToMove, isExcluded: true }];
          }
        } else {
          sourceMonth.expenses = sourceMonth.expenses.filter(e => e.id !== expenseId);
        }
        nextMonths[sourceMonthKey] = sourceMonth;
        
        // Add to target month on targetDay
        if (!nextMonths[targetMonthKey]) {
          nextMonths[targetMonthKey] = { injections: [], expenses: [], notes: '', isClosed: false };
        }
        const targetMonth = { ...nextMonths[targetMonthKey] };
        targetMonth.expenses = targetMonth.expenses || [];
        
        const targetExpenseId = expenseToMove.recurringSourceId 
          ? `${expenseToMove.recurringSourceId}_${targetMonthKey}`
          : expenseToMove.id;
          
        const newExpense = {
          ...expenseToMove,
          id: targetExpenseId,
          day: Number(targetDay) || 1,
          isExcluded: false // Make sure it is active
        };
        
        // Clear any previous items with this ID in target and append
        targetMonth.expenses = targetMonth.expenses.filter(e => e.id !== targetExpenseId);
        targetMonth.expenses = [...targetMonth.expenses, newExpense];
        nextMonths[targetMonthKey] = targetMonth;
      } else {
        // Dragging within the same month: update day override
        if (expenseToMove.recurringSourceId) {
          const existingOverride = sourceMonth.expenses.find(e => e.id === expenseId);
          if (existingOverride) {
            sourceMonth.expenses = sourceMonth.expenses.map(e => e.id === expenseId ? { ...e, day: Number(targetDay) || 1 } : e);
          } else {
            sourceMonth.expenses = [...sourceMonth.expenses, { ...expenseToMove, day: Number(targetDay) || 1 }];
          }
        } else {
          sourceMonth.expenses = sourceMonth.expenses.map(e => e.id === expenseId ? { ...e, day: Number(targetDay) || 1 } : e);
        }
        nextMonths[sourceMonthKey] = sourceMonth;
      }
      
      return { ...prev, months: nextMonths };
    });
  };

  const toggleMonthClosed = (monthKey) => {
    setProject(prev => {
      const nextMonths = { ...prev.months };
      if (!nextMonths[monthKey]) {
        nextMonths[monthKey] = { injections: [], expenses: [], notes: '', isClosed: false };
      }
      const mData = { ...nextMonths[monthKey] };
      mData.isClosed = !mData.isClosed;
      nextMonths[monthKey] = mData;
      return { ...prev, months: nextMonths };
    });
  };

  const updateMonthNotes = (monthKey, notes) => {
    setProject(prev => {
      const nextMonths = { ...prev.months };
      if (!nextMonths[monthKey]) {
        nextMonths[monthKey] = { injections: [], expenses: [], notes: '', isClosed: false };
      }
      const mData = { ...nextMonths[monthKey] };
      mData.notes = notes;
      nextMonths[monthKey] = mData;
      return { ...prev, months: nextMonths };
    });
  };

  const clearProjectData = () => {
    const today = new Date();
    const startYear = today.getFullYear();
    const startMonth = String(today.getMonth() + 1).padStart(2, '0');
    setProject({
      projectName: 'New Budget Project',
      startDate: `${startYear}-${startMonth}`,
      durationMonths: 72,
      defaultMonthlyAllocation: 1800,
      months: {},
      categories: DEFAULT_CATEGORIES,
      currency: detectDefaultCurrency(),
      recurringExpenses: [],
      recurringAnnualExpenses: []
    });
  };

  const loadProjectData = (newData) => {
    if (newData && newData.projectName) {
      setProject({
        ...newData,
        categories: newData.categories || DEFAULT_CATEGORIES,
        months: newData.months || {},
        currency: newData.currency || 'USD',
        recurringExpenses: newData.recurringExpenses || [],
        recurringAnnualExpenses: newData.recurringAnnualExpenses || []
      });
    }
  };

  const dragAndDrop = {
    onDragStart: (e, expenseId, sourceMonthKey) => {
      e.dataTransfer.setData('text/plain', expenseId);
      e.dataTransfer.setData('application/calculon-expense', expenseId);
      e.dataTransfer.setData('application/calculon-source-month', sourceMonthKey);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    onDrop: (e, targetMonthKey, targetDay) => {
      e.preventDefault();
      const expenseId = e.dataTransfer.getData('text/plain');
      const sourceMonthKey = e.dataTransfer.getData('application/calculon-source-month');
      
      if (expenseId && sourceMonthKey && targetMonthKey && targetDay) {
        moveExpense(expenseId, sourceMonthKey, targetMonthKey, targetDay);
      }
    }
  };

  const loadDemoData = () => {
    const today = new Date();
    const startYear = today.getFullYear();
    const startMonth = String(today.getMonth() + 1).padStart(2, '0');
    const startKey = `${startYear}-${startMonth}`;
    
    const getFutureMonthKey = (offset) => {
      const date = new Date(startYear, today.getMonth() + offset, 1);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    };

    const demoMonths = {};

    demoMonths[getFutureMonthKey(0)] = {
      injections: [
        { id: 'inj_seed_1', description: 'Savings Injection', amount: 5000 }
      ],
      notes: 'Initial kickstart! Formed the side-gig company, paid initial legal setup fees.',
      expenses: [
        { id: 'exp_seed_1', day: 2, category: 'software', description: 'Engine License & Tools', plannedAmount: 500, actualAmount: 500, isPaid: true },
        { id: 'exp_seed_2', day: 9, category: 'assets', description: 'Concept Art pack', plannedAmount: 800, actualAmount: 750, isPaid: true },
        { id: 'exp_seed_3', day: 9, category: 'other', description: 'Legal Incorporation', plannedAmount: 1000, actualAmount: 1100, isPaid: true }
      ],
      isClosed: true
    };

    demoMonths[getFutureMonthKey(1)] = {
      notes: 'Standard work month. Bought some basic development hardware.',
      expenses: [
        { id: 'exp_seed_4', day: 13, category: 'hardware', description: 'Dual Monitor Upgrade', plannedAmount: 600, actualAmount: 550, isPaid: true },
        { id: 'exp_seed_5', day: 19, category: 'services', description: 'Cloud backups & domain', plannedAmount: 50, actualAmount: 50, isPaid: true }
      ],
      isClosed: true
    };

    demoMonths[getFutureMonthKey(2)] = {
      notes: 'Development going smooth. Hired a sound designer for custom sfx.',
      expenses: [
        { id: 'exp_seed_6', day: 18, category: 'team', description: 'SFX Contractor Deposit', plannedAmount: 1200, actualAmount: 1200, isPaid: true }
      ],
      isClosed: false
    };

    demoMonths[getFutureMonthKey(5)] = {
      injections: [
        { id: 'inj_seed_2', description: 'Freelance Bonus', amount: 2500 }
      ],
      notes: 'Added extra cash injection from extra freelance work to cover dev kits next month.',
      expenses: []
    };

    demoMonths[getFutureMonthKey(6)] = {
      notes: 'Consoles dev-kits purchased.',
      expenses: [
        { id: 'exp_seed_7', day: 15, category: 'hardware', description: 'Console Dev Kits', plannedAmount: 3000, actualAmount: 0, isPaid: false }
      ]
    };

    demoMonths[getFutureMonthKey(11)] = {
      notes: 'Prepare prototype teaser and run ads.',
      expenses: [
        { id: 'exp_seed_8', day: 20, category: 'marketing', description: 'Trailer Production', plannedAmount: 4000, actualAmount: 0, isPaid: false }
      ]
    };

    demoMonths[getFutureMonthKey(23)] = {
      notes: 'Massive asset sweep (3D models and animation packs).',
      expenses: [
        { id: 'exp_seed_9', day: 10, category: 'assets', description: '3D Character Model packs', plannedAmount: 6000, actualAmount: 0, isPaid: false }
      ]
    };

    demoMonths[getFutureMonthKey(59)] = {
      notes: 'PR Firm monthly retainer before the big release.',
      expenses: [
        { id: 'exp_seed_10', day: 5, category: 'marketing', description: 'PR Agency kickoff', plannedAmount: 5000, actualAmount: 0, isPaid: false }
      ]
    };

    demoMonths[getFutureMonthKey(69)] = {
      notes: 'Big launch expense. Launch party, server costs, promo.',
      expenses: [
        { id: 'exp_seed_11', day: 1, category: 'services', description: 'Launch Dedicated Servers', plannedAmount: 2000, actualAmount: 0, isPaid: false },
        { id: 'exp_seed_12', day: 15, category: 'marketing', description: 'Influencer campaign', plannedAmount: 8000, actualAmount: 0, isPaid: false }
      ]
    };

    setProject({
      projectName: '6-Year RPG Side Project (Calculon)',
      startDate: startKey,
      durationMonths: 72,
      defaultMonthlyAllocation: 1800,
      months: demoMonths,
      categories: DEFAULT_CATEGORIES,
      currency: detectDefaultCurrency(),
      recurringExpenses: [
        { id: 'rec_seed_1', day: 10, category: 'software', description: 'GitHub Copilot', plannedAmount: 10 },
        { id: 'rec_seed_2', day: 15, category: 'services', description: 'VPS Hosting Cloud', plannedAmount: 35 }
      ],
      recurringAnnualExpenses: [
        { id: 'rec_ann_seed_1', month: 4, day: 15, category: 'software', description: 'Tax Preparation Software', plannedAmount: 120 },
        { id: 'rec_ann_seed_2', month: 10, day: 24, category: 'services', description: 'Domain Registry Renewal', plannedAmount: 15 }
      ]
    });
  };

  const addRecurringExpense = (expenseData) => {
    setProject(prev => {
      const nextRecurring = [
        ...(prev.recurringExpenses || []),
        {
          id: 'rec_' + Math.random().toString(36).substr(2, 9),
          day: Number(expenseData.day) || 1,
          category: expenseData.category || 'other',
          description: expenseData.description || 'New recurring expense',
          plannedAmount: Number(expenseData.plannedAmount) || 0,
          endsAt: expenseData.endsAt || ''
        }
      ];
      return { ...prev, recurringExpenses: nextRecurring };
    });
  };

  const removeRecurringExpense = (id) => {
    setProject(prev => {
      const nextRecurring = (prev.recurringExpenses || []).filter(item => item.id !== id);
      return { ...prev, recurringExpenses: nextRecurring };
    });
  };

  const updateRecurringExpense = (id, updates) => {
    setProject(prev => {
      const nextRecurring = (prev.recurringExpenses || []).map(item => {
        if (item.id === id) {
          const plannedAmount = updates.plannedAmount !== undefined ? Number(updates.plannedAmount) : item.plannedAmount;
          const day = updates.day !== undefined ? Number(updates.day) : item.day;
          return {
            ...item,
            ...updates,
            plannedAmount,
            day
          };
        }
        return item;
      });
      return { ...prev, recurringExpenses: nextRecurring };
    });
  };

  const addRecurringAnnualExpense = (expenseData) => {
    setProject(prev => {
      const nextRecurring = [
        ...(prev.recurringAnnualExpenses || []),
        {
          id: 'rec_ann_' + Math.random().toString(36).substr(2, 9),
          month: Number(expenseData.month) || 1,
          day: Number(expenseData.day) || 1,
          category: expenseData.category || 'other',
          description: expenseData.description || 'New annual recurring expense',
          plannedAmount: Number(expenseData.plannedAmount) || 0,
          endsAt: expenseData.endsAt || ''
        }
      ];
      return { ...prev, recurringAnnualExpenses: nextRecurring };
    });
  };

  const removeRecurringAnnualExpense = (id) => {
    setProject(prev => {
      const nextRecurring = (prev.recurringAnnualExpenses || []).filter(item => item.id !== id);
      return { ...prev, recurringAnnualExpenses: nextRecurring };
    });
  };

  const updateRecurringAnnualExpense = (id, updates) => {
    setProject(prev => {
      const nextRecurring = (prev.recurringAnnualExpenses || []).map(item => {
        if (item.id === id) {
          const plannedAmount = updates.plannedAmount !== undefined ? Number(updates.plannedAmount) : item.plannedAmount;
          const month = updates.month !== undefined ? Number(updates.month) : item.month;
          const day = updates.day !== undefined ? Number(updates.day) : item.day;
          return {
            ...item,
            ...updates,
            plannedAmount,
            month,
            day
          };
        }
        return item;
      });
      return { ...prev, recurringAnnualExpenses: nextRecurring };
    });
  };

  const addCategory = (categoryData) => {
    setProject(prev => {
      const nextCategories = [
        ...(prev.categories || DEFAULT_CATEGORIES),
        {
          id: 'cat_' + Math.random().toString(36).substr(2, 9),
          name: categoryData.name || 'New Category',
          icon: categoryData.icon || '📦',
          color: categoryData.color || '#6b7280'
        }
      ];
      return { ...prev, categories: nextCategories };
    });
  };

  const removeCategory = (id) => {
    setProject(prev => {
      const cats = prev.categories || DEFAULT_CATEGORIES;
      if (cats.length <= 1) return prev;
      const nextCategories = cats.filter(c => c.id !== id);
      return { ...prev, categories: nextCategories };
    });
  };

  return {
    project,
    timeline,
    annualSummary,
    summary,
    currencies: CURRENCY_LIST,
    updateProjectMeta,
    addIncomeInjection,
    removeIncomeInjection,
    addExpense,
    updateExpense,
    removeExpense,
    moveExpense,
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
  };
};
