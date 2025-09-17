import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import { colors, THEME_COLORS, SPACING, TYPOGRAPHY } from "../../global/styles";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView as GestureHandlerScrollView } from "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { FadeInDown } from 'react-native-reanimated';
import TransactionModal from '../../Components/TransactionModal';

const { width, height } = Dimensions.get("window");

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

const SearchBar = ({ value, onChangeText, placeholder }) => (
  <View style={styles.searchBarContainer}>
    <LinearGradient
      colors={THEME_COLORS.gradient.glass}
      style={styles.searchBarGradient}
    >
      <MaterialIcons name="search" size={24} color={THEME_COLORS.text.secondary} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={THEME_COLORS.text.secondary}
        value={value}
        onChangeText={onChangeText}
      />
    </LinearGradient>
  </View>
);

const FilterChip = ({ label, selected, onPress }) => (
  <TouchableOpacity
    onPress={() => {
      Haptics.selectionAsync();
      onPress();
    }}
  >
    <LinearGradient
      colors={selected ? THEME_COLORS.gradient.primary : THEME_COLORS.gradient.glass}
      style={[styles.filterChip, selected && styles.selectedFilterChip]}
    >
      <Text style={[styles.filterChipText, { color: selected ? colors.white : colors.silver }]}>
        {label}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
);

// Category Icons mapping
const CATEGORY_ICONS = {
  food: "restaurant",
  groceries: "shopping-cart",
  transport: "directions-car",
  shopping: "shopping-bag",
  entertainment: "movie",
  utilities: "lightbulb",
  rent: "home",
  health: "local-hospital",
  education: "school",
  travel: "flight",
  bills: "receipt",
  other: "attach-money",
};

const TransactionCard = ({ item, onEdit, onDelete, onPress }) => {
  const iconName = CATEGORY_ICONS[item.category.toLowerCase()] || "attach-money";
  
  return (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <GradientCard
        colors={[
          `${item.categoryColor}15`,
          `${item.categoryColor}05`,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryContainer}>
            <LinearGradient
              colors={[item.categoryColor, `${item.categoryColor}80`]}
              style={styles.categoryIndicator}
            >
              <MaterialIcons name={iconName} size={16} color={THEME_COLORS.text.primary} />
            </LinearGradient>
            <Text style={[styles.categoryTitle, { color: item.categoryColor }]}>
              {item.category}
            </Text>
          </View>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>

        <Text style={[styles.amountText, { color: item.categoryColor }]}>
          {item.amount} {item.currency}
        </Text>
        
        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${item.categoryColor}30` }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onEdit();
            }}
          >
            <MaterialIcons name="edit" size={20} color={item.categoryColor} />
            <Text style={[styles.actionButtonText, { color: item.categoryColor }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${THEME_COLORS.danger.main}30` }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onDelete();
            }}
          >
            <MaterialIcons name="delete" size={20} color={THEME_COLORS.danger.main} />
            <Text style={[styles.actionButtonText, { color: THEME_COLORS.danger.main }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </GradientCard>
    </TouchableOpacity>
  );
};

const FloatingButton = ({ onPress, icon, label, loading }) => (
  <TouchableOpacity 
    style={styles.floatingButton}
    onPress={onPress}
    disabled={loading}
  >
    <LinearGradient
      colors={THEME_COLORS.gradient.primary}
      style={styles.gradientButton}
    >
      {loading ? (
        <ActivityIndicator color={THEME_COLORS.text.primary} />
      ) : (
        <>
          {icon}
        </>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

const Transactions = ({ navigation }) => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [aiInsights, setAiInsights] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [spendingTrends, setSpendingTrends] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fabOpen, setFabOpen] = useState(false);

  const userId = auth.currentUser?.uid;

  // Animation values
  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [120, 60],
    extrapolate: 'clamp',
  });

  // AI Analysis Functions
  const analyzeTransactions = async () => {
    if (!transactions.length) return;
    
    setIsAnalyzing(true);
    try {
      const transactionData = transactions.map(t => ({
        amount: t.amount,
        category: t.category,
        date: t.date,
        description: t.description
      }));

      // Group transactions by category
      const categoryTotals = transactionData.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount);
        return acc;
      }, {});

      // Calculate spending trends
      const trends = Object.entries(categoryTotals).map(([category, total]) => ({
        category,
        total: total.toFixed(2),
        percentage: ((total / transactionData.reduce((sum, t) => sum + parseFloat(t.amount), 0)) * 100).toFixed(1)
      }));

      // Sort trends by total amount
      trends.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

      // Calculate monthly spending and growth
      const monthlyData = groupTransactionsByMonth(transactionData);
      const monthlyTotal = Object.values(monthlyData).reduce((sum, val) => sum + val, 0);
      const monthlyAverage = monthlyTotal / Object.keys(monthlyData).length || 1;
      const growth = calculateGrowthRate(monthlyData);

      // Generate budget recommendations
      const budgetRecommendations = generateBudgetRecommendations(trends, monthlyAverage);

      // Analyze spending patterns
      const patterns = analyzeSpendingPatterns(transactionData);

      // Generate AI insights
      const insights = {
        summary: {
          title: "Summary",
          data: [
            `Total Spending: ${monthlyTotal.toFixed(2)}`,
            `Monthly Average: ${monthlyAverage.toFixed(2)}`,
            `Growth Rate: ${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
            `Active Categories: ${trends.length}`
          ]
        },
        topExpenses: {
          title: "Top Expenses",
          data: trends.slice(0, 3).map(t => ({
            category: t.category,
            amount: t.total,
            percentage: t.percentage
          }))
        },
        patterns: {
          title: "Spending Patterns",
          data: patterns
        },
        budget: {
          title: "Budget Recommendations",
          data: budgetRecommendations
        }
      };

      setAiInsights(insights);
      setSpendingTrends(trends);
      setShowInsightsModal(true);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setError('Failed to analyze transactions. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const groupTransactionsByMonth = (transactions) => {
    return transactions.reduce((acc, transaction) => {
      const month = transaction.date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + parseFloat(transaction.amount);
      return acc;
    }, {});
  };

  const calculateGrowthRate = (monthlyData) => {
    const months = Object.keys(monthlyData).sort();
    if (months.length < 2) return 0;
    
    const oldestMonth = monthlyData[months[0]];
    const latestMonth = monthlyData[months[months.length - 1]];
    return ((latestMonth - oldestMonth) / oldestMonth) * 100;
  };

  const generateBudgetRecommendations = (trends, monthlyAverage) => {
    const recommendations = [];
    const totalSpending = trends.reduce((sum, t) => sum + parseFloat(t.total), 0);

    // Recommended category allocations
    const idealAllocations = {
      housing: 30,
      food: 15,
      transport: 10,
      utilities: 10,
      entertainment: 5,
      savings: 20,
      other: 10
    };

    // Compare actual vs ideal spending
    trends.forEach(trend => {
      const category = trend.category.toLowerCase();
      const actualPercentage = parseFloat(trend.percentage);
      const idealPercentage = idealAllocations[category] || idealAllocations.other;

      if (actualPercentage > idealPercentage * 1.2) {
        recommendations.push(`Consider reducing ${trend.category} expenses by ${(actualPercentage - idealPercentage).toFixed(1)}%`);
      }
    });

    // Add general recommendations
    if (totalSpending > monthlyAverage * 1.2) {
      recommendations.push("Your spending is above average. Look for areas to cut back.");
    }

    if (trends.length > 0 && trends[0].percentage > 40) {
      recommendations.push(`${trends[0].category} takes up a large portion of your budget. Consider ways to reduce this expense.`);
    }

    return recommendations;
  };

  const analyzeSpendingPatterns = (transactions) => {
    const patterns = [];
    
    // Analyze daily spending patterns
    const dailySpending = transactions.reduce((acc, t) => {
      const day = new Date(t.date).getDay();
      acc[day] = (acc[day] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

    const highestSpendingDay = Object.entries(dailySpending)
      .sort(([,a], [,b]) => b - a)[0];
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    patterns.push(`Highest spending on ${days[highestSpendingDay[0]]}`);

    // Analyze recurring transactions
    const descriptions = transactions.map(t => t.description.toLowerCase());
    const recurring = descriptions.filter((desc, index) => 
      descriptions.indexOf(desc) !== index
    );

    if (recurring.length > 0) {
      patterns.push("Found recurring transactions - consider setting up automatic payments");
    }

    // Analyze spending frequency
    const dates = transactions.map(t => new Date(t.date).getTime());
    const avgDaysBetween = (Math.max(...dates) - Math.min(...dates)) / (dates.length * 86400000);
    
    if (avgDaysBetween < 2) {
      patterns.push("Frequent small transactions detected - consider consolidating purchases");
    }

    return patterns;
  };

  const suggestCategory = (description) => {
    // Simple category suggestion based on keywords
    const keywords = {
      food: ['restaurant', 'cafe', 'grocery', 'food', 'meal'],
      transport: ['uber', 'taxi', 'bus', 'train', 'gas', 'fuel'],
      shopping: ['amazon', 'store', 'mall', 'shop'],
      utilities: ['electricity', 'water', 'internet', 'phone'],
      entertainment: ['movie', 'game', 'netflix', 'spotify']
    };

    const lowerDesc = description.toLowerCase();
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => lowerDesc.includes(word))) {
        return category;
      }
    }
    return 'other';
  };

  // Enhanced search with smart filtering
  const getSmartSearchResults = (query) => {
    if (!query) return transactions;

    const searchTerms = query.toLowerCase().split(' ');
    return transactions.filter(transaction => {
      const searchableText = `${transaction.description} ${transaction.category} ${transaction.amount}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });
  };

  const fetchCategories = useCallback(async () => {
    if (!userId) {
      setCategories({});
      return {};
    }

    try {
      const categoriesRef = collection(db, "categories");
      const q = query(categoriesRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const categoriesData = {};
      querySnapshot.forEach((doc) => {
        categoriesData[doc.id] = {
          ...doc.data(),
          name: doc.data().name || 'Uncategorized',
          color: doc.data().color || THEME_COLORS.danger.main
        };
      });
      setCategories(categoriesData);
      return categoriesData;
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Error fetching categories. Please try again.");
      return {};
    }
  }, [userId]);

  const fetchTransactions = useCallback(
    async (latestCategories) => {
      if (!userId) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const transactionsRef = collection(db, "transactions");
        let q = query(transactionsRef, where("userId", "==", userId));

        // Add filter logic
        if (filter === "today") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          q = query(
            q, 
            where("date", ">=", today.toISOString()),
            where("date", "<", tomorrow.toISOString())
          );
        } else if (filter === "this week") {
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          q = query(q, where("date", ">=", startOfWeek.toISOString()));
        } else if (filter === "this month") {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          q = query(q, where("date", ">=", startOfMonth.toISOString()));
        } else if (filter === "this year") {
          const startOfYear = new Date(new Date().getFullYear(), 0, 1);
          q = query(q, where("date", ">=", startOfYear.toISOString()));
        }

        const querySnapshot = await getDocs(q);
        const userTransactions = querySnapshot.docs.map((doc) => {
          const transaction = { id: doc.id, ...doc.data() };
          const category = latestCategories[transaction.categoryId] || {
            name: 'Uncategorized',
            color: THEME_COLORS.danger.main
          };
          
          return {
            ...transaction,
            category: category.name,
            categoryColor: category.color
          };
        });

        setTransactions(userTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setError("Error fetching transactions. Please try again.");
        setTransactions([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    },
    [userId, filter]
  );

  const refreshData = useCallback(async () => {
    const latestCategories = await fetchCategories();
    await fetchTransactions(latestCategories);
  }, [fetchCategories, fetchTransactions]);

  // Initialize data on mount and focus
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const handleDeleteTransaction = async (transactionId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "transactions", transactionId));
      const latestCategories = await fetchCategories(); // Fetch latest categories
      await fetchTransactions(latestCategories); // Pass latest categories to fetchTransactions
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setError("Error deleting transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderTransaction = useCallback(
    ({ item }) => (
      <TransactionCard
        item={item}
        onEdit={() => navigation.navigate("EditTransaction", { transactionId: item.id })}
        onDelete={() => handleDeleteTransaction(item.id)}
            onPress={() => {
              setSelectedTransaction(item);
              setModalVisible(true);
            }}
      />
    ),
    []
  );

  const renderHeader = () => (
    <Animated.View style={[styles.header, { height: headerHeight }]}>
      <LinearGradient
        colors={THEME_COLORS.gradient.primary}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>{t('Transactions')}</Text>
        <SearchBar
          placeholder={t('Search transactions')}
          value={searchQuery}
          onChangeText={(query) => {
            setSearchQuery(query);
            setTransactions(getSmartSearchResults(query));
          }}
        />
      </LinearGradient>
    </Animated.View>
  );

  const renderFilterButtons = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {filterOptions.map((option) => (
        <FilterChip
          key={option}
          label={t(option)}
          selected={filter === option}
          onPress={() => setFilter(option)}
        />
      ))}
    </ScrollView>
  );

  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    
    return transactions.filter((transaction) => {
      if (!transaction || !transaction.description) return false;
      return transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [transactions, searchTerm]);

  const filterOptions = [
    "All",
    "Today",
    "This Week",
    "This Month",
    "This Year",
  ];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <LinearGradient
        colors={THEME_COLORS.gradient.primary}
        style={styles.headerGradient}
      >
        <Text style={styles.headerEmoji}>💳</Text>
        <Text style={styles.headerTitle}>{t('Transactions')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('Track your spending and stay on budget')} ✨
        </Text>
        <SearchBar
          placeholder={t('Search transactions')}
          value={searchQuery}
          onChangeText={(query) => {
            setSearchQuery(query);
            setTransactions(getSmartSearchResults(query));
          }}
        />
      </LinearGradient>

      <View style={styles.content}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {filterOptions.map((option) => (
            <FilterChip
              key={option}
              label={t(option)}
              selected={filter === option}
              onPress={() => setFilter(option)}
            />
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={THEME_COLORS.accent.main} />
            <Text style={styles.loaderText}>{t('Loading transactions...')}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons 
              name="error-outline" 
              size={64} 
              color={THEME_COLORS.danger.main} 
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={refreshData}
            >
              <Text style={styles.retryButtonText}>{t('Retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredTransactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons 
                  name="receipt-long" 
                  size={80} 
                  color={THEME_COLORS.text.secondary} 
                />
                <Text style={styles.emptyTitle}>{t('No Transactions Yet')}</Text>
                <Text style={styles.emptyText}>
                  {t('Start tracking your expenses by adding your first transaction')} 📝
                </Text>
                <TouchableOpacity
                  style={styles.addFirstButton}
                  onPress={() => navigation.navigate("AddTransaction")}
                >
                  <Text style={styles.addFirstButtonText}>
                    {t('Add Your First Transaction')} ✨
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      <View style={styles.fabContainer}>
        <FloatingButton
          onPress={() => navigation.navigate("AddTransaction")}
          icon={<MaterialIcons name="add" size={24} color={THEME_COLORS.text.primary} />}
          label={t('Add')}
        />
      </View>

      {/* Replace old modal with new TransactionModal */}
      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        data={selectedTransaction}
        type="transaction"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.dark,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 40,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: Platform.OS === 'ios' ? 180 : 160,
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    color: THEME_COLORS.text.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  searchBarContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: -SPACING.xl,
    zIndex: 1,
    minHeight: 50,
  },
  searchBarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 15,
    backgroundColor: THEME_COLORS.background.overlay,
    minHeight: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: THEME_COLORS.text.primary,
    fontSize: TYPOGRAPHY.body2.fontSize,
    minHeight: 40,
  },
  content: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.dark,
  },
  filterContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 60,
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginHorizontal: SPACING.xs,
    minHeight: 36,
    minWidth: 80,
    justifyContent: 'center',
  },
  selectedFilterChip: {
    elevation: 3,
    shadowColor: THEME_COLORS.accent.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterChipText: {
    color: THEME_COLORS.text.primary,
    fontSize: TYPOGRAPHY.body2.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedFilterChipText: {
    color: THEME_COLORS.text.primary,
    fontWeight: 'bold',
  },
  cardContainer: {
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
    minHeight: 150,
  },
  gradientCard: {
    borderRadius: 15,
    padding: SPACING.md,
    minHeight: 150,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    minHeight: 40,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.subtitle1.fontSize,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    flex: 1,
  },
  dateText: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: THEME_COLORS.text.secondary,
    marginLeft: SPACING.sm,
  },
  amountText: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: 'bold',
    marginVertical: SPACING.sm,
  },
  descriptionText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.secondary,
    marginBottom: SPACING.md,
    minHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minHeight: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginLeft: SPACING.sm,
    minWidth: 80,
    justifyContent: 'center',
  },
  actionButtonText: {
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.button.fontSize,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 999,
    elevation: 6,
  },
  floatingButton: {
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientButton: {
    elevation: 6,
    shadowColor: THEME_COLORS.accent.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    height: 60,
    width: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonText: {
    color: THEME_COLORS.text.primary,
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.button.fontSize,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.primary.dark,
  },
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: SPACING.lg,
    backgroundColor: THEME_COLORS.background.card,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: `${THEME_COLORS.text.secondary}20`,
    paddingBottom: SPACING.md,
  },
  modalCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalCategory: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: 'bold',
  },
  modalAmount: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    fontWeight: 'bold',
    marginVertical: SPACING.md,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.primary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: SPACING.xs,
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalButtonText: {
    color: THEME_COLORS.text.primary,
    fontSize: TYPOGRAPHY.button.fontSize,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  modalCloseButton: {
    backgroundColor: THEME_COLORS.background.card,
    paddingVertical: SPACING.md,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${THEME_COLORS.text.secondary}30`,
  },
  modalCloseButtonText: {
    color: THEME_COLORS.text.primary,
    fontSize: TYPOGRAPHY.button.fontSize,
    fontWeight: 'bold',
  },
  insightsContent: {
    width: '100%',
    maxHeight: height * 0.8,
    borderRadius: 20,
    padding: SPACING.lg,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  insightsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  insightsTitle: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    fontWeight: 'bold',
    color: THEME_COLORS.text.primary,
  },
  insightsScroll: {
    marginBottom: SPACING.lg,
  },
  insightsText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.secondary,
    lineHeight: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: SPACING.sm,
    color: THEME_COLORS.text.secondary,
    fontSize: TYPOGRAPHY.body2.fontSize,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    color: THEME_COLORS.danger.main,
    fontSize: TYPOGRAPHY.body1.fontSize,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: THEME_COLORS.accent.main,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  retryButtonText: {
    color: THEME_COLORS.text.primary,
    fontSize: TYPOGRAPHY.body1.fontSize,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    minHeight: height * 0.5,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    color: THEME_COLORS.text.primary,
    fontWeight: 'bold',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  addFirstButton: {
    backgroundColor: THEME_COLORS.accent.main,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  addFirstButtonText: {
    color: THEME_COLORS.text.primary,
    fontSize: TYPOGRAPHY.button.fontSize,
    fontWeight: 'bold',
  },
  // New and updated styles for insights
  insightSection: {
    marginBottom: SPACING.lg,
    backgroundColor: THEME_COLORS.background.card,
    borderRadius: 15,
    padding: SPACING.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  insightTitle: {
    fontSize: TYPOGRAPHY.h4.fontSize,
    fontWeight: 'bold',
    color: THEME_COLORS.text.primary,
  },
  insightText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  topExpenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  topExpenseText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  patternText: {
    flex: 1,
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  recommendationText: {
    flex: 1,
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  listContainer: {
    paddingBottom: 120,
    flexGrow: 1,
  },
});

export default React.memo(Transactions);
