import React from 'react';
import { useApp } from '../context/AppContext';
import { NAV_SECTIONS, APP_VERSION } from '../utils/constants';
import { isMobile } from '../utils/helpers';

export default function Sidebar() {
  const { state, dispatch, theme, stats, budgetStats } = useApp();

  const badges = {
    transactions: stats.unpaidCount || null,
    budget: budgetStats.categoriesOverBudget || null,
    debts: state.debts.length || null,
    recurring: state.recurringExpenses.filter(r => r.active).length || null,
    accounts: state.linkedAccounts.length || null,
  };

  return (
    <>
      {isMobile && state.sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 90 }}
          onClick={() => dispatch({ type: 'SET_SIDEBAR', payload: false })}
        />
      )}
      <aside style={{
        width: '260px',
        background: theme.bgSidebar,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        transform: state.sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 300ms ease',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: theme.navActive,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="white" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <path d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: theme.text, margin: 0 }}>BalanceBooks</h1>
              <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '500' }}>Pro &bull; v{APP_VERSION}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '10px', fontWeight: '600', textTransform: 'uppercase',
                letterSpacing: '0.5px', color: theme.textMuted, padding: '0 12px', marginBottom: '8px',
              }}>
                {section.section}
              </div>
              {section.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    dispatch({ type: 'SET_VIEW', payload: item.id });
                    if (isMobile) dispatch({ type: 'SET_SIDEBAR', payload: false });
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: '600',
                    color: state.view === item.id ? 'white' : theme.text,
                    background: state.view === item.id ? theme.navActive : 'transparent',
                    cursor: 'pointer', marginBottom: '2px', transition: 'all 150ms ease',
                  }}
                >
                  <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {badges[item.id] && (
                    <span style={{
                      padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600',
                      background: state.view === item.id ? 'rgba(255,255,255,0.2)' : theme.warningBg,
                      color: state.view === item.id ? 'white' : theme.warning,
                    }}>
                      {badges[item.id]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px', borderTop: `1px solid ${theme.border}` }}>
          <div
            onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: '8px', background: theme.bgHover,
              cursor: 'pointer', marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: '500', color: theme.textSecondary }}>
              {state.darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
            <div style={{
              width: '40px', height: '22px', borderRadius: '11px',
              background: state.darkMode ? theme.accent : theme.border,
              position: 'relative', transition: 'all 200ms ease',
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '2px',
                left: state.darkMode ? '20px' : '2px',
                transition: 'all 200ms ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>

          <button
            onClick={() => dispatch({ type: 'SET_MODAL', payload: 'connect' })}
            style={{
              width: '100%', padding: '12px', background: theme.accent, color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginBottom: '8px',
            }}
          >
            🔗 Connect Bank
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_MODAL', payload: 'import' })}
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #1e3a5f, #14b8a6)',
              color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            📥 Import
          </button>
        </div>
      </aside>
    </>
  );
}
