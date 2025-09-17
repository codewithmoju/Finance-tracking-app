import React, { useState, useEffect, useCallback, useMemo, Suspense, useRef } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Dimensions,
  Alert,
} from "react-native";
import { colors } from "../../global/styles";
import { Fonts } from "../../../assets/fonts/fonts";
import { auth, db } from "../../../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  limit,
  orderBy,
  startAfter,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { commonStyles } from "../../global/styles";
import { THEME_COLORS } from "../../global/styles";
import { SPACING } from "../../global/styles";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCurrency } from '../../global/CurrencyContext';
import DateTimePicker from "@react-native-community/datetimepicker";

const { width, height } = Dimensions.get("window");

// Add TYPOGRAPHY constant
const TYPOGRAPHY = {
  h1: {
    fontSize: width * 0.08,
    fontFamily: Fonts.POPPINS_BOLD,
  },
  h2: {
    fontSize: width * 0.06,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  h3: {
    fontSize: width * 0.05,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  body1: {
    fontSize: width * 0.04,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  body2: {
    fontSize: width * 0.035,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  caption: {
    fontSize: width * 0.03,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
};

// Memoized filter options
const FILTER_OPTIONS = [
  { label: 'All Time', value: 'all', icon: 'calendar-today' },
  { label: 'Today', value: 'today', icon: 'today' },
  { label: 'This Week', value: 'week', icon: 'view-week' },
  { label: 'This Month', value: 'month', icon: 'date-range' },
  { label: 'Custom Range', value: 'custom', icon: 'date-range' },
];

// Lazy loaded components with loading fallback
const LazyIncomeList = React.lazy(() => import('./components/IncomeList'));
const LazyTransactionList = React.lazy(() => import('./components/TransactionList'));

// Cache keys
const CACHE_KEYS = {
  USER_DATA: 'userData',
  TRANSACTIONS: 'transactions',
  INCOMES: 'incomes',
  CATEGORIES: 'categories',
  LAST_FETCH: 'lastFetch',
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Custom Range Modal Component
const CustomRangeModal = ({ 
  visible, 
  onClose, 
  onSelectRange, 
  dateRange, 
  onSelectDate,
  showDatePicker,
  setShowDatePicker,
  datePickerType,
  setDatePickerType 
}) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <LinearGradient
        colors={THEME_COLORS.gradient.dark}
        style={styles.modalContent}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, commonStyles.heading3]}>Select Date Range</Text>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButton}
          >
            <MaterialIcons name="close" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.dateSelectionContainer}>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => {
              setDatePickerType('start');
              setShowDatePicker(true);
            }}
          >
            <MaterialIcons name="calendar-today" size={24} color={colors.silver} />
            <Text style={styles.dateInputText}>
              {dateRange.startDate ? dateRange.startDate.toLocaleDateString() : 'Select Start Date'}
            </Text>
          </TouchableOpacity>

          <MaterialIcons name="arrow-forward" size={24} color={colors.silver} />

          <TouchableOpacity 
            style={[
              styles.dateInput,
              !dateRange.startDate && styles.dateInputDisabled
            ]}
            onPress={() => {
              if (dateRange.startDate) {
                setDatePickerType('end');
                setShowDatePicker(true);
              }
            }}
            disabled={!dateRange.startDate}
          >
            <MaterialIcons name="calendar-today" size={24} color={colors.silver} />
            <Text style={styles.dateInputText}>
              {dateRange.endDate ? dateRange.endDate.toLocaleDateString() : 'Select End Date'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickSelectContainer}>
          <Text style={styles.quickSelectTitle}>Quick Select</Text>
          <View style={styles.quickSelectGrid}>
            {[
              { label: 'Last 7 Days', days: 7 },
              { label: 'Last 30 Days', days: 30 },
              { label: 'Last 3 Months', days: 90 },
              { label: 'Last 6 Months', days: 180 },
              { label: 'This Year', days: 365 },
            ].map(option => (
              <TouchableOpacity
                key={option.days}
                style={styles.quickSelectButton}
                onPress={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - option.days);
                  onSelectRange({ startDate: start, endDate: end });
                }}
              >
                <Text style={styles.quickSelectButtonText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const Home = ({ navigation }) => {
  // State variables with initial cached data
  const [userData, setUserData] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [incomeCategories, setIncomeCategories] = useState({});
  const [expenseCategories, setExpenseCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currency: userCurrency } = useCurrency();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;
  const [showTour, setShowTour] = useState(false);

  // Refs for tracking mounted state and data fetching
  const isMounted = useRef(true);
  const isDataFetching = useRef(false);
  const lastFetchTime = useRef(null);

  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState('start'); // 'start' or 'end'
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Initialize cache on mount
  useEffect(() => {
    initializeCache();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const initializeCache = async () => {
    try {
      const cachedData = await AsyncStorage.multiGet([
        CACHE_KEYS.USER_DATA,
        CACHE_KEYS.TRANSACTIONS,
        CACHE_KEYS.INCOMES,
        CACHE_KEYS.CATEGORIES,
        CACHE_KEYS.LAST_FETCH,
      ]);

      const [
        [, userDataStr],
        [, transactionsStr],
        [, incomesStr],
        [, categoriesStr],
        [, lastFetchStr],
      ] = cachedData;

      if (lastFetchStr) {
        lastFetchTime.current = parseInt(lastFetchStr);
        const now = Date.now();
        if (now - lastFetchTime.current < CACHE_EXPIRATION) {
          // Use cached data if not expired
          if (userDataStr) setUserData(JSON.parse(userDataStr));
          if (transactionsStr) setTransactions(JSON.parse(transactionsStr));
          if (incomesStr) setIncomes(JSON.parse(incomesStr));
          if (categoriesStr) {
            const categories = JSON.parse(categoriesStr);
            setIncomeCategories(categories.income);
            setExpenseCategories(categories.expense);
          }
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error initializing cache:', error);
    }
  };

  const updateCache = async (newData) => {
    try {
      const updates = [
        [CACHE_KEYS.LAST_FETCH, Date.now().toString()],
      ];

      if (newData.userData) {
        updates.push([CACHE_KEYS.USER_DATA, JSON.stringify(newData.userData)]);
      }
      if (newData.transactions) {
        updates.push([CACHE_KEYS.TRANSACTIONS, JSON.stringify(newData.transactions)]);
      }
      if (newData.incomes) {
        updates.push([CACHE_KEYS.INCOMES, JSON.stringify(newData.incomes)]);
      }
      if (newData.categories) {
        updates.push([CACHE_KEYS.CATEGORIES, JSON.stringify({
          income: newData.categories.income,
          expense: newData.categories.expense,
        })]);
      }

      await AsyncStorage.multiSet(updates);
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  };

  // Memoized date filter calculation
  const getFilterDate = useCallback((filterType) => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    switch (filterType) {
      case 'today': {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      }
      case 'week': {
        const start = new Date();
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      }
      case 'month': {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      }
      case 'custom': {
        if (!dateRange.startDate || !dateRange.endDate) return null;
        const start = new Date(dateRange.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange.endDate);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      default:
        return null;
    }
  }, [dateRange]);

  // Optimized data fetching with batching and caching
  const fetchData = useCallback(async (filterType, pageNum = 1, refresh = false) => {
    if (isDataFetching.current) return;
    isDataFetching.current = true;

    try {
      if (!refresh && lastFetchTime.current && Date.now() - lastFetchTime.current < CACHE_EXPIRATION) {
        return; // Use cached data if not expired
      }

      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user found");

      const batch = [];

      // Batch user data fetch
      if (pageNum === 1 || refresh) {
        batch.push(getDoc(doc(db, "users", user.uid)));
      }

      const dateFilter = getFilterDate(filterType);
      
      // Build optimized queries
      let incomesQuery = collection(db, "income");
      let transactionsQuery = collection(db, "transactions");

      // Add filters
      const filters = [where("userId", "==", user.uid)];
      
      if (dateFilter) {
        filters.push(
          where("date", ">=", dateFilter.start.toISOString()),
          where("date", "<=", dateFilter.end.toISOString())
        );
      }

      // Apply filters and ordering efficiently
      filters.forEach(filter => {
        incomesQuery = query(incomesQuery, filter);
        transactionsQuery = query(transactionsQuery, filter);
      });

      // Add ordering and pagination
      incomesQuery = query(
        incomesQuery,
        orderBy("date", "desc"),
        limit(ITEMS_PER_PAGE)
      );

      transactionsQuery = query(
        transactionsQuery,
        orderBy("date", "desc"),
        limit(ITEMS_PER_PAGE)
      );

      // Execute queries in parallel
      const [userDoc, incomesSnapshot, transactionsSnapshot] = await Promise.all([
        pageNum === 1 || refresh ? batch[0] : null,
        getDocs(incomesQuery),
        getDocs(transactionsQuery)
      ]);

      if (!isMounted.current) return;

      // Process results
      const updates = {};

      if (userDoc?.exists()) {
        updates.userData = userDoc.data();
        setUserData(updates.userData);
      }

      const incomesData = incomesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const transactionsData = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Update state efficiently
      if (pageNum === 1 || refresh) {
        updates.incomes = incomesData;
        updates.transactions = transactionsData;
        setIncomes(incomesData);
        setTransactions(transactionsData);
      } else {
        updates.incomes = [...incomes, ...incomesData];
        updates.transactions = [...transactions, ...transactionsData];
        setIncomes(prev => [...prev, ...incomesData]);
        setTransactions(prev => [...prev, ...transactionsData]);
      }

      // Calculate totals
      const totalInc = incomesData.reduce((sum, income) => sum + (income.amount || 0), 0);
      const totalExp = transactionsData.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
      
      setTotalIncome(totalInc);
      setTotalExpenses(totalExp);
      setRemainingBalance(totalInc - totalExp);
      
      // Update pagination state
      setHasMore(incomesData.length === ITEMS_PER_PAGE || transactionsData.length === ITEMS_PER_PAGE);
      setPage(pageNum);

      // Fetch categories if needed
      if (pageNum === 1 || refresh) {
        const categories = await fetchCategories(user.uid);
        updates.categories = categories;
      }

      // Update cache
      await updateCache(updates);
      lastFetchTime.current = Date.now();

      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      if (isMounted.current) {
        setError(err.message);
        setLoading(false);
      }
    } finally {
      isDataFetching.current = false;
    }
  }, [getFilterDate, incomes, transactions]);

  // Optimized categories fetch with caching
  const fetchCategories = useCallback(async (userId) => {
    try {
      const [incomeSnapshot, expenseSnapshot] = await Promise.all([
        getDocs(query(collection(db, "incomeCategories"), where("userId", "==", userId))),
        getDocs(query(collection(db, "categories"), where("userId", "==", userId)))
      ]);

      const incomeData = {};
      const expenseData = {};

      incomeSnapshot.docs.forEach(doc => {
        const data = doc.data();
        incomeData[doc.id] = data.color || '#00b894';
      });
      expenseSnapshot.docs.forEach(doc => {
        const data = doc.data();
        expenseData[doc.id] = data.color || '#d63031';
      });

      setIncomeCategories(incomeData);
      setExpenseCategories(expenseData);

      return { income: incomeData, expense: expenseData };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { income: {}, expense: {} };
    }
  }, []);

  // Initialize user data and check auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserData(data);
            // setUserCurrency(data.currency || "$"); // This line is removed as per edit hint
          } else {
            // Create default user data if it doesn't exist
            const defaultUserData = {
              name: user.displayName || 'User',
              email: user.email,
              currency: "$",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, defaultUserData);
            setUserData(defaultUserData);
            // setUserCurrency("$"); // This line is removed as per edit hint
          }
          
          // Initial data fetch
          await fetchData(selectedFilter, 1, true);
        } else {
          navigation.replace('Auth', { screen: 'Login' });
        }
      } catch (error) {
        console.error('Error initializing user data:', error);
        setError('Failed to initialize user data. Please try again.');
      }
    });

    return () => unsubscribe();
  }, [navigation, fetchData, selectedFilter]);

  // Prefetch next page data
  const prefetchNextPage = useCallback(() => {
    if (hasMore && !loading && !isDataFetching.current) {
      fetchData(selectedFilter, page + 1);
    }
  }, [hasMore, loading, selectedFilter, page, fetchData]);

  // Handle end reached for infinite scroll
  const handleEndReached = useCallback(() => {
    if (!isDataFetching.current && hasMore) {
      prefetchNextPage();
    }
  }, [hasMore, prefetchNextPage]);

  // Handle filter change
  const handleFilterChange = useCallback((value) => {
    setSelectedFilter(value);
    if (value === 'custom') {
      setShowCustomRange(true);
    } else {
      fetchData(value, 1, true);
    }
  }, [fetchData]);

  // Handle date selection
  const handleDateChange = useCallback((event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }

    if (datePickerType === 'start') {
      setDateRange(prev => ({ ...prev, startDate: selectedDate }));
      setDatePickerType('end');
      setShowDatePicker(false);
      setTimeout(() => setShowDatePicker(true), 500); // Show end date picker after a short delay
    } else {
      setDateRange(prev => ({ ...prev, endDate: selectedDate }));
      setShowDatePicker(false);
      fetchData('custom', 1, true);
    }
  }, [datePickerType, fetchData]);

  // Handle custom range selection
  const handleCustomRangeSelect = useCallback((range) => {
    setDateRange(range);
    setShowCustomRange(false);
    fetchData('custom', 1, true);
  }, [fetchData]);

  // Load initial data
  useEffect(() => {
    fetchData(selectedFilter, 1, true);
  }, [selectedFilter]);

  // Check if tour should be shown
  useEffect(() => {
    const checkTourStatus = async () => {
      try {
        const tourCompleted = await AsyncStorage.getItem('@tour_completed');
        if (!tourCompleted) {
          setShowTour(true);
        }
      } catch (error) {
        console.error('Error checking tour status:', error);
      }
    };
    checkTourStatus();
  }, []);

  // Memoized sections data
  const sections = useMemo(() => {
    return [
      { type: 'profile', id: 'profile' },
      { type: 'filter', id: 'filter' },
      { type: 'balance', id: 'balance' },
      { type: 'incomes', id: 'incomes', title: 'Recent Incomes', data: incomes },
      { type: 'transactions', id: 'transactions', title: 'Recent Transactions', data: transactions }
    ];
  }, [
    incomes, 
    transactions, 
    incomeCategories, 
    expenseCategories,
  ]);

  // Handle tour completion
  const handleTourComplete = () => {
    setShowTour(false);
  };

  // Render filter options component
  const FilterOptions = useCallback(() => (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => handleFilterChange(option.value)}
            style={[
              styles.filterOption,
              selectedFilter === option.value && styles.filterOptionSelected
            ]}
          >
            <MaterialIcons 
              name={option.icon} 
              size={20} 
              color={selectedFilter === option.value ? THEME_COLORS.primary.main : colors.silver} 
            />
            <Text style={[
              styles.filterText,
              selectedFilter === option.value && styles.filterTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedFilter === 'custom' && dateRange.startDate && (
        <View style={styles.dateRangeContainer}>
          <Text style={[styles.dateRangeText, commonStyles.bodyText2]}>
            {dateRange.startDate?.toLocaleDateString()} - {dateRange.endDate?.toLocaleDateString() || 'Select End Date'}
          </Text>
        </View>
      )}
    </View>
  ), [selectedFilter, dateRange, handleFilterChange]);

  // Optimized render methods
  const renderItem = useCallback(({ item: section }) => {
    switch (section.type) {
      case 'profile':
        return (
          <View style={styles.profileSection}>
            <View style={commonStyles.row}>
              <Image
                source={{ uri: userData?.profileImageUrl }}
                style={styles.profileImage}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.welcomeText, commonStyles.caption]}>
                  Welcome back,
                </Text>
                <Text style={[styles.name, commonStyles.heading2]}>
                  {userData?.name}
                </Text>
              </View>
            </View>
          </View>
        );

      case 'filter':
        return <FilterOptions />;

      case 'balance':
        return (
          <LinearGradient
            colors={THEME_COLORS.gradient.premium}
            style={[styles.balanceCard, commonStyles.premiumCard]}
          >
            <View style={styles.balanceHeader}>
              <View>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceAmount}>
                  {userCurrency}
                  {remainingBalance.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.balanceDetailsContainer}>
              <View style={styles.balanceDetailItem}>
                <View style={[styles.iconContainer, styles.incomeIcon]}>
                  <MaterialIcons name="trending-up" size={24} color={colors.darkCharcoal} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Income</Text>
                  <Text style={styles.detailAmount}>
                    {userCurrency}
                    {totalIncome.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.verticalDivider} />

              <View style={styles.balanceDetailItem}>
                <View style={[styles.iconContainer, styles.expenseIcon]}>
                  <MaterialIcons name="trending-down" size={24} color={colors.darkCharcoal} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Expenses</Text>
                  <Text style={styles.detailAmount}>
                    {userCurrency}
                    {totalExpenses.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        );

      case 'incomes':
        return (
          <Suspense fallback={<ActivityIndicator color={THEME_COLORS.secondary.main} />}>
            <LazyIncomeList
              data={section.data}
              onViewAll={() => navigation.navigate('IncomeStack', { screen: 'Income' })}
              currency={userCurrency}
              categories={incomeCategories}
            />
          </Suspense>
        );

      case 'transactions':
        return (
          <Suspense fallback={<ActivityIndicator color={THEME_COLORS.secondary.main} />}>
            <LazyTransactionList
              data={section.data}
              onViewAll={() => navigation.navigate('TransactionStack', { screen: 'Transactions' })}
              currency={userCurrency}
              categories={expenseCategories}
            />
          </Suspense>
        );

      default:
        return null;
    }
  }, [userData, selectedFilter, remainingBalance, totalIncome, totalExpenses, userCurrency, navigation, incomeCategories, expenseCategories, dateRange, handleFilterChange]);

  // Update loading state check
  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.secondary.main} />
        <Text style={styles.loadingText}>Loading your financial insights...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            fetchData(selectedFilter, 1, true);
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Remove the fonts check since we're proceeding with default fonts if loading fails
  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.secondary.main} />
        <Text style={styles.loadingText}>Initializing your account...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, commonStyles.container]}>
      <FlatList
        data={sections}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={3}
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator style={styles.loadingMore} color={THEME_COLORS.secondary.main} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={async () => {
              await fetchData(selectedFilter, 1, true);
            }}
            colors={[THEME_COLORS.secondary.main]}
            tintColor={THEME_COLORS.secondary.main}
          />
        }
      />

      {showDatePicker && (
        <DateTimePicker
          value={datePickerType === 'start' ? new Date() : (dateRange.startDate || new Date())}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={datePickerType === 'start' ? new Date() : new Date()}
          minimumDate={datePickerType === 'end' ? dateRange.startDate : undefined}
        />
      )}

      <CustomRangeModal 
        visible={showCustomRange}
        onClose={() => setShowCustomRange(false)}
        onSelectRange={handleCustomRangeSelect}
        dateRange={dateRange}
        onSelectDate={handleDateChange}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        datePickerType={datePickerType}
        setDatePickerType={setDatePickerType}
      />
    </View>
  );
};

export default React.memo(Home);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: height * 0.06,
    paddingBottom: SPACING.md,
  },
  profileImage: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    borderWidth: 2,
    borderColor: colors.goldAccent,
  },
  profileInfo: {
    marginLeft: SPACING.md,
  },
  welcomeText: {
    color: colors.silver,
  },
  name: {
    color: colors.white,
    textDecorationLine: "none",
  },
  cardBg: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: 25,
    padding: SPACING.lg,
  },
  balanceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  balanceItem: {
    flex: 1,
  },
  incomeText: {
    color: colors.darkCharcoal,
    marginTop: SPACING.xs,
  },
  expenseText: {
    color: colors.darkCharcoal,
    marginTop: SPACING.xs,
  },
  section: {
    marginTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  sectionTitle: {
    color: colors.white,
    marginLeft: SPACING.lg,
    marginBottom: SPACING.md,
    fontSize: width * 0.05,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  card: {
    minWidth: width * 0.7,
    margin: SPACING.xs,
    padding: SPACING.lg,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: 'rgba(255,255,255,0.05)',
    elevation: 3,
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cardContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  cardTextContainer: {
    flex: 1,
    gap: SPACING.xs,
  },
  cardTitle: {
    ...commonStyles.bodyText1,
    color: THEME_COLORS.text.primary,
    fontSize: width * 0.04,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  cardAmount: {
    ...commonStyles.bodyText2,
    color: THEME_COLORS.success.main,
    fontSize: width * 0.035,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  expenseAmount: {
    color: THEME_COLORS.danger.main,
  },
  balanceText: {
    color: colors.darkCharcoal,
    fontSize: width * 0.07, // Responsive font size
    fontFamily: Fonts.POPPINS_EXTRABOLD,
    alignSelf: "center",
  },
  RecentText: {
    fontSize: width * 0.07, // Responsive font size
    color: colors.white,
    marginLeft: width * 0.08, // Responsive margin
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.primary.main,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: colors.white,
    fontSize: width * 0.04,
    fontFamily: Fonts.POPPINS_MEDIUM,
    textAlign: 'center',
  },
  loadingMore: {
    marginVertical: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.richBlack,
  },
  errorText: {
    color: THEME_COLORS.secondary.light,
    fontSize: 16,
    textAlign: "center",
    margin: 20,
  },
  balanceCard: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
    elevation: 5,
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    ...commonStyles.bodyText2,
    color: colors.darkCharcoal,
    fontSize: width * 0.035,
    marginBottom: SPACING.xs,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  balanceAmount: {
    color: colors.darkCharcoal,
    fontSize: width * 0.07,
    fontFamily: Fonts.POPPINS_BOLD,
    letterSpacing: 1,
  },
  balanceBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  balanceBadgeText: {
    color: colors.darkCharcoal,
    fontSize: width * 0.03,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  balanceDetailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  balanceDetailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  incomeIcon: {
    backgroundColor: THEME_COLORS.success.main,
  },
  expenseIcon: {
    backgroundColor: THEME_COLORS.danger.main,
  },
  iconText: {
    fontSize: width * 0.05,
    color: colors.darkCharcoal,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    ...commonStyles.bodyText2,
    color: colors.darkCharcoal,
    fontSize: width * 0.03,
    marginBottom: 2,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  detailAmount: {
    color: colors.darkCharcoal,
    fontSize: width * 0.035,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  verticalDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: SPACING.md,
  },
  filterContainer: {
    marginBottom: SPACING.md,
  },
  filterScrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 2,
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  filterOptionSelected: {
    backgroundColor: THEME_COLORS.secondary.main,
    borderColor: THEME_COLORS.secondary.light,
  },
  filterText: {
    ...TYPOGRAPHY.body2,
    color: colors.silver,
    marginLeft: SPACING.xs,
  },
  filterTextSelected: {
    color: THEME_COLORS.primary.main,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: THEME_COLORS.secondary.main,
    marginRight: SPACING.xs,
    fontSize: width * 0.035,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  cardDate: {
    color: colors.silver,
    fontSize: width * 0.03,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginTop: SPACING.xs,
  },
  aiStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 15,
    gap: SPACING.xs,
  },
  aiStatusText: {
    fontSize: width * 0.03,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  retryButton: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: THEME_COLORS.secondary.main,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
    fontSize: TYPOGRAPHY.body2.fontSize,
  },
  dateRangeContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.sm,
    borderRadius: 10,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.lg,
  },
  dateRangeText: {
    ...TYPOGRAPHY.body2,
    color: colors.white,
    textAlign: 'center',
  },
  dateRangePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SPACING.lg,
  },
  dateRangePickerContent: {
    borderRadius: 20,
    padding: SPACING.lg,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  datePickerTitle: {
    ...TYPOGRAPHY.h3,
    color: colors.white,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  dateInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.sm,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  dateInputText: {
    ...TYPOGRAPHY.body2,
    color: colors.white,
    marginLeft: SPACING.sm,
  },
  quickSelectContainer: {
    marginBottom: SPACING.lg,
  },
  quickSelectTitle: {
    ...TYPOGRAPHY.body1,
    color: colors.silver,
    marginBottom: SPACING.sm,
  },
  quickSelectContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickSelectButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.sm,
    borderRadius: 15,
    marginRight: SPACING.sm,
  },
  quickSelectButtonText: {
    ...TYPOGRAPHY.caption,
    color: colors.white,
  },
  applyButton: {
    backgroundColor: THEME_COLORS.accent.main,
    padding: SPACING.md,
    borderRadius: 15,
    alignItems: 'center',
  },
  applyButtonText: {
    ...TYPOGRAPHY.button,
    color: colors.white,
  },
  healthScoreCard: {
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 20,
  },
  healthScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  healthScoreTitle: {
    ...TYPOGRAPHY.h3,
    color: colors.white,
  },
  infoButton: {
    padding: SPACING.xs,
  },
  healthScoreContent: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  scoreCircle: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  scoreText: {
    ...TYPOGRAPHY.h1,
  },
  scoreLabel: {
    ...TYPOGRAPHY.h3,
    color: colors.white,
  },
  healthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    ...TYPOGRAPHY.caption,
    color: colors.silver,
    marginBottom: SPACING.xs,
  },
  metricValue: {
    ...TYPOGRAPHY.body1,
    color: colors.white,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: SPACING.lg,
    borderRadius: 20,
    backgroundColor: THEME_COLORS.primary.light,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    color: colors.white,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  dateSelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.md,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  dateInputDisabled: {
    opacity: 0.5,
  },
  dateInputText: {
    ...TYPOGRAPHY.body2,
    color: colors.white,
    marginLeft: SPACING.sm,
  },
  quickSelectContainer: {
    marginTop: SPACING.md,
  },
  quickSelectTitle: {
    ...TYPOGRAPHY.subtitle2,
    color: colors.silver,
    marginBottom: SPACING.sm,
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickSelectButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.sm,
    borderRadius: 12,
    minWidth: '45%',
    alignItems: 'center',
  },
  quickSelectButtonText: {
    ...TYPOGRAPHY.caption,
    color: colors.white,
  },
});