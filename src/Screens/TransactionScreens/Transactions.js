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
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import { colors, THEME_COLORS,SPACING,TYPOGRAPHY } from "../../global/styles";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView as GestureHandlerScrollView } from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");

const Transactions = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = auth.currentUser?.uid;
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCategories = useCallback(async () => {
    if (userId) {
      try {
        const categoriesRef = collection(db, "categories");
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

  const fetchTransactions = useCallback(
    async (latestCategories) => {
      if (userId) {
        setLoading(true);
        setError(null);
        try {
          const transactionsRef = collection(db, "transactions");
          let q = query(transactionsRef, where("userId", "==", userId));

          if (filter === "today") {
            const today = new Date().toISOString().split("T")[0];
            q = query(q, where("date", "==", today));
          }
          // Add more filter conditions here for "this week", "this month", "this year"

          const querySnapshot = await getDocs(q);
          const userTransactions = querySnapshot.docs.map((doc) => {
            const transaction = { id: doc.id, ...doc.data() };
            if (
              transaction.categoryId &&
              latestCategories[transaction.categoryId]
            ) {
              transaction.category =
                latestCategories[transaction.categoryId].name;
              transaction.categoryColor =
                latestCategories[transaction.categoryId].color;
            } else {
              transaction.category = "Uncategorized";
              transaction.categoryColor = "#000000";
            }
            return transaction;
          });

          setTransactions(userTransactions);
        } catch (error) {
          console.error("Error fetching transactions:", error);
          setError("Error fetching transactions. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    },
    [userId, filter]
  );

  const refreshData = useCallback(async () => {
    const latestCategories = await fetchCategories();
    await fetchTransactions(latestCategories);
  }, [fetchCategories, fetchTransactions]);

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
      <View style={styles.transactionItem}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.cardIconContainer}>
              <View
                style={[
                  styles.categoryColor,
                  { backgroundColor: item.categoryColor || "#000" },
                ]}
              />
            </View>
            <Text
              style={[
                styles.transactionCategory,
                { color: item.categoryColor || "#000" },
              ]}
            >
              {item.category}
            </Text>
          </View>
          <View>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        </View>

        <Text style={[styles.transactionAmount,{color:item.categoryColor || '#FFFFFF'}]}>
          {item.amount} {item.currency}
        </Text>
        <View style={{ flexWrap: "wrap" }}>
          <Text style={styles.transactionText}>{item.description}</Text>
        </View>

        <View style={styles.transactionButtonsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              navigation.navigate("EditTransaction", { transactionId: item.id })
            }
          >
            <FontAwesome6
              name="edit"
              size={width * 0.07}
              color={colors.white}
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteTransaction(item.id)}
          >
            <MaterialIcons
              name="delete"
              size={width * 0.07}
              color={colors.white}
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              setSelectedTransaction(item);
              setModalVisible(true);
            }}
          >
            <Entypo
              name="resize-full-screen"
              size={width * 0.07}
              color={colors.white}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>
    ),
    []
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const filterOptions = [
    "all",
    "today",
    "this week",
    "this month",
    "this year",
  ];

  const renderFilterButtons = () => (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => setFilter(option)}
            style={[
              styles.filterButton,
              filter === option && styles.activeFilter,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === option && styles.activeFilterText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <Text style={styles.header}>Transactions</Text>
      <View style={styles.inputView}>
        <TextInput
          placeholder="Search transactions"
          placeholderTextColor={colors.white}
          style={styles.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity onPress={() => navigation.navigate("Categories")}>
          <AntDesign name="bars" size={width * 0.08} color={colors.white} />
        </TouchableOpacity>
      </View>
      <Text style={styles.filtertext}>Filter Transactions</Text>
      {renderFilterButtons()}
      <Text style={styles.filtertext}>Transaction History</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : error ? (
        <Text style={styles.Text}>{error}</Text>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.Text}>No transactions found</Text>
          }
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
      <View style={styles.AddTransactionContainer}>
        <TouchableOpacity
          style={styles.AddTransactionBtn}
          onPress={() => navigation.navigate("AddTransaction")}
        >
          <FontAwesome6
            name="add"
            size={width * 0.08}
            color={colors.white}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      {/* Modal for viewing transaction details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedTransaction(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {selectedTransaction && (
              <>
                <Text
                  style={[
                    styles.modalCategory,
                    { color: selectedTransaction.categoryColor || "#000" },
                  ]}
                >
                  Category: {selectedTransaction.category}
                </Text>

                <Text
                  style={[
                    styles.modalAmount,
                    { color: selectedTransaction.categoryColor || "#000" },
                  ]}
                >
                  {selectedTransaction.amount} {selectedTransaction.currency}
                </Text>
                <View style={{ flexWrap: "wrap" }}>
                  <Text style={styles.modalText}>
                    {selectedTransaction.description}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default React.memo(Transactions);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.main,
    paddingTop: height * 0.02,
  },
  header: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    color: THEME_COLORS.text.primary,
    fontWeight: "bold",
    marginVertical: SPACING.md,
    textAlign: "center",
  },
  input: {
    height: height * 0.08,
    width: width * 0.8,
    backgroundColor: THEME_COLORS.background.card,
    color: THEME_COLORS.text.primary,
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
    borderWidth: 1,
    borderColor: THEME_COLORS.secondary.main,
  },
  inputView: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  filterButton: {
    backgroundColor: THEME_COLORS.secondary.main,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  activeFilter: {
    backgroundColor: THEME_COLORS.accent.main,
  },
  filterButtonText: {
    color: THEME_COLORS.text.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  activeFilterText: {
    color: colors.richBlack,
  },
  filtertext: {
    color: colors.white,
    marginLeft: 15,
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  Text: {
    color: colors.white,
    fontSize: width * 0.04,
    fontWeight: "bold",
  },
  transactionItem: {
    backgroundColor: THEME_COLORS.background.card,
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  transactionAmount: {
    fontSize: width * 0.07,
    fontWeight: "bold",
    color: THEME_COLORS.danger.main,
  },
  transactionText: {
    fontSize: width * 0.045,
    color: THEME_COLORS.text.secondary,
    padding: 10,
  },
  transactionCategory: {
    fontSize: width * 0.04,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  categoryColor: {
    width: 24,
    height: 24,
    borderRadius: 10,
  },
  AddTransactionContainer: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    margin: 20,
    position: "absolute",
    bottom: height * 0.03,
    right: width * 0.03,
    backgroundColor: colors.silver,
    borderRadius: 20,
  },
  AddTransactionBtn: {
    width: width * 0.15,
    height: width * 0.15,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  transactionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  icon: {
    margin: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: colors.gunmetalGray,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    width: width * 0.9,
  },
  modalCategory: {
    fontSize: width * 0.06,
    fontWeight: "bold",
  },
  modalAmount: {
    fontSize: width * 0.06,
    fontWeight: "bold",
  },
  modalText: {
    fontSize: width * 0.05,
    color: colors.white,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: THEME_COLORS.danger.main,
    padding: height * 0.02,
    borderRadius: 10,
    marginTop: height * 0.02,
  },
  closeButtonText: {
    color: THEME_COLORS.text.primary,
    fontWeight: "bold",
    fontSize: width * 0.05,
  },
  date: {
    fontSize: width * 0.04,
    color: colors.silver,
    fontWeight: "bold",
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
});
