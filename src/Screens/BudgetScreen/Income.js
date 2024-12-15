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
import { colors } from "../../global/styles";

import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView as GestureHandlerScrollView } from "react-native-gesture-handler";
import { THEME_COLORS, SPACING, TYPOGRAPHY } from "../../global/styles";

const { width, height } = Dimensions.get("window");

const Income = ({ navigation }) => {
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = auth.currentUser?.uid;
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
      income.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [incomes, searchTerm]); // Only re-compute when incomes or searchTerm changes

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
      <View style={styles.incomeItem}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={[styles.categoryColor, { backgroundColor: item.categoryColor || "#000" }]}
            />
            <Text
              style={[styles.incomeCategory, { color: item.categoryColor || "#000" }]}
            >
              {item.category}
            </Text>
          </View>
          <View>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>

        <Text
          style={[styles.incomeAmount, { color: item.categoryColor || "#000" }]}
        >
          {item.amount} {item.currency}
        </Text>
        <View style={{ flexWrap: "wrap" }}>
          <Text style={styles.incomeText}>{item.description}</Text>
        </View>

        <View style={styles.IncomeButtonsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              navigation.navigate("EditIncome", { incomeId: item.id })
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
            onPress={() => handleDeleteIncome(item.id)}
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
              setSelectedIncome(item);
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
      <Text style={styles.header}>Incomes</Text>
      <View style={styles.inputView}>
        <TextInput
          placeholder="Search incomes"
          placeholderTextColor={colors.white}
          style={styles.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate("IncomeCategories")}
        >
          <AntDesign name="bars" size={width * 0.08} color={colors.white} />
        </TouchableOpacity>
      </View>
      <Text style={styles.filterText}>Filter Income</Text>
      {renderFilterButtons()}
      <Text style={styles.filterText}>Income History</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : error ? (
        <Text style={styles.text}>{error}</Text>
      ) : (
        <FlatList
          data={filteredIncomes}
          renderItem={renderIncome}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.text}>No Income found</Text>}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
      <View style={styles.addIncomeContainer}>
        <TouchableOpacity
          style={styles.addIncomeBtn}
          onPress={() => navigation.navigate("AddIncome")}
        >
          <FontAwesome6
            name="add"
            size={width * 0.08}
            color={colors.white}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      {/* Modal for viewing income details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedIncome(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {selectedIncome && (
              <>
                <Text
                  style={[
                    styles.modalCategory,
                    { color: selectedIncome.categoryColor || "#000" },
                  ]}
                >
                  Category: {selectedIncome.category}
                </Text>

                <Text
                  style={[
                    styles.modalAmount,
                    { color: selectedIncome.categoryColor || "#000" },
                  ]}
                >
                  {selectedIncome.amount} {selectedIncome.currency}
                </Text>
                <View style={{ flexWrap: "wrap" }}>
                  <Text style={styles.modalText}>
                    {selectedIncome.description}
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

export default React.memo(Income);

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
  filterText: {
    color: colors.white,
    marginLeft: 15,
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  text: {
    color: colors.white,
    fontSize: width * 0.04,
    fontWeight: "bold",
  },
  incomeItem: {
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
  dateText: {
    fontSize: width * 0.04,
    color: colors.silver,
    fontWeight: "bold",
  },
  addIncomeContainer: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    margin: 20,
    position: "absolute",
    bottom: height * 0.03,
    right: width * 0.03,
    backgroundColor: colors.silver,
    borderRadius: 20,
  },
  addIncomeBtn: {
    width: width * 0.15,
    height: width * 0.15,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
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
  IncomeButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  incomeAmount: {
    fontSize: width * 0.07,
    fontWeight: "bold",
    color: THEME_COLORS.danger.main,
  },
  incomeText: {
    fontSize: width * 0.045,
    color: THEME_COLORS.text.secondary,
    padding: 10,
  },
  incomeCategory: {
    fontSize: width * 0.04,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  categoryColor: {
    width: 24,
    height: 24,
    borderRadius: 10,
  },
  icon: {
    margin: 10,
  },
});