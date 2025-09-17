import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLORS, SPACING, commonStyles, colors } from '../../../global/styles';
import { Fonts } from '../../../../assets/fonts/fonts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { VictoryPie, VictoryChart, VictoryLine, VictoryAxis, VictoryTheme, VictoryLabel, VictoryTooltip } from 'victory-native';

const { width } = Dimensions.get('window');

const Analytics = ({ 
  incomes = [], 
  transactions = [], 
  incomeCategories = {}, 
  expenseCategories = {}, 
  insights = [],
  currency = '$'
}) => {
  // Calculate category totals with error handling
  const categoryTotals = useMemo(() => {
    const totals = {};
    transactions.forEach(transaction => {
      if (!transaction?.category) return;
      if (!totals[transaction.category]) {
        totals[transaction.category] = {
          total: 0,
          color: transaction.color || expenseCategories[transaction.category] || THEME_COLORS.danger.main,
          count: 0
        };
      }
      totals[transaction.category].total += transaction.amount || 0;
      totals[transaction.category].count += 1;
    });
    return totals;
  }, [transactions, expenseCategories]);

  // Prepare data for pie chart with minimum threshold
  const pieChartData = useMemo(() => {
    const totalSpending = Object.values(categoryTotals).reduce((sum, data) => sum + data.total, 0);
    const threshold = totalSpending * 0.05; // 5% threshold
    
    let otherTotal = 0;
    const significantCategories = [];
    
    Object.entries(categoryTotals).forEach(([category, data]) => {
      if (data.total >= threshold) {
        significantCategories.push({
          x: category,
          y: data.total,
          color: data.color,
          label: `${category}\n${currency}${data.total.toFixed(0)}`
        });
      } else {
        otherTotal += data.total;
      }
    });
    
    if (otherTotal > 0) {
      significantCategories.push({
        x: 'Other',
        y: otherTotal,
        color: THEME_COLORS.neutral.main,
        label: `Other\n${currency}${otherTotal.toFixed(0)}`
      });
    }
    
    return significantCategories;
  }, [categoryTotals, currency]);

  // Calculate monthly trends with error handling
  const monthlyTrends = useMemo(() => {
    const trends = {};
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Initialize months
    for (let d = new Date(sixMonthsAgo); d <= now; d.setMonth(d.getMonth() + 1)) {
      const monthKey = d.toLocaleString('default', { month: 'short' });
      trends[monthKey] = { income: 0, expenses: 0 };
    }

    // Aggregate incomes safely
    incomes.forEach(income => {
      try {
        const date = new Date(income.date);
        if (date >= sixMonthsAgo && !isNaN(date.getTime())) {
          const monthKey = date.toLocaleString('default', { month: 'short' });
          if (trends[monthKey]) {
            trends[monthKey].income += income.amount || 0;
          }
        }
      } catch (error) {
        console.error('Error processing income:', error);
      }
    });

    // Aggregate expenses safely
    transactions.forEach(transaction => {
      try {
        const date = new Date(transaction.date);
        if (date >= sixMonthsAgo && !isNaN(date.getTime())) {
          const monthKey = date.toLocaleString('default', { month: 'short' });
          if (trends[monthKey]) {
            trends[monthKey].expenses += transaction.amount || 0;
          }
        }
      } catch (error) {
        console.error('Error processing transaction:', error);
      }
    });

    return trends;
  }, [incomes, transactions]);

  // Prepare data for line chart with improved formatting
  const lineChartData = useMemo(() => {
    const months = Object.keys(monthlyTrends);
    return {
      income: months.map((month, index) => ({
        x: index + 1,
        y: monthlyTrends[month].income,
        month,
        label: `${currency}${monthlyTrends[month].income.toFixed(0)}`
      })),
      expenses: months.map((month, index) => ({
        x: index + 1,
        y: monthlyTrends[month].expenses,
        month,
        label: `${currency}${monthlyTrends[month].expenses.toFixed(0)}`
      }))
    };
  }, [monthlyTrends, currency]);

  // Group insights by type for better organization
  const groupedInsights = useMemo(() => {
    const groups = {
      positive: [],
      negative: [],
      neutral: []
    };
    
    insights.forEach(insight => {
      if (groups[insight.type]) {
        groups[insight.type].push(insight);
      }
    });
    
    return groups;
  }, [insights]);

  return (
    <ScrollView 
      horizontal={false} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Spending by Category */}
      <LinearGradient
        colors={THEME_COLORS.gradient.glass}
        style={[styles.card, commonStyles.glassMorphism]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Spending by Category</Text>
          <MaterialIcons name="pie-chart" size={24} color={THEME_COLORS.secondary.main} />
        </View>
        {pieChartData.length > 0 ? (
          <View style={styles.chartContainer}>
            <VictoryPie
              data={pieChartData}
              width={width * 0.8}
              height={width * 0.8}
              colorScale={pieChartData.map(d => d.color)}
              innerRadius={width * 0.15}
              labelRadius={({ innerRadius }) => innerRadius + width * 0.15}
              style={{
                labels: {
                  fill: colors.white,
                  fontSize: 12,
                  fontFamily: Fonts.POPPINS_MEDIUM
                }
              }}
              labelComponent={
                <VictoryLabel
                  style={{
                    fill: colors.white,
                    fontSize: 12,
                    fontFamily: Fonts.POPPINS_MEDIUM
                  }}
                />
              }
              labels={({ datum }) => datum.label}
              animate={{ duration: 1000 }}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="info-outline" size={40} color={colors.silver} />
            <Text style={styles.emptyStateText}>No spending data available</Text>
          </View>
        )}
      </LinearGradient>

      {/* Monthly Trends */}
      <LinearGradient
        colors={THEME_COLORS.gradient.glass}
        style={[styles.card, commonStyles.glassMorphism]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Monthly Trends</Text>
          <MaterialIcons name="trending-up" size={24} color={THEME_COLORS.secondary.main} />
        </View>
        <View style={styles.chartContainer}>
          <VictoryChart
            width={width * 0.9}
            height={width * 0.6}
            theme={VictoryTheme.material}
            domainPadding={20}
            animate={{ duration: 1000 }}
          >
            <VictoryAxis
              tickFormat={(t) => lineChartData.income[t-1]?.month || ''}
              style={{
                axis: { stroke: colors.silver },
                tickLabels: { fill: colors.silver, fontSize: 10, fontFamily: Fonts.POPPINS_MEDIUM }
              }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(t) => `${currency}${t}`}
              style={{
                axis: { stroke: colors.silver },
                tickLabels: { fill: colors.silver, fontSize: 10, fontFamily: Fonts.POPPINS_MEDIUM }
              }}
            />
            <VictoryLine
              data={lineChartData.income}
              style={{
                data: { stroke: THEME_COLORS.success.main, strokeWidth: 3 }
              }}
              labelComponent={<VictoryTooltip />}
            />
            <VictoryLine
              data={lineChartData.expenses}
              style={{
                data: { stroke: THEME_COLORS.danger.main, strokeWidth: 3 }
              }}
              labelComponent={<VictoryTooltip />}
            />
          </VictoryChart>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: THEME_COLORS.success.main }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: THEME_COLORS.danger.main }]} />
            <Text style={styles.legendText}>Expenses</Text>
          </View>
        </View>
      </LinearGradient>

      {/* AI Insights */}
      {Object.values(groupedInsights).some(group => group.length > 0) && (
        <LinearGradient
          colors={THEME_COLORS.gradient.glass}
          style={[styles.card, commonStyles.glassMorphism]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>AI Insights</Text>
            <MaterialIcons name="psychology" size={24} color={THEME_COLORS.secondary.main} />
          </View>
          {Object.entries(groupedInsights).map(([type, typeInsights]) => (
            typeInsights.length > 0 && (
              <View key={type}>
                {typeInsights.map((insight, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.insightContainer,
                      { backgroundColor: `${THEME_COLORS[type === 'positive' ? 'success' : type === 'negative' ? 'danger' : 'neutral'].main}15` }
                    ]}
                  >
                    <MaterialIcons
                      name={
                        type === 'positive' ? 'trending-up' : 
                        type === 'negative' ? 'trending-down' : 
                        'info-outline'
                      }
                      size={24}
                      color={THEME_COLORS[type === 'positive' ? 'success' : type === 'negative' ? 'danger' : 'neutral'].main}
                    />
                    <Text style={styles.insightText}>{insight.message}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          ))}
        </LinearGradient>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  card: {
    padding: SPACING.lg,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 3,
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: width * 0.045,
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: colors.silver,
    fontSize: width * 0.035,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  insightText: {
    flex: 1,
    color: colors.white,
    fontSize: width * 0.035,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  emptyStateText: {
    color: colors.silver,
    fontSize: width * 0.04,
    fontFamily: Fonts.POPPINS_MEDIUM,
    textAlign: 'center',
  },
});

export default React.memo(Analytics); 