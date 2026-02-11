import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function ConfirmDialog({ title, message, confirmLabel = 'OK', cancelLabel, onConfirm, onCancel, variant = 'info' }) {
  const { theme } = useApp();
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') (onCancel || onConfirm)();
    };
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, onConfirm]);

  const colors = {
    info: { bg: theme.accentLight, border: theme.accent, icon: 'info' },
    success: { bg: theme.successBg, border: theme.success, icon: 'success' },
    warning: { bg: theme.warningBg, border: theme.warning, icon: 'warning' },
    danger: { bg: theme.dangerBg, border: theme.danger, icon: 'danger' },
  };
  const v = colors[variant] || colors.info;

  const icons = { info: '\u2139\uFE0F', success: '\u2705', warning: '\u26A0\uFE0F', danger: '\u26D4' };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 250, padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && (onCancel || onConfirm)()}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby="confirm-dialog-message"
        tabIndex={-1}
        style={{
          width: '100%', maxWidth: '420px', borderRadius: '16px',
          background: theme.bgCard, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: theme.cardBorder, outline: 'none', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icons[v.icon]}</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: theme.text }}>{title}</h3>
          <p id="confirm-dialog-message" style={{
            margin: 0, fontSize: '13px', color: theme.textSecondary,
            lineHeight: 1.5, whiteSpace: 'pre-line',
          }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', padding: '16px 24px 24px' }}>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '12px', background: theme.bgHover, color: theme.text,
                border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
              }}
            >{cancelLabel || 'Cancel'}</button>
          )}
          <button
            onClick={onConfirm}
            autoFocus
            style={{
              flex: 1, padding: '12px',
              background: variant === 'danger' ? theme.danger : variant === 'success' ? theme.success : theme.accent,
              color: 'white', border: 'none', borderRadius: '8px',
              fontWeight: '600', fontSize: '13px', cursor: 'pointer',
            }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
