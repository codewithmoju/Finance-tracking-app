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
  Platform,
  ScrollView,
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

// Reuse the same component definitions from Transactions.js
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

// Category Icons mapping
const CATEGORY_ICONS = {
  salary: "account-balance",
  freelance: "laptop",
  investment: "trending-up",
  rental: "home",
  business: "store",
  dividend: "pie-chart",
  bonus: "star",
  gift: "card-giftcard",
  other: "attach-money",
};

const IncomeCard = ({ item, onEdit, onDelete, onPress }) => {
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

const Income = ({ navigation }) => {
  const { t } = useTranslation();
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [aiInsights, setAiInsights] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [incomeTrends, setIncomeTrends] = useState(null);
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
  const analyzeIncomes = async () => {
    if (!incomes.length) return;
    
    setIsAnalyzing(true);
    try {
      const incomeData = incomes.map(t => ({
        amount: t.amount,
        category: t.category,
        date: t.date,
        description: t.description
      }));

      // Group incomes by category
      const categoryTotals = incomeData.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount);
        return acc;
      }, {});

      // Calculate income trends
      const trends = Object.entries(categoryTotals).map(([category, total]) => ({
        category,
        total: total.toFixed(2),
        percentage: ((total / incomeData.reduce((sum, t) => sum + parseFloat(t.amount), 0)) * 100).toFixed(1)
      }));

      // Sort trends by total amount
      trends.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

      // Calculate monthly average and growth
      const monthlyTotal = incomeData.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const monthlyAverage = monthlyTotal / (incomeData.length || 1);

      // Calculate month-over-month growth
      const monthlyData = groupIncomesByMonth(incomeData);
      const growth = calculateGrowthRate(monthlyData);

      // Generate AI insights
      const insights = {
        summary: {
          title: "Summary",
          data: [
            `Total Income: ${monthlyTotal.toFixed(2)}`,
            `Monthly Average: ${monthlyAverage.toFixed(2)}`,
            `Growth Rate: ${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
            `Active Income Sources: ${trends.length}`
          ]
        },
        topSources: {
          title: "Top Income Sources",
          data: trends.slice(0, 3).map(t => ({
            category: t.category,
            amount: t.total,
            percentage: t.percentage
          }))
        },
        recommendations: {
          title: "Recommendations",
          data: generateRecommendations(trends, growth, monthlyAverage)
        },
        diversification: {
          title: "Income Diversification",
          score: calculateDiversificationScore(trends),
          suggestion: getDiversificationSuggestion(trends)
        }
      };

      setAiInsights(insights);
      setIncomeTrends(trends);
      setShowInsightsModal(true);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setError('Failed to analyze incomes. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const groupIncomesByMonth = (incomes) => {
    return incomes.reduce((acc, income) => {
      const month = income.date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + parseFloat(income.amount);
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

  const generateRecommendations = (trends, growth, monthlyAverage) => {
    const recommendations = [];

    if (trends.length < 3) {
      recommendations.push("Consider diversifying your income sources to reduce risk");
    }

    if (growth < 5) {
      recommendations.push("Look for opportunities to increase your primary income source");
    }

    if (trends.length > 0 && trends[0].percentage > 70) {
      recommendations.push("Your income is heavily dependent on one source. Consider developing additional income streams");
    }

    const savingsTarget = monthlyAverage * 0.2;
    recommendations.push(`Try to save at least ${savingsTarget.toFixed(2)} per month for financial security`);

    return recommendations;
  };

  const calculateDiversificationScore = (trends) => {
    if (trends.length === 0) return 0;
    if (trends.length === 1) return 20;
    
    const percentages = trends.map(t => parseFloat(t.percentage));
    const evenDistribution = 100 / trends.length;
    const variance = percentages.reduce((acc, p) => acc + Math.abs(p - evenDistribution), 0) / trends.length;
    
    return Math.min(100, Math.max(0, 100 - variance));
  };

  const getDiversificationSuggestion = (trends) => {
    const score = calculateDiversificationScore(trends);
    if (score < 30) return "Your income is highly concentrated. High priority to diversify.";
    if (score < 60) return "Moderate diversification. Consider adding 1-2 more income sources.";
    return "Well-diversified income streams. Focus on growing existing sources.";
  };

  // Smart search with category prediction
  const getSmartSearchResults = (query) => {
    if (!query) return incomes;

    const searchTerms = query.toLowerCase().split(' ');
    return incomes.filter(income => {
      const searchableText = `${income.description} ${income.category} ${income.amount}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });
  };

  const fetchCategories = useCallback(async () => {
    if (userId) {
      try {
        const categoriesRef = collection(db, "incomeCategories");
        const q = query(categoriesRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const categoriesData = {};
        querySnapshot.forEach((doc) => {
          categoriesData[doc.id] = doc.data();
        });
        setCategories(categoriesData);
        return categoriesData; // Return the fetched categories
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Error fetching categories. Please try again.");
        return {}; // Return an empty object in case of error
      }
    }
    return {}; // Return an empty object if there's no userId
  }, [userId]);

  // Memoized function to filter incomes based on the search term
  const filteredIncomes = useMemo(() => {
    return incomes.filter((income) =>
      income.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [incomes, searchQuery]); // Only re-compute when incomes or searchTerm changes

  // Function to fetch incomes from the database
  const fetchIncomes = useCallback(
    async (latestCategories) => {
      if (userId) {
        setLoading(true); // Set loading state to true while fetching
        setError(null); // Reset error state
        try {
          const incomesRef = collection(db, "income");
          let q = query(incomesRef, where("userId", "==", userId));

          // Filter for today's incomes
          if (filter === "today") {
            const today = new Date().toISOString().split("T")[0];
            q = query(q, where("date", "==", today));
          }
          // Add more filter conditions here for "this week", "this month", "this year"

          const querySnapshot = await getDocs(q); // Fetch incomes from Firestore
          const userIncomes = querySnapshot.docs.map((doc) => {
            const income = { id: doc.id, ...doc.data() }; // Create income object
            // Assign category and color if available
            if (income.categoryId && latestCategories[income.categoryId]) {
              income.category = latestCategories[income.categoryId].name;
              income.categoryColor = latestCategories[income.categoryId].color;
            } else {
              income.category = "Uncategorized"; // Default category
              income.categoryColor = "#000000"; // Default color
            }
            return income; // Return the income object
          });

          setIncomes(userIncomes); // Update state with fetched incomes
        } catch (error) {
          console.error("Error fetching incomes:", error);
          setError("Error fetching incomes. Please try again."); // Set error message
        } finally {
          setLoading(false); // Set loading state to false after fetching
        }
      }
    },
    [userId, filter] // Dependencies for useCallback
  );

  const refreshData = useCallback(async () => {
    const latestCategories = await fetchCategories();
    await fetchIncomes(latestCategories);
  }, [fetchCategories, fetchIncomes]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const handleDeleteIncome = async (incomeId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "income", incomeId));
      const latestCategories = await fetchCategories();
      await fetchIncomes(latestCategories);
    } catch (error) {
      console.error("Error deleting income:", error);
      setError("Error deleting income. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderIncome = useCallback(
    ({ item }) => (
      <IncomeCard
        item={item}
        onEdit={() => navigation.navigate("EditIncome", { incomeId: item.id })}
        onDelete={() => handleDeleteIncome(item.id)}
        onPress={() => {
          setSelectedIncome(item);
          setModalVisible(true);
        }}
      />
    ),
    []
  );

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
        colors={THEME_COLORS.gradient.income}
        style={styles.headerGradient}
      >
        <Text style={styles.headerEmoji}>💰</Text>
        <Text style={styles.headerTitle}>{t('Income')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('Track your earnings and grow your wealth')} ✨
        </Text>
        <SearchBar
          placeholder={t('Search income')}
          value={searchQuery}
          onChangeText={(query) => {
            setSearchQuery(query);
            setIncomes(getSmartSearchResults(query));
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
            <Text style={styles.loaderText}>{t('Loading income entries...')}</Text>
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
            data={incomes}
            renderItem={renderIncome}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons 
                  name="account-balance-wallet" 
                  size={80} 
                  color={THEME_COLORS.text.secondary} 
                />
                <Text style={styles.emptyTitle}>{t('No Income Yet')}</Text>
                <Text style={styles.emptyText}>
                  {t('Start tracking your earnings by adding your first income')} 📈
                </Text>
                <TouchableOpacity
                  style={styles.addFirstButton}
                  onPress={() => navigation.navigate("AddIncome")}
                >
                  <Text style={styles.addFirstButtonText}>
                    {t('Add Your First Income')} ✨
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      <View style={styles.fabContainer}>
        <FloatingButton
          onPress={() => navigation.navigate("AddIncome")}
          icon={<MaterialIcons name="add" size={25} color={THEME_COLORS.text.primary} />}
        />
      </View>

      {/* Replace old modal with new TransactionModal */}
      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        data={selectedIncome}
        type="income"
      />
    </View>
  );
};

export default React.memo(Income);

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
    maxWidth: 400,
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
    minWidth: 200,
    alignItems: 'center',
  },
  addFirstButtonText: {
    color: THEME_COLORS.text.primary,
    fontSize: TYPOGRAPHY.button.fontSize,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: THEME_COLORS.accent.main,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginTop: SPACING.md,
  },
  retryButtonText: {
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
  topSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  topSourceText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  scoreContainer: {
    marginVertical: SPACING.sm,
  },
  scoreText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  scoreBar: {
    height: 8,
    backgroundColor: THEME_COLORS.background.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4,
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