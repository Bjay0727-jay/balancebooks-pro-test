import React from 'react';
import { useApp } from '../context/AppContext';
import { MONTHS, FULL_MONTHS } from '../utils/constants';
import { currency } from '../utils/helpers';

export default function Header() {
  const { state, dispatch, theme, stats } = useApp();

  const viewLabels = {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    budget: 'Budget Goals',
    analytics: 'Analytics',
    debts: 'Debt Payoff',
    recurring: 'Recurring',
    accounts: 'Bank Accounts',
    cycle: '12-Month Cycle',
    savings: 'Savings',
    recommendations: 'Smart Tips',
    settings: 'Settings',
  };

  const statCards = [
    { label: 'Beginning', value: currency(stats.beginning), color: 'white' },
    { label: 'Income', value: `+${currency(stats.income)}`, color: '#4ade80', sub: stats.income > 0 ? null : null },
    { label: 'Expenses', value: `-${currency(stats.expenses)}`, color: '#fca5a5', sub: stats.unpaidCount > 0 ? `${stats.unpaidCount} unpaid` : null },
    { label: 'Balance', value: currency(stats.ending), color: '#4ade80', sub: stats.net >= 0 ? `+${currency(stats.net)}` : currency(stats.net) },
  ];

  return (
    <header style={{
      background: theme.headerBg,
      padding: '20px 28px 28px',
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
              padding: '8px 12px', cursor: 'pointer', color: 'white', fontSize: '18px',
            }}
          >
            ☰
          </button>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '2px' }}>
              {FULL_MONTHS[state.month]} {state.year}
            </div>
            <div style={{ color: 'white', fontSize: '22px', fontWeight: '700' }}>
              {viewLabels[state.view] || state.view}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Month Selector */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '2px',
          }}>
            <button
              onClick={() => dispatch({ type: 'PREV_MONTH' })}
              style={{ background: 'transparent', border: 'none', color: 'white', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}
            >
              ◀
            </button>
            <span style={{ color: 'white', fontWeight: '600', padding: '0 10px', fontSize: '13px' }}>
              {MONTHS[state.month]} {state.year}
            </span>
            <button
              onClick={() => dispatch({ type: 'NEXT_MONTH' })}
              style={{ background: 'transparent', border: 'none', color: 'white', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}
            >
              ▶
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={() => dispatch({ type: 'SET_MODAL', payload: 'add' })}
            style={{
              background: 'white', color: '#1e3a5f', border: 'none',
              padding: '10px 16px', borderRadius: '8px', fontWeight: '600',
              fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <span style={{ fontWeight: '700' }}>+</span> Add
          </button>
        </div>
      </div>

      {/* Balance Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {statCards.map((stat, i) => (
          <div
            key={i}
            onClick={() => dispatch({ type: 'SET_MODAL', payload: i === 0 ? 'edit-beginning' : i === 3 ? 'edit-ending' : null })}
            style={{
              background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px',
              border: '2px solid rgba(255,255,255,0.15)',
              cursor: (i === 0 || i === 3) ? 'pointer' : 'default',
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '6px' }}>{stat.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
            {stat.sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{stat.sub}</div>}
          </div>
        ))}
      </div>
    </header>
  );
}
