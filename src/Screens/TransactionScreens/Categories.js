import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import { PieChart } from "react-native-chart-kit";
import { colors, THEME_COLORS,SPACING,TYPOGRAPHY } from "../../global/styles";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

const screenWidth = Dimensions.get("window").width;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const userId = auth.currentUser?.uid;
    if (userId) {
      try {
        // Fetch categories
        const categoriesRef = collection(db, "categories");
        const categoriesQuery = query(
          categoriesRef,
          where("userId", "==", userId)
        );
        const unsubscribeCategories = onSnapshot(
          categoriesQuery,
          (snapshot) => {
            const fetchedCategories = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setCategories(fetchedCategories);
            updateChartData(fetchedCategories, transactions);
          }
        );

        // Fetch transactions
        const transactionsRef = collection(db, "transactions");
        const transactionsQuery = query(
          transactionsRef,
          where("userId", "==", userId)
        );
        const unsubscribeTransactions = onSnapshot(
          transactionsQuery,
          (snapshot) => {
            const fetchedTransactions = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setTransactions(fetchedTransactions);
            updateChartData(categories, fetchedTransactions);
          }
        );

        setLoading(false);

        return () => {
          unsubscribeCategories();
          unsubscribeTransactions();
        };
      } catch (err) {
        setError("Failed to load data. Please try again.");
        setChartData([]);
      }
    }
  };

  const updateChartData = (categories, transactions) => {
    if (categories.length === 0 || transactions.length === 0) {
      setChartData([]);
      return;
    }

    const chartData = categories.map((category) => {
      const categoryTransactions = transactions.filter(
        (t) => t.categoryId === category.id
      );
      const totalAmount = categoryTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
      );

      return {
        name: category.name,
        population: totalAmount,
        color: category.color,
        legendFontColor: "#FFF",
        legendFontSize: 15,
      };
    });

    setChartData(chartData);
  };

  const handleCategoryPress = (category) => {
    setSelectedCategory(category);
    setModalVisible(true);
  };

  const renderCategory = ({ item }) => {
    const categoryTransactions = transactions.filter(
      (t) => t.categoryId === item.id
    );
    const totalAmount = categoryTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const currency = categoryTransactions[0]?.currency || "PKR";

    return (
      <TouchableOpacity
        style={[styles.categoryCard, { backgroundColor: item.color }]}
        onPress={() => handleCategoryPress(item)}
      >
        <View style={styles.categoryContent}>
          <Text style={styles.categoryAmount}>{`${totalAmount.toFixed(2)} ${currency}`}</Text>
          <Text style={styles.categoryName}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.transactionText}>{item.description}</Text>
      <Text style={styles.transactionAmount}>
        {item.amount.toFixed(2)} {item.currency}
      </Text>
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLORS.accent.main} />
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <Text style={styles.header}>Categories</Text>
          {/* Pie Chart */}
          {chartData.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <PieChart
                data={chartData}
                width={screenWidth * 0.95}
                height={250}
                chartConfig={{
                  backgroundColor: THEME_COLORS.primary.light,
                  backgroundGradientFrom: THEME_COLORS.primary.main,
                  backgroundGradientTo: THEME_COLORS.primary.light,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
              />
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>No data available for the chart.</Text>
          )}

          {/* Category Cards */}
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />

          {/* Modal for Transactions */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Transactions for {selectedCategory?.name}
                </Text>
                <FlatList
                  data={transactions.filter(
                    (t) => t.categoryId === selectedCategory?.id
                  )}
                  renderItem={renderTransaction}
                  keyExtractor={(item) => item.id}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      No transactions found for this category
                    </Text>
                  }
                />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

export default Categories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.main,
    paddingTop: SPACING.xl,
  },
  header: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    color: THEME_COLORS.text.primary,
    fontWeight: "bold",
    marginVertical: SPACING.md,
    textAlign: "center",
  },
  categoryCard: {
    flex: 1,
    padding: SPACING.lg,
    margin: SPACING.sm,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  categoryContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.md,
  },
  categoryAmount: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: "bold",
    color: THEME_COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
  noDataText: {
    color: THEME_COLORS.text.secondary,
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalContent: {
    backgroundColor: THEME_COLORS.primary.light,
    padding: SPACING.lg,
    borderRadius: 20,
    marginHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: THEME_COLORS.text.primary,
  },
  closeButton: {
    backgroundColor: THEME_COLORS.accent.main,
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
  },
  closeButtonText: {
    color: THEME_COLORS.text.primary,
    fontSize: 16,
  },
  transactionItem: {
    padding: 15,
    backgroundColor: THEME_COLORS.background.card,
    borderRadius: 5,
    marginBottom: 10,
  },
  transactionText: {
    fontSize: 18,
    color: THEME_COLORS.text.primary,
  },
  transactionAmount: {
    fontSize: 16,
    color: THEME_COLORS.accent.main,
  },
  emptyText: {
    color: colors.white,
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
});
