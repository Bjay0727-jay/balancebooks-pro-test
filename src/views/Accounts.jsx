import React from 'react';
import { useApp } from '../context/AppContext';
import { uid } from '../utils/helpers';

export default function Accounts() {
  const { state, dispatch, theme } = useApp();

  const card = { background: theme.bgCard, borderRadius: '12px', border: theme.cardBorder, boxShadow: theme.cardShadow };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Info Banner */}
      <div style={{ ...card, padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px', background: theme.navActive,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0,
        }}>
          🛡️
        </div>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: theme.text }}>Secure Bank Connection</h3>
          <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary }}>Transactions auto-marked as paid when cleared</p>
        </div>
      </div>

      {/* Linked Accounts */}
      {state.linkedAccounts.length > 0 ? (
        state.linkedAccounts.map(acc => (
          <div key={acc.id} style={{ ...card, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', background: theme.navActive,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '20px',
                }}>
                  {acc.institution.charAt(0)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: '700', color: theme.text }}>{acc.institution}</h4>
                  <span style={{ fontSize: '11px', color: theme.success, fontWeight: '600' }}>✓ Auto-marking enabled</span>
                </div>
              </div>
              <button onClick={() => dispatch({ type: 'SET_LINKED_ACCOUNTS', payload: [] })} style={{
                padding: '8px 14px', background: theme.dangerBg, color: theme.danger,
                border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>Unlink</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {acc.accounts.map(a => (
                <div key={a.id} style={{ padding: '12px', borderRadius: '8px', background: theme.bgSecondary, border: `1px solid ${theme.borderLight}` }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: theme.text }}>{a.subtype}</div>
                  <div style={{ fontSize: '11px', color: theme.textMuted }}>••••{a.mask}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div style={{ ...card, padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏦</div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.text, marginBottom: '4px' }}>No Banks Connected</h3>
          <p style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '16px' }}>Connect your bank to auto-track payments</p>
          <button
            onClick={() => dispatch({ type: 'SET_MODAL', payload: 'connect' })}
            style={{
              padding: '12px 24px', background: theme.navActive, color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
            }}
          >
            🔗 Connect Bank
          </button>
        </div>
      )}
    </div>
  );
}
