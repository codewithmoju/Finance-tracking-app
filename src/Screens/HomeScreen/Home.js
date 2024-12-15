import React, { useState, useEffect, useCallback } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { colors } from "../../global/styles";
import { Fonts, loadFonts } from "../../../assets/fonts/fonts";
import { auth, db } from "../../../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect
import { Dimensions } from "react-native"; // Import Dimensions
import { commonStyles } from "../../global/styles";
import { THEME_COLORS } from "../../global/styles";
import { SPACING } from "../../global/styles";

const { width, height } = Dimensions.get("window"); // Get screen dimensions

const Home = () => {
  // State variables to manage application data
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [userData, setUserData] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState({});
  const [expenseCategories, setExpenseCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCurrency, setUserCurrency] = useState("$"); // Default currency symbol

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          await loadFonts(); // Load custom fonts
          setFontsLoaded(true);
          await fetchAllData(); // Fetch all necessary data in one go
          setLoading(false);
        } catch (err) {
          console.error("Error loading data:", err);
          setError(err.message);
          setLoading(false);
        }
      };

      loadData(); // Call loadData when the screen is focused

      const backAction = () => {
        if (userData) {
          // If user is logged in, close the app
          BackHandler.exitApp();
          return true; // Prevent default back action
        }
        return false; // Allow default back action
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => {
        backHandler.remove(); // Cleanup the event listener
      };
    }, [userData]) // Dependency on userData
  );

  // Fetch all user-related data in a single function
  const fetchAllData = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    // Fetch user data
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      setUserData(userData);

      // Check if currency exists and set it
      const currency = userData.currency; // Adjust this if the field name is different
      if (currency) {
        setUserCurrency(currency); // Set the currency from user data
      } else {
        setUserCurrency("$"); // Fallback to default currency
      }
    } else {
      console.error("User document does not exist");
    }

    // Fetch incomes and transactions
    const incomesQuery = query(
      collection(db, "income"),
      where("userId", "==", user.uid)
    );
    const incomesSnapshot = await getDocs(incomesQuery);
    const incomesData = incomesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setIncomes(incomesData);
    const totalIncome = incomesData.reduce(
      (sum, income) => sum + income.amount,
      0
    );
    setTotalIncome(totalIncome);

    // Fetch transactions
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const transactionsData = transactionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTransactions(transactionsData);
    const totalExpenses = transactionsData.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    setTotalExpenses(totalExpenses);

    // Fetch currency from transactions and incomes
    const incomeCurrency =
      incomesData.length > 0 ? incomesData[0].currency : "$"; // Default to $ if not found
    const transactionCurrency =
      transactionsData.length > 0 ? transactionsData[0].currency : "$"; // Default to $ if not found

    // Set user currency based on fetched data
    setUserCurrency(incomeCurrency || transactionCurrency || "$"); // Fallback to default currency

    // Fetch categories
    await fetchCategories(user.uid);
    calculateRemainingBalance(totalIncome, totalExpenses); // Calculate remaining balance
  };

  // Fetch both income and expense categories
  const fetchCategories = async (userId) => {
    // Fetch income categories
    const incomeCategoriesQuery = query(
      collection(db, "incomeCategories"),
      where("userId", "==", userId)
    );
    const incomeCategoriesSnapshot = await getDocs(incomeCategoriesQuery);
    const incomeCategoriesData = {};
    incomeCategoriesSnapshot.docs.forEach((doc) => {
      incomeCategoriesData[doc.id] = doc.data().color; // Store category color
    });
    setIncomeCategories(incomeCategoriesData);

    // Fetch expense categories
    const expenseCategoriesQuery = query(
      collection(db, "categories"),
      where("userId", "==", userId)
    );
    const expenseCategoriesSnapshot = await getDocs(expenseCategoriesQuery);
    const expenseCategoriesData = {};
    expenseCategoriesSnapshot.docs.forEach((doc) => {
      expenseCategoriesData[doc.id] = doc.data().color; // Store category color
    });
    setExpenseCategories(expenseCategoriesData);
  };

  // Calculate remaining balance
  const calculateRemainingBalance = (income, expenses) => {
    setRemainingBalance(income - expenses); // Calculate remaining balance
  };

  // Render income item with currency
  const renderIncomeItem = ({ item }) => (
    <LinearGradient
      colors={THEME_COLORS.gradient.glass}
      style={[styles.card, commonStyles.glassMorphism]}
    >
      <View style={styles.cardContentContainer}>
        <View style={styles.cardIconContainer}>
          {/* You can add an icon here based on category */}
          <View
            style={[
              styles.categoryIndicator,
              {
                backgroundColor:
                  incomeCategories[item.color] || THEME_COLORS.success.main,
              },
            ]}
          />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.cardAmount}>
            +{userCurrency}
            {item.amount.toFixed(2)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  // Render transaction item with currency
  const renderTransactionItem = ({ item }) => (
    <LinearGradient
      colors={THEME_COLORS.gradient.glass}
      style={[styles.card, commonStyles.glassMorphism]}
    >
      <View style={styles.cardContentContainer}>
        <View style={styles.cardIconContainer}>
          <View
            style={[
              styles.categoryIndicator,
              {
                backgroundColor:
                  expenseCategories[item.color] || THEME_COLORS.danger.main,
              },
            ]}
          />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={[styles.cardAmount, styles.expenseAmount]}>
            -{userCurrency}
            {item.amount.toFixed(2)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  // Loading and error handling
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.secondary.main} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  // Main UI when data is fetched
  if (!fontsLoaded || !userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load fonts or user data</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, commonStyles.container]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Enhanced Profile Section */}
        <View style={styles.profileSection}>
          <View style={commonStyles.row}>
            <Image
              source={{ uri: userData.profileImageUrl }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.welcomeText, commonStyles.caption]}>
                Welcome back,
              </Text>
              <Text style={[styles.name, commonStyles.heading2]}>
                {userData.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Enhanced Balance Card */}
        <LinearGradient
          colors={THEME_COLORS.gradient.premium}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.balanceCard, commonStyles.premiumCard]}
        >
          {/* Balance Header */}
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>
                {userCurrency}
                {remainingBalance.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Balance Details */}
          <View style={styles.balanceDetailsContainer}>
            {/* Income Detail */}
            <View style={styles.balanceDetailItem}>
              <View style={[styles.iconContainer, styles.incomeIcon]}>
                <Text style={styles.iconText}>↑</Text>
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Income</Text>
                <Text style={styles.detailAmount}>
                  {userCurrency}
                  {totalIncome.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.verticalDivider} />

            {/* Expense Detail */}
            <View style={styles.balanceDetailItem}>
              <View style={[styles.iconContainer, styles.expenseIcon]}>
                <Text style={styles.iconText}>↓</Text>
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

        {/* Recent Incomes Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, commonStyles.heading3]}>
            Recent Incomes
          </Text>
          <FlatList
            data={incomes.slice(0, 5)}
            renderItem={renderIncomeItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, commonStyles.heading3]}>
            Recent Transactions
          </Text>
          <FlatList
            data={transactions.slice(0, 5)}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      </ScrollView>
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
    padding: SPACING.md,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.richBlack,
  },
  loadingText: {
    color: colors.white,
    fontSize: 16,
    marginTop: 10,
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
});
