import { MONTHS, CATEGORIES } from './constants';

export const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);

export const currency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export const shortDate = (dateStr) => {
  if (!dateStr) return '';
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${MONTHS[parseInt(match[2]) - 1]} ${parseInt(match[3])}`;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const getDateParts = (dateStr) => {
  if (!dateStr) return null;
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return { year: parseInt(match[1]), month: parseInt(match[2]) - 1, day: parseInt(match[3]) };
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }
  return null;
};

export const getMonthKey = (m, y) => `${y}-${String(m).padStart(2, '0')}`;

export const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// Persistence helpers with debounce
let saveTimeout = null;
const pendingSaves = {};

const flushSaves = () => {
  try {
    for (const [key, data] of Object.entries(pendingSaves)) {
      localStorage.setItem('bb_' + key, JSON.stringify(data));
    }
  } catch (err) {
    console.warn('[BalanceBooks] Failed to save data to localStorage:', err);
  }
  for (const key in pendingSaves) delete pendingSaves[key];
};

export const saveData = (key, data) => {
  pendingSaves[key] = data;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(flushSaves, 300);
};

export const loadData = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem('bb_' + key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// CSV escape helper — prevents CSV injection (OWASP recommendation).
// Fields starting with =, +, -, @, tab, or CR are wrapped in quotes with a
// leading tab character so spreadsheet software treats them as plain text.
const escapeCSVField = (value) => {
  const str = String(value ?? '');
  const needsFormulaGuard = /^[=+\-@\t\r]/.test(str);
  const needsQuoting = needsFormulaGuard || str.includes(',') || str.includes('"') || str.includes('\n');
  if (!needsQuoting) return str;
  const escaped = str.replace(/"/g, '""');
  return needsFormulaGuard ? `"\t${escaped}"` : `"${escaped}"`;
};

export const exportCSV = (transactions) => {
  const rows = [
    ['Balance Books Pro - Transaction Export'],
    [`Export Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
    ['Report Period: All Transactions'],
    [''],
    ['Date', 'Description', 'Amount', 'Category', 'Type', 'Status']
  ];

  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  sorted.forEach(t => {
    const cat = CATEGORIES.find(c => c.id === t.category);
    rows.push([
      escapeCSVField(t.date),
      escapeCSVField(t.desc),
      escapeCSVField(t.amount.toFixed(2)),
      escapeCSVField(cat ? cat.name : t.category),
      t.amount >= 0 ? 'Income' : 'Expense',
      t.paid ? 'Paid' : 'Unpaid',
    ]);
  });

  const totalIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  rows.push([''], ['--- SUMMARY ---']);
  rows.push(['Total Income', '', totalIncome.toFixed(2)]);
  rows.push(['Total Expenses', '', (-totalExpenses).toFixed(2)]);
  rows.push(['Net Amount', '', (totalIncome - totalExpenses).toFixed(2)]);
  rows.push(['Total Transactions', '', transactions.length]);

  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `balance-books-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
};

export const downloadTemplate = () => {
  const a = document.createElement('a');
  a.href = '/BalanceBooks-Import-Template.xlsx';
  a.download = 'BalanceBooks-Import-Template.xlsx';
  a.click();
};
