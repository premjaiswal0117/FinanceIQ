import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency, getMonthName } from '../../utils/formatters';
import { ChartSkeleton } from '../common/Skeleton';

export function CashFlowChart({ monthlyData = [], currency, loading }) {
  const [viewMode, setViewMode] = useState('area');

  if (loading) {
    return <ChartSkeleton />;
  }

  const chartData = [...monthlyData]
    .sort((a, b) =>
      a.year !== b.year
        ? a.year - b.year
        : a.month - b.month
    )
    .map((item) => ({
      ...item,
      label: `${getMonthName(item.month)} ${item.year}`,
      net:
        (item.total_income || 0) -
        (item.total_expense || 0)
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const incomeVal =
        payload.find(
          (p) => p.dataKey === 'total_income'
        )?.value || 0;

      const expenseVal =
        payload.find(
          (p) => p.dataKey === 'total_expense'
        )?.value || 0;

      const netVal = incomeVal - expenseVal;

      return (
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.7)',
            minWidth: '210px'
          }}
        >
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#f8fafc',
              marginBottom: '0.65rem',
              borderBottom:
                '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '0.35rem'
            }}
          >
            {label}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem'
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#94a3b8'
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981'
                  }}
                />
                Income:
              </span>

              <strong
                style={{ color: '#34d399' }}
                className="tabular-nums"
              >
                {formatCurrency(incomeVal, currency)}
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem'
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#94a3b8'
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#f43f5e'
                  }}
                />
                Expense:
              </span>

              <strong
                style={{ color: '#fb7185' }}
                className="tabular-nums"
              >
                {formatCurrency(expenseVal, currency)}
              </strong>
            </div>

            <div
              style={{
                borderTop:
                  '1px dashed rgba(255, 255, 255, 0.1)',
                marginTop: '0.2rem',
                paddingTop: '0.4rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem'
              }}
            >
              <span
                style={{
                  color: '#cbd5e1',
                  fontWeight: 600
                }}
              >
                Net Balance:
              </span>

              <strong
                style={{
                  color:
                    netVal >= 0
                      ? '#34d399'
                      : '#fb7185'
                }}
                className="tabular-nums"
              >
                {formatCurrency(netVal, currency)}
              </strong>
            </div>
          </div>
        </div>
      );
    }

    return null;
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
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
            <TrendingUp
              size={18}
              color="#818cf8"
            />

            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0
              }}
            >
              Monthly Cash Flow
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
            Income and expenses over time
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.8rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)'
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                backgroundColor: '#10b981'
              }}
            />
            <span>Income</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)'
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                backgroundColor: '#f43f5e'
              }}
            />
            <span>Expenses</span>
          </div>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '330px'
        }}
      >
        {chartData.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}
          >
            No monthly financial records available
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: -10,
                bottom: 0
              }}
            >
              <defs>
                <linearGradient
                  id="incomeGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#10b981"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="#10b981"
                    stopOpacity={0}
                  />
                </linearGradient>

                <linearGradient
                  id="expenseGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#f43f5e"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="#f43f5e"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.05)"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={{
                  stroke:
                    'rgba(255, 255, 255, 0.08)'
                }}
              />

              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  formatCurrency(
                    value,
                    currency,
                    true
                  )
                }
              />

              <Tooltip
                content={<CustomTooltip />}
              />

              <Area
                type="monotone"
                dataKey="total_income"
                name="Income"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />

              <Area
                type="monotone"
                dataKey="total_expense"
                name="Expenses"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}