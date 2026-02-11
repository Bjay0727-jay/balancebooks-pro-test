import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, TRANSACTIONS_PAGE_SIZE } from '../utils/constants';
import { currency, shortDate, exportCSV } from '../utils/helpers';

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const TxRow = React.memo(function TxRow({ tx, theme, isSelected, isLast, onToggleSelect, onTogglePaid, onEdit, onDelete }) {
  const cat = CATEGORY_MAP[tx.category];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 20px',
      borderBottom: isLast ? 'none' : `1px solid ${theme.borderLight}`,
      background: isSelected ? theme.accentLight : 'transparent',
    }}>
      {/* Selection checkbox */}
      <div
        role="checkbox"
        aria-checked={isSelected}
        aria-label={`Select ${tx.desc}`}
        tabIndex={0}
        onClick={() => onToggleSelect(tx.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleSelect(tx.id); } }}
        style={{
          width: '18px', height: '18px', borderRadius: '4px',
          border: isSelected ? 'none' : `2px solid ${theme.border}`,
          background: isSelected ? theme.accent : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: '10px', cursor: 'pointer', flexShrink: 0,
        }}
      >
        {isSelected && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
      </div>
      {/* Paid toggle */}
      <div
        role="checkbox"
        aria-checked={tx.paid}
        aria-label={`Mark ${tx.desc} as ${tx.paid ? 'unpaid' : 'paid'}`}
        tabIndex={0}
        onClick={() => onTogglePaid(tx.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTogglePaid(tx.id); } }}
        style={{
          width: '18px', height: '18px', borderRadius: '50%',
          border: tx.paid ? 'none' : `2px solid ${theme.border}`,
          background: tx.paid ? theme.success : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: '12px', cursor: 'pointer', flexShrink: 0,
        }}
      >
        {tx.paid && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
      </div>
      <div style={{
        width: '36px', height: '36px', borderRadius: '8px', background: theme.bgHover,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
        marginRight: '12px', flexShrink: 0,
      }}>
        {cat?.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: theme.text, marginBottom: '2px' }}>{tx.desc}</div>
        <div style={{ fontSize: '11px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
          {shortDate(tx.date)} &bull; {cat?.name}
          <span style={{
            padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600',
            background: tx.paid ? theme.successBg : theme.warningBg,
            color: tx.paid ? theme.success : theme.warning,
          }}>
            {tx.paid ? 'Paid' : 'Pending'}
          </span>
        </div>
      </div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: tx.amount > 0 ? theme.success : theme.text, marginRight: '12px' }}>
        {tx.amount > 0 ? '+' : ''}{currency(tx.amount)}
      </div>
      <button onClick={() => onEdit(tx)} aria-label={`Edit ${tx.desc}`} style={{
        background: 'none', border: 'none', cursor: 'pointer', color: theme.accent, fontSize: '14px', padding: '4px 6px',
      }}>✏️</button>
      <button onClick={() => onDelete(tx.id)} aria-label={`Delete ${tx.desc}`} style={{
        background: 'none', border: 'none', cursor: 'pointer', color: theme.danger, fontSize: '14px', padding: '4px 6px',
      }}>🗑</button>
    </div>
  );
});

export default function Transactions() {
  const { state, dispatch, theme, filtered } = useApp();
  const [selected, setSelected] = useState(new Set());
  const [localSearch, setLocalSearch] = useState(state.search);
  const debounceRef = useRef(null);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setLocalSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch({ type: 'SET_SEARCH', payload: val });
    }, 300);
  }, [dispatch]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const pageItems = useMemo(() => filtered.slice(0, TRANSACTIONS_PAGE_SIZE), [filtered]);

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleTogglePaid = useCallback((id) => {
    dispatch({ type: 'TOGGLE_PAID', payload: id });
  }, [dispatch]);

  const handleEdit = useCallback((tx) => {
    dispatch({ type: 'SET_EDIT_TX', payload: tx });
  }, [dispatch]);

  const handleDelete = useCallback((id) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  }, [dispatch]);

  const selectAll = () => setSelected(new Set(pageItems.map(t => t.id)));
  const deselectAll = () => setSelected(new Set());

  const markSelectedPaid = () => {
    if (selected.size === 0) return;
    dispatch({ type: 'BATCH_SET_PAID', payload: { ids: selected, paid: true } });
    setSelected(new Set());
  };

  const markSelectedUnpaid = () => {
    if (selected.size === 0) return;
    dispatch({ type: 'BATCH_SET_PAID', payload: { ids: selected, paid: false } });
    setSelected(new Set());
  };

  const inputStyle = {
    padding: '10px 14px', background: theme.bgSecondary,
    border: theme.cardBorder, borderRadius: '8px', fontSize: '13px',
    color: theme.text, outline: 'none',
  };

  const hasSelection = selected.size > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
          <input
            type="text" placeholder="Search..." value={localSearch}
            onChange={handleSearchChange}
            aria-label="Search transactions"
            style={{ ...inputStyle, width: '100%', paddingLeft: '36px' }}
          />
        </div>
        <select value={state.filterCat} onChange={e => dispatch({ type: 'SET_FILTER_CAT', payload: e.target.value })} style={inputStyle}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={state.filterPaid} onChange={e => dispatch({ type: 'SET_FILTER_PAID', payload: e.target.value })} style={inputStyle}>
          <option value="all">All Status</option>
          <option value="paid">✓ Paid</option>
          <option value="unpaid">○ Unpaid</option>
        </select>
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
        padding: '12px 16px', background: theme.bgSecondary, borderRadius: '10px', border: `1px solid ${theme.border}`,
      }}>
        <span style={{ fontSize: '13px', color: theme.textSecondary }}>
          <strong>{filtered.length}</strong> transactions
          {hasSelection && <span style={{ color: theme.accent, marginLeft: '8px' }}>{selected.size} selected</span>}
          {state.transactions.length > 0 && <span style={{ color: theme.textMuted }}> &bull; Total: {state.transactions.length}</span>}
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filtered.length > 0 && (
            <>
              <button onClick={hasSelection ? deselectAll : selectAll} style={{
                padding: '8px 14px', background: theme.bgHover, color: theme.text,
                border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>{hasSelection ? '✕ Deselect All' : '☐ Select All'}</button>
              {hasSelection && (
                <>
                  <button onClick={markSelectedPaid} style={{
                    padding: '8px 14px', background: theme.success, color: 'white',
                    border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  }}>✓ Mark Paid ({selected.size})</button>
                  <button onClick={markSelectedUnpaid} style={{
                    padding: '8px 14px', background: theme.warning, color: 'white',
                    border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  }}>○ Mark Unpaid ({selected.size})</button>
                </>
              )}
            </>
          )}
          <button onClick={() => exportCSV(state.transactions)} style={{
            padding: '8px 14px', background: theme.accent, color: 'white',
            border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }}>📥 Export CSV</button>
          <button onClick={() => {
            if (state.transactions.length > 0) {
              dispatch({ type: 'SET_DIALOG', payload: {
                title: 'Delete All Transactions',
                message: `Delete ALL ${state.transactions.length} transactions? This cannot be undone.`,
                variant: 'danger', confirmLabel: 'Delete All', cancelLabel: 'Cancel',
                onConfirm: () => { dispatch({ type: 'SET_TRANSACTIONS', payload: [] }); setSelected(new Set()); },
                onCancel: () => {},
              }});
            }
          }} style={{
            padding: '8px 14px', background: theme.danger, color: 'white',
            border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }} disabled={state.transactions.length === 0}>🗑 Delete All</button>
        </div>
      </div>

      {/* Transaction List */}
      <div style={{
        background: theme.bgCard, borderRadius: '12px',
        border: theme.cardBorder, boxShadow: theme.cardShadow, overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: theme.textMuted }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.text, marginBottom: '4px' }}>No transactions found</h3>
            <p style={{ fontSize: '13px' }}>
              {state.search || state.filterCat !== 'all' || state.filterPaid !== 'all' ? 'Try adjusting your filters' : 'Add your first transaction to get started'}
            </p>
          </div>
        ) : pageItems.map((tx, i) => (
          <TxRow
            key={tx.id}
            tx={tx}
            theme={theme}
            isSelected={selected.has(tx.id)}
            isLast={i >= pageItems.length - 1}
            onToggleSelect={toggleSelect}
            onTogglePaid={handleTogglePaid}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        {filtered.length > TRANSACTIONS_PAGE_SIZE && (
          <div style={{ padding: '12px 20px', textAlign: 'center', fontSize: '12px', color: theme.textMuted, background: theme.bgSecondary }}>
            Showing first {TRANSACTIONS_PAGE_SIZE} of {filtered.length} transactions. Use filters to narrow results.
          </div>
        )}
      </div>
    </div>
  );
}
