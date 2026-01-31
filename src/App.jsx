import React from 'react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Modal from './components/Modal';
import { TxForm, RecurringForm, DebtForm, BudgetSetForm, SimpleValueForm } from './components/Forms';
import Dashboard from './views/Dashboard';
import Transactions from './views/Transactions';
import Budget from './views/Budget';
import Analytics from './views/Analytics';
import Debts from './views/Debts';
import Recurring from './views/Recurring';
import Accounts from './views/Accounts';
import Cycle from './views/Cycle';
import Savings from './views/Savings';
import Recommendations from './views/Recommendations';
import Settings from './views/Settings';
import { parseCSV, parseExcel } from './utils/importParser';
import { getDateParts, uid, currency } from './utils/helpers';
import { FULL_MONTHS, APP_VERSION } from './utils/constants';

function AppContent() {
  const { state, dispatch, theme, stats } = useApp();

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const filename = file.name.toLowerCase();
    let result;
    try {
      if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        result = await parseExcel(file);
        if (result.transactions.length === 0 && result.errors.length > 0) {
          alert(`Unable to read Excel file.\n\n${result.errors[0]}`);
          e.target.value = '';
          return;
        }
      } else if (filename.endsWith('.csv') || filename.endsWith('.txt')) {
        const content = await file.text();
        result = parseCSV(content);
      } else {
        alert('Please upload a CSV or Excel file.');
        e.target.value = '';
        return;
      }

      if (result.transactions.length > 0) {
        result.transactions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        dispatch({ type: 'SET_IMPORT_DATA', payload: {
          transactions: result.transactions, errors: result.errors, filename: file.name,
          summary: {
            total: result.transactions.length,
            income: result.transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
            expenses: result.transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
          },
        }});
        dispatch({ type: 'SET_MODAL', payload: 'import-confirm' });
      } else {
        alert(`No valid transactions found in "${file.name}".`);
      }
    } catch (err) {
      alert(`Error reading file: ${err.message}`);
    }
    e.target.value = '';
  };

  const confirmImport = () => {
    if (state.importData?.transactions.length > 0) {
      const newTx = [...state.transactions, ...state.importData.transactions];
      dispatch({ type: 'SET_TRANSACTIONS', payload: newTx });

      const monthCounts = {};
      state.importData.transactions.forEach(t => {
        const parts = getDateParts(t.date);
        if (parts) { const key = `${parts.year}-${parts.month}`; monthCounts[key] = (monthCounts[key] || 0) + 1; }
      });
      const topMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
      if (topMonth) {
        const [y, m] = topMonth[0].split('-').map(Number);
        dispatch({ type: 'SET_YEAR', payload: y });
        dispatch({ type: 'SET_MONTH', payload: m });
      }

      dispatch({ type: 'SET_IMPORT_NOTIFICATION', payload: {
        count: state.importData.transactions.length,
        income: state.importData.summary.income,
        expenses: state.importData.summary.expenses,
      }});
      setTimeout(() => dispatch({ type: 'SET_IMPORT_NOTIFICATION', payload: null }), 5000);
      dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
      dispatch({ type: 'SET_IMPORT_DATA', payload: null });
      dispatch({ type: 'SET_MODAL', payload: null });
    }
  };

  const connectBank = () => {
    dispatch({ type: 'SET_PLAID_LOADING', payload: true });
    setTimeout(() => {
      dispatch({ type: 'SET_LINKED_ACCOUNTS', payload: [{ id: uid(), institution: 'USAA', accounts: [{ id: '1', name: 'Checking', mask: '4523', subtype: 'checking' }, { id: '2', name: 'Savings', mask: '7891', subtype: 'savings' }] }] });
      dispatch({ type: 'SET_PLAID_LOADING', payload: false });
      dispatch({ type: 'SET_MODAL', payload: null });
      dispatch({ type: 'SET_VIEW', payload: 'accounts' });
    }, 2500);
  };

  const views = {
    dashboard: Dashboard,
    transactions: Transactions,
    budget: Budget,
    analytics: Analytics,
    debts: Debts,
    recurring: Recurring,
    accounts: Accounts,
    cycle: Cycle,
    savings: Savings,
    recommendations: Recommendations,
    settings: Settings,
  };

  const ViewComponent = views[state.view] || Dashboard;

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: theme.bg, color: theme.text, fontSize: '14px',
      transition: 'all 200ms ease',
    }}>
      <Sidebar />

      <main style={{
        flex: 1,
        marginLeft: state.sidebarOpen ? '260px' : '0',
        minHeight: '100vh',
        transition: 'margin-left 300ms ease',
      }}>
        <Header />
        <div style={{ padding: '24px 28px' }}>
          <ViewComponent />
        </div>
      </main>

      {/* ============ MODALS ============ */}

      {state.modal === 'add' && (
        <Modal title="Add Transaction" onClose={() => dispatch({ type: 'SET_MODAL', payload: null })}>
          <TxForm onSubmit={tx => dispatch({ type: 'ADD_TRANSACTION', payload: tx })} onCancel={() => dispatch({ type: 'SET_MODAL', payload: null })} />
        </Modal>
      )}

      {state.editTx && (
        <Modal title="Edit Transaction" onClose={() => dispatch({ type: 'SET_EDIT_TX', payload: null })}>
          <TxForm tx={state.editTx} onSubmit={tx => dispatch({ type: 'UPDATE_TRANSACTION', payload: tx })} onCancel={() => dispatch({ type: 'SET_EDIT_TX', payload: null })} />
        </Modal>
      )}

      {state.modal === 'add-recurring' && (
        <Modal title="Add Recurring Expense" onClose={() => dispatch({ type: 'SET_MODAL', payload: null })}>
          <RecurringForm onSubmit={r => dispatch({ type: 'ADD_RECURRING', payload: r })} onCancel={() => dispatch({ type: 'SET_MODAL', payload: null })} />
        </Modal>
      )}

      {state.editRecurring && (
        <Modal title="Edit Recurring Expense" onClose={() => dispatch({ type: 'SET_EDIT_RECURRING', payload: null })}>
          <RecurringForm recurring={state.editRecurring} onSubmit={r => dispatch({ type: 'UPDATE_RECURRING', payload: r })} onCancel={() => dispatch({ type: 'SET_EDIT_RECURRING', payload: null })} />
        </Modal>
      )}

      {state.modal === 'add-debt' && (
        <Modal title="Add Debt" onClose={() => dispatch({ type: 'SET_MODAL', payload: null })}>
          <DebtForm onSubmit={d => dispatch({ type: 'ADD_DEBT', payload: d })} onCancel={() => dispatch({ type: 'SET_MODAL', payload: null })} />
        </Modal>
      )}

      {state.editDebt && (
        <Modal title="Edit Debt" onClose={() => dispatch({ type: 'SET_EDIT_DEBT', payload: null })}>
          <DebtForm debt={state.editDebt} onSubmit={d => dispatch({ type: 'UPDATE_DEBT', payload: d })} onCancel={() => dispatch({ type: 'SET_EDIT_DEBT', payload: null })} />
        </Modal>
      )}

      {state.modal === 'set-budgets' && (
        <Modal title="Set Budget Goals" onClose={() => dispatch({ type: 'SET_MODAL', payload: null })}>
          <BudgetSetForm budgetGoals={state.budgetGoals} onSubmit={g => { dispatch({ type: 'SET_BUDGET_GOALS', payload: g }); dispatch({ type: 'SET_MODAL', payload: null }); }} onCancel={() => dispatch({ type: 'SET_MODAL', payload: null })} />
        </Modal>
      )}

      {state.modal === 'edit-beginning' && (
        <Modal title="Set Beginning Balance" onClose={() => dispatch({ type: 'SET_MODAL', payload: null })}>
          <SimpleValueForm label={`Beginning Balance for ${FULL_MONTHS[state.month]} ${state.year}`} value={stats.beginning}
            onSubmit={v => { dispatch({ type: 'SET_BEGINNING_BALANCE', payload: v }); dispatch({ type: 'SET_MODAL', payload: null }); }}
            onCancel={() => dispatch({ type: 'SET_MODAL', payload: null })} />
        </Modal>
      )}

      {state.modal === 'edit-ending' && (
        <Modal title="Set Ending Balance" onClose={() => dispatch({ type: 'SET_MODAL', payload: null })}>
          <SimpleValueForm label={`Ending Balance for ${FULL_MONTHS[state.month]} ${state.year}`} value={stats.ending}
            onSubmit={v => { dispatch({ type: 'SET_ENDING_BALANCE', payload: v }); dispatch({ type: 'SET_MODAL', payload: null }); }}
            onCancel={() => dispatch({ type: 'SET_MODAL', payload: null })} />
        </Modal>
      )}

      {state.modal === 'edit-goal' && (
        <Modal title="Set Savings Goal" onClose={() => dispatch({ type: 'SET_MODAL', payload: null })}>
          <SimpleValueForm label="Monthly Savings Goal" value={state.savingsGoal}
            onSubmit={v => { dispatch({ type: 'SET_SAVINGS_GOAL', payload: v }); dispatch({ type: 'SET_MODAL', payload: null }); }}
            onCancel={() => dispatch({ type: 'SET_MODAL', payload: null })} />
        </Modal>
      )}

      {state.modal === 'connect' && (
        <Modal title="Connect Bank Account" onClose={() => dispatch({ type: 'SET_MODAL', payload: null })}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏦</div>
            <h4 style={{ color: theme.text, marginBottom: '8px' }}>Secure Bank Connection</h4>
            <p style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '20px' }}>
              Connect your bank to auto-mark transactions as paid when they clear.
            </p>
            <button onClick={connectBank} disabled={state.plaidLoading} style={{
              width: '100%', padding: '14px', background: theme.navActive, color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            }}>
              {state.plaidLoading ? '⏳ Connecting...' : '🔗 Connect with Plaid (Demo)'}
            </button>
            <p style={{ fontSize: '11px', color: theme.textMuted, marginTop: '12px' }}>
              Demo mode — simulates a bank connection
            </p>
          </div>
        </Modal>
      )}

      {state.modal === 'import' && (
        <Modal title="Import Transactions" onClose={() => dispatch({ type: 'SET_MODAL', payload: null })}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: theme.textSecondary }}>
              Upload a CSV or Excel file with columns: Date, Description, Amount, Category, Type, Paid
            </p>
            <div style={{ position: 'relative' }}>
              <input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleFileImport}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
              <div style={{
                padding: '40px 20px', border: `2px dashed ${theme.border}`, borderRadius: '12px',
                textAlign: 'center', color: theme.textSecondary, background: theme.bgSecondary,
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                <div style={{ fontWeight: '600' }}>Click to choose file</div>
                <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>CSV, XLSX, or XLS</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {state.modal === 'import-confirm' && state.importData && (
        <Modal title="Confirm Import" onClose={() => { dispatch({ type: 'SET_IMPORT_DATA', payload: null }); dispatch({ type: 'SET_MODAL', payload: null }); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '14px', background: theme.successBg, borderRadius: '10px', border: `1px solid ${theme.success}33` }}>
              <div style={{ fontWeight: '600', color: theme.success, marginBottom: '4px' }}>✅ {state.importData.summary.total} transactions found</div>
              <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                Income: {currency(state.importData.summary.income)} | Expenses: {currency(state.importData.summary.expenses)}
              </div>
            </div>
            {state.importData.errors.length > 0 && (
              <div style={{ padding: '12px', background: theme.warningBg, borderRadius: '8px', fontSize: '12px', color: theme.warning }}>
                ⚠️ {state.importData.errors.length} row(s) skipped
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { dispatch({ type: 'SET_IMPORT_DATA', payload: null }); dispatch({ type: 'SET_MODAL', payload: null }); }}
                style={{ flex: 1, padding: '12px', background: theme.bgHover, color: theme.text, border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmImport}
                style={{ flex: 1, padding: '12px', background: theme.success, color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Import All</button>
            </div>
          </div>
        </Modal>
      )}

      {state.modal === 'restore' && (
        <Modal title="Restore from Backup" onClose={() => { dispatch({ type: 'SET_RESTORE_DATA', payload: null }); dispatch({ type: 'SET_MODAL', payload: null }); }}>
          {!state.restoreData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: theme.textSecondary }}>Select a backup file to restore your data.</p>
              <div style={{ position: 'relative' }}>
                <input type="file" accept=".backup,.json" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const parsed = JSON.parse(ev.target.result);
                      const data = parsed.data || parsed;
                      const transactions = data.transactions || parsed.transactions;
                      if (transactions && Array.isArray(transactions)) {
                        dispatch({ type: 'SET_RESTORE_DATA', payload: {
                          filename: file.name,
                          date: parsed.exportDate || 'Unknown',
                          version: parsed.version || '1.0',
                          summary: {
                            transactions: transactions.length,
                            recurringBills: (data.recurringExpenses || parsed.recurringExpenses || []).length,
                            debts: (data.debts || parsed.debts || []).length,
                            budgetGoals: Object.keys(data.budgetGoals || parsed.budgetGoals || {}).filter(k => (data.budgetGoals || parsed.budgetGoals || {})[k] > 0).length,
                          },
                          raw: parsed,
                        }});
                      } else {
                        alert('This doesn\'t look like a Balance Books backup file.');
                      }
                    } catch { alert('Could not read this file.'); }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                <div style={{
                  padding: '40px 20px', border: `2px dashed ${theme.border}`, borderRadius: '12px',
                  textAlign: 'center', color: theme.textSecondary, background: theme.bgSecondary,
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                  <div style={{ fontWeight: '600' }}>Choose Backup File</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', background: theme.successBg, borderRadius: '10px' }}>
                <div style={{ fontWeight: '600', color: theme.success }}>✅ Backup Found: {state.restoreData.filename}</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>
                  {state.restoreData.summary.transactions} transactions, {state.restoreData.summary.recurringBills} bills, {state.restoreData.summary.debts} debts
                </div>
              </div>
              <div style={{ padding: '12px', background: theme.warningBg, borderRadius: '8px', fontSize: '12px', color: theme.warning }}>
                ⚠️ This will replace all current data with the backup.
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => dispatch({ type: 'SET_RESTORE_DATA', payload: null })} style={{ flex: 1, padding: '12px', background: theme.bgHover, color: theme.text, border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Back</button>
                <button onClick={() => {
                  const parsed = state.restoreData.raw;
                  const data = parsed.data || parsed;
                  dispatch({ type: 'RESTORE_BACKUP', payload: {
                    transactions: data.transactions || parsed.transactions || [],
                    recurringExpenses: data.recurringExpenses || parsed.recurringExpenses || [],
                    monthlyBalances: data.monthlyBalances || parsed.monthlyBalances || {},
                    savingsGoal: data.savingsGoal || parsed.savingsGoal,
                    budgetGoals: data.budgetGoals || parsed.budgetGoals,
                    debts: data.debts || parsed.debts,
                  }});
                  alert('Data restored successfully!');
                }} style={{ flex: 1, padding: '12px', background: theme.success, color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Restore</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Import Notification Toast */}
      {state.importNotification && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', background: theme.navActive,
          color: 'white', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          zIndex: 300, maxWidth: '320px',
        }}>
          <div style={{ fontWeight: '700', marginBottom: '4px' }}>✅ Import Successful!</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>{state.importNotification.count} transactions imported</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '11px', opacity: 0.8 }}>
            <span>+{currency(state.importNotification.income)} income</span>
            <span>-{currency(state.importNotification.expenses)} expenses</span>
          </div>
          <button onClick={() => dispatch({ type: 'SET_IMPORT_NOTIFICATION', payload: null })} style={{
            position: 'absolute', top: '8px', right: '8px', background: 'none',
            border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px',
          }}>✕</button>
        </div>
      )}
    </div>
  );
}

export default AppContent;
