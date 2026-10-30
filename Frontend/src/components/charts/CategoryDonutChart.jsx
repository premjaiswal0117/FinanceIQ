import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector
} from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { ChartSkeleton } from '../common/Skeleton';

const CATEGORY_COLORS = [
  '#6366f1',
  '#06b6d4',
  '#a855f7',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#84cc16',
  '#64748b'
];

export function CategoryDonutChart({
  categories = [],
  currency,
  loading,
  title = 'Spending Breakdown by Category',
  subtitle
}) {
  const [activeIndex, setActiveIndex] = useState(null);

  if (loading) {
    return <ChartSkeleton />;
  }

  const totalSpend = categories.reduce(
    (sum, item) => sum + (item.total_spending || 0),
    0
  );

  const formattedData = [...categories]
    .sort(
      (a, b) =>
        (b.total_spending || 0) -
        (a.total_spending || 0)
    )
    .map((item, index) => {
      const percentage =
        totalSpend > 0
          ? ((item.total_spending || 0) / totalSpend) * 100
          : 0;

      return {
        ...item,
        percentage,
        color:
          CATEGORY_COLORS[
          index % CATEGORY_COLORS.length
          ]
      };
    });

  const activeData =
    activeIndex !== null
      ? formattedData[activeIndex]
      : null;

  const renderActiveShape = (props) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 3}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{
            filter: `drop-shadow(0px 0px 8px ${fill}66)`
          }}
        />
      </g>
    );
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        minHeight: '430px'
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <PieIcon
              size={18}
              color="#06b6d4"
            />

            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0
              }}
            >
              {title}
            </h3>
          </div>

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              marginTop: '0.2rem',
              margin: 0
            }}
          >
            {subtitle || 'How your spending is distributed across categories'}
          </p>
        </div>

        <span
          style={{
            fontSize: '0.78rem',
            color: '#a5b4fc',
            backgroundColor:
              'rgba(99, 102, 241, 0.12)',
            padding: '3px 10px',
            borderRadius: '999px',
            border:
              '1px solid rgba(99, 102, 241, 0.25)',
            fontWeight: 600
          }}
        >
          {categories.length} Categories
        </span>
      </div>

      {/* CHART + CATEGORY LIST */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            formattedData.length > 0
              ? 'minmax(220px, 1fr) minmax(240px, 1.2fr)'
              : '1fr',
          gap: '1.5rem',
          alignItems: 'center',
          flex: 1
        }}
      >
        {/* DONUT */}
        <div
          style={{
            height: '280px',
            position: 'relative'
          }}
        >
          {formattedData.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)'
              }}
            >
              No expense categories recorded for this period
            </div>
          ) : (
            <>
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={formattedData}
                    cx="50%"
                    cy="52%"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={3}
                    dataKey="total_spending"
                    nameKey="category"
                    onMouseEnter={(_, index) =>
                      setActiveIndex(index)
                    }
                    onMouseLeave={() =>
                      setActiveIndex(null)
                    }
                  >
                    {formattedData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="transparent"
                        />
                      )
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* CENTER TOTAL */}
              <div
                style={{
                  position: 'absolute',
                  top: '52%',
                  left: '50%',
                  transform:
                    'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Total Spend
                </div>

                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#ffffff'
                  }}
                  className="tabular-nums"
                >
                  {formatCurrency(
                    totalSpend,
                    currency,
                    true
                  )}
                </div>
              </div>

              {/* FIXED HOVER DETAILS */}
              {activeData && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    right: '8px',
                    zIndex: 5,
                    pointerEvents: 'none',
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={{
                      backgroundColor:
                        'rgba(15, 23, 42, 0.96)',
                      backdropFilter: 'blur(16px)',
                      border:
                        '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius:
                        'var(--radius-md)',
                      padding:
                        '0.65rem 0.9rem',
                      boxShadow:
                        '0 10px 25px -4px rgba(0, 0, 0, 0.6)',
                      minWidth: '175px',
                      maxWidth: '210px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '0.35rem'
                      }}
                    >
                      <span
                        style={{
                          width: '9px',
                          height: '9px',
                          borderRadius: '50%',
                          backgroundColor:
                            activeData.color,
                          flexShrink: 0
                        }}
                      />

                      <strong
                        style={{
                          color: '#ffffff',
                          fontSize: '0.82rem'
                        }}
                      >
                        {activeData.category}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: '#94a3b8'
                      }}
                    >
                      <span>Spending</span>

                      <strong
                        style={{
                          color: '#ffffff'
                        }}
                        className="tabular-nums"
                      >
                        {formatCurrency(
                          activeData.total_spending,
                          currency
                        )}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        marginTop: '2px'
                      }}
                    >
                      <span>Share</span>

                      <strong
                        style={{
                          color: activeData.color
                        }}
                      >
                        {formatPercentage(
                          activeData.percentage
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* CATEGORY LIST */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.7rem',
            maxHeight: '280px',
            overflowY:
              formattedData.length > 7
                ? 'auto'
                : 'visible',
            paddingRight:
              formattedData.length > 7
                ? '0.35rem'
                : 0
          }}
        >
          {formattedData.map((item, idx) => (
            <div
              key={item.category}
              onMouseEnter={() =>
                setActiveIndex(idx)
              }
              onMouseLeave={() =>
                setActiveIndex(null)
              }
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                cursor: 'pointer',
                padding: '0.3rem 0.45rem',
                borderRadius:
                  'var(--radius-sm)',
                backgroundColor:
                  activeIndex === idx
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'transparent',
                transition:
                  'background-color var(--transition-fast)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                  gap: '0.5rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: 0
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor:
                        item.color,
                      flexShrink: 0
                    }}
                  />

                  <span
                    style={{
                      fontWeight: 600,
                      color: '#f1f5f9',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.category}
                  </span>

                  <span
                    style={{
                      fontSize: '0.72rem',
                      color:
                        'var(--text-muted)',
                      flexShrink: 0
                    }}
                  >
                    ({item.transaction_count})
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexShrink: 0
                  }}
                >
                  <span
                    style={{
                      color: '#cbd5e1',
                      fontWeight: 600
                    }}
                    className="tabular-nums"
                  >
                    {formatCurrency(
                      item.total_spending,
                      currency
                    )}
                  </span>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: item.color,
                      minWidth: '40px',
                      textAlign: 'right'
                    }}
                  >
                    {formatPercentage(
                      item.percentage
                    )}
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor:
                    'rgba(255, 255, 255, 0.06)',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(2, item.percentage)
                    )}%`,
                    height: '100%',
                    backgroundColor:
                      item.color,
                    borderRadius: '999px',
                    transition:
                      'width 0.6s ease'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}