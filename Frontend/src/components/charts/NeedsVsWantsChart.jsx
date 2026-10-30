import React, { useMemo, useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import {
  Scale,
  ShieldCheck,
  Sparkles,
  Lightbulb,
  Info,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  RefreshCw,
  Edit3,
  X,
  HelpCircle,
  ArrowRightLeft,
  Check
} from 'lucide-react';
import {
  analyzeNeedsVsWants,
  getUserOverrides,
  saveUserOverride,
  removeUserOverride,
  resetUserOverrides,
  classifyTransactionWithDetails
} from '../../utils/needsWants';
import { formatCurrency } from '../../utils/formatters';
import { ChartSkeleton } from '../common/Skeleton';

const NEEDS_COLOR = '#06b6d4'; // Vibrant Cyan
const WANTS_COLOR = '#f43f5e'; // Vibrant Rose

export function NeedsVsWantsChart({
  transactions = [],
  currency = 'INR',
  loading = false,
  currentMonthLabel = 'Current Month',
  monthlyIncome = 0,
  userId = 'default'
}) {
  const [activeSegment, setActiveSegment] = useState(null);
  const [userOverrides, setUserOverrides] = useState({});
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionTab, setCorrectionTab] = useState('categories'); // 'categories' | 'transactions'
  const [searchFilter, setSearchFilter] = useState('');

  // Load user overrides for this authenticated user
  useEffect(() => {
    const loaded = getUserOverrides(userId);
    setUserOverrides(loaded);
  }, [userId]);

  // Handle classification toggle for an entire category
  const handleToggleCategory = (category, currentClass) => {
    const newClass = currentClass === 'Needs' ? 'Wants' : 'Needs';
    const updated = saveUserOverride(userId, category, newClass);
    setUserOverrides({ ...updated });
  };

  // Handle classification toggle for an individual transaction
  const handleToggleTransaction = (txnId, currentClass) => {
    const newClass = currentClass === 'Needs' ? 'Wants' : 'Needs';
    const updated = saveUserOverride(userId, txnId, newClass);
    setUserOverrides({ ...updated });
  };

  // Reset all overrides back to smart defaults
  const handleResetOverrides = () => {
    const cleared = resetUserOverrides(userId);
    setUserOverrides(cleared);
  };

  // Remove override for a single key
  const handleRemoveOverride = (key) => {
    const updated = removeUserOverride(userId, key);
    setUserOverrides({ ...updated });
  };

  // Recalculate analysis dynamically whenever month transactions, monthly income, or overrides change
  const analysis = useMemo(() => {
    return analyzeNeedsVsWants(transactions, monthlyIncome, userOverrides);
  }, [transactions, monthlyIncome, userOverrides]);

  if (loading) {
    return <ChartSkeleton />;
  }

  const {
    totalNeeds,
    totalWants,
    totalExpense,
    needsPercent,
    wantsPercent,
    needsByCategory,
    wantsByCategory,
    allCategories,
    ambiguousItems,
    hasEstimatedClassifications,
    estimatedCount,
    insights
  } = analysis;

  const chartData = [
    {
      name: 'Needs',
      value: totalNeeds,
      color: NEEDS_COLOR,
      percent: needsPercent,
      description: 'Essential Living Expenses'
    },
    {
      name: 'Wants',
      value: totalWants,
      color: WANTS_COLOR,
      percent: wantsPercent,
      description: 'Discretionary & Lifestyle'
    }
  ].filter((item) => item.value > 0);

  const hasData = totalExpense > 0;
  const expenseTransactions = transactions.filter(
    (t) => (t.transaction_type || '').toLowerCase() === 'expense'
  );

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}
    >
      {/* 1. Header with Timeframe, 50/30 Benchmark Tag, and Adjust Classification Button */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.2)'
              }}
            >
              <Scale size={18} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: 0
                  }}
                >
                  Needs vs Wants Analysis
                </h3>
                {hasEstimatedClassifications && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}
                    title="Some categories contain estimated classifications"
                  >
                    ⚡ {estimatedCount} Estimated
                  </span>
                )}
              </div>
            </div>
          </div>

          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              marginTop: '0.25rem',
              margin: 0
            }}
          >
            Essential living costs vs discretionary lifestyle spending for <strong>{currentMonthLabel}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              padding: '5px 12px',
              borderRadius: '999px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: '#a5b4fc',
              fontWeight: 600
            }}
            title="Standard 50/30/20 Budgeting Rule: 50% Needs, 30% Wants, 20% Savings"
          >
            <Info size={14} color="#818cf8" />
            <span>Target: 50% Needs • 30% Wants</span>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsCorrectionModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem'
            }}
            title="Review and correct categories classified as Needs or Wants"
          >
            <Sliders size={14} />
            Review & Adjust Classification
          </button>
        </div>
      </div>

      {/* 2. Ambiguity & Estimated Notice Banner */}
      {hasEstimatedClassifications && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.8rem', color: '#fde68a' }}>
            <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
            <span>
              <strong>Estimated Classifications:</strong> Categories like Food, Shopping, or Travel are categorized using intelligent estimates (Food defaults to essential sustenance/Need). You can customize any item's classification.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCorrectionModalOpen(true)}
            style={{
              background: 'rgba(245, 158, 11, 0.18)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#ffffff',
              padding: '0.35rem 0.75rem',
              borderRadius: '7px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Customize Classification
          </button>
        </div>
      )}

      {/* 3. Top Summary KPI Cards for Needs and Wants */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* NEEDS CARD */}
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.09) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.28)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(6, 182, 212, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22d3ee'
                }}
              >
                <ShieldCheck size={16} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                Needs (Essential)
              </span>
            </div>

            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#22d3ee',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                padding: '2px 8px',
                borderRadius: '999px'
              }}
            >
              {needsPercent}% of expenses
            </span>
          </div>

          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
              {formatCurrency(totalNeeds, currency)}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>
              Rent, Groceries, Utilities, Healthcare, Education
            </div>
          </div>

          {/* Subcategory Pills */}
          {needsByCategory.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {needsByCategory.slice(0, 4).map((cat) => (
                <span
                  key={cat.category}
                  style={{
                    fontSize: '0.72rem',
                    color: '#cbd5e1',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{cat.category}: {formatCurrency(cat.total, currency)}</span>
                  {cat.isEstimated && <span style={{ color: '#fbbf24', fontSize: '0.65rem' }}>⚡</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* WANTS CARD */}
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.09) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(244, 63, 94, 0.28)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(244, 63, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fb7185'
                }}
              >
                <Sparkles size={16} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                Wants (Discretionary)
              </span>
            </div>

            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: wantsPercent > 35 ? '#fb7185' : '#34d399',
                backgroundColor:
                  wantsPercent > 35 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                padding: '2px 8px',
                borderRadius: '999px'
              }}
            >
              {wantsPercent}% of expenses
            </span>
          </div>

          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
              {formatCurrency(totalWants, currency)}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>
              Entertainment, Shopping, Dining Out, Travel, Hobbies
            </div>
          </div>

          {/* Subcategory Pills */}
          {wantsByCategory.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {wantsByCategory.slice(0, 4).map((cat) => (
                <span
                  key={cat.category}
                  style={{
                    fontSize: '0.72rem',
                    color: '#cbd5e1',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{cat.category}: {formatCurrency(cat.total, currency)}</span>
                  {cat.isEstimated && <span style={{ color: '#fbbf24', fontSize: '0.65rem' }}>⚡</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Visual Comparison, Donut Chart & Progress Split */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: hasData ? 'minmax(220px, 1fr) minmax(280px, 1.4fr)' : '1fr',
          gap: '1.5rem',
          alignItems: 'center',
          padding: '1.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        {!hasData ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.88rem'
            }}
          >
            No expense transactions recorded for {currentMonthLabel}.
          </div>
        ) : (
          <>
            {/* Donut Chart */}
            <div style={{ height: '220px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div
                            style={{
                              backgroundColor: '#0f172a',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
                            }}
                          >
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: data.color }}>
                              {data.name}: {formatCurrency(data.value, currency)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                              {data.percent}% of monthly spending
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={4}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveSegment(index)}
                    onMouseLeave={() => setActiveSegment(null)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="transparent"
                        style={{
                          filter:
                            activeSegment === index
                              ? `drop-shadow(0 0 10px ${entry.color}88)`
                              : 'none',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Ratio Display */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Ratio
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                  {needsPercent}:{wantsPercent}
                </div>
              </div>
            </div>

            {/* Split Bar & Budget Health Assessment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22d3ee' }}>
                    Needs: {needsPercent}% ({formatCurrency(totalNeeds, currency)})
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fb7185' }}>
                    Wants: {wantsPercent}% ({formatCurrency(totalWants, currency)})
                  </span>
                </div>

                {/* Split Progress Bar */}
                <div
                  style={{
                    height: '10px',
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    display: 'flex'
                  }}
                >
                  <div
                    style={{
                      width: `${needsPercent}%`,
                      backgroundColor: NEEDS_COLOR,
                      transition: 'width 0.4s ease'
                    }}
                  />
                  <div
                    style={{
                      width: `${wantsPercent}%`,
                      backgroundColor: WANTS_COLOR,
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>

              {/* 50/30/20 Rule Benchmark Status */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>50/30 Rule Evaluation: </span>
                  {wantsPercent <= 30 ? (
                    <span>Discretionary spending is well within guideline (&le; 30%).</span>
                  ) : wantsPercent <= 40 ? (
                    <span>Slightly elevated wants ({wantsPercent}% vs 30% guideline).</span>
                  ) : (
                    <span>Discretionary wants exceed 40% of expenses. Scope to optimize savings.</span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    backgroundColor:
                      wantsPercent <= 35 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: wantsPercent <= 35 ? '#4ade80' : '#fbbf24'
                  }}
                >
                  {wantsPercent <= 35 ? 'Healthy Balance' : 'Discretionary Alert'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 5. Actionable Spending Insights */}
      {insights.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lightbulb size={16} color="#fbbf24" />
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0
              }}
            >
              Actionable Spending Insights
            </h4>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '0.85rem'
            }}
          >
            {insights.map((insight, idx) => {
              const isWarning = insight.type === 'warning';
              const isSuccess = insight.type === 'success';

              return (
                <div
                  key={idx}
                  style={{
                    padding: '0.9rem 1.1rem',
                    borderRadius: '10px',
                    backgroundColor: isWarning
                      ? 'rgba(244, 63, 94, 0.06)'
                      : isSuccess
                      ? 'rgba(16, 185, 129, 0.06)'
                      : 'rgba(99, 102, 241, 0.06)',
                    border: `1px solid ${
                      isWarning
                        ? 'rgba(244, 63, 94, 0.2)'
                        : isSuccess
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(99, 102, 241, 0.2)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isWarning ? (
                      <AlertTriangle size={15} color="#fb7185" />
                    ) : isSuccess ? (
                      <CheckCircle2 size={15} color="#34d399" />
                    ) : (
                      <Lightbulb size={15} color="#818cf8" />
                    )}

                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: isWarning ? '#fb7185' : isSuccess ? '#34d399' : '#a5b4fc'
                      }}
                    >
                      {insight.title}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: '#cbd5e1',
                      margin: 0,
                      lineHeight: 1.45
                    }}
                  >
                    {insight.description}
                  </p>

                  {insight.action && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#94a3b8',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        paddingTop: '0.4rem',
                        marginTop: '0.2rem'
                      }}
                    >
                      <span style={{ color: '#f8fafc' }}>Action: </span>
                      {insight.action}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. CORRECTION & CLASSIFICATION ADJUSTMENT MODAL */}
      {isCorrectionModalOpen && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsCorrectionModalOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '680px',
              padding: '1.75rem',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.12)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={20} color="#818cf8" />
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.25rem', fontWeight: 800 }}>
                  Adjust Needs vs Wants Classification
                </h3>
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={() => setIsCorrectionModalOpen(false)}
                style={{ width: '32px', height: '32px', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Categories like Food default to essential sustenance (Need). You can reclassify any category or individual transaction between Needs and Wants. Changes apply immediately to charts and insights.
            </p>

            {/* Tab Selector & Reset Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '3px',
                  borderRadius: '8px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setCorrectionTab('categories')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background:
                      correctionTab === 'categories' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                    color: correctionTab === 'categories' ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  By Category ({allCategories.length})
                </button>

                <button
                  type="button"
                  onClick={() => setCorrectionTab('transactions')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background:
                      correctionTab === 'transactions' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                    color: correctionTab === 'transactions' ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  By Transaction ({expenseTransactions.length})
                </button>
              </div>

              {Object.keys(userOverrides).length > 0 && (
                <button
                  type="button"
                  onClick={handleResetOverrides}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: '#fb7185',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={13} />
                  Reset {Object.keys(userOverrides).length} custom adjustments
                </button>
              )}
            </div>

            {/* TAB 1: CATEGORY LEVEL CLASSIFICATION */}
            {correctionTab === 'categories' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {allCategories.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No categories found for {currentMonthLabel}.
                  </div>
                ) : (
                  allCategories.map((cat) => {
                    const isNeed = cat.classification === 'Needs';
                    const isOverridden = Boolean(userOverrides[cat.category]);

                    return (
                      <div
                        key={cat.category}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: isOverridden
                            ? '1px solid rgba(99, 102, 241, 0.35)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          gap: '1rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                              {cat.category}
                            </strong>

                            {cat.isEstimated && !isOverridden && (
                              <span
                                style={{
                                  fontSize: '0.66rem',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245, 158, 11, 0.3)'
                                }}
                              >
                                ⚡ Estimated
                              </span>
                            )}

                            {isOverridden && (
                              <span
                                style={{
                                  fontSize: '0.66rem',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  background: 'rgba(99, 102, 241, 0.2)',
                                  color: '#a5b4fc',
                                  border: '1px solid rgba(99, 102, 241, 0.4)'
                                }}
                              >
                                ✏️ Custom
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {formatCurrency(cat.total, currency)} • {cat.count} transactions
                            {cat.category.toLowerCase() === 'food' && ' • Sustenance default'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '999px',
                              backgroundColor: isNeed
                                ? 'rgba(6, 182, 212, 0.15)'
                                : 'rgba(244, 63, 94, 0.15)',
                              color: isNeed ? '#22d3ee' : '#fb7185',
                              border: isNeed
                                ? '1px solid rgba(6, 182, 212, 0.3)'
                                : '1px solid rgba(244, 63, 94, 0.3)'
                            }}
                          >
                            {cat.classification}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleCategory(cat.category, cat.classification)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              padding: '4px 9px',
                              borderRadius: '7px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#cbd5e1',
                              cursor: 'pointer'
                            }}
                            title={`Switch category to ${isNeed ? 'Wants' : 'Needs'}`}
                          >
                            <ArrowRightLeft size={12} />
                            Set as {isNeed ? 'Want' : 'Need'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: TRANSACTION LEVEL CLASSIFICATION */}
            {correctionTab === 'transactions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {expenseTransactions.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No expense transactions for {currentMonthLabel}.
                  </div>
                ) : (
                  expenseTransactions.slice(0, 30).map((tx) => {
                    const details = classifyTransactionWithDetails(tx, userOverrides);
                    const isNeed = details.classification === 'Needs';
                    const isOverridden = Boolean(userOverrides[tx.transaction_id]);

                    return (
                      <div
                        key={tx.transaction_id || `${tx.date}-${tx.amount}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.9rem',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: isOverridden
                            ? '1px solid rgba(99, 102, 241, 0.35)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          gap: '0.75rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <strong style={{ color: '#ffffff', fontSize: '0.84rem' }}>
                              {tx.category || 'Other'}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                              {formatCurrency(Math.abs(Number(tx.amount) || 0), currency)}
                            </span>
                            {details.isEstimated && (
                              <span
                                style={{
                                  fontSize: '0.64rem',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: '999px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#fbbf24'
                                }}
                              >
                                ⚡ Estimated
                              </span>
                            )}
                            {isOverridden && (
                              <span
                                style={{
                                  fontSize: '0.64rem',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: '999px',
                                  background: 'rgba(99, 102, 241, 0.2)',
                                  color: '#a5b4fc'
                                }}
                              >
                                ✏️ Custom
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {tx.date} • {tx.notes || tx.description || 'No description notes'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              backgroundColor: isNeed
                                ? 'rgba(6, 182, 212, 0.15)'
                                : 'rgba(244, 63, 94, 0.15)',
                              color: isNeed ? '#22d3ee' : '#fb7185'
                            }}
                          >
                            {details.classification}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleTransaction(tx.transaction_id, details.classification)
                            }
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#cbd5e1',
                              cursor: 'pointer'
                            }}
                          >
                            Switch to {isNeed ? 'Want' : 'Need'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '1.25rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)'
              }}
            >
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsCorrectionModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
