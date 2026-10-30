import React from 'react';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Hero({ summary, lastUpdated }) {
  const { user } = useAuth();

  const income = summary?.income !== undefined ? summary.income : (summary?.total_income || 0);
  const expense = summary?.expenses !== undefined ? summary.expenses : (summary?.total_expense || 0);
  const balance =
    summary?.balance !== undefined
      ? summary.balance
      : (summary?.net_balance !== undefined
        ? summary.net_balance
        : income - expense);

  const isSurplus = balance >= 0;
  const firstName = user?.full_name?.split(' ')[0] || 'Personal';

  return (
    <div
      className="glass-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '2rem 2.25rem',
        marginBottom: '2rem',
        background:
          'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Background Decorative Gradient Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-40px',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: isSurplus
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(244, 63, 94, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '20%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              <Sparkles size={13} />
              Personal Finance • User ID: {user?.user_id}
            </span>

            {lastUpdated && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                Synced{' '}
                {lastUpdated.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: isSurplus ? '#34d399' : '#fb7185',
              backgroundColor: isSurplus
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(244, 63, 94, 0.1)',
              padding: '4px 12px',
              borderRadius: '999px',
              border: `1px solid ${isSurplus
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(244, 63, 94, 0.2)'
                }`,
            }}
          >
            {isSurplus ? (
              <TrendingUp size={15} />
            ) : (
              <TrendingDown size={15} />
            )}

            <span>
              {isSurplus ? 'Positive Balance' : 'Negative Balance'}
            </span>
          </div>
        </div>

        <h1
          style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            margin: 0,
          }}
        >
          {firstName}'s Personal Finance Overview
        </h1>

        <p
          style={{
            fontSize: '0.98rem',
            color: '#cbd5e1',
            maxWidth: '850px',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {summary ? (
            `Welcome back, ${firstName}! Here is your real-time cash flow overview, spending patterns, and predictive financial insights.`
          ) : (
            'Loading your personal financial data...'
          )}
        </p>
      </div>
    </div>
  );
}