export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0.3';

export const CATEGORIES = [
  { id: 'income', name: 'Income', color: '#059669', bg: '#ecfdf5', icon: '💵' },
  { id: 'housing', name: 'Housing', color: '#4f46e5', bg: '#eef2ff', icon: '🏠' },
  { id: 'utilities', name: 'Utilities', color: '#7c3aed', bg: '#f5f3ff', icon: '💡' },
  { id: 'groceries', name: 'Groceries', color: '#16a34a', bg: '#f0fdf4', icon: '🛒' },
  { id: 'transportation', name: 'Transportation', color: '#d97706', bg: '#fffbeb', icon: '🚗' },
  { id: 'healthcare', name: 'Healthcare', color: '#dc2626', bg: '#fef2f2', icon: '🏥' },
  { id: 'insurance', name: 'Insurance', color: '#0284c7', bg: '#f0f9ff', icon: '🛡️' },
  { id: 'entertainment', name: 'Entertainment', color: '#db2777', bg: '#fdf2f8', icon: '🎬' },
  { id: 'dining', name: 'Dining', color: '#ea580c', bg: '#fff7ed', icon: '🍽️' },
  { id: 'shopping', name: 'Shopping', color: '#9333ea', bg: '#faf5ff', icon: '🛍️' },
  { id: 'subscriptions', name: 'Subscriptions', color: '#0d9488', bg: '#f0fdfa', icon: '📱' },
  { id: 'education', name: 'Education', color: '#2563eb', bg: '#eff6ff', icon: '📚' },
  { id: 'tithes', name: 'Tithes & Offerings', color: '#7c3aed', bg: '#f5f3ff', icon: '⛪' },
  { id: 'savings', name: 'Savings', color: '#047857', bg: '#ecfdf5', icon: '💰' },
  { id: 'investment', name: 'Investment', color: '#065f46', bg: '#ecfdf5', icon: '📈' },
  { id: 'debt', name: 'Debt Payment', color: '#b91c1c', bg: '#fef2f2', icon: '💳' },
  { id: 'childcare', name: 'Childcare', color: '#f472b6', bg: '#fdf2f8', icon: '👶' },
  { id: 'pets', name: 'Pets', color: '#f59e0b', bg: '#fffbeb', icon: '🐾' },
  { id: 'personal', name: 'Personal Care', color: '#ec4899', bg: '#fdf2f8', icon: '💇' },
  { id: 'gifts', name: 'Gifts & Donations', color: '#8b5cf6', bg: '#f5f3ff', icon: '🎁' },
  { id: 'transfer', name: 'Transfer', color: '#475569', bg: '#f8fafc', icon: '🔄' },
  { id: 'other', name: 'Other', color: '#64748b', bg: '#f8fafc', icon: '📦' },
];

export const FREQUENCY_OPTIONS = [
  { id: 'weekly', name: 'Weekly', days: 7 },
  { id: 'biweekly', name: 'Bi-Weekly', days: 14 },
  { id: 'monthly', name: 'Monthly', days: 30 },
  { id: 'quarterly', name: 'Quarterly', days: 90 },
  { id: 'yearly', name: 'Yearly', days: 365 },
];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const TRANSACTIONS_PAGE_SIZE = 50;
export const RECENT_TRANSACTIONS_LIMIT = 6;
export const UPCOMING_BILLS_LIMIT = 3;
export const PIE_CHART_CATEGORIES_LIMIT = 8;
export const SPENDING_CATEGORIES_LIMIT = 5;
export const DEBT_PAYOFF_MAX_MONTHS = 360;
export const SPENDING_HISTORY_MONTHS = 6;

export const NAV_SECTIONS = [
  { section: 'Overview', items: [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'transactions', icon: '💳', label: 'Transactions' },
  ]},
  { section: 'Planning', items: [
    { id: 'budget', icon: '🎯', label: 'Budget Goals' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
    { id: 'debts', icon: '💳', label: 'Debt Payoff' },
  ]},
  { section: 'Automation', items: [
    { id: 'recurring', icon: '🔄', label: 'Recurring' },
    { id: 'accounts', icon: '🏦', label: 'Accounts' },
  ]},
  { section: 'Insights', items: [
    { id: 'cycle', icon: '📅', label: '12-Month Cycle' },
    { id: 'savings', icon: '🐷', label: 'Savings' },
    { id: 'recommendations', icon: '💡', label: 'Smart Tips' },
  ]},
  { section: 'System', items: [
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]},
];
