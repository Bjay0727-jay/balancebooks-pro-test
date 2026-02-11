import Dexie from 'dexie';

const db = new Dexie('BalanceBooksPro');

db.version(1).stores({
  transactions: 'id, date, category, paid, [date+category]',
});

// Migration: move transactions from localStorage to IndexedDB on first load
export async function migrateTransactions() {
  const count = await db.transactions.count();
  if (count > 0) return; // already migrated

  try {
    const raw = localStorage.getItem('bb_transactions');
    if (raw) {
      const txs = JSON.parse(raw);
      if (Array.isArray(txs) && txs.length > 0) {
        await db.transactions.bulkPut(txs);
      }
    }
  } catch (err) {
    console.warn('[BalanceBooks] IndexedDB migration failed, localStorage data used as fallback:', err);
  }
}

export async function loadTransactions() {
  try {
    const txs = await db.transactions.toArray();
    if (txs.length > 0) return txs;
  } catch (err) {
    console.warn('[BalanceBooks] Failed to load from IndexedDB, falling back to localStorage:', err);
  }
  try {
    const raw = localStorage.getItem('bb_transactions');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[BalanceBooks] Failed to parse transactions from localStorage:', err);
    return [];
  }
}

export async function saveTransactions(transactions) {
  try {
    await db.transaction('rw', db.transactions, async () => {
      await db.transactions.clear();
      if (transactions.length > 0) {
        await db.transactions.bulkPut(transactions);
      }
    });
  } catch (err) {
    console.warn('[BalanceBooks] Failed to save to IndexedDB, falling back to localStorage:', err);
    try {
      localStorage.setItem('bb_transactions', JSON.stringify(transactions));
    } catch (lsErr) {
      console.warn('[BalanceBooks] localStorage fallback also failed:', lsErr);
    }
  }
}

export async function getTransactionsByMonth(year, month) {
  // month is 0-indexed, dates are stored as YYYY-MM-DD strings
  const monthStr = String(month + 1).padStart(2, '0');
  const start = `${year}-${monthStr}-01`;
  const end = `${year}-${monthStr}-31`;
  try {
    return await db.transactions.where('date').between(start, end, true, true).toArray();
  } catch (err) {
    console.warn('[BalanceBooks] Failed to query transactions by month from IndexedDB:', err);
    return [];
  }
}

export default db;
