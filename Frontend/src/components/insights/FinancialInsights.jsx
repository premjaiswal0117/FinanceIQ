import React from 'react';
import {
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingUp,
  PieChart,
  ArrowRight
} from 'lucide-react';
import { generateInsights } from '../../utils/calculations';

export function FinancialInsights({
  summary,
  categories,
  monthly,
  loading,
  isOverview = false
}) {
  if (loading || !summary) {
    return null;
  }

  const insights = generateInsights(summary, categories, monthly, { isOverview });

  const getCardTheme = (type) => {
    switch (type) {
      case 'positive':
        return {
          border: 'rgba(16, 185, 129, 0.25)',
          bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          iconColor: '#34d399',
          badgeBg: 'rgba(16, 185, 129, 0.15)',
          badgeColor: '#34d399',
          icon: CheckCircle2
        };
      case 'warning':
        return {
          border: 'rgba(244, 63, 94, 0.25)',
          bg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          iconColor: '#fb7185',
          badgeBg: 'rgba(244, 63, 94, 0.15)',
          badgeColor: '#fb7185',
          icon: AlertCircle
        };
      case 'info':
      default:
        return {
          border: 'rgba(99, 102, 241, 0.25)',
          bg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          iconColor: '#a5b4fc',
          badgeBg: 'rgba(99, 102, 241, 0.15)',
          badgeColor: '#a5b4fc',
          icon: Info
        };
    }
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24'
          }}
        >
          <Lightbulb size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Automated Financial Intelligence
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Algorithmic observations computed directly from live transactional and view data
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {insights.map((item) => {
          const theme = getCardTheme(item.type);
          const Icon = theme.icon;

          return (
            <div
              key={item.id}
              className="glass-card glass-card-interactive"
              style={{
                background: theme.bg,
                borderColor: theme.border,
                padding: '1.4rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: theme.badgeBg,
                      color: theme.badgeColor
                    }}
                  >
                    <Icon size={12} />
                    {item.badge}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }} className="tabular-nums">
                    {item.metric}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {item.title}
                </h4>

                <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.55, margin: 0 }}>
                  {item.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Real-Time Computed</span>
                <ArrowRight size={13} color="var(--text-muted)" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
