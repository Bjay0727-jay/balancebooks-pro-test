import React from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../utils/constants';
import { currency, shortDate, exportCSV } from '../utils/helpers';

export default function Transactions() {
  const { state, dispatch, theme, filtered } = useApp();

  const inputStyle = {
    padding: '10px 14px', background: theme.bgSecondary,
    border: theme.cardBorder, borderRadius: '8px', fontSize: '13px',
    color: theme.text, outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
          <input
            type="text" placeholder="Search..." value={state.search}
            onChange={e => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            style={{ ...inputStyle, width: '100%', paddingLeft: '36px' }}
          />
        </div>
        <select value={state.filterCat} onChange={e => dispatch({ type: 'SET_FILTER_CAT', payload: e.target.value })} style={inputStyle}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={state.filterPaid} onChange={e => dispatch({ type: 'SET_FILTER_PAID', payload: e.target.value })} style={inputStyle}>
          <option value="all">All Status</option>
          <option value="paid">✓ Paid</option>
          <option value="unpaid">○ Unpaid</option>
        </select>
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
        padding: '12px 16px', background: theme.bgSecondary, borderRadius: '10px', border: `1px solid ${theme.border}`,
      }}>
        <span style={{ fontSize: '13px', color: theme.textSecondary }}>
          <strong>{filtered.length}</strong> transactions
          {state.transactions.length > 0 && <span style={{ color: theme.textMuted }}> &bull; Total: {state.transactions.length}</span>}
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filtered.length > 0 && (
            <>
              <button onClick={() => {
                const ids = new Set(filtered.map(t => t.id));
                dispatch({ type: 'BATCH_SET_PAID', payload: { ids, paid: true } });
              }} style={{
                padding: '8px 14px', background: theme.success, color: 'white',
                border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>✓ Select All</button>
              <button onClick={() => {
                const ids = new Set(filtered.map(t => t.id));
                dispatch({ type: 'BATCH_SET_PAID', payload: { ids, paid: false } });
              }} style={{
                padding: '8px 14px', background: theme.bgHover, color: theme.text,
                border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>✕ Deselect All</button>
            </>
          )}
          <button onClick={() => exportCSV(state.transactions)} style={{
            padding: '8px 14px', background: theme.accent, color: 'white',
            border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }}>📥 Export CSV</button>
          <button onClick={() => {
            if (state.transactions.length > 0 && confirm(`Delete ALL ${state.transactions.length} transactions? This cannot be undone.`)) {
              dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
            }
          }} style={{
            padding: '8px 14px', background: theme.danger, color: 'white',
            border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }} disabled={state.transactions.length === 0}>🗑 Delete All</button>
        </div>
      </div>

      {/* Transaction List */}
      <div style={{
        background: theme.bgCard, borderRadius: '12px',
        border: theme.cardBorder, boxShadow: theme.cardShadow, overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: theme.textMuted }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.text, marginBottom: '4px' }}>No transactions found</h3>
            <p style={{ fontSize: '13px' }}>
              {state.search || state.filterCat !== 'all' || state.filterPaid !== 'all' ? 'Try adjusting your filters' : 'Add your first transaction to get started'}
            </p>
          </div>
        ) : filtered.slice(0, 50).map((tx, i) => {
          const cat = CATEGORIES.find(c => c.id === tx.category);
          return (
            <div key={tx.id} style={{
              display: 'flex', alignItems: 'center', padding: '12px 20px',
              borderBottom: i < Math.min(filtered.length, 50) - 1 ? `1px solid ${theme.borderLight}` : 'none',
            }}>
              <div
                onClick={() => dispatch({ type: 'TOGGLE_PAID', payload: tx.id })}
                style={{
                  width: '18px', height: '18px', borderRadius: '5px',
                  border: tx.paid ? 'none' : `2px solid ${theme.border}`,
                  background: tx.paid ? theme.accent : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: '12px', cursor: 'pointer', flexShrink: 0,
                }}
              >
                {tx.paid && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
              </div>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px', background: theme.bgHover,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                marginRight: '12px', flexShrink: 0,
              }}>
                {cat?.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: theme.text, marginBottom: '2px' }}>{tx.desc}</div>
                <div style={{ fontSize: '11px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {shortDate(tx.date)} &bull; {cat?.name}
                  <span style={{
                    padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600',
                    background: tx.paid ? theme.successBg : theme.warningBg,
                    color: tx.paid ? theme.success : theme.warning,
                  }}>
                    {tx.paid ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: tx.amount > 0 ? theme.success : theme.text, marginRight: '12px' }}>
                {tx.amount > 0 ? '+' : ''}{currency(tx.amount)}
              </div>
              <button onClick={() => dispatch({ type: 'SET_EDIT_TX', payload: tx })} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: theme.accent, fontSize: '14px', padding: '4px 6px',
              }}>✏️</button>
              <button onClick={() => dispatch({ type: 'DELETE_TRANSACTION', payload: tx.id })} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: theme.danger, fontSize: '14px', padding: '4px 6px',
              }}>🗑</button>
            </div>
          );
        })}
        {filtered.length > 50 && (
          <div style={{ padding: '12px 20px', textAlign: 'center', fontSize: '12px', color: theme.textMuted, background: theme.bgSecondary }}>
            Showing first 50 of {filtered.length} transactions. Use filters to narrow results.
          </div>
        )}
      </div>
    </div>
  );
}
