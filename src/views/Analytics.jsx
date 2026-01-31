import React from 'react';
import { useApp } from '../context/AppContext';
import { FULL_MONTHS } from '../utils/constants';
import { currency } from '../utils/helpers';

export default function Analytics() {
  const { state, theme, spendingTrends, catBreakdown, stats } = useApp();

  const card = { background: theme.bgCard, borderRadius: '12px', border: theme.cardBorder, boxShadow: theme.cardShadow };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '12px',
        padding: '20px', color: 'white', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>📈 Financial Analytics</div>
        <div style={{ fontSize: '13px', opacity: 0.8 }}>Visualize your spending patterns and trends</div>
      </div>

      {/* 6-Month Trends */}
      <div style={{ ...card, padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: theme.text }}>📊 6-Month Spending Trends</h3>
        <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
          {spendingTrends.map((t, i) => {
            const maxVal = Math.max(...spendingTrends.map(s => Math.max(s.income, s.expenses))) || 1;
            const incH = (t.income / maxVal) * 200;
            const expH = (t.expenses / maxVal) * 200;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '200px', marginBottom: '8px' }}>
                  <div style={{ width: '20px', height: `${incH}px`, background: theme.success, borderRadius: '4px 4px 0 0', transition: 'height 300ms' }} title={`Income: ${currency(t.income)}`} />
                  <div style={{ width: '20px', height: `${expH}px`, background: theme.danger, borderRadius: '4px 4px 0 0', transition: 'height 300ms' }} title={`Expenses: ${currency(t.expenses)}`} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', color: theme.textSecondary }}>{t.month}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${theme.borderLight}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: theme.success }} />
            <span style={{ fontSize: '12px', color: theme.textSecondary }}>Income</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: theme.danger }} />
            <span style={{ fontSize: '12px', color: theme.textSecondary }}>Expenses</span>
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      <div style={{ ...card, padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: theme.text }}>
          🥧 Spending by Category ({FULL_MONTHS[state.month]})
        </h3>
        {catBreakdown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textMuted }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📊</div>
            <p style={{ fontSize: '13px' }}>No spending data for this month</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', alignItems: 'center' }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              {(() => {
                let cumulative = 0;
                return catBreakdown.slice(0, 8).map((cat) => {
                  const pct = cat.pct / 100;
                  const startAngle = cumulative * 360;
                  cumulative += pct;
                  const endAngle = cumulative * 360;
                  const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                  const largeArc = pct > 0.5 ? 1 : 0;
                  return (
                    <path key={cat.id} d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={cat.color} opacity={0.8} style={{ cursor: 'pointer' }}>
                      <title>{cat.name}: {currency(cat.total)} ({cat.pct.toFixed(1)}%)</title>
                    </path>
                  );
                });
              })()}
              <circle cx="100" cy="100" r="40" fill={theme.bgCard} />
              <text x="100" y="95" textAnchor="middle" style={{ fontSize: '12px', fontWeight: '700', fill: theme.text }}>Total</text>
              <text x="100" y="112" textAnchor="middle" style={{ fontSize: '10px', fill: theme.textMuted }}>{currency(stats.expenses)}</text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {catBreakdown.slice(0, 8).map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cat.color }} />
                    <span style={{ fontSize: '12px', fontWeight: '500', color: theme.text }}>{cat.icon} {cat.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: theme.text }}>{currency(cat.total)}</span>
                    <span style={{ fontSize: '10px', color: theme.textMuted, marginLeft: '6px' }}>({cat.pct.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
