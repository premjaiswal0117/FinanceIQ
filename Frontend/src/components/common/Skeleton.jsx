import React from 'react';

export function Skeleton({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', className = '' }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        display: 'inline-block'
      }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="40%" height="16px" />
        <Skeleton width="36px" height="36px" borderRadius="10px" />
      </div>
      <Skeleton width="65%" height="32px" />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
        <Skeleton width="50px" height="20px" borderRadius="12px" />
        <Skeleton width="80px" height="14px" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card" style={{ padding: '1.75rem', height: '380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton width="30%" height="24px" />
        <Skeleton width="120px" height="32px" borderRadius="8px" />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '1rem', padding: '1rem 0' }}>
        {[45, 75, 55, 90, 65, 80, 70, 85, 60, 95].map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h}%`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <Skeleton width="100%" height="100%" borderRadius="6px" />
          </div>
        ))}
      </div>
    </div>
  );
}
