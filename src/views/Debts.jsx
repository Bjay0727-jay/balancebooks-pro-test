import React from 'react';
import { useApp } from '../context/AppContext';
import { currency } from '../utils/helpers';

export default function Debts() {
  const { state, dispatch, theme, debtPayoffPlan } = useApp();

  const card = { background: theme.bgCard, borderRadius: '12px', border: theme.cardBorder, boxShadow: theme.cardShadow };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #ef4444, #f97316)', borderRadius: '12px',
        padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>💳 Debt Payoff Plan</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{currency(debtPayoffPlan.totalDebt)}</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Total debt across {state.debts.length} account(s)</div>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_MODAL', payload: 'add-debt' })}
          style={{
            padding: '10px 18px', background: 'white', color: '#ef4444',
            border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
          }}
        >
          + Add Debt
        </button>
      </div>

      {/* Strategy Comparison */}
      {state.debts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ ...card, padding: '16px', borderColor: theme.success }}>
            <div style={{ fontSize: '12px', color: theme.success, fontWeight: '600', marginBottom: '8px' }}>❄️ Snowball Method</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: theme.text }}>{debtPayoffPlan.snowballMonths} months</div>
            <div style={{ fontSize: '12px', color: theme.textMuted }}>Interest paid: {currency(debtPayoffPlan.snowballInterest)}</div>
          </div>
          <div style={{ ...card, padding: '16px', borderColor: theme.accent }}>
            <div style={{ fontSize: '12px', color: theme.accent, fontWeight: '600', marginBottom: '8px' }}>🏔️ Avalanche Method</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: theme.text }}>{debtPayoffPlan.avalancheMonths} months</div>
            <div style={{ fontSize: '12px', color: theme.textMuted }}>Interest paid: {currency(debtPayoffPlan.avalancheInterest)}</div>
          </div>
        </div>
      )}

      {/* Debt List */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: theme.text }}>Your Debts</h3>
        </div>
        {state.debts.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: theme.textMuted }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💳</div>
            <p style={{ fontSize: '13px' }}>No debts tracked. Add a debt to see your payoff plan.</p>
          </div>
        ) : state.debts.map((d, i) => (
          <div key={d.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderBottom: i < state.debts.length - 1 ? `1px solid ${theme.borderLight}` : 'none',
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>{d.name}</div>
              <div style={{ fontSize: '11px', color: theme.textMuted }}>{d.interestRate}% APR &bull; Min: {currency(d.minPayment)}/mo</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: theme.danger }}>{currency(d.balance)}</span>
              <button onClick={() => dispatch({ type: 'SET_EDIT_DEBT', payload: d })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
              <button onClick={() => dispatch({ type: 'DELETE_DEBT', payload: d.id })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
