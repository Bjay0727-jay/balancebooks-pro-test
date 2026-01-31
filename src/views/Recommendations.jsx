import React from 'react';
import { useApp } from '../context/AppContext';
import { currency } from '../utils/helpers';

export default function Recommendations() {
  const { theme, savingsRecommendations, stats, monthTx, state } = useApp();

  const card = { background: theme.bgCard, borderRadius: '12px', border: theme.cardBorder, boxShadow: theme.cardShadow };

  // Debug panel - remove after confirming fix
  const debug = (
    <div style={{ padding: '12px', background: '#1e1e1e', color: '#0f0', fontFamily: 'monospace', fontSize: '11px', borderRadius: '8px', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
      <strong>DEBUG (remove after fix):</strong>{'\n'}
      transactions total: {state.transactions.length}{'\n'}
      monthTx (current month): {monthTx.length}{'\n'}
      stats.income: {stats.income}, stats.expenses: {stats.expenses}, stats.saved: {stats.saved}{'\n'}
      savingsRecommendations count: {savingsRecommendations.length}{'\n'}
      recs: {JSON.stringify(savingsRecommendations.map(r => ({ id: r.id, title: r.title, type: r.type })), null, 1)}
    </div>
  );

  const typeColors = {
    success: { bg: theme.successBg, color: theme.success, icon: '✅' },
    alert: { bg: theme.dangerBg, color: theme.danger, icon: '⚠️' },
    increase: { bg: theme.accentLight, color: theme.accent, icon: '📈' },
    reduce: { bg: theme.warningBg, color: theme.warning, icon: '💡' },
    audit: { bg: theme.accentLight, color: theme.accent, icon: '🔍' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{
        background: theme.insightsGradient, borderRadius: '12px', padding: '20px', color: 'white',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>💡 Smart Money Tips</div>
        <div style={{ fontSize: '13px', opacity: 0.8 }}>Personalized recommendations based on your spending patterns</div>
      </div>

      {debug}
      {savingsRecommendations.length === 0 ? (
        <div style={{ ...card, padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.text }}>You're Doing Great!</h3>
          <p style={{ fontSize: '13px', color: theme.textMuted }}>No recommendations at this time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {savingsRecommendations.map(rec => {
            const tc = typeColors[rec.type] || typeColors.reduce;
            return (
              <div key={rec.id} style={{ ...card, padding: '20px' }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', background: tc.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0,
                  }}>
                    {tc.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: theme.text }}>{rec.title}</h4>
                      {rec.priority === 'high' && rec.type !== 'success' && (
                        <span style={{
                          padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600',
                          background: theme.warningBg, color: theme.warning,
                        }}>High Priority</span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: theme.textSecondary, lineHeight: 1.5 }}>{rec.description}</p>
                    {rec.potential > 0 && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px', borderRadius: '8px', background: theme.successBg,
                        fontSize: '12px', fontWeight: '600', color: theme.success, marginBottom: '10px',
                      }}>
                        💰 Potential savings: {currency(rec.potential)}/mo
                      </div>
                    )}
                    {rec.tips && rec.tips.length > 0 && (
                      <div style={{ padding: '12px', background: theme.bgSecondary, borderRadius: '8px', border: `1px solid ${theme.borderLight}` }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px' }}>Action Steps:</div>
                        {rec.tips.map((tip, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                            <span style={{
                              width: '18px', height: '18px', borderRadius: '50%', background: theme.accent,
                              color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, marginTop: '1px',
                            }}>{i + 1}</span>
                            <span style={{ fontSize: '12px', color: theme.textSecondary }}>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
