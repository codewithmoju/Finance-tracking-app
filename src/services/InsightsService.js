import { CHART_COLORS } from '../global/PremiumFeatures';

export const InsightsService = {
  generateSmartInsights(data) {
    try {
      const insights = [];
      
      // Spending Pattern Insights
      if (data.monthlyTrends) {
        const expenses = data.monthlyTrends.expenses.filter(e => !isNaN(e) && e > 0);
        const lastMonth = expenses[expenses.length - 1] || 0;
        const prevMonth = expenses[expenses.length - 2] || lastMonth;
        const growth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
        
        insights.push({
          type: 'spending',
          title: 'Spending Trend',
          description: `Your spending has ${growth > 0 ? 'increased' : 'decreased'} by ${Math.abs(growth).toFixed(1)}% compared to last month.`,
          color: growth > 0 ? CHART_COLORS.single.expense : CHART_COLORS.single.income,
          icon: growth > 0 ? 'trending-up' : 'trending-down',
          impact: growth > 20 ? 'high' : growth > 10 ? 'medium' : 'low'
        });
      }

      // Budget Progress Insights
      if (data.budgetProgress) {
        const { current = 0, limit = 5000, percentage = 0 } = data.budgetProgress;
        const validPercentage = Math.min(Math.max(0, percentage), 100);
        const remaining = Math.max(0, limit - current);
        
        insights.push({
          type: 'budget',
          title: 'Budget Status',
          description: validPercentage > 80
            ? `Warning: You've used ${validPercentage.toFixed(1)}% of your budget.`
            : `You have ${remaining.toFixed(2)} remaining in your budget.`,
          color: validPercentage > 80 ? CHART_COLORS.single.expense :
                 validPercentage > 50 ? CHART_COLORS.single.neutral :
                 CHART_COLORS.single.income,
          icon: 'account-balance-wallet',
          impact: validPercentage > 80 ? 'high' : validPercentage > 50 ? 'medium' : 'low'
        });
      }

      // Savings Insights
      if (data.monthlyTrends) {
        const incomes = data.monthlyTrends.income.filter(i => !isNaN(i) && i >= 0);
        const expenses = data.monthlyTrends.expenses.filter(e => !isNaN(e) && e >= 0);
        
        const lastMonthIncome = incomes[incomes.length - 1] || 0;
        const lastMonthExpense = expenses[expenses.length - 1] || 0;
        const savings = lastMonthIncome - lastMonthExpense;
        const savingsRate = lastMonthIncome > 0 ? (savings / lastMonthIncome) * 100 : 0;
        
        insights.push({
          type: 'savings',
          title: 'Monthly Savings',
          description: savings > 0
            ? `Great job! You saved ${Math.abs(savingsRate).toFixed(1)}% of your income.`
            : `Alert: Your expenses exceeded your income by ${Math.abs(savingsRate).toFixed(1)}%.`,
          color: savings > 0 ? CHART_COLORS.single.income : CHART_COLORS.single.expense,
          icon: savings > 0 ? 'savings' : 'warning',
          impact: Math.abs(savingsRate) > 20 ? 'high' : Math.abs(savingsRate) > 10 ? 'medium' : 'low'
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [{
        type: 'spending',
        title: 'Data Analysis',
        description: 'Analyzing your financial data...',
        color: CHART_COLORS.single.neutral,
        icon: 'analytics',
        impact: 'low'
      }];
    }
  },

  predictFutureSpending(transactions) {
    try {
      if (!transactions?.length) return [];

      // Group transactions by month
      const monthlyTotals = transactions.reduce((acc, transaction) => {
        const month = new Date(transaction.date).getMonth();
        acc[month] = (acc[month] || 0) + transaction.amount;
        return acc;
      }, {});

      // Calculate average monthly change
      const months = Object.keys(monthlyTotals).sort();
      let totalChange = 0;
      let changeCount = 0;

      for (let i = 1; i < months.length; i++) {
        const change = monthlyTotals[months[i]] - monthlyTotals[months[i - 1]];
        totalChange += change;
        changeCount++;
      }

      const avgChange = changeCount > 0 ? totalChange / changeCount : 0;
      const lastMonth = Math.max(...months);
      const lastAmount = monthlyTotals[lastMonth];

      // Generate predictions for next 3 months
      return Array.from({ length: 3 }, (_, i) => {
        const predictedAmount = lastAmount + (avgChange * (i + 1));
        const month = new Date();
        month.setMonth(lastMonth + i + 1);
        
        return {
          month: month.toLocaleString('default', { month: 'short' }),
          amount: Math.max(0, predictedAmount), // Ensure no negative predictions
          confidence: Math.max(0, 100 - (i * 15)) // Confidence decreases with time
        };
      });
    } catch (error) {
      console.error('Error predicting spending:', error);
      return [];
    }
  }
}; 