import { THEME_COLORS, colors } from './styles';

export const PREMIUM_FEATURES = {
  ANALYTICS: {
    BASIC: [
      'Monthly spending trends',
      'Basic category breakdown',
      'Simple budget tracking'
    ],
    ADVANCED: [
      'AI-powered spending predictions',
      'Detailed category analytics',
      'Investment tracking',
      'Custom budget rules',
      'Expense forecasting'
    ]
  },
  BUDGETING: {
    BASIC: [
      'Basic budget limits',
      'Simple notifications',
      'Monthly reports'
    ],
    ADVANCED: [
      'Smart budget recommendations',
      'Real-time alerts',
      'Custom spending rules',
      'Multi-currency support',
      'Family budget sharing'
    ]
  },
  INSIGHTS: {
    BASIC: [
      'Basic spending insights',
      'Monthly summaries',
      'Simple savings tips'
    ],
    ADVANCED: [
      'AI-powered financial advice',
      'Personalized saving strategies',
      'Investment opportunities',
      'Market trends analysis',
      'Smart saving goals'
    ]
  }
};

export const CHART_COLORS = {
  gradient: {
    income: ['#00b894', '#55efc4'],
    expense: ['#d63031', '#ff7675'],
    savings: ['#0984e3', '#74b9ff'],
    investment: ['#6c5ce7', '#a29bfe']
  },
  single: {
    income: '#00b894',
    expense: '#d63031',
    savings: '#0984e3',
    investment: '#6c5ce7',
    neutral: '#636e72'
  }
};

export const CHART_CONFIG = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: 'transparent',
  backgroundGradientTo: 'transparent',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: THEME_COLORS.secondary.main
  }
};

export const formatCurrency = (amount, currency = '$') => {
  return `${currency}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

export const calculateGrowth = (current, previous) => {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
};

export const getGrowthColor = (growth) => {
  if (growth > 0) return CHART_COLORS.single.income;
  if (growth < 0) return CHART_COLORS.single.expense;
  return CHART_COLORS.single.neutral;
};

export const generateSmartInsights = (data) => {
  const insights = [];
  
  // Spending Pattern Insights
  if (data.monthlyTrends) {
    const lastMonth = data.monthlyTrends.expenses[data.monthlyTrends.expenses.length - 1];
    const prevMonth = data.monthlyTrends.expenses[data.monthlyTrends.expenses.length - 2];
    const growth = calculateGrowth(lastMonth, prevMonth);
    
    insights.push({
      type: 'spending',
      title: 'Spending Trend',
      description: `Your spending has ${growth > 0 ? 'increased' : 'decreased'} by ${Math.abs(growth).toFixed(1)}% compared to last month.`,
      color: getGrowthColor(-growth), // Negative growth in spending is positive
      icon: growth > 0 ? 'trending-up' : 'trending-down'
    });
  }

  // Category Insights
  if (data.categoryBreakdown) {
    const topCategory = Object.entries(data.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0];
    
    insights.push({
      type: 'category',
      title: 'Top Spending Category',
      description: `${topCategory[0]} accounts for ${((topCategory[1] / Object.values(data.categoryBreakdown).reduce((a,b) => a+b)) * 100).toFixed(1)}% of your expenses.`,
      color: CHART_COLORS.single.expense,
      icon: 'pie-chart'
    });
  }

  // Savings Insights
  if (data.monthlyTrends) {
    const lastMonthSavings = data.monthlyTrends.income[data.monthlyTrends.income.length - 1] - 
                            data.monthlyTrends.expenses[data.monthlyTrends.expenses.length - 1];
    
    insights.push({
      type: 'savings',
      title: 'Monthly Savings',
      description: lastMonthSavings > 0 
        ? `Great job! You saved ${formatCurrency(lastMonthSavings)} last month.`
        : `Alert: You overspent by ${formatCurrency(-lastMonthSavings)} last month.`,
      color: lastMonthSavings > 0 ? CHART_COLORS.single.income : CHART_COLORS.single.expense,
      icon: lastMonthSavings > 0 ? 'savings' : 'warning'
    });
  }

  // Budget Insights
  if (data.budgetProgress) {
    const { current, limit } = data.budgetProgress;
    const percentage = (current / limit) * 100;
    
    insights.push({
      type: 'budget',
      title: 'Budget Status',
      description: `You've used ${percentage.toFixed(1)}% of your monthly budget.`,
      color: percentage > 80 ? CHART_COLORS.single.expense : 
             percentage > 50 ? CHART_COLORS.single.neutral : 
             CHART_COLORS.single.income,
      icon: 'account-balance-wallet'
    });
  }

  return insights;
};

export const predictFutureSpending = (transactions, months = 3) => {
  // Group transactions by month
  const monthlyTotals = transactions.reduce((acc, transaction) => {
    const month = new Date(transaction.date).getMonth();
    acc[month] = (acc[month] || 0) + transaction.amount;
    return acc;
  }, {});

  // Calculate average monthly change
  let totalChange = 0;
  let changeCount = 0;
  Object.keys(monthlyTotals).sort().forEach((month, index, months) => {
    if (index > 0) {
      const change = monthlyTotals[month] - monthlyTotals[months[index - 1]];
      totalChange += change;
      changeCount++;
    }
  });

  const avgChange = changeCount > 0 ? totalChange / changeCount : 0;
  const lastMonth = Math.max(...Object.keys(monthlyTotals).map(Number));
  const lastAmount = monthlyTotals[lastMonth];

  // Generate predictions
  return Array.from({ length: months }, (_, i) => ({
    month: new Date(new Date().setMonth(lastMonth + i + 1)).toLocaleString('default', { month: 'short' }),
    amount: lastAmount + (avgChange * (i + 1)),
    confidence: Math.max(0, 100 - (i * 15)) // Confidence decreases with time
  }));
}; 