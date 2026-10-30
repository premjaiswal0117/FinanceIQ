import React from 'react';
import {
  Search,
  RefreshCw,
  Coins,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Header({
  systemHealth,
  onRefresh,
  isRefreshing,
  currency,
  onToggleCurrency,
  onOpenStatusModal,
  searchQuery,
  onSearchChange
}) {
  const { user, logout } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const initials = user?.full_name
    ? user.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
    : (user?.user_id || 'IQ');

  return (
    <header
      className="app-header"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        gap: '1.5rem'
      }}
    >
      {/* Greeting / Page Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div>
          <h2
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>
              {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Member'}
            </span>

            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#818cf8',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid rgba(99, 102, 241, 0.25)'
              }}
            >
              {user?.user_id || 'ID'}
            </span>
          </h2>

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              margin: 0
            }}
          >
            Personal Finance Analytics & Intelligent Money Management
          </p>
        </div>
      </div>

      {/* Center Search Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '0.45rem 1rem',
          width: '300px',
          maxWidth: '100%',
          transition: 'all var(--transition-fast)'
        }}
      >
        <Search
          size={16}
          color="var(--text-muted)"
          style={{ flexShrink: 0 }}
        />

        <input
          type="text"
          placeholder="Search personal ledger..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            width: '100%',
          }}
        />

        <span
          style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            color: 'var(--text-muted)',
            fontFamily: 'monospace'
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}
      >
        {/* Currency Switcher */}
        <button
          onClick={onToggleCurrency}
          className="btn-secondary"
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
          title="Toggle Currency Display (INR / USD)"
        >
          <Coins size={15} color="#818cf8" />

          <span style={{ fontWeight: 600 }}>
            {currency === 'INR' ? '₹ INR' : '$ USD'}
          </span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="icon-btn"
          title="Refresh Personal Data"
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          <RefreshCw
            size={16}
            style={{
              animation: isRefreshing
                ? 'spin 1s linear infinite'
                : 'none',
              transformOrigin: 'center'
            }}
          />
        </button>

        {/* User Profile & Sign Out */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            paddingLeft: '0.75rem',
            borderLeft: '1px solid var(--border-subtle)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '0.25rem 0.75rem 0.25rem 0.35rem'
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                color: '#ffffff'
              }}
            >
              {initials}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                  lineHeight: 1.1
                }}
              >
                {user?.full_name?.split(' ')[0] || user?.user_id}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="icon-btn"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-full)',
              color: '#fb7185',
              backgroundColor: 'rgba(244, 63, 94, 0.08)',
              borderColor: 'rgba(244, 63, 94, 0.2)'
            }}
            title="Sign Out of FinanceIQ"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}