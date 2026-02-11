import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import { loadData, saveData, uid, getDateParts, getMonthKey, currency } from '../utils/helpers';
import { CATEGORIES, MONTHS, APP_VERSION } from '../utils/constants';
import { lightTheme, darkTheme } from '../utils/theme';
import { migrateTransactions, loadTransactions, saveTransactions } from '../utils/db';

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
  const [dbReady, setDbReady] = useState(false);
  const txVersionRef = React.useRef(0);

  // Load transactions from IndexedDB on mount (upgrades from localStorage)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await migrateTransactions();
        const txs = await loadTransactions();
        if (!cancelled && txs.length > 0) {
          dispatch({ type: 'SET_TRANSACTIONS', payload: txs });
        }
      } catch (err) {
        console.warn('[BalanceBooks] IndexedDB init failed, using localStorage fallback:', err);
      }
      if (!cancelled) setDbReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist transactions to IndexedDB — skip the first trigger after dbReady
  useEffect(() => {
    if (!dbReady) return;
    txVersionRef.current++;
    if (txVersionRef.current <= 1) return; // skip the render right after dbReady flips
    saveTransactions(state.transactions);
    // Also keep localStorage as fallback
    saveData('transactions', state.transactions);
  }, [state.transactions, dbReady]);
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

  const getCategoryTips = (catId) => {
    const tips = {
      housing: ['Review rent/mortgage for refinance options', 'Consider downsizing or roommates', 'Negotiate property tax assessments'],
      utilities: ['Switch to LED bulbs', 'Use programmable thermostats', 'Compare electric/gas providers'],
      groceries: ['Make a list and stick to it', 'Buy store brands', 'Use cashback apps like Ibotta'],
      transportation: ['Combine errands into one trip', 'Use GasBuddy for cheapest gas', 'Carpool 2-3 days/week'],
      healthcare: ['Use HSA/FSA accounts', 'Ask about generic prescriptions', 'Compare provider prices'],
      insurance: ['Shop around annually', 'Bundle policies for discounts', 'Raise deductibles if you have savings'],
      entertainment: ['Check library for free events', 'Host game nights at home', 'Explore free outdoor activities'],
      dining: ['Cook at home 2 more days/week', 'Bring lunch to work', 'Use meal planning apps'],
      shopping: ['Wait 24hrs before buying over $50', 'Unsubscribe from retail emails', 'Use a shopping list'],
      subscriptions: ['Cancel unused streaming services', 'Look for annual discounts', 'Share family plans'],
      education: ['Look for scholarships/grants', 'Use free online courses', 'Check employer tuition benefits'],
      childcare: ['Explore FSA dependent care', 'Check community programs', 'Consider co-op childcare'],
      pets: ['Buy food in bulk', 'Keep up with preventive care', 'Compare vet prices'],
      personal: ['Look for salon school discounts', 'Buy products in bulk', 'Try DIY treatments'],
      debt: ['Pay more than minimums', 'Use the avalanche method', 'Consider consolidation'],
      tithes: ['Track for tax deductions', 'Set up automatic giving', 'Review giving goals annually'],
    };
    return tips[catId] || ['Review this category for savings opportunities', 'Compare prices before purchasing', 'Set a monthly budget for this category'];
  };

  const savingsRecommendations = useMemo(() => {
    const recs = [];
    const avgIncome = stats.income || 0;
    const hasData = state.transactions.length > 0;
    const hasMonthData = monthTx.length > 0;

    if (!hasData) {
      recs.push({ id: 20, type: 'increase', priority: 'low', title: 'Get Started', description: 'Add your first transactions to receive personalized money tips and spending insights.', potential: 0, tips: ['Add this month\'s income and expenses', 'Set budget goals for each category', 'Import past transactions via CSV or Excel'] });
      return recs;
    }

    if (!hasMonthData) {
      recs.push({ id: 22, type: 'increase', priority: 'low', title: 'No Data This Month', description: 'Add transactions for the current month to see personalized recommendations.', potential: 0, tips: ['Add income and expense transactions', 'Import from your bank statement', 'Use recurring bills to auto-generate entries'] });
      return recs;
    }

    // --- Monthly spending summary ---
    recs.push({
      id: 100, type: avgIncome > 0 && stats.expenses <= avgIncome ? 'success' : 'alert',
      priority: 'low',
      title: 'Monthly Spending Summary',
      description: avgIncome > 0
        ? `Income: ${currency(avgIncome)} | Expenses: ${currency(stats.expenses)} | Net: ${currency(avgIncome - stats.expenses)}`
        : `Total expenses: ${currency(stats.expenses)} across ${monthTx.length} transactions. Add income transactions for a complete picture.`,
      potential: 0,
      tips: avgIncome === 0
        ? ['Add income transactions (paychecks, freelance, etc.)', 'Income tracking unlocks savings rate analysis', 'Use the "income" category for all earnings']
        : [],
    });

    // --- Missing income warning ---
    if (avgIncome === 0 && stats.expenses > 0) {
      recs.push({ id: 101, type: 'alert', priority: 'high', title: 'No Income Recorded', description: `You have ${currency(stats.expenses)} in expenses but no income tracked. Add your income to unlock savings rate tips and full budget analysis.`, potential: 0, tips: ['Add paycheck/salary as an income transaction', 'Include side income and freelance earnings', 'Set the category to "Income" with a positive amount'] });
    }

    // --- Top spending categories (dynamic — shows top 3 expense categories) ---
    if (catBreakdown.length > 0) {
      const top = catBreakdown.slice(0, 3);
      top.forEach((cat, i) => {
        const pctOfTotal = stats.expenses > 0 ? ((cat.total / stats.expenses) * 100).toFixed(0) : 0;
        const savePct = i === 0 ? 0.2 : i === 1 ? 0.15 : 0.1;
        recs.push({
          id: 200 + i,
          type: i === 0 ? 'reduce' : 'audit',
          priority: cat.total > stats.expenses * 0.3 ? 'high' : 'medium',
          title: `${cat.icon || '📊'} ${cat.name}: ${currency(cat.total)}`,
          description: `${cat.name} is ${pctOfTotal}% of your spending (${currency(cat.total)}). ${i === 0 ? 'This is your biggest expense category.' : 'Look for ways to trim this.'}`,
          potential: Math.round(cat.total * savePct),
          tips: getCategoryTips(cat.id),
        });
      });
    }

    // --- Savings rate (only when income exists) ---
    if (avgIncome > 0) {
      const savingsRate = (stats.saved / avgIncome) * 100;
      const expenseRatio = (stats.expenses / avgIncome) * 100;

      if (savingsRate >= 20) {
        recs.push({ id: 5, type: 'success', priority: 'low', title: 'Excellent Savings Rate!', description: `Saving ${savingsRate.toFixed(1)}% of income — above the recommended 20% target!`, potential: 0, tips: ['Max out retirement accounts', 'Look into index fund investing', 'Keep it up!'] });
      } else if (savingsRate < 10) {
        recs.push({ id: 4, type: 'alert', priority: 'high', title: 'Savings Rate Below 10%', description: `Saving ${savingsRate.toFixed(1)}% of income — experts recommend at least 20%.`, potential: Math.round(avgIncome * 0.1 - stats.saved), tips: ['Auto-transfer to savings on payday', 'Start with $25-50/paycheck', 'Build 3-month emergency fund'] });
      } else {
        recs.push({ id: 4, type: 'increase', priority: 'medium', title: 'Boost Savings to 20%', description: `Currently saving ${savingsRate.toFixed(1)}%. Adding ${currency(avgIncome * 0.2 - stats.saved)} more would hit the target.`, potential: Math.round(avgIncome * 0.2 - stats.saved), tips: ['Increase savings 1%/month', 'Save windfalls and bonuses', 'Follow 50/30/20 rule'] });
      }

      if (expenseRatio > 90) {
        recs.push({ id: 10, type: 'alert', priority: 'high', title: 'Living Paycheck to Paycheck', description: `Spending ${expenseRatio.toFixed(0)}% of income leaves almost no buffer.`, potential: Math.round(avgIncome * 0.1), tips: ['Track every expense for 1 week', 'Cut 1 non-essential expense now', 'Build $1k starter emergency fund'] });
      }
    }

    // --- Unpaid bills ---
    if (stats.unpaidCount > 3) {
      recs.push({ id: 11, type: 'alert', priority: 'high', title: 'Manage Unpaid Bills', description: `You have ${stats.unpaidCount} unpaid expenses this month. Stay on top of due dates to avoid late fees.`, potential: 0, tips: ['Set calendar reminders', 'Enable autopay for fixed bills', 'Review bills weekly'] });
    } else if (stats.unpaidCount > 0) {
      recs.push({ id: 11, type: 'audit', priority: 'medium', title: `${stats.unpaidCount} Unpaid Transaction${stats.unpaidCount > 1 ? 's' : ''}`, description: `You have ${stats.unpaidCount} pending transaction${stats.unpaidCount > 1 ? 's' : ''} this month. Mark them paid as they clear.`, potential: 0, tips: ['Go to Transactions and mark items paid', 'Use bulk actions to mark multiple at once'] });
    }

    // --- Spending trend analysis ---
    if (spendingTrends.length >= 2) {
      const current = spendingTrends[spendingTrends.length - 1];
      const prev = spendingTrends[spendingTrends.length - 2];
      if (prev.expenses > 0 && current.expenses > prev.expenses * 1.2) {
        const increase = ((current.expenses - prev.expenses) / prev.expenses * 100).toFixed(0);
        recs.push({ id: 12, type: 'alert', priority: 'medium', title: 'Spending Increased', description: `Expenses are up ${increase}% compared to last month (${currency(prev.expenses)} → ${currency(current.expenses)}).`, potential: Math.round(current.expenses - prev.expenses), tips: ['Review recent purchases', 'Compare with your budget goals', 'Identify new recurring charges'] });
      } else if (prev.expenses > 0 && current.expenses < prev.expenses * 0.8) {
        const decrease = ((prev.expenses - current.expenses) / prev.expenses * 100).toFixed(0);
        recs.push({ id: 12, type: 'success', priority: 'low', title: 'Spending Decreased', description: `Expenses dropped ${decrease}% from last month (${currency(prev.expenses)} → ${currency(current.expenses)}). Great job!`, potential: 0, tips: ['Keep the momentum going', 'Put the savings toward your goals'] });
      }
    }

    // --- Budget over-limit ---
    if (budgetStats.categoriesOverBudget > 0) {
      recs.push({ id: 13, type: 'alert', priority: 'high', title: `${budgetStats.categoriesOverBudget} Budget(s) Over Limit`, description: `You've exceeded your budget in ${budgetStats.categoriesOverBudget} categor${budgetStats.categoriesOverBudget === 1 ? 'y' : 'ies'}. Review your Budget Goals page.`, potential: 0, tips: ['Pause non-essential spending in over-budget categories', 'Adjust budgets if they are unrealistic', 'Track daily spending in problem categories'] });
    } else if (budgetStats.totalBudget === 0 && stats.expenses > 0) {
      recs.push({ id: 15, type: 'increase', priority: 'medium', title: 'Set Budget Goals', description: 'You don\'t have any budget goals set. Setting budgets helps you control spending by category.', potential: 0, tips: ['Go to Budget Goals and set limits', 'Start with your top 3 spending categories', 'Use the 50/30/20 rule as a starting point'] });
    }

    // --- Debt recommendations ---
    if (state.debts.length > 0) {
      const totalDebt = state.debts.reduce((s, d) => s + d.balance, 0);
      const highInterest = state.debts.filter(d => d.interestRate > 15);
      if (highInterest.length > 0) {
        recs.push({ id: 14, type: 'alert', priority: 'high', title: 'High-Interest Debt', description: `You have ${highInterest.length} debt(s) above 15% APR totaling ${currency(highInterest.reduce((s, d) => s + d.balance, 0))}. Prioritize paying these down.`, potential: 0, tips: ['Use the avalanche method (highest rate first)', 'Consider balance transfer offers', 'Pay more than minimums when possible'] });
      } else if (totalDebt > 0) {
        recs.push({ id: 14, type: 'increase', priority: 'medium', title: 'Keep Paying Down Debt', description: `Total debt: ${currency(totalDebt)}. Check the Debt Payoff page for your plan.`, potential: 0, tips: ['Stick to your payoff schedule', 'Apply any extra funds to debt', 'Celebrate milestones along the way'] });
      }
    }

    return recs.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
  }, [catBreakdown, stats, monthTx, state.transactions.length, spendingTrends, budgetStats, state.debts]);

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
