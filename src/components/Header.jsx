import React from 'react';
import { useApp } from '../context/AppContext';
import { MONTHS, FULL_MONTHS } from '../utils/constants';
import { currency } from '../utils/helpers';

export default function Header() {
  const { state, dispatch, theme, stats, closeMonth } = useApp();

  const handleCloseMonth = () => {
    const nextM = state.month === 11 ? 0 : state.month + 1;
    const nextY = state.month === 11 ? state.year + 1 : state.year;
    dispatch({ type: 'SET_DIALOG', payload: {
      title: `Close ${FULL_MONTHS[state.month]} ${state.year}`,
      message: `This will:\n\n\u2022 Set ending balance to ${currency(stats.calculatedEnding)}\n\u2022 Carry ${currency(stats.calculatedEnding)} as ${FULL_MONTHS[nextM]} beginning balance\n\u2022 Move ${stats.unpaidCount} unpaid expense(s) to ${FULL_MONTHS[nextM]}\n\u2022 Populate recurring bills for ${FULL_MONTHS[nextM]}`,
      variant: 'info', confirmLabel: 'Close Month', cancelLabel: 'Cancel',
      onConfirm: () => {
        const result = closeMonth();
        dispatch({ type: 'SET_DIALOG', payload: {
          title: 'Month Closed',
          message: `${FULL_MONTHS[state.month]} has been closed.\n\n\u2022 Balance carried: ${currency(result.endingBalance)}\n\u2022 Unpaid expenses moved: ${result.unpaidCount}\n\u2022 Recurring bills created: ${result.recurringCount}`,
          variant: 'success',
        }});
      },
      onCancel: () => {},
    }});
  };

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

          {/* Close Month Button */}
          <button
            onClick={handleCloseMonth}
            title="Close month and carry forward"
            style={{
              background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              padding: '10px 14px', borderRadius: '8px', fontWeight: '600',
              fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            Close Month
          </button>

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
