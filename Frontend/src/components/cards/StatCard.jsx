import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export function StatCard({
  title,
  value,
  secondaryText,
  icon: Icon,
  variant = 'default', // 'income' | 'expense' | 'balance' | 'savings'
  badgeText,
  trendDirection = 'neutral',
  subtitle
}) {
  const [transformStyle, setTransformStyle] = useState('');

  const variantThemes = {
    income: {
      accentColor: '#10b981',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.75) 100%)',
      borderColor: 'rgba(16, 185, 129, 0.22)',
      hoverBorder: 'rgba(16, 185, 129, 0.45)',
      iconBg: 'rgba(16, 185, 129, 0.15)',
      iconColor: '#34d399',
      glow: '0 12px 30px -4px rgba(16, 185, 129, 0.2)',
    },
    expense: {
      accentColor: '#f43f5e',
      bgGradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(15, 23, 42, 0.75) 100%)',
      borderColor: 'rgba(244, 63, 94, 0.22)',
      hoverBorder: 'rgba(244, 63, 94, 0.45)',
      iconBg: 'rgba(244, 63, 94, 0.15)',
      iconColor: '#fb7185',
      glow: '0 12px 30px -4px rgba(244, 63, 94, 0.2)',
    },
    balance: {
      accentColor: '#6366f1',
      bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.75) 100%)',
      borderColor: 'rgba(99, 102, 241, 0.22)',
      hoverBorder: 'rgba(99, 102, 241, 0.45)',
      iconBg: 'rgba(99, 102, 241, 0.15)',
      iconColor: '#a5b4fc',
      glow: '0 12px 30px -4px rgba(99, 102, 241, 0.2)',
    },
    savings: {
      accentColor: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.75) 100%)',
      borderColor: 'rgba(245, 158, 11, 0.22)',
      hoverBorder: 'rgba(245, 158, 11, 0.45)',
      iconBg: 'rgba(245, 158, 11, 0.15)',
      iconColor: '#fcd34d',
      glow: '0 12px 30px -4px rgba(245, 158, 11, 0.2)',
    },
    default: {
      accentColor: '#94a3b8',
      bgGradient: 'rgba(15, 23, 42, 0.65)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      hoverBorder: 'rgba(255, 255, 255, 0.2)',
      iconBg: 'rgba(255, 255, 255, 0.06)',
      iconColor: '#94a3b8',
      glow: 'var(--shadow-md)',
    }
  };

  const theme = variantThemes[variant] || variantThemes.default;

  // 3D Parallax tilt handler
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    setTransformStyle(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`);
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)');
  };

  return (
    <div
      className="glass-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        background: theme.bgGradient,
        borderColor: theme.borderColor,
        padding: '1.6rem 1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        transform: transformStyle || 'perspective(1000px) translateY(0)',
        transition: 'transform 0.15s ease-out, border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: theme.glow
      }}
    >
      {/* Top Row: Title and Icon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {title}
          </span>
          {subtitle && (
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {subtitle}
            </span>
          )}
        </div>

        {Icon && (
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              backgroundColor: theme.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.iconColor,
              boxShadow: `0 2px 10px ${theme.iconBg}`,
              flexShrink: 0
            }}
          >
            <Icon size={19} />
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div style={{ margin: '0.15rem 0' }}>
        <div
          className="tabular-nums"
          style={{
            fontSize: '1.95rem',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.15
          }}
        >
          {value}
        </div>
      </div>

      {/* Bottom Contextual Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        {badgeText && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: theme.iconBg,
              color: theme.iconColor,
              border: `1px solid ${theme.borderColor}`
            }}
          >
            {trendDirection === 'up' && <ArrowUpRight size={13} />}
            {trendDirection === 'down' && <ArrowDownRight size={13} />}
            {trendDirection === 'neutral' && <Minus size={13} />}
            {badgeText}
          </span>
        )}

        {secondaryText && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {secondaryText}
          </span>
        )}
      </div>
    </div>
  );
}
