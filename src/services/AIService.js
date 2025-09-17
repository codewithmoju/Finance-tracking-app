import { THEME_COLORS } from '../global/styles';

class AIService {
  static async analyzeFinancialData({ transactions = [], incomes = [], categories = [] }) {
    try {
      // Calculate basic metrics
      const totalIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
      const totalExpense = transactions.reduce((sum, trans) => sum + (trans.amount || 0), 0);
      const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;

      // Get category spending
      const categorySpending = {};
      transactions.forEach(trans => {
        if (!categorySpending[trans.category]) {
          categorySpending[trans.category] = 0;
        }
        categorySpending[trans.category] += trans.amount || 0;
      });

      // Sort categories by spending
      const sortedCategories = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a);

      // Generate insights array
      const insights = [];

      // Savings Rate Insight
      if (savingsRate > 20) {
        insights.push({
          type: 'positive',
          message: `Great job! Your savings rate is ${savingsRate.toFixed(1)}% which is above the recommended 20%.`
        });
      } else if (savingsRate > 0) {
        insights.push({
          type: 'neutral',
          message: `Your savings rate is ${savingsRate.toFixed(1)}%. Try to aim for 20% or more.`
        });
      } else {
        insights.push({
          type: 'negative',
          message: `Warning: Your expenses exceed your income. Consider reviewing your budget.`
        });
      }

      // Top Spending Category Insight
      if (sortedCategories.length > 0) {
        const [topCategory, topAmount] = sortedCategories[0];
        const percentageOfTotal = (topAmount / totalExpense) * 100;
        insights.push({
          type: percentageOfTotal > 40 ? 'negative' : 'neutral',
          message: `Your highest spending category is ${topCategory} at ${percentageOfTotal.toFixed(1)}% of total expenses.`
        });
      }

      // Monthly Trend Insight
      const currentMonth = new Date().getMonth();
      const currentMonthTransactions = transactions.filter(t => 
        new Date(t.date).getMonth() === currentMonth
      );
      const currentMonthTotal = currentMonthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const lastMonth = (currentMonth - 1 + 12) % 12;
      const lastMonthTransactions = transactions.filter(t => 
        new Date(t.date).getMonth() === lastMonth
      );
      const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      if (lastMonthTotal > 0) {
        const monthOverMonthChange = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        if (Math.abs(monthOverMonthChange) > 10) {
          insights.push({
            type: monthOverMonthChange < 0 ? 'positive' : 'negative',
            message: `Your spending is ${Math.abs(monthOverMonthChange).toFixed(1)}% ${monthOverMonthChange < 0 ? 'lower' : 'higher'} than last month.`
          });
        }
      }

      // Unusual Transactions Insight
      const averageTransaction = totalExpense / transactions.length;
      const largeTransactions = transactions.filter(t => t.amount > averageTransaction * 2);
      
      if (largeTransactions.length > 0) {
        insights.push({
          type: 'neutral',
          message: `You have ${largeTransactions.length} unusually large transaction${largeTransactions.length > 1 ? 's' : ''} this period.`
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [
        {
          type: 'neutral',
          message: 'Unable to generate detailed insights at this time. Please try again later.'
        }
      ];
    }
  }
}

export { AIService }; 