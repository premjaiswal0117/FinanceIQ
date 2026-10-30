import React from 'react';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variantStyles = {
    income: {
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      color: '#34d399',
      border: '1px solid rgba(16, 185, 129, 0.25)',
    },
    expense: {
      backgroundColor: 'rgba(244, 63, 94, 0.12)',
      color: '#fb7185',
      border: '1px solid rgba(244, 63, 94, 0.25)',
    },
    primary: {
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      color: '#a5b4fc',
      border: '1px solid rgba(99, 102, 241, 0.3)',
    },
    success: {
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      color: '#34d399',
      border: '1px solid rgba(16, 185, 129, 0.25)',
    },
    warning: {
      backgroundColor: 'rgba(245, 158, 11, 0.12)',
      color: '#fcd34d',
      border: '1px solid rgba(245, 158, 11, 0.25)',
    },
    info: {
      backgroundColor: 'rgba(6, 182, 212, 0.12)',
      color: '#67e8f9',
      border: '1px solid rgba(6, 182, 212, 0.25)',
    },
    default: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      color: '#94a3b8',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
  };

  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '0.72rem', borderRadius: '6px' },
    md: { padding: '3px 10px', fontSize: '0.78rem', borderRadius: '8px' },
    lg: { padding: '5px 14px', fontSize: '0.85rem', borderRadius: '10px' },
  };

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '0.01em',
    ...variantStyles[variant] || variantStyles.default,
    ...sizeStyles[size] || sizeStyles.md,
  };

  return (
    <span style={style} className={className}>
      {children}
    </span>
  );
}
