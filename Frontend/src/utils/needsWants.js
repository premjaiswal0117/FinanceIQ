/**
 * Needs vs Wants Classification Engine and Insights Generator
 *
 * Classifies expenses according to standard 50/30/20 financial principles:
 * - Needs (Essential living costs): Rent, Housing, Utilities, Groceries, Healthcare, Education, Insurance
 * - Wants (Discretionary lifestyle): Entertainment, Shopping, Dining Out, Travel, Hobbies, Leisure
 *
 * Features:
 * - Does NOT assume all Food expenses are Wants. Basic food & sustenance default to Needs.
 * - Identifies ambiguous categories (Food without notes, general Shopping, Transportation, Miscellaneous)
 *   and labels them as 'Estimated'.
 * - Full support for user overrides/corrections at both category and transaction level,
 *   stored per-user with instant recalculation.
 */

export const NEEDS_KEYWORDS = [
  'rent',
  'groceries',
  'grocery',
  'utilities',
  'utility',
  'electricity',
  'water',
  'gas',
  'bills',
  'bill',
  'healthcare',
  'health',
  'medical',
  'medicine',
  'doctor',
  'hospital',
  'pharmacy',
  'education',
  'tuition',
  'school',
  'college',
  'course',
  'insurance',
  'commute',
  'transportation',
  'transport',
  'fuel',
  'petrol',
  'diesel',
  'milk',
  'food' // default basic sustenance
];

export const WANTS_KEYWORDS = [
  'entertainment',
  'movie',
  'movies',
  'cinema',
  'shopping',
  'clothes',
  'clothing',
  'apparel',
  'electronics',
  'dining out',
  'dining',
  'restaurant',
  'restaurants',
  'cafe',
  'coffee',
  'bar',
  'pub',
  'fast food',
  'zomato',
  'swiggy',
  'travel',
  'vacation',
  'holiday',
  'hotel',
  'flight',
  'leisure',
  'hobbies',
  'hobby',
  'gaming',
  'games',
  'subscriptions',
  'streaming',
  'netflix',
  'spotify',
  'prime',
  'gym',
  'fitness',
  'personal care',
  'salon',
  'spa',
  'luxury',
  'gifts',
  'gift',
  'party',
  'parties'
];

export const DINING_OUT_KEYWORDS = [
  'restaurant',
  'cafe',
  'coffee',
  'bar',
  'pub',
  'dinner',
  'lunch',
  'fast food',
  'swiggy',
  'zomato',
  'takeaway',
  'takeout',
  'drinks',
  'pizza',
  'burger',
  'bistro'
];

export const GROCERY_KEYWORDS = [
  'grocery',
  'groceries',
  'supermarket',
  'vegetables',
  'fruits',
  'milk',
  'bread',
  'provisions',
  'ration',
  'market',
  'supplies',
  'cooking'
];

/**
 * Retrieves saved user overrides from localStorage.
 */
export function getUserOverrides(userId = 'default') {
  try {
    const raw = localStorage.getItem(`financeiq_needs_wants_overrides_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves a user correction for a category or transaction id.
 */
export function saveUserOverride(userId = 'default', key, classification) {
  try {
    const existing = getUserOverrides(userId);
    existing[key] = classification;
    localStorage.setItem(
      `financeiq_needs_wants_overrides_${userId}`,
      JSON.stringify(existing)
    );
    return existing;
  } catch (e) {
    console.error('Failed to save user override:', e);
    return {};
  }
}

/**
 * Removes a specific user override.
 */
export function removeUserOverride(userId = 'default', key) {
  try {
    const existing = getUserOverrides(userId);
    delete existing[key];
    localStorage.setItem(
      `financeiq_needs_wants_overrides_${userId}`,
      JSON.stringify(existing)
    );
    return existing;
  } catch (e) {
    console.error('Failed to remove user override:', e);
    return {};
  }
}

/**
 * Resets all user overrides for the user.
 */
export function resetUserOverrides(userId = 'default') {
  try {
    localStorage.removeItem(`financeiq_needs_wants_overrides_${userId}`);
    return {};
  } catch {
    return {};
  }
}

/**
 * Classifies an individual transaction with comprehensive audit details:
 * Returns: {
 *   classification: 'Needs' | 'Wants',
 *   isEstimated: boolean,
 *   isUserCorrected: boolean,
 *   reason: string,
 *   category: string
 * }
 */
export function classifyTransactionWithDetails(transaction, userOverrides = {}) {
  if (!transaction) {
    return {
      classification: 'Needs',
      isEstimated: false,
      isUserCorrected: false,
      reason: 'Default empty transaction fallback',
      category: 'Uncategorized'
    };
  }

  const txnId = transaction.transaction_id;
  const rawCategory = transaction.category || 'Other';
  const categoryLower = rawCategory.toLowerCase().trim();
  const notes = (transaction.notes || '').toLowerCase().trim();

  // 1. Check if user explicitly corrected this specific transaction
  if (txnId && userOverrides[txnId]) {
    return {
      classification: userOverrides[txnId],
      isEstimated: false,
      isUserCorrected: true,
      reason: 'Manually corrected for this specific transaction by user',
      category: rawCategory
    };
  }

  // 2. Check if user explicitly corrected this whole category
  if (userOverrides[rawCategory]) {
    return {
      classification: userOverrides[rawCategory],
      isEstimated: false,
      isUserCorrected: true,
      reason: `Manually corrected category "${rawCategory}" by user`,
      category: rawCategory
    };
  }

  // 3. Clear-cut Unambiguous Needs
  const isDirectNeeds = [
    'rent',
    'housing',
    'groceries',
    'grocery',
    'utilities',
    'utility',
    'electricity',
    'water',
    'gas',
    'bills',
    'healthcare',
    'health',
    'medical',
    'medicine',
    'doctor',
    'hospital',
    'pharmacy',
    'education',
    'tuition',
    'school',
    'college',
    'insurance'
  ].some((kw) => categoryLower === kw || categoryLower.includes(kw));

  if (isDirectNeeds) {
    return {
      classification: 'Needs',
      isEstimated: false,
      isUserCorrected: false,
      reason: `Unambiguous essential living cost (${rawCategory})`,
      category: rawCategory
    };
  }

  // 4. Clear-cut Unambiguous Wants
  const isDirectWants = [
    'entertainment',
    'movies',
    'cinema',
    'dining out',
    'restaurant',
    'cafe',
    'bar',
    'pub',
    'swiggy',
    'zomato',
    'vacation',
    'hobbies',
    'gaming',
    'streaming',
    'netflix',
    'spotify',
    'salon',
    'spa',
    'luxury',
    'gifts',
    'party'
  ].some((kw) => categoryLower === kw || categoryLower.includes(kw));

  if (isDirectWants) {
    return {
      classification: 'Wants',
      isEstimated: false,
      isUserCorrected: false,
      reason: `Unambiguous discretionary lifestyle expense (${rawCategory})`,
      category: rawCategory
    };
  }

  // 5. Food Category Handling
  // Critical requirement: Do NOT assume every Food expense is a Want.
  if (categoryLower === 'food') {
    const isDiningOut = DINING_OUT_KEYWORDS.some(
      (kw) => notes.includes(kw) || categoryLower.includes(kw)
    );
    const isGrocery = GROCERY_KEYWORDS.some((kw) => notes.includes(kw));

    if (isDiningOut) {
      return {
        classification: 'Wants',
        isEstimated: false,
        isUserCorrected: false,
        reason: 'Classified as Want because notes indicate dining out or restaurant meal',
        category: rawCategory
      };
    }

    if (isGrocery) {
      return {
        classification: 'Needs',
        isEstimated: false,
        isUserCorrected: false,
        reason: 'Classified as Need because notes indicate groceries or cooking supplies',
        category: rawCategory
      };
    }

    // Generic Food without notes: protected as Needs (sustenance), but marked as Estimated
    return {
      classification: 'Needs',
      isEstimated: true,
      isUserCorrected: false,
      reason:
        'Generic Food category with no dining notes; defaulted to essential sustenance (Need). Can be adjusted if this was dining out.',
      category: rawCategory
    };
  }

  // 6. Shopping Category Handling (Ambiguous)
  if (categoryLower === 'shopping') {
    const isEssential = ['grocery', 'supplies', 'hardware', 'pharmacy', 'medicine'].some((w) =>
      notes.includes(w)
    );
    if (isEssential) {
      return {
        classification: 'Needs',
        isEstimated: false,
        isUserCorrected: false,
        reason: 'Classified as Need because notes indicate essential supplies',
        category: rawCategory
      };
    }

    return {
      classification: 'Wants',
      isEstimated: true,
      isUserCorrected: false,
      reason:
        'General shopping defaulted to discretionary Want. Can be adjusted if essential household supplies.',
      category: rawCategory
    };
  }

  // 7. Transportation / Commute / Travel Handling (Ambiguous)
  if (
    categoryLower === 'transportation' ||
    categoryLower === 'transport' ||
    categoryLower === 'travel' ||
    categoryLower === 'commute'
  ) {
    const isCommute = ['commute', 'metro', 'bus', 'train', 'fuel', 'petrol', 'diesel', 'transit'].some(
      (w) => notes.includes(w) || categoryLower.includes(w)
    );
    const isVacation = ['vacation', 'flight', 'hotel', 'trip', 'holiday', 'resort'].some((w) =>
      notes.includes(w)
    );

    if (isCommute) {
      return {
        classification: 'Needs',
        isEstimated: false,
        isUserCorrected: false,
        reason: 'Essential transportation / daily work commute (Need)',
        category: rawCategory
      };
    }

    if (isVacation) {
      return {
        classification: 'Wants',
        isEstimated: false,
        isUserCorrected: false,
        reason: 'Discretionary travel / vacation (Want)',
        category: rawCategory
      };
    }

    const defaultClass = categoryLower === 'travel' ? 'Wants' : 'Needs';
    return {
      classification: defaultClass,
      isEstimated: true,
      isUserCorrected: false,
      reason: `Generic ${rawCategory} defaulted to ${defaultClass}. Can be customized to reflect daily commute vs leisure trip.`,
      category: rawCategory
    };
  }

  // 8. Other / Miscellaneous / Unrecognized Category (Ambiguous)
  const hasNeedsInNotes = NEEDS_KEYWORDS.some((kw) => notes.includes(kw));
  const hasWantsInNotes = WANTS_KEYWORDS.some((kw) => notes.includes(kw));

  if (hasNeedsInNotes && !hasWantsInNotes) {
    return {
      classification: 'Needs',
      isEstimated: true,
      isUserCorrected: false,
      reason: 'Estimated as Need based on transaction description notes',
      category: rawCategory
    };
  }

  if (hasWantsInNotes) {
    return {
      classification: 'Wants',
      isEstimated: true,
      isUserCorrected: false,
      reason: 'Estimated as Want based on transaction description notes',
      category: rawCategory
    };
  }

  // Default fallback for ambiguous categories
  return {
    classification: 'Wants',
    isEstimated: true,
    isUserCorrected: false,
    reason: `Unrecognized category "${rawCategory}"; estimated as discretionary Want. You can correct it anytime.`,
    category: rawCategory
  };
}

/**
 * Classifies an individual transaction into 'Needs' or 'Wants'.
 * Retains strict backward compatibility with existing callers.
 */
export function classifyTransaction(transaction, userOverrides = {}) {
  const details = classifyTransactionWithDetails(transaction, userOverrides);
  return details.classification;
}

/**
 * Computes aggregated Needs vs Wants breakdown, estimated category tracking,
 * and actionable spending insights.
 */
export function analyzeNeedsVsWants(
  transactions = [],
  monthlyIncome = 0,
  userOverrides = {}
) {
  const expenseTx = transactions.filter(
    (t) => (t.transaction_type || '').toLowerCase() === 'expense'
  );

  let totalNeeds = 0;
  let totalWants = 0;
  let estimatedCount = 0;

  const needsCategoriesMap = {};
  const wantsCategoriesMap = {};
  const categoryDetailsMap = {};
  const ambiguousItems = [];

  expenseTx.forEach((tx) => {
    const details = classifyTransactionWithDetails(tx, userOverrides);
    const amount = Math.abs(Number(tx.amount) || 0);
    const catName = tx.category || 'Other';

    if (details.isEstimated) {
      estimatedCount += 1;
      ambiguousItems.push({
        transaction: tx,
        details
      });
    }

    // Category summary tracking
    if (!categoryDetailsMap[catName]) {
      categoryDetailsMap[catName] = {
        category: catName,
        classification: details.classification,
        isEstimated: details.isEstimated,
        isUserCorrected: details.isUserCorrected,
        total: 0,
        count: 0,
        sampleNotes: tx.notes || ''
      };
    }
    categoryDetailsMap[catName].total += amount;
    categoryDetailsMap[catName].count += 1;

    if (details.classification === 'Needs') {
      totalNeeds += amount;
      if (!needsCategoriesMap[catName]) {
        needsCategoriesMap[catName] = {
          category: catName,
          total: 0,
          count: 0,
          isEstimated: details.isEstimated,
          isUserCorrected: details.isUserCorrected
        };
      }
      needsCategoriesMap[catName].total += amount;
      needsCategoriesMap[catName].count += 1;
    } else {
      totalWants += amount;
      if (!wantsCategoriesMap[catName]) {
        wantsCategoriesMap[catName] = {
          category: catName,
          total: 0,
          count: 0,
          isEstimated: details.isEstimated,
          isUserCorrected: details.isUserCorrected
        };
      }
      wantsCategoriesMap[catName].total += amount;
      wantsCategoriesMap[catName].count += 1;
    }
  });

  const totalExpense = totalNeeds + totalWants;
  const needsPercent = totalExpense > 0 ? (totalNeeds / totalExpense) * 100 : 0;
  const wantsPercent = totalExpense > 0 ? (totalWants / totalExpense) * 100 : 0;

  const needsByCategory = Object.values(needsCategoriesMap).sort((a, b) => b.total - a.total);
  const wantsByCategory = Object.values(wantsCategoriesMap).sort((a, b) => b.total - a.total);
  const allCategories = Object.values(categoryDetailsMap).sort((a, b) => b.total - a.total);

  // Generate actionable spending insights
  const insights = [];

  if (totalExpense === 0) {
    insights.push({
      type: 'neutral',
      title: 'No Expenses Recorded',
      description: 'Add or record expense transactions for this month to see your Needs vs Wants breakdown.',
      action: 'Track your first transaction using the Add Transaction button.'
    });
  } else {
    // 1. Overall Balance Analysis vs 50/30 Rule
    if (wantsPercent > 40) {
      insights.push({
        type: 'warning',
        title: 'High Discretionary Spending',
        description: `Wants represent ${wantsPercent.toFixed(1)}% of your expenses (higher than the recommended 30% guideline).`,
        action: wantsByCategory[0]
          ? `Consider pausing non-essential purchases in ${wantsByCategory[0].category} to boost your monthly savings.`
          : 'Trimming non-essential lifestyle purchases can immediately free up monthly cash flow.'
      });
    } else if (wantsPercent <= 30) {
      insights.push({
        type: 'success',
        title: 'Disciplined Discretionary Spending',
        description: `Wants are well-controlled at ${wantsPercent.toFixed(1)}% of total spending, staying within the recommended 30% guideline.`,
        action: 'Great job maintaining financial discipline while covering your essentials!'
      });
    } else {
      insights.push({
        type: 'info',
        title: 'Moderate Wants Allocation',
        description: `Wants account for ${wantsPercent.toFixed(1)}% of expenses. You are close to the ideal 30% guideline.`,
        action: 'Review minor subscriptions or dining out expenses to stay comfortably on budget.'
      });
    }

    // 2. Needs Assessment
    if (needsPercent > 70) {
      insights.push({
        type: 'info',
        title: 'High Fixed Obligations',
        description: `Essential needs consume ${needsPercent.toFixed(1)}% of your expenses. Fixed obligations (like rent and utilities) dominate your cash flow.`,
        action: 'Audit utility bills, recurring phone plans, or groceries for potential cost-saving opportunities.'
      });
    }

    // 3. Top Wants Driver
    if (wantsByCategory.length > 0 && wantsByCategory[0].total > 0) {
      const topWant = wantsByCategory[0];
      const topWantShare = totalWants > 0 ? ((topWant.total / totalWants) * 100).toFixed(0) : 0;
      insights.push({
        type: 'action',
        title: `Top Discretionary Driver: ${topWant.category}`,
        description: `${topWant.category} makes up ${topWantShare}% of all discretionary spending (${topWant.count} transactions).`,
        action: `Implementing a 24-hour waiting rule for ${topWant.category} purchases can prevent impulse spending.`
      });
    }
  }

  return {
    totalNeeds: Math.round(totalNeeds),
    totalWants: Math.round(totalWants),
    totalExpense: Math.round(totalExpense),
    needsPercent: Math.round(needsPercent * 10) / 10,
    wantsPercent: Math.round(wantsPercent * 10) / 10,
    needsByCategory,
    wantsByCategory,
    allCategories,
    ambiguousItems,
    hasEstimatedClassifications: estimatedCount > 0,
    estimatedCount,
    insights
  };
}
