import React, { useEffect, useState, useCallback } from "react";
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
import { auth, db } from "../../../firebaseConfig"; // Ensure firebase is configured correctly
import { PieChart } from "react-native-chart-kit";
import HomeHeader from "../../Components/HomeHeader";
import { colors } from "../../global/styles";

const screenWidth = Dimensions.get("window").width;

const IncomeCategories = () => {
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [incomeTransactions, setIncomeTransactions] = useState([]);
  const [incomePieChartData, setIncomePieChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedIncomeCategory, setSelectedIncomeCategory] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const updateIncomePieChartData = useCallback(() => {
    const incomeTotals = {};
    incomeCategories.forEach(category => {
      const categoryTransactions = incomeTransactions.filter(t => t.categoryId === category.id);
      const totalAmount = categoryTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      incomeTotals[category.id] = totalAmount;
    });

    const pieChartData = incomeCategories.map(category => ({
      name: category.name,
      value: incomeTotals[category.id] || 0,
      color: category.color || '#000000',
      legendFontColor: "#FFF",
      legendFontSize: 15,
    })).filter(item => item.value > 0);


    if (pieChartData.length === 0) {
      pieChartData.push({
        name: "No Data",
        value: 1,
        color: "#CCCCCC",
        legendFontColor: "#FFF",
        legendFontSize: 15,
      });
    }

    setIncomePieChartData(pieChartData);
  }, [incomeCategories, incomeTransactions]);

  useEffect(() => {
    const fetchIncomeData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          // Fetch income categories
          const incomeCategoriesRef = collection(db, "incomeCategories");
          const incomeCategoriesQuery = query(
            incomeCategoriesRef,
            where("userId", "==", userId)
          );
          const unsubscribeCategories = onSnapshot(
            incomeCategoriesQuery,
            (snapshot) => {
              const fetchedIncomeCategories = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setIncomeCategories(fetchedIncomeCategories);
            }
          );

          // Fetch income transactions
          const incomeTransactionsRef = collection(db, "income");
          const incomeTransactionsQuery = query(
            incomeTransactionsRef,
            where("userId", "==", userId)
          );
          const unsubscribeTransactions = onSnapshot(
            incomeTransactionsQuery,
            (snapshot) => {
              const fetchedIncomeTransactions = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                amount: parseFloat(doc.data().amount) || 0,
              }));
              setIncomeTransactions(fetchedIncomeTransactions);
            }
          );

          return () => {
            unsubscribeCategories();
            unsubscribeTransactions();
          };
        } catch (err) {
          console.error("Error fetching income data:", err);
          setErrorMessage("Failed to load income data. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchIncomeData();
  }, []);

  useEffect(() => {
    if (incomeCategories.length > 0 && incomeTransactions.length > 0) {
      updateIncomePieChartData();
    }
  }, [incomeCategories, incomeTransactions, updateIncomePieChartData]);

  const handleIncomeCategoryPress = (category) => {
    setSelectedIncomeCategory(category);
    setIsModalVisible(true);
  };

  const renderIncomeCategory = ({ item }) => {
    const categoryTransactions = incomeTransactions.filter(
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
        onPress={() => handleIncomeCategoryPress(item)}
      >
        <Text style={styles.categoryAmount}>{`${totalAmount.toFixed(
          2
        )} ${currency}`}</Text>
        <Text style={styles.categoryName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderIncomeTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.transactionText}>{item.description}</Text>
      <Text style={styles.transactionAmount}>
        {item.amount.toFixed(2)} {item.currency}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <HomeHeader title={"Income Categories"} iconName={"arrow-back"} />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.goldAccent} />
        </View>
      ) : errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : (
        <>
          {/* Income Pie Chart */}
          {incomePieChartData.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <PieChart
                data={incomePieChartData}
                width={screenWidth * 0.95}
                height={250}
                chartConfig={{
                  backgroundColor: "#121212",
                  backgroundGradientFrom: "#1E1E1E",
                  backgroundGradientTo: "#121212",
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </ScrollView>
          )}

          {/* Income Category Cards */}
          <FlatList
            data={incomeCategories}
            renderItem={renderIncomeCategory}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
          />

          {/* Modal for Income Transactions */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Income Transactions for {selectedIncomeCategory?.name}
                </Text>
                <FlatList
                  data={incomeTransactions.filter(
                    (t) => t.categoryId === selectedIncomeCategory?.id
                  )}
                  renderItem={renderIncomeTransaction}
                  keyExtractor={(item) => item.id}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      No income transactions found for this category
                    </Text>
                  }
                />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsModalVisible(false)}
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

export default IncomeCategories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.richBlack,
  },
  categoryCard: {
    flex: 1,
    padding: 20,
    margin: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  categoryName: {
    fontSize: 16,
    color: colors.white,
    marginTop: 10,
  },
  row: {
    justifyContent: "space-between",
  },
  transactionItem: {
    padding: 15,
    backgroundColor: "#1E1E1E",
    borderRadius: 5,
    marginBottom: 10,
  },
  transactionText: {
    fontSize: 18,
    color: colors.white,
  },
  transactionAmount: {
    fontSize: 16,
    color: colors.goldAccent,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: colors.white,
  },
  closeButton: {
    backgroundColor: colors.goldAccent,
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
  },
  closeButtonText: {
    color: colors.richBlack,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
  emptyText: {
    color: colors.white,
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
