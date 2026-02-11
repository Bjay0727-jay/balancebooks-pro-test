import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function Modal({ title, children, onClose }) {
  const { theme } = useApp();
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    // Focus the dialog on mount for screen readers
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 200, padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{
          width: '100%', maxWidth: '480px', borderRadius: '16px',
          background: theme.bgCard, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxHeight: '90vh', overflowY: 'auto', border: theme.cardBorder,
          outline: 'none',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: `1px solid ${theme.border}`,
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: theme.text }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: theme.bgHover, border: 'none', borderRadius: '8px',
              padding: '6px 10px', cursor: 'pointer', color: theme.textSecondary,
              fontSize: '16px', fontWeight: '600',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}
