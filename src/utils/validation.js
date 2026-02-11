import { CATEGORIES } from './constants';

const VALID_CATEGORY_IDS = new Set(CATEGORIES.map(c => c.id));

export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_TRANSACTION_COUNT = 50_000;
const MAX_STRING_LENGTH = 500;

function isFiniteNum(val) {
  return typeof val === 'number' && Number.isFinite(val);
}

function sanitizeString(val, maxLen = MAX_STRING_LENGTH) {
  if (typeof val !== 'string') return String(val ?? '');
  return val.slice(0, maxLen).trim();
}

export function validateTransaction(tx) {
  if (!tx || typeof tx !== 'object') return null;

  const id = typeof tx.id === 'string' ? tx.id : undefined;
  const date = typeof tx.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(tx.date) ? tx.date : null;
  const desc = sanitizeString(tx.desc);
  const amount = isFiniteNum(tx.amount) ? tx.amount : parseFloat(tx.amount);
  const category = VALID_CATEGORY_IDS.has(tx.category) ? tx.category : 'other';
  const paid = Boolean(tx.paid);

  if (!date || !Number.isFinite(amount)) return null;

  return { id, date, desc, amount, category, paid };
}

function validateRecurringExpense(r) {
  if (!r || typeof r !== 'object') return null;

  const id = typeof r.id === 'string' ? r.id : undefined;
  const name = sanitizeString(r.name);
  const amount = isFiniteNum(r.amount) ? r.amount : parseFloat(r.amount);
  const dueDay = typeof r.dueDay === 'number' && r.dueDay >= 1 && r.dueDay <= 31
    ? Math.floor(r.dueDay) : null;
  const category = VALID_CATEGORY_IDS.has(r.category) ? r.category : 'other';
  const active = Boolean(r.active);
  const autoPay = Boolean(r.autoPay);

  if (!name || !Number.isFinite(amount) || !dueDay) return null;

  return { id, name, amount, dueDay, category, active, autoPay };
}

function validateDebt(d) {
  if (!d || typeof d !== 'object') return null;

  const id = typeof d.id === 'string' ? d.id : undefined;
  const name = sanitizeString(d.name);
  const balance = isFiniteNum(d.balance) ? d.balance : parseFloat(d.balance);
  const interestRate = isFiniteNum(d.interestRate) ? d.interestRate : parseFloat(d.interestRate);
  const minPayment = isFiniteNum(d.minPayment) ? d.minPayment : parseFloat(d.minPayment);

  if (!name || !Number.isFinite(balance) || !Number.isFinite(interestRate) || !Number.isFinite(minPayment)) return null;

  return { id, name, balance, interestRate, minPayment };
}

function validateMonthlyBalances(mb) {
  if (!mb || typeof mb !== 'object' || Array.isArray(mb)) return {};

  const result = {};
  for (const [key, val] of Object.entries(mb)) {
    if (!/^\d{4}-\d{2}$/.test(key)) continue;
    if (!val || typeof val !== 'object') continue;
    const entry = {};
    if (isFiniteNum(val.beginning)) entry.beginning = val.beginning;
    if (isFiniteNum(val.ending)) entry.ending = val.ending;
    if (Object.keys(entry).length > 0) result[key] = entry;
  }
  return result;
}

function validateBudgetGoals(bg) {
  if (!bg || typeof bg !== 'object' || Array.isArray(bg)) return {};

  const result = {};
  for (const [key, val] of Object.entries(bg)) {
    if (!VALID_CATEGORY_IDS.has(key)) continue;
    const num = isFiniteNum(val) ? val : parseFloat(val);
    if (Number.isFinite(num) && num >= 0) result[key] = num;
  }
  return result;
}

/**
 * Validates and sanitizes a full backup payload.
 * Returns { valid, error?, data?, skipped? }.
 */
export function validateBackupData(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'Invalid backup file format.' };
  }

  const data = parsed.data || parsed;
  const rawTx = data.transactions || parsed.transactions;

  if (!Array.isArray(rawTx)) {
    return { valid: false, error: 'No transactions array found in backup.' };
  }

  if (rawTx.length > MAX_TRANSACTION_COUNT) {
    return { valid: false, error: `Backup contains ${rawTx.length.toLocaleString()} transactions, exceeding the ${MAX_TRANSACTION_COUNT.toLocaleString()} limit.` };
  }

  const transactions = rawTx.map(validateTransaction).filter(Boolean);
  const rawRecurring = data.recurringExpenses || parsed.recurringExpenses || [];
  const recurringExpenses = Array.isArray(rawRecurring)
    ? rawRecurring.map(validateRecurringExpense).filter(Boolean) : [];
  const rawDebts = data.debts || parsed.debts || [];
  const debts = Array.isArray(rawDebts)
    ? rawDebts.map(validateDebt).filter(Boolean) : [];
  const monthlyBalances = validateMonthlyBalances(data.monthlyBalances || parsed.monthlyBalances);
  const budgetGoals = validateBudgetGoals(data.budgetGoals || parsed.budgetGoals);

  const rawSavingsGoal = data.savingsGoal ?? parsed.savingsGoal;
  const savingsGoal = isFiniteNum(rawSavingsGoal) ? rawSavingsGoal
    : (Number.isFinite(parseFloat(rawSavingsGoal)) ? parseFloat(rawSavingsGoal) : undefined);

  return {
    valid: true,
    data: { transactions, recurringExpenses, debts, monthlyBalances, budgetGoals, savingsGoal },
    skipped: {
      transactions: rawTx.length - transactions.length,
      recurringExpenses: (Array.isArray(rawRecurring) ? rawRecurring.length : 0) - recurringExpenses.length,
      debts: (Array.isArray(rawDebts) ? rawDebts.length : 0) - debts.length,
    },
  };
}

/**
 * Validates an array of imported transactions (from CSV / Excel).
 * Drops invalid rows and caps at MAX_TRANSACTION_COUNT.
 */
export function validateImportTransactions(transactions) {
  if (!Array.isArray(transactions)) return [];
  return transactions.slice(0, MAX_TRANSACTION_COUNT).map(validateTransaction).filter(Boolean);
}
