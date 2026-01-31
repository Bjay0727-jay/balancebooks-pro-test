import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, FREQUENCY_OPTIONS } from '../utils/constants';

const inputStyle = (theme) => ({
  width: '100%', padding: '10px 14px', background: theme.bgSecondary,
  border: theme.cardBorder, borderRadius: '8px', fontSize: '13px',
  color: theme.text, outline: 'none', transition: 'border 150ms',
});

const labelStyle = (theme) => ({
  display: 'block', fontSize: '12px', fontWeight: '600',
  color: theme.textSecondary, marginBottom: '6px',
});

const btnRow = { display: 'flex', gap: '10px', paddingTop: '16px' };

const btnPrimary = (theme) => ({
  flex: 1, padding: '12px', background: theme.navActive, color: 'white',
  border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
});

const btnSecondary = (theme) => ({
  flex: 1, padding: '12px', background: theme.bgHover, color: theme.text,
  border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
});

export function TxForm({ tx, onSubmit, onCancel }) {
  const { theme } = useApp();
  const [form, setForm] = useState({
    date: tx?.date || new Date().toISOString().split('T')[0],
    desc: tx?.desc || '',
    amount: tx ? Math.abs(tx.amount) : '',
    type: tx?.amount > 0 ? 'income' : 'expense',
    category: tx?.category || 'other',
    paid: tx?.paid || false,
  });

  const handle = (e) => {
    e.preventDefault();
    const amt = form.type === 'income' ? Math.abs(parseFloat(form.amount)) : -Math.abs(parseFloat(form.amount));
    onSubmit({ ...tx, date: form.date, desc: form.desc, amount: amt, category: form.category, paid: form.paid });
  };

  return (
    <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle(theme)}>Date</label>
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle(theme)} required />
      </div>
      <div>
        <label style={labelStyle(theme)}>Description</label>
        <input type="text" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Enter description" style={inputStyle(theme)} required />
      </div>
      <div>
        <label style={labelStyle(theme)}>Amount</label>
        <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={inputStyle(theme)} required />
      </div>
      <div>
        <label style={labelStyle(theme)}>Type</label>
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category: e.target.value === 'income' ? 'income' : form.category })} style={inputStyle(theme)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>
      <div>
        <label style={labelStyle(theme)}>Category</label>
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle(theme)}>
          {CATEGORIES.filter(c => form.type === 'income' ? c.id === 'income' : c.id !== 'income').map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: theme.accentLight, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.paid} onChange={e => setForm({ ...form, paid: e.target.checked })} />
        <span style={{ fontSize: '13px', fontWeight: '500', color: theme.text }}>Mark as paid</span>
      </label>
      <div style={btnRow}>
        <button type="button" onClick={onCancel} style={btnSecondary(theme)}>Cancel</button>
        <button type="submit" style={btnPrimary(theme)}>{tx ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}

export function RecurringForm({ recurring, onSubmit, onCancel }) {
  const { theme } = useApp();
  const [form, setForm] = useState({
    name: recurring?.name || '', amount: recurring?.amount || '',
    category: recurring?.category || 'utilities', frequency: recurring?.frequency || 'monthly',
    dueDay: recurring?.dueDay || 1, autoPay: recurring?.autoPay || false,
  });

  const handle = (e) => {
    e.preventDefault();
    onSubmit({ ...recurring, ...form, amount: parseFloat(form.amount), dueDay: parseInt(form.dueDay) });
  };

  return (
    <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle(theme)}>Name</label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Netflix, Rent" style={inputStyle(theme)} required />
      </div>
      <div>
        <label style={labelStyle(theme)}>Amount</label>
        <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={inputStyle(theme)} required />
      </div>
      <div>
        <label style={labelStyle(theme)}>Category</label>
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle(theme)}>
          {CATEGORIES.filter(c => c.id !== 'income').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={labelStyle(theme)}>Frequency</label>
          <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} style={inputStyle(theme)}>
            {FREQUENCY_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle(theme)}>Due Day</label>
          <input type="number" min="1" max="31" value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })} style={inputStyle(theme)} required />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: theme.accentLight, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.autoPay} onChange={e => setForm({ ...form, autoPay: e.target.checked })} />
        <span style={{ fontSize: '13px', fontWeight: '500', color: theme.text }}>Auto-pay (marks as paid)</span>
      </label>
      <div style={btnRow}>
        <button type="button" onClick={onCancel} style={btnSecondary(theme)}>Cancel</button>
        <button type="submit" style={btnPrimary(theme)}>{recurring ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}

export function DebtForm({ debt, onSubmit, onCancel }) {
  const { theme } = useApp();
  const [form, setForm] = useState({
    name: debt?.name || '', balance: debt?.balance || '',
    interestRate: debt?.interestRate || '', minPayment: debt?.minPayment || '',
    type: debt?.type || 'credit-card',
  });

  const handle = (e) => {
    e.preventDefault();
    onSubmit({ ...debt, ...form, balance: parseFloat(form.balance), interestRate: parseFloat(form.interestRate), minPayment: parseFloat(form.minPayment) });
  };

  return (
    <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle(theme)}>Debt Name</label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Chase Visa" style={inputStyle(theme)} required />
      </div>
      <div>
        <label style={labelStyle(theme)}>Debt Type</label>
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle(theme)}>
          <option value="credit-card">💳 Credit Card</option>
          <option value="car-loan">🚗 Car Loan</option>
          <option value="student-loan">🎓 Student Loan</option>
          <option value="mortgage">🏠 Mortgage</option>
          <option value="personal-loan">💰 Personal Loan</option>
          <option value="medical">🏥 Medical Debt</option>
          <option value="other">📋 Other</option>
        </select>
      </div>
      <div>
        <label style={labelStyle(theme)}>Current Balance</label>
        <input type="number" step="0.01" min="0" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} placeholder="0.00" style={inputStyle(theme)} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={labelStyle(theme)}>Interest Rate (%)</label>
          <input type="number" step="0.1" min="0" max="100" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} placeholder="18.9" style={inputStyle(theme)} required />
        </div>
        <div>
          <label style={labelStyle(theme)}>Min Payment</label>
          <input type="number" step="0.01" min="0" value={form.minPayment} onChange={e => setForm({ ...form, minPayment: e.target.value })} placeholder="50.00" style={inputStyle(theme)} required />
        </div>
      </div>
      <div style={btnRow}>
        <button type="button" onClick={onCancel} style={btnSecondary(theme)}>Cancel</button>
        <button type="submit" style={{ ...btnPrimary(theme), background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>{debt ? 'Update' : 'Add Debt'}</button>
      </div>
    </form>
  );
}

export function BudgetSetForm({ budgetGoals, onSubmit, onCancel }) {
  const { theme } = useApp();
  const [goals, setGoals] = useState({ ...budgetGoals });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(goals); }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {CATEGORIES.filter(c => c.id !== 'income').map(cat => (
          <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', width: '24px', textAlign: 'center' }}>{cat.icon}</span>
            <span style={{ flex: 1, fontSize: '12px', fontWeight: '500', color: theme.text }}>{cat.name}</span>
            <input
              type="number" step="1" min="0" placeholder="0"
              value={goals[cat.id] || ''}
              onChange={e => setGoals({ ...goals, [cat.id]: parseFloat(e.target.value) || 0 })}
              style={{ ...inputStyle(theme), width: '100px', textAlign: 'right' }}
            />
          </div>
        ))}
      </div>
      <div style={btnRow}>
        <button type="button" onClick={onCancel} style={btnSecondary(theme)}>Cancel</button>
        <button type="submit" style={btnPrimary(theme)}>Save Budgets</button>
      </div>
    </form>
  );
}

export function SimpleValueForm({ label, value, onSubmit, onCancel }) {
  const { theme } = useApp();
  const [val, setVal] = useState(value || '');

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(parseFloat(val) || 0); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle(theme)}>{label}</label>
        <input type="number" step="0.01" value={val} onChange={e => setVal(e.target.value)} style={inputStyle(theme)} autoFocus />
      </div>
      <div style={btnRow}>
        <button type="button" onClick={onCancel} style={btnSecondary(theme)}>Cancel</button>
        <button type="submit" style={btnPrimary(theme)}>Save</button>
      </div>
    </form>
  );
}
