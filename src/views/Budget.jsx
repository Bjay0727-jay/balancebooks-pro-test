import React from 'react';
import { useApp } from '../context/AppContext';
import { currency } from '../utils/helpers';

export default function Budget() {
  const { dispatch, theme, budgetAnalysis, budgetStats } = useApp();

  const card = { background: theme.bgCard, borderRadius: '12px', border: theme.cardBorder, boxShadow: theme.cardShadow };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      {/* Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Budget', value: currency(budgetStats.totalBudget), color: theme.accent },
          { label: 'Total Spent', value: currency(budgetStats.totalSpent), color: theme.text },
          { label: 'Remaining', value: currency(budgetStats.remaining), color: budgetStats.remaining >= 0 ? theme.success : theme.danger },
          { label: 'Over Budget', value: `${budgetStats.categoriesOverBudget} categories`, color: theme.warning },
        ].map((s, i) => (
          <div key={i} style={{ ...card, padding: '16px' }}>
            <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {budgetStats.categoriesOverBudget > 0 && (
        <div style={{ padding: '14px 18px', background: theme.dangerBg, borderRadius: '10px', border: `2px solid ${theme.danger}33` }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: theme.danger, display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Budget Alert: {budgetStats.categoriesOverBudget} category(s) over budget!
          </div>
        </div>
      )}

      {/* Category Budgets */}
      <div style={{ ...card, padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: theme.text }}>🎯 Category Budgets</h3>
          <button
            onClick={() => dispatch({ type: 'SET_MODAL', payload: 'set-budgets' })}
            style={{
              padding: '8px 16px', background: theme.navActive, color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            + Set Budgets
          </button>
        </div>

        {budgetAnalysis.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textMuted }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎯</div>
            <p style={{ fontSize: '13px' }}>No budgets set yet. Click "Set Budgets" to create spending limits.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {budgetAnalysis.map(b => (
              <div key={b.id} style={{ padding: '14px', borderRadius: '10px', border: `1px solid ${theme.borderLight}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{b.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>{b.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontWeight: '700', fontSize: '13px',
                      color: b.status === 'over' ? theme.danger : b.status === 'warning' ? theme.warning : theme.success,
                    }}>
                      {currency(b.spent)}
                    </span>
                    <span style={{ color: theme.textMuted, fontSize: '12px' }}> / {currency(b.budget)}</span>
                  </div>
                </div>
                <div style={{ height: '6px', background: theme.bgHover, borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px', transition: 'width 300ms',
                    width: `${Math.min(b.percentUsed, 100)}%`,
                    background: b.status === 'over' ? theme.danger : b.status === 'warning' ? theme.warning : theme.success,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px' }}>
                  <span style={{ color: b.status === 'over' ? theme.danger : theme.textMuted }}>{b.percentUsed.toFixed(0)}% used</span>
                  <span style={{ color: b.remaining >= 0 ? theme.success : theme.danger }}>
                    {b.remaining >= 0 ? `${currency(b.remaining)} left` : `${currency(Math.abs(b.remaining))} over`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
