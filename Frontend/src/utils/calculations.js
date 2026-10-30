/**
 * Financial calculation and insight derivation engine.
 * Computes analytics strictly based on real API data.
 */

export function calculateSavingsRate(income = 0, expense = 0) {
  if (!income || income <= 0) return 0;

  const savings = income - expense;

  return Math.max(0, (savings / income) * 100);
}

export function generateInsights(
  summary = {},
  categories = [],
  monthly = [],
  options = {}
) {
  const { isOverview = false } = options;
  const insights = [];

  const income = summary.total_income || 0;
  const expense = summary.total_expense || 0;

  const balance =
    summary.net_balance !== undefined
      ? summary.net_balance
      : income - expense;

  const savingsRate = calculateSavingsRate(income, expense);

  // 1. Savings Rate & Cash Flow (omitted on Overview to avoid repeating KPI cards)
  if (!isOverview && income > 0) {
    if (savingsRate >= 25) {
      insights.push({
        id: 'savings-strong',
        type: 'positive',
        title: 'Strong Savings Rate',
        description: `Your savings rate is ${savingsRate.toFixed(
          1
        )}%, meaning you are saving a good portion of your income.`,
        metric: `${savingsRate.toFixed(1)}% saved`,
        badge: 'Good Savings'
      });
    } else if (savingsRate > 0) {
      insights.push({
        id: 'savings-moderate',
        type: 'info',
        title: 'Positive Savings',
        description: `You are currently saving ${savingsRate.toFixed(
          1
        )}% of your income. Increasing your savings rate over time can help build a stronger financial cushion.`,
        metric: `${savingsRate.toFixed(1)}% saved`,
        badge: 'Positive'
      });
    } else {
      insights.push({
        id: 'savings-deficit',
        type: 'warning',
        title: 'Expenses Exceed Income',
        description: `Your expenses exceed your income by ${Math.abs(
          balance
        ).toLocaleString()}. Reviewing your highest spending categories may help improve your monthly balance.`,
        metric: 'Negative Balance',
        badge: 'Attention Needed'
      });
    }
  }

  // 2. Highest Spending Category
  if (categories && categories.length > 0) {
    const sorted = [...categories].sort(
      (a, b) =>
        (b.total_spending || 0) -
        (a.total_spending || 0)
    );

    const top = sorted[0];

    const topSpend = top.total_spending || 0;

    const totalExp =
      expense > 0
        ? expense
        : categories.reduce(
          (sum, c) =>
            sum + (c.total_spending || 0),
          0
        );

    const categoryShare =
      totalExp > 0
        ? (topSpend / totalExp) * 100
        : 0;

    insights.push({
      id: 'top-category',
      type: 'info',
      title: `Highest Spending: ${top.category}`,
      description: `${top.category} is your highest spending category, accounting for ${categoryShare.toFixed(
        1
      )}% of your total recorded expenses across ${top.transaction_count || 0
        } transactions.`,
      metric: `${categoryShare.toFixed(1)}% of spending`,
      badge: top.category
    });

    // Second highest spending category
    if (sorted.length > 1) {
      const second = sorted[1];

      const secondShare =
        totalExp > 0
          ? ((second.total_spending || 0) /
            totalExp) *
          100
          : 0;

      insights.push({
        id: 'secondary-category',
        type: 'info',
        title: `Second Highest: ${second.category}`,
        description: `${second.category} is your second highest spending category, accounting for ${secondShare.toFixed(
          1
        )}% of total spending.`,
        metric: `${secondShare.toFixed(1)}%`,
        badge: second.category
      });
    }
  }

  // 3. Monthly Spending Trends
  if (monthly && monthly.length > 0) {
    // Find month with highest expenses
    const highestExpenseMonth = [...monthly].reduce(
      (max, curr) =>
        curr.total_expense > max.total_expense
          ? curr
          : max,
      monthly[0]
    );

    if (highestExpenseMonth) {
      insights.push({
        id: 'peak-month',
        type: 'info',
        title: 'Highest Spending Month',
        description: `Your highest monthly expenses were recorded in ${highestExpenseMonth.month}/${highestExpenseMonth.year}, with total expenses of ${highestExpenseMonth.total_expense.toLocaleString()}.`,
        metric: `M${highestExpenseMonth.month} Peak`,
        badge: `${highestExpenseMonth.year}`
      });
    }

    // Average monthly income and expenses
    const avgExpense =
      monthly.reduce(
        (acc, m) =>
          acc + (m.total_expense || 0),
        0
      ) / monthly.length;

    const avgIncome =
      monthly.reduce(
        (acc, m) =>
          acc + (m.total_income || 0),
        0
      ) / monthly.length;

    insights.push({
      id: 'monthly-runrate',
      type: 'info',
      title: 'Average Monthly Spending',
      description: isOverview
        ? `Across your historical records, you maintain an average net run rate of ${Math.round(
            avgIncome - avgExpense
          ).toLocaleString()}/month.`
        : `Across the available monthly data, your average monthly income is ${Math.round(
            avgIncome
          ).toLocaleString()} and your average monthly expenses are ${Math.round(
            avgExpense
          ).toLocaleString()}.`,
      metric: `Net ${Math.round(
        avgIncome - avgExpense
      ).toLocaleString()}/mo`,
      badge: 'Monthly Average'
    });
  }

  return insights;
}