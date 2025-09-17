import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';
import { THEME_COLORS, SPACING, TYPOGRAPHY, colors } from '../../global/styles';
import * as Haptics from 'expo-haptics';
import { AIService } from '../../services/AIService';
import { Fonts } from "../../../assets/fonts/fonts";
import { useCurrency } from '../../global/CurrencyContext';

const { width } = Dimensions.get('window');

// Add premium icon colors
const PREMIUM_COLORS = {
  health: ['#00C6FB', '#005BEA'],
  income: ['#43E97B', '#38F9D7'],
  expense: ['#FA709A', '#FEE140'],
  savings: ['#4FACFE', '#00F2FE'],
  investment: ['#F6D365', '#FDA085'],
  warning: ['#FF9A9E', '#FAD0C4'],
  tip: ['#A18CD1', '#FBC2EB'],
  analytics: ['#764BA2', '#667EEA']
};

const GradientCard = ({ children, colors: gradientColors, style }) => (
  <LinearGradient
    colors={gradientColors || THEME_COLORS.gradient.glass}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[styles.gradientCard, style]}
  >
    {children}
  </LinearGradient>
);

const InsightCard = ({ title, icon, children, gradient, index = 0, iconGradient }) => {
  return (
    <GradientCard
      colors={gradient || THEME_COLORS.gradient.glass}
      style={[styles.card, { marginBottom: width * 0.03 }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <LinearGradient
            colors={iconGradient || THEME_COLORS.gradient.glass}
            style={styles.iconContainer}
          >
            <MaterialIcons name={icon} size={24} color={colors.white} />
          </LinearGradient>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
          </View>
        </View>
      </View>
      {children}
    </GradientCard>
  );
};

const MonthlySummaryCard = ({ summary = {} }) => {
  const { currency } = useCurrency();
  const {
    totalIncome = 0,
    totalExpenses = 0,
    netSavings = 0,
    savingsRate = 0,
    topCategories = []
  } = summary;

  return (
    <InsightCard
      title="Monthly Summary"
      icon="assessment"
      gradient={THEME_COLORS.gradient.glass}
      index={0}
    >
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={styles.summaryValue}>{totalIncome.toFixed(2)} {currency}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={styles.summaryValue}>{totalExpenses.toFixed(2)} {currency}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net Savings</Text>
            <Text style={[
              styles.summaryValue,
              { color: netSavings >= 0 ? THEME_COLORS.success.main : THEME_COLORS.danger.main }
            ]}>
              {Math.abs(netSavings).toFixed(2)} {currency}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Savings Rate</Text>
            <Text style={styles.summaryValue}>{savingsRate.toFixed(1)}%</Text>
          </View>
        </View>
        <View style={styles.topCategoriesContainer}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          {topCategories.map((category, index) => (
            <View key={index} style={styles.categoryRow}>
              <LinearGradient
                colors={THEME_COLORS.gradient.glass}
                style={styles.categoryIcon}
              >
                <MaterialIcons name="category" size={20} color={colors.white} />
              </LinearGradient>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.category || 'Unknown'}</Text>
                <Text style={styles.categoryAmount}>{(category.amount || 0).toFixed(2)} {currency}</Text>
              </View>
              <Text style={styles.categoryPercentage}>{(category.percentage || 0).toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </View>
    </InsightCard>
  );
};

const ForecastCard = ({ forecast = {} }) => {
  const { currency } = useCurrency();
  const {
    predictedAmount = 0,
    trend = 'stable',
    avgGrowthRate = 0,
    confidence = 'low',
    categoryPredictions = {}
  } = forecast;

  return (
    <InsightCard
      title="Next Month Forecast"
      icon="trending-up"
      gradient={THEME_COLORS.gradient.glass}
      index={1}
    >
      <View style={styles.forecastContainer}>
        <View style={styles.forecastHeader}>
          <Text style={styles.predictedAmount}>
            {predictedAmount.toFixed(2)} {currency}
          </Text>
          <View style={styles.trendContainer}>
            <MaterialIcons
              name={trend === 'increasing' ? 'arrow-upward' : trend === 'decreasing' ? 'arrow-downward' : 'remove'}
              size={24}
              color={trend === 'increasing' ? THEME_COLORS.danger.main : trend === 'decreasing' ? THEME_COLORS.success.main : colors.silver}
            />
            <Text style={[styles.trendText, {
              color: trend === 'increasing' ? THEME_COLORS.danger.main : trend === 'decreasing' ? THEME_COLORS.success.main : colors.silver
            }]}>
              {avgGrowthRate.toFixed(1)}%
            </Text>
          </View>
        </View>
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Forecast Confidence:</Text>
          <View style={styles.confidenceDots}>
            <View style={[styles.confidenceDot, { backgroundColor: THEME_COLORS.success.main }]} />
            <View style={[styles.confidenceDot, { 
              backgroundColor: confidence === 'medium' || confidence === 'high' ? THEME_COLORS.success.main : colors.darkGray 
            }]} />
            <View style={[styles.confidenceDot, { 
              backgroundColor: confidence === 'high' ? THEME_COLORS.success.main : colors.darkGray 
            }]} />
          </View>
        </View>
        <View style={styles.categoryPredictions}>
          <Text style={styles.sectionTitle}>Category Trends</Text>
          {Object.entries(categoryPredictions).map(([category, prediction], index) => (
            <View key={index} style={styles.predictionRow}>
              <LinearGradient
                colors={THEME_COLORS.gradient.glass}
                style={styles.categoryIcon}
              >
                <MaterialIcons name="category" size={20} color={colors.white} />
              </LinearGradient>
              <View style={styles.predictionInfo}>
                <Text style={styles.categoryName}>{category}</Text>
                <Text style={styles.predictionTrend}>
                  {prediction.trend === 'increasing' ? '↗️ Increasing' : prediction.trend === 'decreasing' ? '↘️ Decreasing' : '→ Stable'}
                </Text>
              </View>
              <Text style={[styles.predictionChange, {
                color: prediction.trend === 'increasing' ? THEME_COLORS.danger.main : prediction.trend === 'decreasing' ? THEME_COLORS.success.main : colors.silver
              }]}>
                {prediction.predictedChange > 0 ? '+' : ''}{prediction.predictedChange.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </InsightCard>
  );
};

const AnomaliesCard = ({ anomalies = [] }) => {
  const { currency } = useCurrency();
  
  return (
    <InsightCard
      title="Unusual Activities"
      icon="warning"
      gradient={THEME_COLORS.gradient.glass}
      index={2}
    >
      <View style={styles.anomaliesContainer}>
        {anomalies.map((anomaly, index) => (
          <View key={index} style={styles.anomalyItem}>
            <MaterialIcons
              name={anomaly.type === 'expense' ? 'arrow-upward' : 'arrow-downward'}
              size={24}
              color={anomaly.type === 'expense' ? THEME_COLORS.danger.main : THEME_COLORS.success.main}
            />
            <View style={styles.anomalyInfo}>
              <Text style={styles.anomalyTitle}>{anomaly.title}</Text>
              <Text style={styles.anomalyDescription}>{anomaly.description}</Text>
              <Text style={[
                styles.anomalyAmount,
                { color: anomaly.type === 'expense' ? THEME_COLORS.danger.main : THEME_COLORS.success.main }
              ]}>
                {anomaly.amount.toFixed(2)} {currency}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </InsightCard>
  );
};

const Insights = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState({
    monthlySummary: {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      savingsRate: 0,
      topCategories: []
    },
    forecast: {
      predictedAmount: 0,
      trend: 'stable',
      avgGrowthRate: 0,
      confidence: 'low',
      categoryPredictions: {}
    },
    anomalies: [],
    healthScore: {
      score: 0,
      status: 'Calculating...',
      savingsRate: 0,
      expenseToIncomeRatio: 0
    },
    dailyTip: 'Loading your personalized tip...',
    spendingPatterns: [],
    incomePatterns: [],
    savingsOpportunities: [],
    investmentSuggestions: []
  });
  const [error, setError] = useState(null);
  const { currency } = useCurrency();

  const analyzeData = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setError('Please sign in to view insights');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch transactions
      const transactionsRef = collection(db, "transactions");
      const transactionQuery = query(transactionsRef, where("userId", "==", userId));
      const transactionSnapshot = await getDocs(transactionQuery);
      const transactions = transactionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch incomes
      const incomesRef = collection(db, "income");
      const incomeQuery = query(incomesRef, where("userId", "==", userId));
      const incomeSnapshot = await getDocs(incomeQuery);
      const incomes = incomeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const analysisResult = await AIService.analyzeFinancialData({
        transactions,
        incomes,
        userId,
        currency // Pass currency to analysis service
      });

      // Ensure all required properties exist with default values
      setInsights({
        monthlySummary: {
          totalIncome: 0,
          totalExpenses: 0,
          netSavings: 0,
          savingsRate: 0,
          topCategories: [],
          ...analysisResult.monthlySummary
        },
        forecast: {
          predictedAmount: 0,
          trend: 'stable',
          avgGrowthRate: 0,
          confidence: 'low',
          categoryPredictions: {},
          ...analysisResult.forecast
        },
        anomalies: analysisResult.anomalies || [],
        healthScore: {
          score: 0,
          status: 'Calculating...',
          savingsRate: 0,
          expenseToIncomeRatio: 0,
          ...analysisResult.healthScore
        },
        dailyTip: analysisResult.dailyTip || 'No tip available',
        spendingPatterns: analysisResult.spendingPatterns || [],
        incomePatterns: analysisResult.incomePatterns || [],
        savingsOpportunities: analysisResult.savingsOpportunities || [],
        investmentSuggestions: analysisResult.investmentSuggestions || []
      });

      setError(null);
    } catch (error) {
      console.error('Error analyzing data:', error);
      setError('Failed to analyze your financial data. Please try again.');
      // Set default values on error
      setInsights({
        monthlySummary: {
          totalIncome: 0,
          totalExpenses: 0,
          netSavings: 0,
          savingsRate: 0,
          topCategories: []
        },
        forecast: {
          predictedAmount: 0,
          trend: 'stable',
          avgGrowthRate: 0,
          confidence: 'low',
          categoryPredictions: {}
        },
        anomalies: [],
        healthScore: {
          score: 0,
          status: 'Error calculating score',
          savingsRate: 0,
          expenseToIncomeRatio: 0
        },
        dailyTip: 'Unable to generate tip',
        spendingPatterns: [],
        incomePatterns: [],
        savingsOpportunities: [],
        investmentSuggestions: []
      });
    } finally {
      setLoading(false);
    }
  }, [currency]); // Add currency to dependencies

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await analyzeData();
    setRefreshing(false);
  }, [analyzeData]);

  useEffect(() => {
    analyzeData();
  }, [analyzeData]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={THEME_COLORS.secondary.main} />
        <Text style={styles.loadingText}>Analyzing your financial data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialIcons name="error-outline" size={64} color={THEME_COLORS.danger.main} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            analyzeData();
          }}
        >
          <LinearGradient
            colors={THEME_COLORS.gradient.primary}
            style={styles.retryButtonGradient}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      
      {/* Add Premium Header */}
      <GradientCard
        colors={THEME_COLORS.gradient.primary}
        style={styles.headerCard}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <LinearGradient
              colors={PREMIUM_COLORS.analytics}
              style={styles.headerIcon}
            >
              <MaterialIcons name="insights" size={32} color={colors.white} />
            </LinearGradient>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Financial Insights</Text>
            <Text style={styles.headerSubtitle}>Your personalized analysis</Text>
          </View>
        </View>
      </GradientCard>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Insights</Text>
          
          {insights && (
            <>
              <MonthlySummaryCard summary={insights.monthlySummary} />
              {insights.forecast && <ForecastCard forecast={insights.forecast} />}
              <AnomaliesCard anomalies={insights.anomalies} />

              <InsightCard
                title="Financial Health"
                icon="health-and-safety"
                gradient={THEME_COLORS.gradient.glass}
                iconGradient={PREMIUM_COLORS.health}
              >
                <View style={styles.healthScoreContainer}>
                  <Text style={styles.scoreText}>{insights.healthScore.score}</Text>
                  <Text style={styles.scoreStatus}>{insights.healthScore.status}</Text>
                  <View style={styles.scoreBar}>
                    <LinearGradient
                      colors={THEME_COLORS.gradient.success}
                      style={[styles.scoreProgress, { width: `${insights.healthScore.score}%` }]}
                    />
                  </View>
                  <View style={styles.scoreDetails}>
                    <View style={styles.scoreDetailItem}>
                      <Text style={styles.scoreDetailLabel}>Savings Rate</Text>
                      <Text style={styles.scoreDetailValue}>
                        {insights.healthScore.savingsRate.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.scoreDetailItem}>
                      <Text style={styles.scoreDetailLabel}>Expense Ratio</Text>
                      <Text style={styles.scoreDetailValue}>
                        {insights.healthScore.expenseToIncomeRatio.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </InsightCard>

              <InsightCard
                title="Daily Tip"
                icon="lightbulb"
                gradient={THEME_COLORS.gradient.glass}
                iconGradient={PREMIUM_COLORS.tip}
              >
                <Text style={styles.tipText}>{insights.dailyTip}</Text>
              </InsightCard>

              <InsightCard
                title="Spending Patterns"
                icon="trending-down"
                gradient={THEME_COLORS.gradient.glass}
                iconGradient={PREMIUM_COLORS.expense}
              >
                {insights.spendingPatterns.map((pattern, idx) => (
                  <View key={idx} style={styles.patternItem}>
                    <LinearGradient
                      colors={THEME_COLORS.gradient.glass}
                      style={styles.patternIcon}
                    >
                      <MaterialIcons name={pattern.icon} size={24} color={colors.silver} />
                    </LinearGradient>
                    <View style={styles.patternContent}>
                      <Text style={styles.patternTitle}>{pattern.title}</Text>
                      <Text style={styles.patternDescription}>{pattern.description}</Text>
                    </View>
                  </View>
                ))}
              </InsightCard>

              <InsightCard
                title="Income Patterns"
                icon="trending-up"
                gradient={THEME_COLORS.gradient.glass}
                iconGradient={PREMIUM_COLORS.income}
              >
                {insights.incomePatterns.map((pattern, idx) => (
                  <View key={idx} style={styles.patternItem}>
                    <LinearGradient
                      colors={THEME_COLORS.gradient.glass}
                      style={styles.patternIcon}
                    >
                      <MaterialIcons name={pattern.icon} size={24} color={colors.silver} />
                    </LinearGradient>
                    <View style={styles.patternContent}>
                      <Text style={styles.patternTitle}>{pattern.title}</Text>
                      <Text style={styles.patternDescription}>{pattern.description}</Text>
                    </View>
                  </View>
                ))}
              </InsightCard>

              <InsightCard
                title="Savings Opportunities"
                icon="savings"
                gradient={THEME_COLORS.gradient.glass}
                iconGradient={PREMIUM_COLORS.savings}
              >
                {insights.savingsOpportunities.map((opportunity, idx) => (
                  <View key={idx} style={styles.opportunityItem}>
                    <LinearGradient
                      colors={THEME_COLORS.gradient.glass}
                      style={styles.opportunityIcon}
                    >
                      <MaterialIcons name={opportunity.icon} size={24} color={colors.silver} />
                    </LinearGradient>
                    <Text style={styles.opportunityText}>{opportunity.description}</Text>
                  </View>
                ))}
              </InsightCard>

              <InsightCard
                title="Investment Ideas"
                icon="account-balance"
                gradient={THEME_COLORS.gradient.glass}
                iconGradient={PREMIUM_COLORS.investment}
              >
                {insights.investmentSuggestions.map((suggestion, idx) => (
                  <View key={idx} style={styles.suggestionItem}>
                    <LinearGradient
                      colors={THEME_COLORS.gradient.glass}
                      style={styles.suggestionIcon}
                    >
                      <MaterialIcons name={suggestion.icon} size={24} color={colors.silver} />
                    </LinearGradient>
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                      <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                    </View>
                  </View>
                ))}
              </InsightCard>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.richBlack,
    paddingBottom: width * 0.20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: width * 0.05,
  },
  section: {
    paddingTop: Platform.OS === 'ios' ? width * 0.1 : width * 0.05,
  },
  sectionTitle: {
    fontSize: Math.min(width * 0.045, 20),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginBottom: width * 0.03,
  },
  card: {
    borderRadius: width * 0.04,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: width * 0.04,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.03,
  },
  iconContainer: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Math.min(width * 0.04, 18),
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  loadingText: {
    marginTop: width * 0.04,
    fontSize: Math.min(width * 0.035, 16),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  errorText: {
    marginTop: width * 0.04,
    fontSize: Math.min(width * 0.035, 16),
    color: THEME_COLORS.danger.main,
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
    marginBottom: width * 0.04,
  },
  retryButton: {
    overflow: 'hidden',
    borderRadius: width * 0.04,
  },
  retryButtonGradient: {
    paddingHorizontal: width * 0.08,
    paddingVertical: width * 0.03,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: Math.min(width * 0.04, 18),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  healthScoreContainer: {
    padding: width * 0.04,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: Math.min(width * 0.12, 48),
    color: colors.white,
    fontFamily: Fonts.POPPINS_BOLD,
  },
  scoreStatus: {
    fontSize: Math.min(width * 0.04, 18),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginVertical: width * 0.02,
  },
  scoreBar: {
    width: '100%',
    height: width * 0.02,
    backgroundColor: colors.darkGray,
    borderRadius: width * 0.01,
    marginVertical: width * 0.04,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    borderRadius: width * 0.01,
  },
  scoreDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: width * 0.02,
  },
  scoreDetailItem: {
    alignItems: 'center',
  },
  scoreDetailLabel: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  scoreDetailValue: {
    fontSize: Math.min(width * 0.04, 18),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  tipText: {
    fontSize: Math.min(width * 0.035, 16),
    color: colors.white,
    fontFamily: Fonts.POPPINS_REGULAR,
    lineHeight: width * 0.06,
    padding: width * 0.04,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.04,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  patternIcon: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.03,
  },
  patternContent: {
    flex: 1,
  },
  patternTitle: {
    fontSize: Math.min(width * 0.035, 16),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  patternDescription: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  opportunityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.04,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  opportunityIcon: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.03,
  },
  opportunityText: {
    flex: 1,
    fontSize: Math.min(width * 0.035, 16),
    color: colors.white,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.04,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  suggestionIcon: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.03,
  },
  suggestionContent: {
    flex: 1,
    
  },
  suggestionTitle: {
    fontSize: Math.min(width * 0.035, 16),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  suggestionDescription: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  gradientCard: {
    borderRadius: width * 0.04,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  insightCard: {
    padding: width * 0.04,
  },
  insightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: width * 0.04,
  },
  insightIcon: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.03,
  },
  insightCardTitle: {
    fontSize: Math.min(width * 0.045, 20),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  summaryContainer: {
    padding: width * 0.04,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: width * 0.04,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginBottom: width * 0.01,
  },
  summaryValue: {
    fontSize: Math.min(width * 0.045, 20),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  topCategoriesContainer: {
    marginTop: width * 0.04,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: width * 0.03,
  },
  categoryIcon: {
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: width * 0.03,
  },
  categoryName: {
    fontSize: Math.min(width * 0.035, 16),
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  categoryAmount: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  categoryPercentage: {
    fontSize: Math.min(width * 0.035, 16),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  forecastContainer: {
    padding: width * 0.04,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: width * 0.04,
  },
  predictedAmount: {
    fontSize: Math.min(width * 0.06, 28),
    color: colors.white,
    fontFamily: Fonts.POPPINS_BOLD,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: Math.min(width * 0.035, 16),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginLeft: width * 0.01,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: width * 0.04,
  },
  confidenceLabel: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginRight: width * 0.02,
  },
  confidenceDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceDot: {
    width: width * 0.02,
    height: width * 0.02,
    borderRadius: width * 0.01,
    marginHorizontal: width * 0.005,
  },
  categoryPredictions: {
    marginTop: width * 0.02,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: width * 0.03,
  },
  predictionInfo: {
    flex: 1,
    marginLeft: width * 0.03,
  },
  predictionTrend: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  predictionChange: {
    fontSize: Math.min(width * 0.035, 16),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  anomaliesContainer: {
    padding: width * 0.04,
  },
  noAnomaliesText: {
    fontSize: Math.min(width * 0.035, 16),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  anomalyItem: {
    marginBottom: width * 0.04,
  },
  anomalyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: width * 0.02,
  },
  severityIndicator: {
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.03,
  },
  anomalyTitle: {
    fontSize: Math.min(width * 0.035, 16),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  anomalyReason: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginBottom: width * 0.02,
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: `${colors.darkGray}50`,
    padding: width * 0.02,
    borderRadius: width * 0.01,
  },
  transactionCategory: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  transactionDate: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  recentTransactions: {
    backgroundColor: `${colors.darkGray}50`,
    padding: width * 0.02,
    borderRadius: width * 0.01,
  },
  recentTransactionsTitle: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginBottom: width * 0.01,
  },
  recentTransaction: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.white,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginBottom: width * 0.01,
  },
  // Add new header styles
  headerCard: {
    borderBottomLeftRadius: width * 0.08,
    borderBottomRightRadius: width * 0.08,
    padding: width * 0.05,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? width * 0.1 : width * 0.05,
  },
  headerIconContainer: {
    marginRight: width * 0.04,
  },
  headerIcon: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Math.min(width * 0.06, 24),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  headerSubtitle: {
    fontSize: Math.min(width * 0.035, 14),
    color: colors.white,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginTop: 2,
  },
  anomalyInfo: {
    flex: 1,
    marginLeft: width * 0.03,
  },
  anomalyDescription: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginBottom: width * 0.01,
  },
  anomalyAmount: {
    fontSize: Math.min(width * 0.04, 18),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
});

export default Insights; 