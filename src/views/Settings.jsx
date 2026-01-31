import React from 'react';
import { useApp } from '../context/AppContext';
import { APP_VERSION } from '../utils/constants';
import { exportCSV, downloadTemplate } from '../utils/helpers';

export default function Settings() {
  const { state, dispatch, theme } = useApp();

  const card = { background: theme.bgCard, borderRadius: '12px', border: theme.cardBorder, boxShadow: theme.cardShadow, padding: '20px' };

  const toggle = (enabled, onChange) => (
    <div onClick={onChange} style={{
      width: '40px', height: '22px', borderRadius: '11px',
      background: enabled ? theme.accent : theme.border,
      position: 'relative', transition: 'all 200ms ease', cursor: 'pointer',
    }}>
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', background: 'white',
        position: 'absolute', top: '2px', left: enabled ? '20px' : '2px',
        transition: 'all 200ms ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
      <div style={card}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: theme.text }}>⚙️ Preferences</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>Dark Mode</div>
              <div style={{ fontSize: '11px', color: theme.textMuted }}>Switch between light and dark themes</div>
            </div>
            {toggle(state.darkMode, () => dispatch({ type: 'TOGGLE_DARK_MODE' }))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>Bill Reminders</div>
              <div style={{ fontSize: '11px', color: theme.textMuted }}>Get notified when bills are due soon</div>
            </div>
            {toggle(state.notificationsEnabled, () => dispatch({ type: 'SET_NOTIFICATIONS', payload: !state.notificationsEnabled }))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>Auto Backup</div>
              <div style={{ fontSize: '11px', color: theme.textMuted }}>Automatically backup data every 24 hours</div>
            </div>
            {toggle(state.autoBackupEnabled, () => dispatch({ type: 'SET_AUTO_BACKUP', payload: !state.autoBackupEnabled }))}
          </div>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: theme.text }}>📁 Data Management</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => exportCSV(state.transactions)} style={{
            width: '100%', padding: '12px', background: theme.accent, color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}>📥 Export Transactions (CSV)</button>
          <button onClick={downloadTemplate} style={{
            width: '100%', padding: '12px', background: theme.bgHover, color: theme.text,
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}>📄 Download Import Template</button>
          <button onClick={() => dispatch({ type: 'SET_MODAL', payload: 'import' })} style={{
            width: '100%', padding: '12px', background: theme.navActive, color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}>📥 Import Transactions</button>
          <button onClick={() => {
            const data = {
              version: APP_VERSION, exportDate: new Date().toISOString(),
              data: { transactions: state.transactions, recurringExpenses: state.recurringExpenses, monthlyBalances: state.monthlyBalances, savingsGoal: state.savingsGoal, budgetGoals: state.budgetGoals, debts: state.debts },
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `BalanceBooks-Backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
          }} style={{
            width: '100%', padding: '12px', background: theme.success, color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}>💾 Save Backup</button>
          <button onClick={() => dispatch({ type: 'SET_MODAL', payload: 'restore' })} style={{
            width: '100%', padding: '12px', background: theme.warning, color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}>📂 Restore from Backup</button>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '12px', color: theme.textMuted, fontSize: '12px' }}>
        BalanceBooks Pro v{APP_VERSION}
      </div>
    </div>
  );
}
