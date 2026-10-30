import React from 'react';
import { AlertTriangle, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';

export function ErrorBanner({ message, onRetry, isRefreshing }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(225, 29, 72, 0.05))',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 1.75rem',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 8px 24px -6px rgba(244, 63, 94, 0.2)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb7185',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffe4e6', marginBottom: '0.2rem' }}>
              Backend API Connection Unavailable
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#fda4af', margin: 0 }}>
              {message || 'Unable to establish connection with FastAPI backend at http://127.0.0.1:8000'}
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRefreshing}
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #e11d48, #be123c)',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)',
              alignSelf: 'center'
            }}
          >
            <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            {isRefreshing ? 'Retrying Connection...' : 'Retry Connection'}
          </button>
        )}
      </div>

      <div
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          fontSize: '0.82rem',
          color: '#cbd5e1',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontFamily: "'JetBrains Mono', monospace"
        }}
      >
        <Terminal size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
        <span>Tip: Ensure FastAPI is active in terminal: <code style={{ color: '#38bdf8' }}>uvicorn app.main:app --reload --port 8000</code></span>
      </div>
    </div>
  );
}
