import React from 'react';
import { useApp } from '../context/AppContext';
import { currency } from '../utils/helpers';

export default function Savings() {
  const { state, dispatch, theme, stats } = useApp();

  const card = { background: theme.bgCard, borderRadius: '12px', border: theme.cardBorder, boxShadow: theme.cardShadow };

  const ytdSavings = state.transactions
    .filter(t => t.category === 'savings' && new Date(t.date).getFullYear() === state.year)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '8px' }}>This Month</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: theme.success }}>{currency(stats.saved)}</div>
          <div style={{ height: '6px', background: theme.bgHover, borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: theme.success, borderRadius: '3px', width: `${Math.min(100, state.savingsGoal > 0 ? (stats.saved / state.savingsGoal * 100) : 0)}%` }} />
          </div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>
            {state.savingsGoal > 0 ? `${Math.min(100, (stats.saved / state.savingsGoal * 100)).toFixed(0)}% of ${currency(state.savingsGoal)} goal` : 'No goal set'}
          </div>
        </div>
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '8px' }}>Year to Date</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: theme.accent }}>{currency(ytdSavings)}</div>
        </div>
        <div style={{ ...card, padding: '20px', cursor: 'pointer' }} onClick={() => dispatch({ type: 'SET_MODAL', payload: 'edit-goal' })}>
          <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '8px' }}>Monthly Goal</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: theme.accent }}>{currency(state.savingsGoal)}</div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>✏️ Click to edit</div>
        </div>
      </div>
    </div>
  );
}
