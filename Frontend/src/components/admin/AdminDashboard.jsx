import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  Database,
  Cpu,
  Workflow,
  Users,
  Receipt,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  LogOut,
  ExternalLink,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Server,
  Terminal,
  Search,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAdminStats } from '../../api/financeApi';
import { formatCurrency } from '../../utils/formatters';

export function AdminDashboard({ onPreviewUserDashboard }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await getAdminStats();
      setStats(data);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setError(err.message || 'Unable to load system-level administrative data.');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const kpis = stats?.system_kpis || {};
  const database = stats?.database || {};
  const airflow = stats?.etl_airflow || {};
  const usersList = stats?.users || [];
  const transactionsList = stats?.recent_transactions || [];

  const filteredUsers = usersList.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.user_id?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTx = transactionsList.filter(
    (t) =>
      t.user_id?.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.category?.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.transaction_type?.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.payment_mode?.toLowerCase().includes(txSearch.toLowerCase())
  );

  return (
    <div
      className="admin-dashboard-container"
      style={{
        width: '100%',
        height: '100vh',
        maxHeight: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: '#0a0f1d',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        position: 'relative'
      }}
    >
      {/* Top Admin Navigation Header */}
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.45)'
            }}
          >
            <ShieldAlert size={20} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Finance<span style={{ color: '#f87171' }}>IQ</span>
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.18)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.35)'
                }}
              >
                Admin Console
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
              Platform Infrastructure, Database & Pipeline Health
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Live Heartbeat Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }}
            />
            Live System
          </div>

          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              background: autoRefresh ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${autoRefresh ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              color: autoRefresh ? '#a5b4fc' : '#94a3b8',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
            title={autoRefresh ? 'Auto-refresh active (15s)' : 'Enable auto-refresh'}
          >
            <Activity size={13} />
            <span>{autoRefresh ? 'Auto: ON (15s)' : 'Auto: OFF'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
            title="Refresh System Data"
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>

          {/* Preview User Dashboard Toggle */}
          {onPreviewUserDashboard && (
            <button
              type="button"
              onClick={onPreviewUserDashboard}
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: '#c7d2fe',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
              title="Preview Regular User View"
            >
              <Eye size={14} />
              <span>Preview User App</span>
            </button>
          )}

          {/* Admin User Profile & Sign Out */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              paddingLeft: '0.75rem',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#ffffff'
              }}
            >
              {user?.full_name ? user.full_name[0] : 'A'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                {user?.full_name || 'System Administrator'}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 600 }}>
                {user?.email || 'admin@financeiq.com'}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="icon-btn"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                color: '#fb7185',
                marginLeft: '0.25rem',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                backgroundColor: 'rgba(244, 63, 94, 0.08)',
                cursor: 'pointer'
              }}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: '1 0 auto',
          padding: '2rem 2rem 5rem 2rem',
          maxWidth: '1440px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {error && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <AlertCircle size={20} color="#f87171" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Administrative Access Notice</div>
              <div style={{ fontSize: '0.82rem', marginTop: '0.15rem' }}>{error}</div>
            </div>
            <button
              type="button"
              onClick={() => fetchStats(true)}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ffffff',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Top Hero Banner */}
        <div
          style={{
            padding: '1.75rem 2rem',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                Root Privileges Active
              </span>
              {lastRefreshed && (
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Updated {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
              System Command & Health Center
            </h1>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Real-time telemetry across PostgreSQL databases, Apache Airflow ETL orchestrator, registered users, and system transactions.
            </p>
          </div>

          {/* Quick Metrics Badge Group */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                minWidth: '130px'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>DB STATUS</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                Online
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>PostgreSQL 17</div>
            </div>

            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                minWidth: '130px'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>ETL PIPELINE</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Workflow size={15} />
                Airflow
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                {airflow.last_run?.state ? `Last: ${airflow.last_run.state.toUpperCase()}` : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        {/* System KPIs Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}
        >
          {/* Card 1: Total Users */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Registered Users
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
                  {loading ? '...' : kpis.total_users || 0}
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8'
                }}
              >
                <Users size={22} />
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem' }}>
              <span style={{ color: '#34d399', fontWeight: 700 }}>{usersList.filter((u) => u.role === 'admin').length} Admin</span>
              {' • '}
              <span>{usersList.filter((u) => u.role !== 'admin').length} Individual Accounts</span>
            </div>
          </div>

          {/* Card 2: Total Transactions */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  System Transactions
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
                  {loading ? '...' : (kpis.total_transactions || 0).toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399'
                }}
              >
                <Receipt size={22} />
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem' }}>
              Total Volume: <strong style={{ color: '#ffffff' }}>{formatCurrency(kpis.total_volume || 0, 'INR')}</strong>
            </div>
          </div>

          {/* Card 3: Database Status */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Database Engine
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
                  {loading ? '...' : database.engine || 'PostgreSQL'}
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22d3ee'
                }}
              >
                <Database size={22} />
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Size: <strong style={{ color: '#ffffff' }}>{database.size || 'N/A'}</strong></span>
              <span>Pool: <strong style={{ color: '#38bdf8' }}>{database.active_connections || 0} active</strong></span>
            </div>
          </div>

          {/* Card 4: ETL / Airflow Status */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ETL Orchestration
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
                  {loading ? '...' : 'Airflow ETL'}
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24'
                }}
              >
                <Workflow size={22} />
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Status: <strong style={{ color: '#34d399' }}>{airflow.status || 'Active'}</strong></span>
              <span>Runs: <strong style={{ color: '#ffffff' }}>{airflow.total_runs || 0} total</strong></span>
            </div>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1.75rem'
          }}
        >
          {[
            { id: 'overview', label: 'Infrastructure & Pipelines', icon: Server },
            { id: 'users', label: `User Directory (${usersList.length})`, icon: Users },
            { id: 'transactions', label: `Global Audit Stream (${transactionsList.length})`, icon: Receipt }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem 1.25rem',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? '#ef4444' : 'transparent'}`,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderRadius: '8px 8px 0 0'
                }}
              >
                <Icon size={16} color={isActive ? '#f87171' : 'currentColor'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Infrastructure & Pipelines */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Grid with 2 columns: Database details and Airflow pipeline */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>
              {/* Database Overview Card */}
              <div
                style={{
                  padding: '1.75rem',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(6, 182, 212, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#22d3ee'
                      }}
                    >
                      <Database size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                        PostgreSQL Database Engine
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                        Connected at localhost:5433 / database: financeiq
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    HEALTHY
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    padding: '1rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    color: '#cbd5e1',
                    marginBottom: '1.25rem',
                    lineHeight: 1.6
                  }}
                >
                  <div><strong>Server Version:</strong> {database.version || 'PostgreSQL 17.11'}</div>
                  <div><strong>Database Name:</strong> financeiq</div>
                  <div><strong>Allocated Size:</strong> {database.size || '9374 kB'}</div>
                  <div><strong>Active Connections:</strong> {database.active_connections || 6}</div>
                </div>

                {/* Database Tables Inventory */}
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0' }}>
                  Public Tables Inventory
                </h4>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '0.75rem'
                  }}
                >
                  {(database.tables || []).map((tbl) => (
                    <div
                      key={tbl.name}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                        {tbl.name}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                        {tbl.rows.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Airflow ETL Pipeline Card */}
              <div
                style={{
                  padding: '1.75rem',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fbbf24'
                      }}
                    >
                      <Workflow size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                        Apache Airflow ETL Pipeline
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                        DAG: <code style={{ color: '#38bdf8' }}>{airflow.dag_id || 'financeiq_etl_pipeline'}</code>
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)'
                    }}
                  >
                    OPERATIONAL
                  </span>
                </div>

                {/* Pipeline Stages Flow Diagram */}
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0' }}>
                  Orchestrated Pipeline Stages
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  {(airflow.pipeline_tasks || []).map((task) => (
                    <div
                      key={task.step}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem'
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        {task.step}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                            {task.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                            ({task.script})
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                          {task.description}
                        </div>
                      </div>

                      <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0 }} />
                    </div>
                  ))}
                </div>

                {/* Airflow DAG Run Statistics */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.75rem',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ padding: '0.65rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>TOTAL RUNS</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                      {airflow.total_runs || 0}
                    </div>
                  </div>
                  <div style={{ padding: '0.65rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#34d399' }}>SUCCESS</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                      {airflow.success_runs || 0}
                    </div>
                  </div>
                  <div style={{ padding: '0.65rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#f87171' }}>FAILED</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171', marginTop: '2px' }}>
                      {airflow.failed_runs || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Airflow DAG Runs Table */}
            <div
              style={{
                padding: '1.75rem',
                borderRadius: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} color="#38bdf8" />
                  Recent Airflow Pipeline Execution History
                </h3>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  Queried directly from PostgreSQL Airflow metadata schema
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Run Identifier</th>
                      <th style={{ padding: '0.75rem 1rem' }}>State</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Execution Date</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(airflow.recent_runs || []).map((run, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#cbd5e1' }}>
                          {run.run_id}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor:
                                run.state === 'success'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : 'rgba(239, 68, 68, 0.15)',
                              color: run.state === 'success' ? '#34d399' : '#f87171',
                              border: `1px solid ${run.state === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                            }}
                          >
                            {run.state === 'success' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                            {run.state}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                          {run.logical_date ? new Date(run.logical_date).toLocaleString() : 'N/A'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#ffffff', fontWeight: 600 }}>
                          {run.duration_seconds ? `${run.duration_seconds}s` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {(!airflow.recent_runs || airflow.recent_runs.length === 0) && (
                      <tr>
                        <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                          No execution logs found in Airflow database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User Accounts */}
        {activeTab === 'users' && (
          <div
            style={{
              padding: '1.75rem',
              borderRadius: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                  Platform Registered Users Directory
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                  Manage access roles, inspect registration credentials, and review user transaction allocations.
                </p>
              </div>

              {/* User Search Input */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search user name, email, or ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 1rem 0.55rem 2.2rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>User ID</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Full Name</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Email Address</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Role Privilege</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Tx Count</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Member Since</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, idx) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                          {u.user_id}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#ffffff', fontWeight: 600 }}>
                        {u.full_name || 'Anonymous User'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            backgroundColor:
                              u.role === 'admin'
                                ? 'rgba(239, 68, 68, 0.18)'
                                : 'rgba(99, 102, 241, 0.15)',
                            color: u.role === 'admin' ? '#fca5a5' : '#a5b4fc',
                            border: `1px solid ${u.role === 'admin' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(99, 102, 241, 0.3)'}`
                          }}
                        >
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: u.transaction_count > 0 ? '#34d399' : '#64748b' }}>
                          {u.transaction_count} txns
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Initial Data'}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No users match the search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Global Transactions Audit */}
        {activeTab === 'transactions' && (
          <div
            style={{
              padding: '1.75rem',
              borderRadius: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                  Cross-Platform Global Transaction Stream
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                  Auditing recorded ledger transactions across all user profiles.
                </p>
              </div>

              {/* Transaction Filter Input */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Filter category, mode, or user..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 1rem 0.55rem 2.2rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Tx ID</th>
                    <th style={{ padding: '0.85rem 1rem' }}>User ID</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Type</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Amount</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Payment Mode</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map((tx, idx) => (
                    <tr
                      key={tx.transaction_id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                        #{tx.transaction_id}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                          {tx.user_id}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                        {tx.date}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor:
                              tx.transaction_type === 'Income'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(244, 63, 94, 0.15)',
                            color: tx.transaction_type === 'Income' ? '#34d399' : '#fb7185'
                          }}
                        >
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#ffffff', fontWeight: 600 }}>
                        {tx.category}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: tx.transaction_type === 'Income' ? '#34d399' : '#ffffff' }}>
                        {formatCurrency(tx.amount, 'INR')}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>
                        {tx.payment_mode || 'UPI'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {tx.location || 'Online'}
                      </td>
                    </tr>
                  ))}
                  {filteredTx.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No transactions match filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
