import React from 'react';
import {
  X,
  Server,
  Database,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '../common/Badge';

export function SystemStatusModal({ isOpen, onClose, systemHealth, onRefresh, isRefreshing }) {
  if (!isOpen) return null;

  const isApiUp = systemHealth.api === 'connected';
  const isDbUp = systemHealth.database === 'connected';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '2rem',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}
            >
              <Activity size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                System Diagnostics & Pipeline Health
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Direct telemetry from FastAPI & PostgreSQL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-btn"
            style={{ width: '30px', height: '30px', borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Diagnostics Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 1. FastAPI Service */}
          <div
            style={{
              padding: '1rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Server size={20} color={isApiUp ? '#34d399' : '#fb7185'} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                  FastAPI REST Engine
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  http://127.0.0.1:8000/health
                </div>
              </div>
            </div>

            <Badge variant={isApiUp ? 'success' : 'expense'}>
              {isApiUp ? (
                <>
                  <CheckCircle2 size={12} />
                  Connected
                </>
              ) : (
                <>
                  <AlertTriangle size={12} />
                  Unavailable
                </>
              )}
            </Badge>
          </div>

          {/* 2. PostgreSQL Database */}
          <div
            style={{
              padding: '1rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Database size={20} color={isDbUp ? '#34d399' : '#fb7185'} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                  PostgreSQL 17 Database
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Port 5433 (Container Host Mapping)
                </div>
              </div>
            </div>

            <Badge variant={isDbUp ? 'success' : 'expense'}>
              {isDbUp ? (
                <>
                  <CheckCircle2 size={12} />
                  Connected
                </>
              ) : (
                <>
                  <AlertTriangle size={12} />
                  Unreachable
                </>
              )}
            </Badge>
          </div>

          {/* 3. Metrics Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem'
            }}
          >
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total DB Records
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }} className="tabular-nums">
                {systemHealth.totalTransactions ? systemHealth.totalTransactions.toLocaleString() : '—'}
              </div>
            </div>

            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Telemetry Latency
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }} className="tabular-nums">
                {systemHealth.dbLatencyMs ? `${systemHealth.dbLatencyMs} ms` : '< 15 ms'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-secondary"
            style={{ fontSize: '0.82rem' }}
          >
            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            Re-ping Status
          </button>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ fontSize: '0.82rem' }}
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
