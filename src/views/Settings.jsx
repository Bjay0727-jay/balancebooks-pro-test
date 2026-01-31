import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { APP_VERSION } from '../utils/constants';
import { exportCSV, downloadTemplate } from '../utils/helpers';

const DROPBOX_APP_KEY = '';

export default function Settings() {
  const { state, dispatch, theme } = useApp();
  const [dropboxStatus, setDropboxStatus] = useState('disconnected');
  const [dropboxUser, setDropboxUser] = useState(null);
  const [backupProgress, setBackupProgress] = useState(null);

  // Check for existing Dropbox token on mount
  useEffect(() => {
    const token = localStorage.getItem('bb_dropbox_token');
    if (token) {
      setDropboxStatus('connected');
      const user = localStorage.getItem('bb_dropbox_user');
      if (user) setDropboxUser(user);
    }
    // Check for OAuth redirect hash
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        localStorage.setItem('bb_dropbox_token', accessToken);
        setDropboxStatus('connected');
        window.history.replaceState(null, '', window.location.pathname);
        // Fetch user info
        fetch('https://api.dropboxapi.com/2/users/get_current_account', {
          method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` },
        }).then(r => r.json()).then(data => {
          if (data.name) {
            const name = data.name.display_name;
            setDropboxUser(name);
            localStorage.setItem('bb_dropbox_user', name);
          }
        }).catch(() => {});
      }
    }
  }, []);

  const card = {
    background: theme.bgCard, borderRadius: '12px',
    border: theme.cardBorder, boxShadow: theme.cardShadow, padding: '24px',
  };

  const sectionTitle = (icon, title, subtitle) => (
    <div style={{ marginBottom: '18px' }}>
      <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: theme.text }}>
        {icon} {title}
      </h3>
      {subtitle && <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>{subtitle}</p>}
    </div>
  );

  const toggle = (enabled, onChange) => (
    <div onClick={onChange} style={{
      width: '44px', height: '24px', borderRadius: '12px',
      background: enabled ? theme.accent : theme.border,
      position: 'relative', transition: 'all 200ms ease', cursor: 'pointer', flexShrink: 0,
    }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%', background: 'white',
        position: 'absolute', top: '2px', left: enabled ? '22px' : '2px',
        transition: 'all 200ms ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );

  const settingRow = (label, desc, control, isLast) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 0',
      borderBottom: isLast ? 'none' : `1px solid ${theme.borderLight}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>{label}</div>
        <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>{desc}</div>
      </div>
      {control}
    </div>
  );

  const connectDropbox = () => {
    if (!DROPBOX_APP_KEY) {
      alert('Dropbox integration requires an App Key.\n\nTo set up:\n1. Go to dropbox.com/developers/apps\n2. Create an app with "Full Dropbox" access\n3. Add your redirect URI\n4. Copy the App Key into Settings.jsx\n\nSee docs for details.');
      return;
    }
    setDropboxStatus('connecting');
    const redirectUri = window.location.origin + '/settings';
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  };

  const disconnectDropbox = () => {
    setDropboxStatus('disconnected');
    setDropboxUser(null);
    localStorage.removeItem('bb_dropbox_token');
    localStorage.removeItem('bb_dropbox_user');
  };

  const backupToDropbox = async () => {
    const token = localStorage.getItem('bb_dropbox_token');
    if (!token) { alert('Please connect Dropbox first.'); return; }
    setBackupProgress('uploading');
    try {
      const data = {
        version: APP_VERSION, exportDate: new Date().toISOString(),
        data: { transactions: state.transactions, recurringExpenses: state.recurringExpenses, monthlyBalances: state.monthlyBalances, savingsGoal: state.savingsGoal, budgetGoals: state.budgetGoals, debts: state.debts },
      };
      const filename = `/BalanceBooks-Backup-${new Date().toISOString().split('T')[0]}.json`;
      const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({ path: filename, mode: 'overwrite', autorename: false }),
        },
        body: JSON.stringify(data, null, 2),
      });
      if (res.ok) {
        setBackupProgress('success');
        dispatch({ type: 'SET_LAST_BACKUP', payload: new Date().toISOString() });
        setTimeout(() => setBackupProgress(null), 3000);
      } else {
        throw new Error('Upload failed');
      }
    } catch {
      setBackupProgress('error');
      setTimeout(() => setBackupProgress(null), 3000);
    }
  };

  const handleLocalBackup = () => {
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
    dispatch({ type: 'SET_LAST_BACKUP', payload: new Date().toISOString() });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>

      {/* Preferences */}
      <div style={card}>
        {sectionTitle('⚙️', 'Preferences', 'Customize your BalanceBooks experience')}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {settingRow('Dark Mode', 'Switch between light and dark themes', toggle(state.darkMode, () => dispatch({ type: 'TOGGLE_DARK_MODE' })))}
          {settingRow('Bill Reminders', 'Get notified when bills are due within 7 days', toggle(state.notificationsEnabled, () => dispatch({ type: 'SET_NOTIFICATIONS', payload: !state.notificationsEnabled })))}
          {settingRow('Auto Backup', 'Automatically backup data every 24 hours', toggle(state.autoBackupEnabled, () => dispatch({ type: 'SET_AUTO_BACKUP', payload: !state.autoBackupEnabled })), true)}
        </div>
      </div>

      {/* Import & Export */}
      <div style={card}>
        {sectionTitle('📁', 'Import & Export', 'Move your data in and out of BalanceBooks')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={() => exportCSV(state.transactions)} style={{
            padding: '12px 16px', background: theme.accent, color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>📥 Export CSV</button>
          <button onClick={downloadTemplate} style={{
            padding: '12px 16px', background: theme.bgHover, color: theme.text,
            border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>📄 Import Template</button>
          <button onClick={() => dispatch({ type: 'SET_MODAL', payload: 'import' })} style={{
            padding: '12px 16px', background: theme.navActive, color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>📥 Import Transactions</button>
          <button onClick={() => dispatch({ type: 'SET_MODAL', payload: 'restore' })} style={{
            padding: '12px 16px', background: theme.bgHover, color: theme.text,
            border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>📂 Restore Backup</button>
        </div>
      </div>

      {/* Backup & Cloud */}
      <div style={card}>
        {sectionTitle('☁️', 'Backup & Cloud Storage', 'Save your data locally or sync to the cloud')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Local Backup */}
          <div style={{
            padding: '16px', background: theme.bgSecondary, borderRadius: '10px',
            border: `1px solid ${theme.borderLight}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>💾 Local Backup</div>
                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>
                  {state.lastBackupDate
                    ? `Last backup: ${new Date(state.lastBackupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                    : 'No backups yet'}
                </div>
              </div>
            </div>
            <button onClick={handleLocalBackup} style={{
              width: '100%', padding: '10px', background: theme.success, color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}>💾 Save Backup to Device</button>
          </div>

          {/* Dropbox */}
          <div style={{
            padding: '16px', background: theme.bgSecondary, borderRadius: '10px',
            border: `1px solid ${theme.borderLight}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: '#0061FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '16px', fontWeight: '700',
                }}>D</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>Dropbox</div>
                  <div style={{ fontSize: '11px', color: theme.textMuted }}>
                    {dropboxStatus === 'connected' ? `Connected as ${dropboxUser || 'user'}` : 'Sync backups to Dropbox'}
                  </div>
                </div>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700',
                background: dropboxStatus === 'connected' ? theme.successBg : theme.warningBg,
                color: dropboxStatus === 'connected' ? theme.success : theme.warning,
              }}>
                {dropboxStatus === 'connected' ? 'Connected' : dropboxStatus === 'connecting' ? 'Connecting...' : 'Not Connected'}
              </span>
            </div>

            {dropboxStatus === 'connected' ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={backupToDropbox} disabled={backupProgress === 'uploading'} style={{
                  flex: 1, padding: '10px', background: '#0061FF', color: 'white',
                  border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                }}>
                  {backupProgress === 'uploading' ? '⏳ Uploading...' : backupProgress === 'success' ? '✅ Saved!' : backupProgress === 'error' ? '❌ Failed' : '☁️ Backup to Dropbox'}
                </button>
                <button onClick={disconnectDropbox} style={{
                  padding: '10px 14px', background: theme.bgHover, color: theme.danger,
                  border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                }}>Disconnect</button>
              </div>
            ) : (
              <button onClick={connectDropbox} disabled={dropboxStatus === 'connecting'} style={{
                width: '100%', padding: '10px', background: '#0061FF', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              }}>
                {dropboxStatus === 'connecting' ? '⏳ Connecting...' : '🔗 Connect Dropbox'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Stats */}
      <div style={card}>
        {sectionTitle('📊', 'Data Overview', 'Summary of your stored data')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'Transactions', value: state.transactions.length, icon: '💳' },
            { label: 'Recurring Bills', value: state.recurringExpenses.length, icon: '🔄' },
            { label: 'Debts Tracked', value: state.debts.length, icon: '📊' },
          ].map(item => (
            <div key={item.label} style={{
              padding: '14px', background: theme.bgSecondary, borderRadius: '10px',
              textAlign: 'center', border: `1px solid ${theme.borderLight}`,
            }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: theme.text }}>{item.value}</div>
              <div style={{ fontSize: '11px', color: theme.textMuted }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ ...card, borderColor: theme.danger + '40' }}>
        {sectionTitle('⚠️', 'Danger Zone', 'Irreversible actions')}
        <button onClick={() => {
          if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
            dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
            dispatch({ type: 'SET_RECURRING', payload: [] });
            dispatch({ type: 'SET_DEBTS', payload: [] });
            dispatch({ type: 'SET_BUDGET_GOALS', payload: {} });
            dispatch({ type: 'SET_MONTHLY_BALANCES', payload: {} });
            localStorage.clear();
            alert('All data has been cleared.');
          }
        }} style={{
          width: '100%', padding: '12px', background: 'transparent', color: theme.danger,
          border: `2px solid ${theme.danger}`, borderRadius: '8px', fontSize: '13px',
          fontWeight: '600', cursor: 'pointer',
        }}>🗑 Delete All Data</button>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '12px', color: theme.textMuted, fontSize: '12px' }}>
        BalanceBooks Pro v{APP_VERSION}
      </div>
    </div>
  );
}
