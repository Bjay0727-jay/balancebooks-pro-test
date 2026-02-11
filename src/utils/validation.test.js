import { describe, it, expect } from 'vitest';
import {
  validateTransaction,
  validateBackupData,
  validateImportTransactions,
  MAX_IMPORT_FILE_SIZE,
  MAX_TRANSACTION_COUNT,
} from './validation';

// --- validateTransaction ---

describe('validateTransaction', () => {
  const valid = { date: '2025-01-15', desc: 'Groceries', amount: 42.5, category: 'groceries', paid: true };

  it('returns a valid transaction unchanged', () => {
    const result = validateTransaction(valid);
    expect(result).toMatchObject({ date: '2025-01-15', desc: 'Groceries', amount: 42.5, category: 'groceries', paid: true });
  });

  it('preserves id when present', () => {
    const result = validateTransaction({ ...valid, id: 'abc-123' });
    expect(result.id).toBe('abc-123');
  });

  it('returns null for null/undefined/non-object', () => {
    expect(validateTransaction(null)).toBeNull();
    expect(validateTransaction(undefined)).toBeNull();
    expect(validateTransaction('string')).toBeNull();
    expect(validateTransaction(42)).toBeNull();
  });

  it('returns null when date is missing or invalid', () => {
    expect(validateTransaction({ ...valid, date: undefined })).toBeNull();
    expect(validateTransaction({ ...valid, date: 'not-a-date' })).toBeNull();
    expect(validateTransaction({ ...valid, date: 123 })).toBeNull();
  });

  it('returns null when amount is not a finite number', () => {
    expect(validateTransaction({ ...valid, amount: NaN })).toBeNull();
    expect(validateTransaction({ ...valid, amount: Infinity })).toBeNull();
    expect(validateTransaction({ ...valid, amount: 'abc' })).toBeNull();
  });

  it('parses string amounts when valid', () => {
    const result = validateTransaction({ ...valid, amount: '99.99' });
    expect(result.amount).toBe(99.99);
  });

  it('defaults unknown category to "other"', () => {
    const result = validateTransaction({ ...valid, category: 'nonexistent' });
    expect(result.category).toBe('other');
  });

  it('accepts all valid categories', () => {
    for (const cat of ['income', 'housing', 'utilities', 'groceries', 'other']) {
      const result = validateTransaction({ ...valid, category: cat });
      expect(result.category).toBe(cat);
    }
  });

  it('coerces paid to boolean', () => {
    expect(validateTransaction({ ...valid, paid: 0 }).paid).toBe(false);
    expect(validateTransaction({ ...valid, paid: 1 }).paid).toBe(true);
    expect(validateTransaction({ ...valid, paid: undefined }).paid).toBe(false);
  });

  it('truncates long desc strings', () => {
    const longDesc = 'x'.repeat(1000);
    const result = validateTransaction({ ...valid, desc: longDesc });
    expect(result.desc.length).toBe(500);
  });

  it('sanitizes non-string desc', () => {
    const result = validateTransaction({ ...valid, desc: 123 });
    expect(result.desc).toBe('123');
  });
});

// --- validateBackupData ---

describe('validateBackupData', () => {
  const minimalBackup = {
    transactions: [
      { date: '2025-01-01', desc: 'Test', amount: 10, category: 'other', paid: false },
    ],
  };

  it('validates a minimal valid backup', () => {
    const result = validateBackupData(minimalBackup);
    expect(result.valid).toBe(true);
    expect(result.data.transactions).toHaveLength(1);
    expect(result.skipped.transactions).toBe(0);
  });

  it('rejects null/undefined/non-object', () => {
    expect(validateBackupData(null).valid).toBe(false);
    expect(validateBackupData(undefined).valid).toBe(false);
    expect(validateBackupData('string').valid).toBe(false);
  });

  it('rejects backup without transactions array', () => {
    const result = validateBackupData({ foo: 'bar' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No transactions array');
  });

  it('rejects backup exceeding transaction count limit', () => {
    const bigBackup = {
      transactions: Array.from({ length: MAX_TRANSACTION_COUNT + 1 }, (_, i) => ({
        date: '2025-01-01', desc: `tx${i}`, amount: 1, category: 'other', paid: false,
      })),
    };
    const result = validateBackupData(bigBackup);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('limit');
  });

  it('skips invalid transactions and reports count', () => {
    const backup = {
      transactions: [
        { date: '2025-01-01', desc: 'Valid', amount: 10, category: 'other', paid: false },
        { date: 'bad', desc: 'Invalid', amount: 10, category: 'other', paid: false },
        null,
      ],
    };
    const result = validateBackupData(backup);
    expect(result.valid).toBe(true);
    expect(result.data.transactions).toHaveLength(1);
    expect(result.skipped.transactions).toBe(2);
  });

  it('handles nested data property', () => {
    const backup = {
      data: {
        transactions: [
          { date: '2025-01-01', desc: 'Nested', amount: 5, category: 'income', paid: true },
        ],
      },
    };
    const result = validateBackupData(backup);
    expect(result.valid).toBe(true);
    expect(result.data.transactions).toHaveLength(1);
  });

  it('validates recurringExpenses', () => {
    const backup = {
      transactions: [{ date: '2025-01-01', desc: 'T', amount: 1, category: 'other', paid: false }],
      recurringExpenses: [
        { name: 'Rent', amount: 1200, dueDay: 1, category: 'housing', active: true, autoPay: false },
        { name: '', amount: NaN, dueDay: 0 }, // invalid
      ],
    };
    const result = validateBackupData(backup);
    expect(result.data.recurringExpenses).toHaveLength(1);
    expect(result.skipped.recurringExpenses).toBe(1);
  });

  it('validates debts', () => {
    const backup = {
      transactions: [{ date: '2025-01-01', desc: 'T', amount: 1, category: 'other', paid: false }],
      debts: [
        { name: 'Car Loan', balance: 15000, interestRate: 4.5, minPayment: 300 },
        { name: '', balance: NaN, interestRate: 0, minPayment: 0 }, // invalid name
      ],
    };
    const result = validateBackupData(backup);
    expect(result.data.debts).toHaveLength(1);
    expect(result.skipped.debts).toBe(1);
  });

  it('validates monthlyBalances', () => {
    const backup = {
      transactions: [{ date: '2025-01-01', desc: 'T', amount: 1, category: 'other', paid: false }],
      monthlyBalances: {
        '2025-01': { beginning: 1000, ending: 1500 },
        'bad-key': { beginning: 100 }, // invalid key
        '2025-02': 'not-object', // invalid value
      },
    };
    const result = validateBackupData(backup);
    expect(result.data.monthlyBalances).toEqual({ '2025-01': { beginning: 1000, ending: 1500 } });
  });

  it('validates budgetGoals', () => {
    const backup = {
      transactions: [{ date: '2025-01-01', desc: 'T', amount: 1, category: 'other', paid: false }],
      budgetGoals: {
        groceries: 500,
        housing: 1200,
        'fake-category': 100, // invalid category
        dining: -50, // negative
      },
    };
    const result = validateBackupData(backup);
    expect(result.data.budgetGoals).toEqual({ groceries: 500, housing: 1200 });
  });

  it('validates savingsGoal', () => {
    const backup = {
      transactions: [{ date: '2025-01-01', desc: 'T', amount: 1, category: 'other', paid: false }],
      savingsGoal: 10000,
    };
    const result = validateBackupData(backup);
    expect(result.data.savingsGoal).toBe(10000);
  });

  it('parses string savingsGoal', () => {
    const backup = {
      transactions: [{ date: '2025-01-01', desc: 'T', amount: 1, category: 'other', paid: false }],
      savingsGoal: '5000',
    };
    const result = validateBackupData(backup);
    expect(result.data.savingsGoal).toBe(5000);
  });
});

// --- validateImportTransactions ---

describe('validateImportTransactions', () => {
  it('returns empty array for non-array input', () => {
    expect(validateImportTransactions(null)).toEqual([]);
    expect(validateImportTransactions('string')).toEqual([]);
    expect(validateImportTransactions({})).toEqual([]);
  });

  it('filters out invalid transactions', () => {
    const input = [
      { date: '2025-03-01', desc: 'Valid', amount: 25, category: 'dining', paid: true },
      { date: 'nope', desc: 'Bad date', amount: 10 },
      null,
    ];
    const result = validateImportTransactions(input);
    expect(result).toHaveLength(1);
    expect(result[0].desc).toBe('Valid');
  });

  it('caps at MAX_TRANSACTION_COUNT', () => {
    const input = Array.from({ length: MAX_TRANSACTION_COUNT + 100 }, (_, i) => ({
      date: '2025-01-01', desc: `tx${i}`, amount: 1, category: 'other', paid: false,
    }));
    const result = validateImportTransactions(input);
    expect(result.length).toBeLessThanOrEqual(MAX_TRANSACTION_COUNT);
  });
});

// --- Constants ---

describe('constants', () => {
  it('MAX_IMPORT_FILE_SIZE is 10 MB', () => {
    expect(MAX_IMPORT_FILE_SIZE).toBe(10 * 1024 * 1024);
  });

  it('MAX_TRANSACTION_COUNT is 50000', () => {
    expect(MAX_TRANSACTION_COUNT).toBe(50_000);
  });
});
