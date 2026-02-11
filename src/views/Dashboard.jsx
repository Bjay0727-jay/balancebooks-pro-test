import React, { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, UPCOMING_BILLS_LIMIT, RECENT_TRANSACTIONS_LIMIT, SPENDING_CATEGORIES_LIMIT } from '../utils/constants';
import { currency, shortDate } from '../utils/helpers';

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const DashboardTxRow = React.memo(function DashboardTxRow({ tx, theme, isLast, onTogglePaid }) {
  const cat = CATEGORY_MAP[tx.category];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 20px',
      borderBottom: isLast ? 'none' : `1px solid ${theme.borderLight}`,
      cursor: 'pointer',
    }}>
      <div style={{
        width: '18px', height: '18px', borderRadius: '5px',
        border: tx.paid ? 'none' : `2px solid ${theme.border}`,
        background: tx.paid ? theme.accent : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginRight: '12px', cursor: 'pointer', flexShrink: 0,
      }}
        role="checkbox" aria-checked={tx.paid} aria-label={`Mark ${tx.desc} as ${tx.paid ? 'unpaid' : 'paid'}`}
        tabIndex={0}
        onClick={() => onTogglePaid(tx.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTogglePaid(tx.id); } }}
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
        <div style={{ fontSize: '11px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '8px' }}>
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
      <div style={{ fontSize: '14px', fontWeight: '600', color: tx.amount > 0 ? theme.success : theme.text }}>
        {tx.amount > 0 ? '+' : ''}{currency(tx.amount)}
      </div>
    </div>
  );
});

export default function Dashboard() {
  const { state, dispatch, theme, stats, catBreakdown, monthTx, upcomingBills, savingsRecommendations, totalMonthlyRecurring } = useApp();

  const handleTogglePaid = useCallback((id) => {
    dispatch({ type: 'TOGGLE_PAID', payload: id });
  }, [dispatch]);

  const card = {
    background: theme.bgCard, borderRadius: '12px',
    border: theme.cardBorder, boxShadow: theme.cardShadow, overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { icon: '💵', title: 'Add Income', action: () => dispatch({ type: 'SET_MODAL', payload: 'add' }) },
          { icon: '🛒', title: 'Add Expense', action: () => dispatch({ type: 'SET_MODAL', payload: 'add' }) },
          { icon: '🔄', title: 'Recurring', action: () => dispatch({ type: 'SET_VIEW', payload: 'recurring' }) },
          { icon: '🎯', title: 'Set Budget', action: () => dispatch({ type: 'SET_VIEW', payload: 'budget' }) },
        ].map((a, i) => (
          <div key={i} onClick={a.action} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: theme.bgCard, borderRadius: '10px', padding: '14px 16px',
            border: theme.cardBorder, boxShadow: theme.cardShadow, cursor: 'pointer',
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: theme.bgHover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{a.icon}</div>
            <span style={{ fontWeight: '600', fontSize: '13px', color: theme.text }}>{a.title}</span>
          </div>
        ))}
      </div>

      {/* Upcoming Bills */}
      {upcomingBills.length > 0 && (
        <div style={{ ...card, padding: '16px 20px', background: theme.warningBg, border: `2px solid ${theme.warning}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>🔔</span>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: theme.warning }}>Upcoming Bills</h3>
          </div>
          {upcomingBills.slice(0, UPCOMING_BILLS_LIMIT).map(b => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '13px' }}>
              <span style={{ color: theme.text }}>{b.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: '600', color: theme.text }}>{currency(b.amount)}</span>
                <span style={{ color: theme.warning, fontSize: '11px', fontWeight: '600' }}>
                  {b.daysUntil === 0 ? 'Today' : b.daysUntil === 1 ? 'Tomorrow' : `in ${b.daysUntil} days`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
        {/* Recent Transactions */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: theme.text }}>Recent Transactions</h3>
            <a onClick={() => dispatch({ type: 'SET_VIEW', payload: 'transactions' })} style={{ color: theme.accent, fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>View All →</a>
          </div>
          <div>
            {monthTx.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textMuted }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                <p style={{ fontSize: '13px' }}>No transactions this month</p>
              </div>
            ) : monthTx.slice(0, RECENT_TRANSACTIONS_LIMIT).map((tx, i) => (
              <DashboardTxRow
                key={tx.id}
                tx={tx}
                theme={theme}
                isLast={i >= Math.min(monthTx.length, RECENT_TRANSACTIONS_LIMIT) - 1}
                onTogglePaid={handleTogglePaid}
              />
            ))}
          </div>
        </div>

        {/* Right Column Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Savings Goal */}
          <div style={{
            background: theme.savingsGradient, borderRadius: '12px', padding: '20px',
            color: 'white', border: '2px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', opacity: 0.9 }}>Monthly Savings Goal</span>
              <span style={{ fontSize: '16px', fontWeight: '700' }}>
                {state.savingsGoal > 0 ? `${Math.min(100, (stats.saved / state.savingsGoal * 100)).toFixed(0)}%` : '0%'}
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700', marginBottom: '4px' }}>{currency(stats.saved)}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '14px' }}>of {currency(state.savingsGoal)} goal</div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ height: '100%', width: `${Math.min(100, state.savingsGoal > 0 ? (stats.saved / state.savingsGoal * 100) : 0)}%`, background: 'white', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.8 }}>
              <span>{currency(Math.max(0, state.savingsGoal - stats.saved))} remaining</span>
              <span onClick={() => dispatch({ type: 'SET_MODAL', payload: 'edit-goal' })} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Edit Goal</span>
            </div>
          </div>

          {/* Spending by Category */}
          <div style={card}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: theme.text }}>Spending by Category</h3>
            </div>
            <div style={{ padding: '12px 20px' }}>
              {catBreakdown.length === 0 ? (
                <p style={{ fontSize: '13px', color: theme.textMuted, textAlign: 'center', padding: '20px 0' }}>No spending data</p>
              ) : catBreakdown.slice(0, SPENDING_CATEGORIES_LIMIT).map(cat => (
                <div key={cat.id} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                    <span style={{ color: theme.text, fontWeight: '500' }}>{cat.icon} {cat.name}</span>
                    <span style={{ fontWeight: '600', color: theme.text }}>{currency(cat.total)}</span>
                  </div>
                  <div style={{ height: '6px', background: theme.bgHover, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cat.pct}%`, backgroundColor: cat.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Insights */}
          {savingsRecommendations.filter(r => r.priority === 'high').length > 0 && (
            <div style={{
              background: theme.insightsGradient, borderRadius: '12px', padding: '18px',
              color: 'white', border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '14px', opacity: 0.9 }}>💡 Priority Insights</div>
              {savingsRecommendations.filter(r => r.priority === 'high').slice(0, 3).map(rec => (
                <div key={rec.id} style={{
                  background: 'rgba(255,255,255,0.12)', borderRadius: '8px',
                  padding: '12px', marginBottom: '8px', cursor: 'pointer',
                }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', lineHeight: 1.5 }}>{rec.title}</p>
                  {rec.potential > 0 && (
                    <span style={{ fontSize: '11px', color: '#fde047', fontWeight: '600' }}>
                      Save up to {currency(rec.potential)}/mo →
                    </span>
                  )}
                </div>
              ))}
              <span
                onClick={() => dispatch({ type: 'SET_VIEW', payload: 'recommendations' })}
                style={{ fontSize: '11px', color: '#fde047', fontWeight: '500', cursor: 'pointer' }}
              >
                View All Tips →
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
