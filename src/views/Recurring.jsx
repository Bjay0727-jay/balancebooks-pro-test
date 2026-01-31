import React from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, FREQUENCY_OPTIONS } from '../utils/constants';
import { currency } from '../utils/helpers';

export default function Recurring() {
  const { state, dispatch, theme, totalMonthlyRecurring } = useApp();

  const card = { background: theme.bgCard, borderRadius: '12px', border: theme.cardBorder, boxShadow: theme.cardShadow };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        background: theme.navActive, borderRadius: '12px', padding: '20px',
        color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Monthly Recurring</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{currency(totalMonthlyRecurring)}</div>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_MODAL', payload: 'add-recurring' })}
          style={{
            padding: '10px 18px', background: 'white', color: '#1e3a5f',
            border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
          }}
        >
          + Add
        </button>
      </div>

      {/* List */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {state.recurringExpenses.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: theme.textMuted }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔄</div>
            <p style={{ fontSize: '13px' }}>No recurring expenses yet.</p>
          </div>
        ) : state.recurringExpenses.map((r, i) => {
          const cat = CATEGORIES.find(c => c.id === r.category);
          const freq = FREQUENCY_OPTIONS.find(f => f.id === r.frequency);
          return (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', opacity: r.active ? 1 : 0.5,
              borderBottom: i < state.recurringExpenses.length - 1 ? `1px solid ${theme.borderLight}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  onClick={() => dispatch({ type: 'TOGGLE_RECURRING_ACTIVE', payload: r.id })}
                  style={{
                    width: '18px', height: '18px', borderRadius: '5px',
                    border: r.active ? 'none' : `2px solid ${theme.border}`,
                    background: r.active ? theme.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {r.active && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                </div>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px', background: theme.bgHover,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                }}>
                  {cat?.icon}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>{r.name}</div>
                  <div style={{ fontSize: '11px', color: theme.textMuted, display: 'flex', gap: '6px' }}>
                    <span>{freq?.name}</span> &bull; <span>Due: {r.dueDay}</span>
                    {r.autoPay && <><span>&bull;</span><span style={{ color: theme.accent, fontWeight: '600' }}>Auto-pay</span></>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: theme.text }}>{currency(r.amount)}</span>
                <button onClick={() => dispatch({ type: 'CREATE_FROM_RECURRING', payload: r })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: theme.success }} title="Create transaction">➕</button>
                <button onClick={() => dispatch({ type: 'SET_EDIT_RECURRING', payload: r })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                <button onClick={() => dispatch({ type: 'DELETE_RECURRING', payload: r.id })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: theme.danger }}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
