import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { loadData, saveData, uid, getDateParts, getMonthKey, currency } from '../utils/helpers';
import { CATEGORIES, MONTHS, APP_VERSION } from '../utils/constants';
import { lightTheme, darkTheme } from '../utils/theme';

const AppContext = createContext(null);

const initialState = {
  view: 'dashboard',
  darkMode: loadData('darkMode', false),
  transactions: loadData('transactions', []),
  recurringExpenses: loadData('recurring', []),
  monthlyBalances: loadData('monthlyBalances', {}),
  savingsGoal: loadData('savingsGoal', 500),
  budgetGoals: loadData('budgetGoals', {}),
  debts: loadData('debts', []),
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  modal: null,
  editTx: null,
  editRecurring: null,
  editDebt: null,
  search: '',
  filterCat: 'all',
  filterPaid: 'all',
  sidebarOpen: typeof window !== 'undefined' && window.innerWidth >= 768,
  linkedAccounts: [],
  plaidLoading: false,
  importData: null,
  importNotification: null,
  autoBackupEnabled: loadData('autoBackup', false),
  lastBackupDate: loadData('lastBackup', null),
  notificationsEnabled: loadData('notifications', false),
  restoreData: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW': return { ...state, view: action.payload };
    case 'TOGGLE_DARK_MODE': return { ...state, darkMode: !state.darkMode };
    case 'SET_TRANSACTIONS': return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION': return { ...state, transactions: [...state.transactions, { ...action.payload, id: uid() }], modal: null };
    case 'UPDATE_TRANSACTION': return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t), editTx: null };
    case 'DELETE_TRANSACTION': return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case 'TOGGLE_PAID': return { ...state, transactions: state.transactions.map(t => t.id === action.payload ? { ...t, paid: !t.paid } : t) };
    case 'BATCH_SET_PAID': return { ...state, transactions: state.transactions.map(t => action.payload.ids.has(t.id) ? { ...t, paid: action.payload.paid } : t) };
    case 'SET_RECURRING': return { ...state, recurringExpenses: action.payload };
    case 'ADD_RECURRING': return { ...state, recurringExpenses: [...state.recurringExpenses, { ...action.payload, id: uid(), active: true }], modal: null };
    case 'UPDATE_RECURRING': return { ...state, recurringExpenses: state.recurringExpenses.map(e => e.id === action.payload.id ? action.payload : e), editRecurring: null };
    case 'DELETE_RECURRING': return { ...state, recurringExpenses: state.recurringExpenses.filter(r => r.id !== action.payload) };
    case 'TOGGLE_RECURRING_ACTIVE': return { ...state, recurringExpenses: state.recurringExpenses.map(r => r.id === action.payload ? { ...r, active: !r.active } : r) };
    case 'CREATE_FROM_RECURRING': {
      const r = action.payload;
      return { ...state, transactions: [...state.transactions, { id: uid(), date: new Date().toISOString().split('T')[0], desc: r.name, amount: -r.amount, category: r.category, paid: r.autoPay }] };
    }
    case 'SET_MONTHLY_BALANCES': return { ...state, monthlyBalances: action.payload };
    case 'SET_BEGINNING_BALANCE': {
      const key = getMonthKey(state.month, state.year);
      return { ...state, monthlyBalances: { ...state.monthlyBalances, [key]: { ...state.monthlyBalances[key], beginning: parseFloat(action.payload) || 0 } } };
    }
    case 'SET_ENDING_BALANCE': {
      const key = getMonthKey(state.month, state.year);
      return { ...state, monthlyBalances: { ...state.monthlyBalances, [key]: { ...state.monthlyBalances[key], ending: parseFloat(action.payload) || 0 } } };
    }
    case 'SET_SAVINGS_GOAL': return { ...state, savingsGoal: action.payload };
    case 'SET_BUDGET_GOALS': return { ...state, budgetGoals: action.payload };
    case 'SET_DEBTS': return { ...state, debts: action.payload };
    case 'ADD_DEBT': return { ...state, debts: [...state.debts, { ...action.payload, id: uid() }], modal: null };
    case 'UPDATE_DEBT': return { ...state, debts: state.debts.map(d => d.id === action.payload.id ? action.payload : d), editDebt: null };
    case 'DELETE_DEBT': return { ...state, debts: state.debts.filter(d => d.id !== action.payload) };
    case 'SET_MONTH': return { ...state, month: action.payload };
    case 'SET_YEAR': return { ...state, year: action.payload };
    case 'PREV_MONTH': return state.month === 0 ? { ...state, month: 11, year: state.year - 1 } : { ...state, month: state.month - 1 };
    case 'NEXT_MONTH': return state.month === 11 ? { ...state, month: 0, year: state.year + 1 } : { ...state, month: state.month + 1 };
    case 'SET_MODAL': return { ...state, modal: action.payload };
    case 'SET_EDIT_TX': return { ...state, editTx: action.payload };
    case 'SET_EDIT_RECURRING': return { ...state, editRecurring: action.payload };
    case 'SET_EDIT_DEBT': return { ...state, editDebt: action.payload };
    case 'SET_SEARCH': return { ...state, search: action.payload };
    case 'SET_FILTER_CAT': return { ...state, filterCat: action.payload };
    case 'SET_FILTER_PAID': return { ...state, filterPaid: action.payload };
    case 'TOGGLE_SIDEBAR': return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR': return { ...state, sidebarOpen: action.payload };
    case 'SET_LINKED_ACCOUNTS': return { ...state, linkedAccounts: action.payload };
    case 'SET_PLAID_LOADING': return { ...state, plaidLoading: action.payload };
    case 'SET_IMPORT_DATA': return { ...state, importData: action.payload };
    case 'SET_IMPORT_NOTIFICATION': return { ...state, importNotification: action.payload };
    case 'SET_AUTO_BACKUP': return { ...state, autoBackupEnabled: action.payload };
    case 'SET_LAST_BACKUP': return { ...state, lastBackupDate: action.payload };
    case 'SET_NOTIFICATIONS': return { ...state, notificationsEnabled: action.payload };
    case 'SET_RESTORE_DATA': return { ...state, restoreData: action.payload };
    case 'RESTORE_BACKUP': {
      const d = action.payload;
      return {
        ...state,
        transactions: d.transactions || [],
        recurringExpenses: d.recurringExpenses || [],
        monthlyBalances: d.monthlyBalances || {},
        savingsGoal: d.savingsGoal || state.savingsGoal,
        budgetGoals: d.budgetGoals || state.budgetGoals,
        debts: d.debts || state.debts,
        restoreData: null,
        modal: null,
      };
    }
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist state changes
  useEffect(() => { saveData('transactions', state.transactions); }, [state.transactions]);
  useEffect(() => { saveData('recurring', state.recurringExpenses); }, [state.recurringExpenses]);
  useEffect(() => { saveData('monthlyBalances', state.monthlyBalances); }, [state.monthlyBalances]);
  useEffect(() => { saveData('savingsGoal', state.savingsGoal); }, [state.savingsGoal]);
  useEffect(() => { saveData('budgetGoals', state.budgetGoals); }, [state.budgetGoals]);
  useEffect(() => { saveData('debts', state.debts); }, [state.debts]);
  useEffect(() => { saveData('autoBackup', state.autoBackupEnabled); }, [state.autoBackupEnabled]);
  useEffect(() => { saveData('lastBackup', state.lastBackupDate); }, [state.lastBackupDate]);
  useEffect(() => { saveData('notifications', state.notificationsEnabled); }, [state.notificationsEnabled]);
  useEffect(() => { saveData('darkMode', state.darkMode); }, [state.darkMode]);

  const theme = state.darkMode ? darkTheme : lightTheme;

  // Computed values
  const currentMonthKey = getMonthKey(state.month, state.year);

  const getBeginningBalance = useCallback((m, y) => {
    const key = getMonthKey(m, y);
    if (state.monthlyBalances[key]?.beginning !== undefined) return state.monthlyBalances[key].beginning;
    const prevMonth = m === 0 ? 11 : m - 1;
    const prevYear = m === 0 ? y - 1 : y;
    const prevKey = getMonthKey(prevMonth, prevYear);
    if (state.monthlyBalances[prevKey]?.ending !== undefined) return state.monthlyBalances[prevKey].ending;
    return 0;
  }, [state.monthlyBalances]);

  const beginningBalance = getBeginningBalance(state.month, state.year);

  const monthTx = useMemo(() => state.transactions.filter(t => {
    const parts = getDateParts(t.date);
    return parts && parts.month === state.month && parts.year === state.year;
  }), [state.transactions, state.month, state.year]);

  const stats = useMemo(() => {
    const income = monthTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const saved = monthTx.filter(t => t.category === 'savings').reduce((s, t) => s + Math.abs(t.amount), 0);
    const unpaidCount = monthTx.filter(t => !t.paid && t.amount < 0).length;
    const net = income - expenses;
    const calculatedEnding = beginningBalance + net;
    const ending = state.monthlyBalances[currentMonthKey]?.ending !== undefined ? state.monthlyBalances[currentMonthKey].ending : calculatedEnding;
    return { income, expenses, net, saved, unpaidCount, beginning: beginningBalance, ending, calculatedEnding };
  }, [monthTx, beginningBalance, state.monthlyBalances, currentMonthKey]);

  const catBreakdown = useMemo(() => {
    const map = {};
    monthTx.filter(t => t.amount < 0 && t.category !== 'savings').forEach(t => { map[t.category] = (map[t.category] || 0) + Math.abs(t.amount); });
    return Object.entries(map).map(([id, total]) => ({ ...CATEGORIES.find(c => c.id === id), total, pct: stats.expenses > 0 ? (total / stats.expenses) * 100 : 0 })).sort((a, b) => b.total - a.total);
  }, [monthTx, stats.expenses]);

  const filtered = useMemo(() => {
    let list = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (state.search) list = list.filter(t => t.desc.toLowerCase().includes(state.search.toLowerCase()));
    if (state.filterCat !== 'all') list = list.filter(t => t.category === state.filterCat);
    if (state.filterPaid === 'paid') list = list.filter(t => t.paid);
    if (state.filterPaid === 'unpaid') list = list.filter(t => !t.paid);
    return list;
  }, [state.transactions, state.search, state.filterCat, state.filterPaid]);

  const budgetAnalysis = useMemo(() => {
    return CATEGORIES.filter(c => c.id !== 'income').map(cat => {
      const spent = catBreakdown.find(c => c.id === cat.id)?.total || 0;
      const budget = state.budgetGoals[cat.id] || 0;
      const remaining = budget - spent;
      const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
      const status = budget === 0 ? 'no-budget' : percentUsed > 100 ? 'over' : percentUsed > 80 ? 'warning' : 'good';
      return { ...cat, spent, budget, remaining, percentUsed, status };
    }).filter(b => b.budget > 0 || b.spent > 0).sort((a, b) => b.spent - a.spent);
  }, [catBreakdown, state.budgetGoals]);

  const budgetStats = useMemo(() => {
    const totalBudget = Object.values(state.budgetGoals).reduce((s, v) => s + (v || 0), 0);
    const totalSpent = budgetAnalysis.reduce((s, b) => s + b.spent, 0);
    const categoriesOverBudget = budgetAnalysis.filter(b => b.status === 'over').length;
    const categoriesNearLimit = budgetAnalysis.filter(b => b.status === 'warning').length;
    return { totalBudget, totalSpent, remaining: totalBudget - totalSpent, categoriesOverBudget, categoriesNearLimit };
  }, [state.budgetGoals, budgetAnalysis]);

  const totalMonthlyRecurring = useMemo(() =>
    state.recurringExpenses.filter(r => r.active).reduce((s, r) => s + r.amount, 0),
  [state.recurringExpenses]);

  const spendingTrends = useMemo(() => {
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const m = (state.month - i + 12) % 12;
      const y = state.month - i < 0 ? state.year - 1 : state.year;
      const txs = state.transactions.filter(t => {
        const parts = getDateParts(t.date);
        return parts && parts.month === m && parts.year === y;
      });
      const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expenses = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      trends.push({ month: MONTHS[m], year: y, income, expenses, net: income - expenses });
    }
    return trends;
  }, [state.transactions, state.month, state.year]);

  const upcomingBills = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    return state.recurringExpenses.filter(r => r.active).map(r => {
      let dueDate = new Date(state.year, state.month, r.dueDay);
      if (r.dueDay < day) dueDate = new Date(state.year, state.month + 1, r.dueDay);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return { ...r, dueDate, daysUntil };
    }).filter(r => r.daysUntil >= 0 && r.daysUntil <= 7).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [state.recurringExpenses, state.month, state.year]);

  const cycleData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 12; i++) {
      const m = (state.month - 11 + i + 12) % 12;
      const y = state.year - (state.month - 11 + i < 0 ? 1 : 0);
      const key = getMonthKey(m, y);
      const txs = state.transactions.filter(t => {
        const parts = getDateParts(t.date);
        return parts && parts.month === m && parts.year === y;
      });
      const inc = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      const beginning = getBeginningBalance(m, y);
      const calculated = beginning + inc - exp;
      const ending = state.monthlyBalances[key]?.ending !== undefined ? state.monthlyBalances[key].ending : calculated;
      data.push({ month: MONTHS[m], year: y, monthNum: m, income: inc, expenses: exp, net: inc - exp, beginning, ending });
    }
    return data;
  }, [state.transactions, state.month, state.year, state.monthlyBalances, getBeginningBalance]);

  const debtPayoffPlan = useMemo(() => {
    if (state.debts.length === 0) return { snowball: [], avalanche: [], totalDebt: 0, totalInterest: 0 };
    const totalDebt = state.debts.reduce((s, d) => s + d.balance, 0);
    const totalMinPayment = state.debts.reduce((s, d) => s + d.minPayment, 0);
    const snowball = [...state.debts].sort((a, b) => a.balance - b.balance);
    const avalanche = [...state.debts].sort((a, b) => b.interestRate - a.interestRate);

    const calculatePayoff = (sortedDebts) => {
      let totalInterestPaid = 0;
      let months = 0;
      const maxMonths = 360;
      let balances = sortedDebts.map(d => ({ ...d, currentBalance: d.balance }));
      while (balances.some(d => d.currentBalance > 0) && months < maxMonths) {
        months++;
        let availableExtra = 0;
        for (let i = 0; i < balances.length; i++) {
          const d = balances[i];
          if (d.currentBalance <= 0) continue;
          const monthlyInterest = (d.currentBalance * (d.interestRate / 100)) / 12;
          totalInterestPaid += monthlyInterest;
          d.currentBalance += monthlyInterest;
          let payment = d.minPayment + (i === balances.findIndex(b => b.currentBalance > 0) ? availableExtra : 0);
          payment = Math.min(payment, d.currentBalance);
          d.currentBalance -= payment;
          if (d.currentBalance <= 0) availableExtra += d.minPayment;
        }
      }
      return { months, totalInterestPaid: Math.round(totalInterestPaid) };
    };

    const snowballResult = calculatePayoff(snowball);
    const avalancheResult = calculatePayoff(avalanche);

    return {
      snowball, avalanche, totalDebt, totalMinPayment,
      snowballMonths: snowballResult.months, snowballInterest: snowballResult.totalInterestPaid,
      avalancheMonths: avalancheResult.months, avalancheInterest: avalancheResult.totalInterestPaid,
      interestSavings: snowballResult.totalInterestPaid - avalancheResult.totalInterestPaid,
    };
  }, [state.debts]);

  const savingsRecommendations = useMemo(() => {
    const recs = [];
    const avgIncome = stats.income || 0;
    const savingsRate = avgIncome > 0 ? (stats.saved / avgIncome) * 100 : 0;
    const expenseRatio = avgIncome > 0 ? (stats.expenses / avgIncome) * 100 : 0;

    const checkCat = (id, threshold, recData) => {
      const val = catBreakdown.find(c => c.id === id)?.total || 0;
      if (val > threshold) recs.push({ ...recData, potential: val * recData.savePct });
    };

    checkCat('dining', 150, { id: 1, type: 'reduce', priority: 'high', title: 'Reduce Dining Out', description: `You spent ${currency(catBreakdown.find(c => c.id === 'dining')?.total || 0)} on dining. Consider meal prepping.`, savePct: 0.4, icon: '🍽️', tips: ['Cook at home 2 more days/week', 'Bring lunch to work', 'Use meal planning apps'] });
    checkCat('subscriptions', 50, { id: 2, type: 'audit', priority: 'medium', title: 'Audit Subscriptions', description: `Review subscriptions and cancel unused services.`, savePct: 0.3, icon: '📱', tips: ['Cancel unused streaming', 'Look for annual discounts', 'Share family plans'] });
    checkCat('shopping', 200, { id: 3, type: 'reduce', priority: 'high', title: 'Curb Impulse Shopping', description: `Try the 24-hour rule before non-essential purchases.`, savePct: 0.35, icon: '🛍️', tips: ['Wait 24hrs before buying over $50', 'Unsubscribe from retail emails', 'Use a shopping list'] });
    checkCat('entertainment', 200, { id: 6, type: 'reduce', priority: 'medium', title: 'Find Free Entertainment', description: `Look for free local events and activities.`, savePct: 0.3, icon: '🎬', tips: ['Check library for free events', 'Host game nights at home', 'Explore free outdoor activities'] });
    checkCat('transportation', 400, { id: 7, type: 'reduce', priority: 'medium', title: 'Lower Transport Costs', description: `Consider carpooling or combining trips.`, savePct: 0.2, icon: '🚗', tips: ['Combine errands', 'Use GasBuddy', 'Carpool 2-3 days/week'] });
    checkCat('groceries', 600, { id: 8, type: 'reduce', priority: 'medium', title: 'Optimize Groceries', description: `Smart shopping can save 15-20% monthly.`, savePct: 0.15, icon: '🛒', tips: ['Make a list and stick to it', 'Buy store brands', 'Use cashback apps'] });

    if (savingsRate < 10 && avgIncome > 0) {
      recs.push({ id: 4, type: 'alert', priority: 'high', title: 'Savings Rate Below 10%', description: `Saving ${savingsRate.toFixed(1)}% — experts recommend 20%.`, potential: avgIncome * 0.1 - stats.saved, icon: '⚠️', tips: ['Auto-transfer to savings on payday', 'Start with $25-50/paycheck', 'Build 3-month emergency fund'] });
    } else if (savingsRate < 20 && avgIncome > 0) {
      recs.push({ id: 4, type: 'increase', priority: 'medium', title: 'Boost Savings to 20%', description: `Current: ${savingsRate.toFixed(1)}%. Add ${currency(avgIncome * 0.2 - stats.saved)} more.`, potential: avgIncome * 0.2 - stats.saved, icon: '📈', tips: ['Increase savings 1%/month', 'Save windfalls and bonuses', 'Follow 50/30/20 rule'] });
    }

    if (expenseRatio > 90 && avgIncome > 0) {
      recs.push({ id: 10, type: 'alert', priority: 'high', title: 'Living Paycheck to Paycheck', description: `Spending ${expenseRatio.toFixed(0)}% of income. Almost no buffer.`, potential: avgIncome * 0.1, icon: '🔴', tips: ['Track every expense for 1 week', 'Cut 1 non-essential expense now', 'Build $1k starter emergency fund'] });
    }

    if (stats.unpaidCount > 3) {
      recs.push({ id: 11, type: 'alert', priority: 'high', title: 'Manage Unpaid Bills', description: `${stats.unpaidCount} unpaid expenses. Stay on top of due dates.`, potential: 0, icon: '📋', tips: ['Set calendar reminders', 'Enable autopay for fixed bills', 'Review bills weekly'] });
    }

    if (savingsRate >= 20) {
      recs.push({ id: 5, type: 'success', priority: 'low', title: 'Excellent Savings Rate!', description: `Saving ${savingsRate.toFixed(1)}% — above the 20% target!`, potential: 0, icon: '🏆', tips: ['Max out retirement accounts', 'Look into index fund investing', 'Keep it up!'] });
    }

    return recs.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
  }, [catBreakdown, stats]);

  const value = {
    state, dispatch, theme,
    monthTx, stats, catBreakdown, filtered, budgetAnalysis, budgetStats,
    totalMonthlyRecurring, spendingTrends, upcomingBills, cycleData,
    debtPayoffPlan, savingsRecommendations, currentMonthKey, getBeginningBalance,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
