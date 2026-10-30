import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Trash2,
  Edit3,
  Loader2,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Info,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Wallet,
  PiggyBank,
  Check
} from 'lucide-react';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../../api/financeApi';
import {
  analyzeFinancialCapacity,
  evaluateGoalFeasibility,
  calculateMonthsRemaining
} from '../../utils/goalPlanner';

export function GoalTracker({
  currency = 'INR',
  onGoalsChanged,
  monthly = [],
  transactions = [],
  summary = null
}) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buffer and assumptions states
  const [emergencyBufferPercent, setEmergencyBufferPercent] = useState(15);
  const [customAssumptions, setCustomAssumptions] = useState(null);
  const [isAssumptionsModalOpen, setIsAssumptionsModalOpen] = useState(false);

  // Assumptions form state
  const [tempIncome, setTempIncome] = useState('');
  const [tempEssential, setTempEssential] = useState('');
  const [tempDiscretionary, setTempDiscretionary] = useState('');
  const [tempBufferPct, setTempBufferPct] = useState(15);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Form states for creating goal
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentSaved, setCurrentSaved] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Form states for editing goal
  const [editGoalId, setEditGoalId] = useState('');
  const [editName, setEditName] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editCurrentSaved, setEditCurrentSaved] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');

  // Form state for adding savings contribution
  const [contributionAmount, setContributionAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currencySymbol = currency === 'USD' ? '$' : '₹';

  const fetchGoalsData = async () => {
    try {
      setLoading(true);
      const data = await getGoals();
      setGoals(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load goals:', err);
      setError('Unable to load savings goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsData();
  }, []);

  // 1. Analyze financial capacity from user's actual history or assumptions
  const capacity = useMemo(() => {
    return analyzeFinancialCapacity({
      monthly,
      transactions,
      summary,
      activeGoals: goals,
      customAssumptions,
      emergencyBufferPercent,
      currency
    });
  }, [
    monthly,
    transactions,
    summary,
    goals,
    customAssumptions,
    emergencyBufferPercent,
    currency
  ]);

  // Sync temp assumptions with capacity when modal opens
  const openAssumptionsModal = () => {
    setTempIncome(String(capacity.monthlyIncome));
    setTempEssential(String(capacity.essentialExpenses));
    setTempDiscretionary(String(capacity.discretionarySpending));
    setTempBufferPct(capacity.emergencyBufferPercent);
    setIsAssumptionsModalOpen(true);
  };

  const handleSaveAssumptions = (e) => {
    e.preventDefault();
    setCustomAssumptions({
      monthlyIncome: parseFloat(tempIncome) || 0,
      essentialExpenses: parseFloat(tempEssential) || 0,
      discretionarySpending: parseFloat(tempDiscretionary) || 0,
      emergencyBufferPercent: parseFloat(tempBufferPct) || 15
    });
    setEmergencyBufferPercent(parseFloat(tempBufferPct) || 15);
    setIsAssumptionsModalOpen(false);
  };

  const handleResetAssumptions = () => {
    setCustomAssumptions(null);
    setEmergencyBufferPercent(15);
    setIsAssumptionsModalOpen(false);
  };

  // 2. Real-time feasibility for Create Goal Modal
  const createFeasibility = useMemo(() => {
    if (!targetAmount || !targetDate) return null;
    return evaluateGoalFeasibility({
      targetAmount: parseFloat(targetAmount) || 0,
      currentSaved: parseFloat(currentSaved) || 0,
      targetDate,
      financialCapacity: capacity,
      currentGoalId: null,
      activeGoals: goals
    });
  }, [targetAmount, currentSaved, targetDate, capacity, goals]);

  // 3. Real-time feasibility for Edit Goal Modal
  const editFeasibility = useMemo(() => {
    if (!editGoalId || !editTargetAmount || !editTargetDate) return null;
    return evaluateGoalFeasibility({
      targetAmount: parseFloat(editTargetAmount) || 0,
      currentSaved: parseFloat(editCurrentSaved) || 0,
      targetDate: editTargetDate,
      financialCapacity: capacity,
      currentGoalId: editGoalId,
      activeGoals: goals
    });
  }, [editGoalId, editTargetAmount, editCurrentSaved, editTargetDate, capacity, goals]);

  // Handle Create Goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalName || !targetAmount || !targetDate) return;

    setSubmitting(true);
    try {
      await createGoal({
        name: goalName,
        target_amount: parseFloat(targetAmount),
        current_saved: parseFloat(currentSaved) || 0.0,
        target_date: targetDate
      });
      setIsAddModalOpen(false);
      setGoalName('');
      setTargetAmount('');
      setCurrentSaved('');
      setTargetDate('');
      await fetchGoalsData();
      if (onGoalsChanged) onGoalsChanged();
    } catch (err) {
      alert(err.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Goal
  const handleEditGoal = async (e) => {
    e.preventDefault();
    if (!editGoalId || !editName || !editTargetAmount || !editTargetDate) return;

    setSubmitting(true);
    try {
      await updateGoal(editGoalId, {
        name: editName,
        target_amount: parseFloat(editTargetAmount),
        current_saved: parseFloat(editCurrentSaved) || 0.0,
        target_date: editTargetDate
      });
      setIsEditModalOpen(false);
      setEditGoalId('');
      setEditName('');
      setEditTargetAmount('');
      setEditCurrentSaved('');
      setEditTargetDate('');
      await fetchGoalsData();
      if (onGoalsChanged) onGoalsChanged();
    } catch (err) {
      alert(err.message || 'Failed to update goal');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (g) => {
    setEditGoalId(g.goal_id);
    setEditName(g.name);
    setEditTargetAmount(String(g.target_amount));
    setEditCurrentSaved(String(g.current_saved));
    setEditTargetDate(g.target_date);
    setIsEditModalOpen(true);
  };

  // Handle Add Savings Contribution
  const handleUpdateContribution = async (e) => {
    e.preventDefault();
    if (!selectedGoal || !contributionAmount) return;

    setSubmitting(true);
    try {
      const added = parseFloat(contributionAmount);
      const newSaved = Math.max(0, (selectedGoal.current_saved || 0) + added);
      await updateGoal(selectedGoal.goal_id, {
        current_saved: newSaved
      });
      setIsUpdateModalOpen(false);
      setSelectedGoal(null);
      setContributionAmount('');
      await fetchGoalsData();
      if (onGoalsChanged) onGoalsChanged();
    } catch (err) {
      alert(err.message || 'Failed to update goal');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Goal
  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to remove this savings goal?')) return;
    try {
      await deleteGoal(goalId);
      await fetchGoalsData();
      if (onGoalsChanged) onGoalsChanged();
    } catch (err) {
      alert(err.message || 'Failed to delete goal');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ahead':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          icon: CheckCircle2,
          label: 'Ahead of Schedule'
        };
      case 'Completed':
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          icon: Sparkles,
          label: 'Goal Achieved!'
        };
      case 'Behind':
        return {
          bg: 'rgba(244, 63, 94, 0.15)',
          color: '#fb7185',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          icon: AlertTriangle,
          label: 'Behind Schedule'
        };
      case 'On Track':
      default:
        return {
          bg: 'rgba(99, 102, 241, 0.15)',
          color: '#a5b4fc',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          icon: TrendingUp,
          label: 'On Track'
        };
    }
  };

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {/* HEADER SECTION */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Target size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                Smart Goal Planner
              </h3>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.18)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                Living Costs Protected
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Analyzes historical living expenses and preserves your emergency buffer before planning savings
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={openAssumptionsModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 0.95rem',
              fontSize: '0.82rem'
            }}
            title="Adjust monthly baseline assumptions and emergency buffer"
          >
            <Sliders size={15} />
            Adjust Assumptions
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              fontSize: '0.85rem'
            }}
          >
            <Plus size={16} />
            New Savings Goal
          </button>
        </div>
      </div>

      {/* NEW USER WARNING / ESTIMATE BADGE */}
      {!capacity.hasSufficientHistory && (
        <div
          style={{
            padding: '0.85rem 1.1rem',
            borderRadius: '14px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: '#fbbf24',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Info size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Estimated Baseline (Limited History):</strong> You have limited transaction history. FinanceIQ is using standardized estimates. You can fine-tune your baseline anytime.
            </span>
          </div>
          <button
            type="button"
            onClick={openAssumptionsModal}
            style={{
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#ffffff',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Personalize Estimates
          </button>
        </div>
      )}

      {/* FINANCIAL CAPACITY DASHBOARD & LIVING COST PROTECTION */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '18px',
          marginBottom: '1.5rem',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
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
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
              Monthly Capacity Analysis
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              Financial Safety & Living Cost Protection
            </div>
          </div>

          {/* Quick Buffer Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginRight: '2px' }}>
              Emergency Buffer:
            </span>
            {[10, 15, 20, 25].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => {
                  setEmergencyBufferPercent(pct);
                  if (customAssumptions) {
                    setCustomAssumptions({ ...customAssumptions, emergencyBufferPercent: pct });
                  }
                }}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border:
                    emergencyBufferPercent === pct
                      ? '1px solid #10b981'
                      : '1px solid var(--border-subtle)',
                  background:
                    emergencyBufferPercent === pct
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(255, 255, 255, 0.04)',
                  color: emergencyBufferPercent === pct ? '#34d399' : 'var(--text-muted)'
                }}
              >
                {pct}%{pct === 15 ? ' (Rec.)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Key Capacity Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.9rem'
          }}
        >
          {/* Monthly Income */}
          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Monthly Income
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              {currencySymbol}{capacity.monthlyIncome.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>
              {customAssumptions?.monthlyIncome ? 'Custom Assumption' : 'Historical average'}
            </div>
          </div>

          {/* Essential Living Expenses */}
          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.04)',
              border: '1px solid rgba(239, 68, 68, 0.15)'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 600 }}>
              Essential Needs (Protected)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171', marginTop: '2px' }}>
              {currencySymbol}{capacity.essentialExpenses.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#fca5a5', marginTop: '4px' }}>
              Rent, food, utilities, medical
            </div>
          </div>

          {/* Emergency Buffer */}
          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.04)',
              border: '1px solid rgba(245, 158, 11, 0.15)'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>
              Emergency Buffer ({capacity.emergencyBufferPercent}%)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
              {currencySymbol}{capacity.emergencyBuffer.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#fde68a', marginTop: '4px' }}>
              Safety cushion (Protected)
            </div>
          </div>

          {/* Discretionary Spending */}
          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Discretionary Spending
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#cbd5e1', marginTop: '2px' }}>
              {currencySymbol}{capacity.discretionarySpending.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>
              Shopping, dining, leisure
            </div>
          </div>

          {/* Safe Monthly Savings Capacity */}
          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.22)'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>
              Safe Monthly Savings
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
              {currencySymbol}{capacity.safeMonthlySavingsCapacity.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#a7f3d0', marginTop: '4px' }}>
              After protecting living costs
            </div>
          </div>

          {/* Free Uncommitted Capacity (Accounts for existing goals) */}
          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 700 }}>
              Free Savings for New Goals
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              {currencySymbol}{capacity.freeMonthlySavingsCapacity.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#c7d2fe', marginTop: '4px' }}>
              {capacity.existingGoalsCommittedMonthly > 0
                ? `${currencySymbol}${capacity.existingGoalsCommittedMonthly.toLocaleString()} committed to active goals`
                : 'No existing commitments'}
            </div>
          </div>
        </div>
      </div>

      {/* LOADING & ERROR STATES */}
      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2
            size={24}
            style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }}
          />
          Analyzing your goals and financial capacity...
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            padding: '1rem',
            color: '#fb7185',
            background: 'rgba(244,63,94,0.1)',
            borderRadius: '12px',
            marginBottom: '1rem'
          }}
        >
          {error}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && goals.length === 0 && (
        <div
          className="glass-card"
          style={{
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            borderRadius: '18px'
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: '#34d399'
            }}
          >
            <Target size={28} />
          </div>

          <h4 style={{ margin: '0 0 0.4rem', color: '#ffffff', fontSize: '1.1rem', fontWeight: 700 }}>
            No Active Savings Goals
          </h4>
          <p
            style={{
              margin: '0 auto 1.25rem',
              color: 'var(--text-muted)',
              fontSize: '0.84rem',
              maxWidth: '460px'
            }}
          >
            Set a target for an emergency fund, travel, tech gadget, or vehicle. The Smart Planner
            will ensure your living costs remain protected and suggest realistic timelines.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ margin: '0 auto' }}
          >
            Create Your First Goal
          </button>
        </div>
      )}

      {/* GOALS GRID */}
      {!loading && goals.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {goals.map((g) => {
            const badge = getStatusBadge(g.status);
            const BadgeIcon = badge.icon;

            // Feasibility evaluation for THIS specific goal (accounts for other active goals)
            const goalFeasibility = evaluateGoalFeasibility({
              targetAmount: g.target_amount,
              currentSaved: g.current_saved,
              targetDate: g.target_date,
              financialCapacity: capacity,
              currentGoalId: g.goal_id,
              activeGoals: goals
            });

            const isUnrealistic = !goalFeasibility.isFeasible && goalFeasibility.remainingToSave > 0;

            return (
              <div
                key={g.goal_id}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.1rem',
                  position: 'relative',
                  border: isUnrealistic
                    ? '1px solid rgba(244, 63, 94, 0.35)'
                    : '1px solid var(--border-subtle)'
                }}
              >
                {/* CARD TOP */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: '#ffffff'
                        }}
                      >
                        {g.name}
                      </h4>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.76rem',
                          marginTop: '3px'
                        }}
                      >
                        <Calendar size={13} />
                        Deadline: {g.target_date} ({g.months_remaining} mo remaining)
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: '999px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: badge.border,
                          flexShrink: 0
                        }}
                      >
                        <BadgeIcon size={12} />
                        {badge.label}
                      </span>

                      {/* Feasibility Pill */}
                      {isUnrealistic ? (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            background: 'rgba(244, 63, 94, 0.15)',
                            color: '#fb7185',
                            border: '1px solid rgba(244, 63, 94, 0.3)'
                          }}
                        >
                          ⚠️ Unrealistic Target
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.25)'
                          }}
                        >
                          ✓ Feasible Budget
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AMOUNT PROGRESS BIG NUMBERS */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Saved</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
                        {currencySymbol}
                        {g.current_saved.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Target</span>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {currencySymbol}
                        {g.target_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      overflow: 'hidden',
                      marginBottom: '0.6rem'
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, g.progress_percent)}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background:
                          g.status === 'Completed'
                            ? 'linear-gradient(90deg, #38bdf8, #818cf8)'
                            : isUnrealistic
                            ? 'linear-gradient(90deg, #fb7185, #f43f5e)'
                            : g.status === 'Ahead'
                            ? 'linear-gradient(90deg, #34d399, #10b981)'
                            : 'linear-gradient(90deg, #6366f1, #818cf8)',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.85rem'
                    }}
                  >
                    <span>{g.progress_percent}% Complete</span>
                    <span>
                      Remaining: {currencySymbol}
                      {g.remaining_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  {/* DYNAMIC MONTHLY REQUIREMENT VS SAFE CAPACITY */}
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      background: isUnrealistic
                        ? 'rgba(244, 63, 94, 0.08)'
                        : 'rgba(99, 102, 241, 0.06)',
                      border: isUnrealistic
                        ? '1px solid rgba(244, 63, 94, 0.25)'
                        : '1px solid rgba(99, 102, 241, 0.18)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: isUnrealistic ? '0.75rem' : '0'
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: isUnrealistic ? '#fb7185' : '#a5b4fc',
                          fontWeight: 600
                        }}
                      >
                        Required Monthly Saving:
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {currencySymbol}
                        {g.current_required_monthly_saving.toLocaleString('en-IN', {
                          maximumFractionDigits: 0
                        })}
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                          /mo
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '0.74rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>
                        Safe budget for goal:
                      </span>
                      <span
                        style={{
                          color: isUnrealistic ? '#fb7185' : '#34d399',
                          fontWeight: 700
                        }}
                      >
                        {currencySymbol}
                        {goalFeasibility.availableMonthlyForGoal.toLocaleString()}/mo
                      </span>
                    </div>
                  </div>

                  {/* UNREALISTIC WARNING & SMART ACTIONABLE SUGGESTIONS */}
                  {isUnrealistic && (
                    <div
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: '12px',
                        background: 'rgba(244, 63, 94, 0.08)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        fontSize: '0.75rem',
                        color: '#fca5a5'
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={13} color="#fb7185" />
                        Deficit: {currencySymbol}{goalFeasibility.monthlyDeficit.toLocaleString()}/mo over safe capacity
                      </div>
                      <div style={{ color: '#cbd5e1', lineHeight: '1.3' }}>
                        Suggested realistic date: <strong>{goalFeasibility.suggestedRealisticDate || 'N/A'}</strong> ({goalFeasibility.suggestedRealisticMonths} mo) or affordable target: <strong>{currencySymbol}{goalFeasibility.suggestedAffordableTarget.toLocaleString()}</strong>.
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD ACTIONS */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setSelectedGoal(g);
                        setIsUpdateModalOpen(true);
                      }}
                      style={{
                        fontSize: '0.76rem',
                        padding: '0.4rem 0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Plus size={13} />
                      Add Savings
                    </button>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => openEditModal(g)}
                      style={{
                        fontSize: '0.76rem',
                        padding: '0.4rem 0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                      title="Edit goal parameters and deadlines"
                    >
                      <Edit3 size={13} />
                      Edit Goal
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(g.goal_id)}
                    className="icon-btn"
                    style={{ color: '#fb7185', width: '32px', height: '32px' }}
                    title="Delete Goal"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE GOAL MODAL WITH LIVE FEASIBILITY ANALYZER */}
      {isAddModalOpen && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
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
              maxWidth: '520px',
              padding: '1.75rem',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.12)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.25rem', fontWeight: 800 }}>
                Create Smart Savings Goal
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399'
                }}
              >
                Safe Budget: {currencySymbol}{capacity.freeMonthlySavingsCapacity.toLocaleString()}/mo
              </span>
            </div>

            <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Set your target. FinanceIQ automatically tests feasibility against your protected living costs and existing goals.
            </p>

            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, New Laptop, Japan Trip"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Target Amount ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="50000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Already Saved ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentSaved}
                    onChange={(e) => setCurrentSaved(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Target Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* LIVE FEASIBILITY ASSESSMENT BOX */}
              {createFeasibility && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '14px',
                    background: createFeasibility.isFeasible
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(244, 63, 94, 0.08)',
                    border: createFeasibility.isFeasible
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(244, 63, 94, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {createFeasibility.isFeasible ? (
                        <ShieldCheck size={18} color="#34d399" />
                      ) : (
                        <ShieldAlert size={18} color="#fb7185" />
                      )}
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          color: createFeasibility.isFeasible ? '#34d399' : '#fb7185'
                        }}
                      >
                        {createFeasibility.isFeasible
                          ? 'Feasible Goal (Safe to Save)'
                          : 'Goal is Unrealistic'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                      {createFeasibility.monthsRemaining} months timeline
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '0.65rem',
                      borderRadius: '10px',
                      fontSize: '0.76rem'
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Required Monthly:</span>
                      <strong style={{ color: '#ffffff', fontSize: '0.92rem' }}>
                        {currencySymbol}{createFeasibility.requiredMonthly.toLocaleString()}/mo
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Safe Available:</span>
                      <strong
                        style={{
                          color: createFeasibility.isFeasible ? '#34d399' : '#fb7185',
                          fontSize: '0.92rem'
                        }}
                      >
                        {currencySymbol}{createFeasibility.availableMonthlyForGoal.toLocaleString()}/mo
                      </strong>
                    </div>
                  </div>

                  {/* UNREALISTIC DETAILS & AUTO-SUGGESTIONS */}
                  {!createFeasibility.isFeasible && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: '#fca5a5', lineHeight: '1.4' }}>
                        <strong>Why:</strong> Exceeds your safe monthly budget by{' '}
                        <strong>{currencySymbol}{createFeasibility.monthlyDeficit.toLocaleString()}/mo</strong> after protecting essential living costs ({currencySymbol}{capacity.essentialExpenses.toLocaleString()}), emergency buffer ({currencySymbol}{capacity.emergencyBuffer.toLocaleString()}), and other active goals.
                      </p>

                      <div style={{ fontSize: '0.76rem', color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>
                        Realistic Recommendations:
                      </div>

                      {/* Apply Suggested Date Button */}
                      {createFeasibility.suggestedRealisticDate && (
                        <button
                          type="button"
                          onClick={() => setTargetDate(createFeasibility.suggestedRealisticDate)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.18)',
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            color: '#c7d2fe',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span>
                            📅 Extend deadline to <strong>{createFeasibility.suggestedRealisticDate}</strong> ({createFeasibility.suggestedRealisticMonths} months)
                          </span>
                          <span style={{ color: '#818cf8', fontWeight: 700 }}>Apply Date</span>
                        </button>
                      )}

                      {/* Apply Suggested Target Amount Button */}
                      {createFeasibility.suggestedAffordableTarget > 0 && (
                        <button
                          type="button"
                          onClick={() => setTargetAmount(String(createFeasibility.suggestedAffordableTarget))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            color: '#a7f3d0',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span>
                            💰 Reduce target to <strong>{currencySymbol}{createFeasibility.suggestedAffordableTarget.toLocaleString()}</strong> by this deadline
                          </span>
                          <span style={{ color: '#34d399', fontWeight: 700 }}>Apply Amount</span>
                        </button>
                      )}

                      {/* Discretionary Reduction Tip */}
                      {createFeasibility.suggestedDiscretionaryReduction > 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                          💡 Discretionary option: Trimming non-essential discretionary spending by {currencySymbol}{createFeasibility.suggestedDiscretionaryReduction.toLocaleString()}/mo would bridge this gap.
                        </div>
                      )}
                    </div>
                  )}

                  {createFeasibility.isFeasible && (
                    <div style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
                      Comfortable target! Leaves a monthly safety cushion of {currencySymbol}{createFeasibility.monthlyCushion.toLocaleString()}/mo.
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ minWidth: '130px', justifyContent: 'center' }}
                >
                  {submitting ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GOAL MODAL WITH LIVE FEASIBILITY ANALYZER */}
      {isEditModalOpen && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
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
              maxWidth: '520px',
              padding: '1.75rem',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.12)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.35rem', color: '#ffffff', fontSize: '1.25rem', fontWeight: 800 }}>
              Edit Savings Goal
            </h3>
            <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Modify target amount or deadline. Feasibility recalculates live against your protected living costs.
            </p>

            <form onSubmit={handleEditGoal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Target Amount ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={editTargetAmount}
                    onChange={(e) => setEditTargetAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Current Saved ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editCurrentSaved}
                    onChange={(e) => setEditCurrentSaved(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Target Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* LIVE FEASIBILITY IN EDIT MODAL */}
              {editFeasibility && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '14px',
                    background: editFeasibility.isFeasible
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(244, 63, 94, 0.08)',
                    border: editFeasibility.isFeasible
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(244, 63, 94, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {editFeasibility.isFeasible ? (
                        <ShieldCheck size={18} color="#34d399" />
                      ) : (
                        <ShieldAlert size={18} color="#fb7185" />
                      )}
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          color: editFeasibility.isFeasible ? '#34d399' : '#fb7185'
                        }}
                      >
                        {editFeasibility.isFeasible ? 'Feasible Goal' : 'Goal is Unrealistic'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                      {editFeasibility.monthsRemaining} months timeline
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '0.65rem',
                      borderRadius: '10px',
                      fontSize: '0.76rem'
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Required Monthly:</span>
                      <strong style={{ color: '#ffffff', fontSize: '0.92rem' }}>
                        {currencySymbol}{editFeasibility.requiredMonthly.toLocaleString()}/mo
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Safe Available:</span>
                      <strong
                        style={{
                          color: editFeasibility.isFeasible ? '#34d399' : '#fb7185',
                          fontSize: '0.92rem'
                        }}
                      >
                        {currencySymbol}{editFeasibility.availableMonthlyForGoal.toLocaleString()}/mo
                      </strong>
                    </div>
                  </div>

                  {/* UNREALISTIC DETAILS & BUTTONS */}
                  {!editFeasibility.isFeasible && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: '#fca5a5', lineHeight: '1.4' }}>
                        <strong>Deficit:</strong> Requires{' '}
                        <strong>{currencySymbol}{editFeasibility.requiredMonthly.toLocaleString()}/mo</strong>, exceeding safe budget by{' '}
                        <strong>{currencySymbol}{editFeasibility.monthlyDeficit.toLocaleString()}/mo</strong>.
                      </p>

                      {editFeasibility.suggestedRealisticDate && (
                        <button
                          type="button"
                          onClick={() => setEditTargetDate(editFeasibility.suggestedRealisticDate)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.18)',
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            color: '#c7d2fe',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span>
                            📅 Extend deadline to <strong>{editFeasibility.suggestedRealisticDate}</strong> ({editFeasibility.suggestedRealisticMonths} mo)
                          </span>
                          <span style={{ color: '#818cf8', fontWeight: 700 }}>Apply Date</span>
                        </button>
                      )}

                      {editFeasibility.suggestedAffordableTarget > 0 && (
                        <button
                          type="button"
                          onClick={() => setEditTargetAmount(String(editFeasibility.suggestedAffordableTarget))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            color: '#a7f3d0',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span>
                            💰 Set target to <strong>{currencySymbol}{editFeasibility.suggestedAffordableTarget.toLocaleString()}</strong>
                          </span>
                          <span style={{ color: '#34d399', fontWeight: 700 }}>Apply Amount</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ minWidth: '130px', justifyContent: 'center' }}
                >
                  {submitting ? 'Saving...' : 'Update Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SAVINGS CONTRIBUTION MODAL */}
      {isUpdateModalOpen && selectedGoal && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsUpdateModalOpen(false);
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
              maxWidth: '420px',
              padding: '1.75rem',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.35rem', color: '#ffffff', fontSize: '1.2rem', fontWeight: 800 }}>
              Add Savings to "{selectedGoal.name}"
            </h3>
            <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Currently saved: {currencySymbol}
              {selectedGoal.current_saved.toLocaleString()} / {currencySymbol}
              {selectedGoal.target_amount.toLocaleString()}
            </p>

            <form
              onSubmit={handleUpdateContribution}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    color: '#cbd5e1',
                    marginBottom: '0.35rem',
                    fontWeight: 600
                  }}
                >
                  Amount to Add ({currencySymbol})
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  placeholder="e.g. 5000"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 700
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsUpdateModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ minWidth: '130px', justifyContent: 'center' }}
                >
                  {submitting ? 'Updating...' : 'Save Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST ASSUMPTIONS & BUFFER MODAL */}
      {isAssumptionsModalOpen && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAssumptionsModalOpen(false);
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
              maxWidth: '480px',
              padding: '1.75rem',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.25rem', fontWeight: 800 }}>
                Financial Baseline Assumptions
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#a5b4fc'
                }}
              >
                Safe Savings Engine
              </span>
            </div>

            <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Configure your living expenses and emergency buffer. FinanceIQ strictly protects these funds from savings commitments.
            </p>

            <form onSubmit={handleSaveAssumptions} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Monthly Income ({currencySymbol})
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={tempIncome}
                  onChange={(e) => setTempIncome(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#f87171', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Essential Needs & Living Expenses ({currencySymbol})
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={tempEssential}
                  onChange={(e) => setTempEssential(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Rent, groceries, utilities, debt, health care (never counted as savings)
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Discretionary Spending (Wants) ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  value={tempDiscretionary}
                  onChange={(e) => setTempDiscretionary(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600 }}>
                    Emergency Buffer Percentage
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24' }}>
                    {tempBufferPct}% ({currencySymbol}{Math.round(((parseFloat(tempIncome) || 0) * tempBufferPct) / 100).toLocaleString()})
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={tempBufferPct}
                  onChange={(e) => setTempBufferPct(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#fbbf24' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  <span>5% (Aggressive)</span>
                  <span>15% (Recommended)</span>
                  <span>30% (Conservative)</span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)'
                }}
              >
                <button
                  type="button"
                  onClick={handleResetAssumptions}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Reset to Historical Analysis
                </button>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsAssumptionsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Apply Assumptions
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
