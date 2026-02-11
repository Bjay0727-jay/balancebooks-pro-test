import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', fontFamily: "'Inter', sans-serif", padding: '24px',
          background: '#f8fafc', color: '#1e293b',
        }}>
          <div style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Something went wrong</h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              An unexpected error occurred. Your data is safe — try reloading the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px', background: '#4f46e5', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
