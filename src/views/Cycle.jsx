import React from 'react';
import { useApp } from '../context/AppContext';
import { currency } from '../utils/helpers';

export default function Cycle() {
  const { theme, cycleData } = useApp();

  return (
    <div style={{
      background: theme.bgCard, borderRadius: '12px',
      border: theme.cardBorder, boxShadow: theme.cardShadow, overflowX: 'auto',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: theme.bgSecondary, borderBottom: `2px solid ${theme.border}` }}>
            {['Month', 'Beginning', 'Income', 'Expenses', 'Net', 'Ending'].map(h => (
              <th key={h} style={{ padding: '14px 16px', textAlign: h === 'Month' ? 'left' : 'right', fontWeight: '600', color: theme.textSecondary, fontSize: '12px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cycleData.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${theme.borderLight}` }}>
              <td style={{ padding: '12px 16px', fontWeight: '600', color: theme.text }}>{row.month} {row.year}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: theme.textSecondary }}>{currency(row.beginning)}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: theme.success, fontWeight: '500' }}>{currency(row.income)}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: theme.danger }}>{currency(row.expenses)}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: row.net >= 0 ? theme.success : theme.danger }}>
                {row.net >= 0 ? '+' : ''}{currency(row.net)}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: theme.accent }}>{currency(row.ending)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
