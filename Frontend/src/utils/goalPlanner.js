/**
 * Smart Goal Planner & Financial Feasibility Engine for FinanceIQ
 *
 * Evaluates goal feasibility against user's actual historical income,
 * essential living expenses (Needs), discretionary spending (Wants),
 * and a configurable emergency buffer.
 *
 * Rules:
 * 1. Living expenses and emergency buffer are strictly protected.
 * 2. Never assumes all surplus cash is safe to save.
 * 3. Accounts for commitments to other active goals to prevent double counting.
 * 4. Provides realistic target dates and affordable contribution suggestions when unrealistic.
 */

import { classifyTransaction } from './needsWants.js';

/**
 * Calculates number of full or partial months between two dates.
 */
export function calculateMonthsRemaining(targetDateStr, fromDate = new Date()) {
  if (!targetDateStr) return 1;
  const target = new Date(targetDateStr);
  const now = new Date(fromDate);

  if (isNaN(target.getTime())) return 1;

  const diffYears = target.getFullYear() - now.getFullYear();
  const diffMonths = target.getMonth() - now.getMonth();
  const totalMonths = diffYears * 12 + diffMonths;

  // If date is later in the current month, treat as at least 1 month
  return Math.max(1, totalMonths <= 0 ? 1 : totalMonths);
}

/**
 * Derives user's baseline financial capacity from history.
 */
export function analyzeFinancialCapacity({
  monthly = [],
  transactions = [],
  summary = null,
  activeGoals = [],
  customAssumptions = null,
  emergencyBufferPercent = 15, // configurable default 15%
  currency = 'INR'
}) {
  const isUSD = currency === 'USD';
  const defaultIncome = isUSD ? 3500 : 50000;
  const defaultEssential = isUSD ? 1800 : 25000;
  const defaultDiscretionary = isUSD ? 700 : 10000;

  // 1. Calculate historical average income
  let avgMonthlyIncome = 0;
  const validIncomeMonths = monthly.filter((m) => (m.total_income || 0) > 0);

  if (validIncomeMonths.length > 0) {
    const recentIncomeMonths = validIncomeMonths.slice(-6); // last 6 active months
    avgMonthlyIncome =
      recentIncomeMonths.reduce((sum, m) => sum + Number(m.total_income || 0), 0) /
      recentIncomeMonths.length;
  } else if (summary && summary.total_income > 0) {
    avgMonthlyIncome = Number(summary.total_income) / Math.max(1, monthly.length || 1);
  }

  // 2. Calculate essential expenses (Needs) vs discretionary (Wants)
  const expenseTxns = transactions.filter(
    (t) => (t.transaction_type || '').toLowerCase() === 'expense'
  );

  let avgMonthlyEssential = 0;
  let avgMonthlyDiscretionary = 0;

  if (expenseTxns.length >= 5) {
    let totalEssential = 0;
    let totalDiscretionary = 0;

    expenseTxns.forEach((tx) => {
      const type = classifyTransaction(tx);
      const amt = Math.abs(Number(tx.amount) || 0);
      if (type === 'Needs') {
        totalEssential += amt;
      } else {
        totalDiscretionary += amt;
      }
    });

    const numMonths = Math.max(1, monthly.length || 1);
    avgMonthlyEssential = totalEssential / numMonths;
    avgMonthlyDiscretionary = totalDiscretionary / numMonths;
  } else if (monthly.length > 0) {
    // If few transactions, estimate 60% needs, 40% wants from total monthly expenses
    const avgTotalExpense =
      monthly.reduce((sum, m) => sum + Number(m.total_expense || 0), 0) / monthly.length;
    avgMonthlyEssential = avgTotalExpense * 0.6;
    avgMonthlyDiscretionary = avgTotalExpense * 0.4;
  }

  // Determine if user has sufficient history
  const hasSufficientHistory =
    validIncomeMonths.length >= 1 && (expenseTxns.length >= 5 || monthly.length >= 1);

  // Apply custom assumptions if provided or if new user
  let finalIncome = avgMonthlyIncome;
  let finalEssential = avgMonthlyEssential;
  let finalDiscretionary = avgMonthlyDiscretionary;
  let finalBufferPct = emergencyBufferPercent;

  if (customAssumptions) {
    if (customAssumptions.monthlyIncome !== undefined) {
      finalIncome = Number(customAssumptions.monthlyIncome);
    }
    if (customAssumptions.essentialExpenses !== undefined) {
      finalEssential = Number(customAssumptions.essentialExpenses);
    }
    if (customAssumptions.discretionarySpending !== undefined) {
      finalDiscretionary = Number(customAssumptions.discretionarySpending);
    }
    if (customAssumptions.emergencyBufferPercent !== undefined) {
      finalBufferPct = Number(customAssumptions.emergencyBufferPercent);
    }
  } else if (!hasSufficientHistory) {
    finalIncome = defaultIncome;
    finalEssential = defaultEssential;
    finalDiscretionary = defaultDiscretionary;
  }

  // 3. Protect living costs and calculate Emergency Buffer
  // Emergency buffer protects against surprise expenses: X% of monthly income
  const emergencyBuffer = Math.round((finalIncome * finalBufferPct) / 100);

  // Protected Living Costs = Essential Expenses + Emergency Buffer
  const protectedLivingCosts = Math.round(finalEssential + emergencyBuffer);

  // Safe Total Monthly Savings Capacity:
  // Income minus (Essential Expenses + Discretionary Allowance + Emergency Buffer)
  // Ensure we do not assume all remaining cash is safe
  const rawSurplus = finalIncome - finalEssential - finalDiscretionary;
  const safeMonthlySavingsCapacity = Math.max(
    0,
    Math.round(finalIncome - protectedLivingCosts - finalDiscretionary)
  );

  // 4. Committed Monthly Savings across other active goals (prevents double counting)
  const existingGoalsCommittedMonthly = activeGoals
    .filter((g) => g.status !== 'Completed')
    .reduce((sum, g) => sum + Number(g.current_required_monthly_saving || 0), 0);

  // Free uncommitted monthly capacity for new/edited goals
  const freeMonthlySavingsCapacity = Math.max(
    0,
    Math.round(safeMonthlySavingsCapacity - existingGoalsCommittedMonthly)
  );

  return {
    hasSufficientHistory,
    monthlyIncome: Math.round(finalIncome),
    essentialExpenses: Math.round(finalEssential),
    discretionarySpending: Math.round(finalDiscretionary),
    emergencyBufferPercent: finalBufferPct,
    emergencyBuffer,
    protectedLivingCosts,
    rawSurplus: Math.round(rawSurplus),
    safeMonthlySavingsCapacity,
    existingGoalsCommittedMonthly: Math.round(existingGoalsCommittedMonthly),
    freeMonthlySavingsCapacity,
    currency
  };
}

/**
 * Evaluates the feasibility of a single savings goal.
 */
export function evaluateGoalFeasibility({
  targetAmount = 0,
  currentSaved = 0,
  targetDate = '',
  financialCapacity,
  currentGoalId = null,
  activeGoals = []
}) {
  const target = Math.max(0, Number(targetAmount) || 0);
  const saved = Math.max(0, Number(currentSaved) || 0);
  const remainingToSave = Math.max(0, target - saved);

  const monthsRemaining = calculateMonthsRemaining(targetDate);
  const requiredMonthly =
    remainingToSave <= 0 ? 0 : Math.round(remainingToSave / monthsRemaining);

  // Calculate available capacity for THIS goal specifically
  // Exclude current goal if editing so we don't count its own previous requirement against itself
  const otherGoalsCommitted = activeGoals
    .filter((g) => g.status !== 'Completed' && g.goal_id !== currentGoalId)
    .reduce((sum, g) => sum + Number(g.current_required_monthly_saving || 0), 0);

  const availableMonthlyForGoal = Math.max(
    0,
    financialCapacity.safeMonthlySavingsCapacity - otherGoalsCommitted
  );

  const monthlyDeficit = Math.max(0, requiredMonthly - availableMonthlyForGoal);
  const monthlyCushion = Math.max(0, availableMonthlyForGoal - requiredMonthly);

  // Feasibility status evaluation
  let isFeasible = false;
  let status = 'Achievable';
  let riskLevel = 'Low'; // 'Low' | 'Moderate' | 'High' | 'Critical'
  let message = '';

  if (remainingToSave <= 0) {
    isFeasible = true;
    status = 'Completed';
    riskLevel = 'Low';
    message = 'Goal is already fully funded!';
  } else if (availableMonthlyForGoal <= 0) {
    isFeasible = false;
    status = 'Unrealistic';
    riskLevel = 'Critical';
    message =
      'Zero safe monthly savings capacity available after protecting essential costs, emergency buffer, and other goals.';
  } else if (requiredMonthly <= availableMonthlyForGoal) {
    isFeasible = true;
    status = 'Achievable';
    riskLevel = requiredMonthly > availableMonthlyForGoal * 0.8 ? 'Moderate' : 'Low';
    message = `Realistic! Requires ${requiredMonthly.toLocaleString()}/mo, comfortably within your safe available budget of ${availableMonthlyForGoal.toLocaleString()}/mo.`;
  } else {
    isFeasible = false;
    status = 'Unrealistic';
    riskLevel = requiredMonthly > availableMonthlyForGoal * 1.5 ? 'Critical' : 'High';
    message = `Unrealistic target: Requires ${requiredMonthly.toLocaleString()}/mo, which exceeds your safe capacity by ${monthlyDeficit.toLocaleString()}/mo.`;
  }

  // Smart Realistic Suggestions
  let suggestedRealisticDate = null;
  let suggestedRealisticMonths = monthsRemaining;
  let suggestedAffordableTarget = target;
  let suggestedDiscretionaryReduction = 0;

  if (!isFeasible && remainingToSave > 0) {
    // 1. Realistic Target Date based on safe available monthly capacity
    if (availableMonthlyForGoal > 0) {
      suggestedRealisticMonths = Math.ceil(remainingToSave / availableMonthlyForGoal);
      const suggestedDateObj = new Date();
      suggestedDateObj.setMonth(suggestedDateObj.getMonth() + suggestedRealisticMonths);
      suggestedRealisticDate = suggestedDateObj.toISOString().split('T')[0];
    }

    // 2. Affordable Target Amount achievable by the current deadline
    suggestedAffordableTarget = Math.round(saved + availableMonthlyForGoal * monthsRemaining);

    // 3. Can trimming discretionary spending bridge the gap?
    if (
      monthlyDeficit <= financialCapacity.discretionarySpending &&
      financialCapacity.discretionarySpending > 0
    ) {
      suggestedDiscretionaryReduction = monthlyDeficit;
    }
  }

  return {
    targetAmount: target,
    currentSaved: saved,
    remainingToSave,
    monthsRemaining,
    requiredMonthly,
    availableMonthlyForGoal,
    otherGoalsCommitted: Math.round(otherGoalsCommitted),
    monthlyDeficit,
    monthlyCushion,
    isFeasible,
    status,
    riskLevel,
    message,
    suggestedRealisticDate,
    suggestedRealisticMonths,
    suggestedAffordableTarget,
    suggestedDiscretionaryReduction
  };
}
