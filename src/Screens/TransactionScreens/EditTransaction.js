import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Alert,
  ScrollView,
} from "react-native";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import ColorPicker from "react-native-wheel-color-picker";
import { THEME_COLORS, SPACING, TYPOGRAPHY } from "../../global/styles";

const EditTransactionScreen = ({ route, navigation }) => {
  const { transactionId } = route.params;
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryColor, setCategoryColor] = useState("#000000");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    fetchTransactionDetails();
    fetchCategories();
  }, []);

  const fetchTransactionDetails = async () => {
    try {
      const transactionRef = doc(db, "transactions", transactionId);
      const transactionSnap = await getDoc(transactionRef);
      if (transactionSnap.exists()) {
        const transaction = transactionSnap.data();
        setDescription(transaction.description || "");
        setAmount(transaction.amount ? transaction.amount.toString() : "");
        setSelectedCategory(transaction.categoryId || null);
        setCategoryColor(transaction.categoryColor || "#000000");
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      Alert.alert("Error", "Failed to fetch transaction details");
    }
  };

  const fetchCategories = async () => {
    try {
      const userId = auth.currentUser.uid;
      const categoriesRef = collection(db, "categories");
      const q = query(categoriesRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "Failed to fetch categories");
      setLoading(false);
    }
  };

  const handleSaveTransaction = async () => {
    try {
      const transactionRef = doc(db, "transactions", transactionId);
      await updateDoc(transactionRef, {
        description: description,
        amount: parseFloat(amount),
        categoryId: selectedCategory,
      });

      if (selectedCategory) {
        const categoryRef = doc(db, "categories", selectedCategory);
        await updateDoc(categoryRef, {
          color: categoryColor,
        });
      }

      Alert.alert("Success", "Transaction updated successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating transaction:", error);
      Alert.alert("Error", "Failed to update transaction");
    }
  };

  const renderItem = ({ item }) => {
    switch (item.type) {
      case "category":
        return (
          <TouchableOpacity
            style={[
              styles.categoryItem,
              {
                backgroundColor:
                  selectedCategory === item.id
                    ? item.color
                    : THEME_COLORS.secondary.main,
              },
            ]}
            onPress={() => {
              setSelectedCategory(item.id);
              setCategoryColor(item.color || "#000000");
            }}
          >
            <Text style={styles.categoryText}>{item.name}</Text>
          </TouchableOpacity>
        );
      case "colorPicker":
        return (
          <View style={styles.colorPickerContainer}>
            <Text style={styles.subHeader}>Change Category Color</Text>
            <ColorPicker
              color={categoryColor}
              onColorChange={setCategoryColor}
              thumbSize={40}
              sliderSize={20}
              noSnap={true}
              row={false}
            />
          </View>
        );
      case "description":
        return (
          <TextInput
            placeholder="Edit Description"
            placeholderTextColor={THEME_COLORS.text.secondary}
            value={description}
            onChangeText={setDescription}
            style={styles.input}
          />
        );
      case "amount":
        return (
          <TextInput
            placeholder="Edit Amount"
            placeholderTextColor={THEME_COLORS.text.secondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const listData = [
    { type: "header", id: "header" },
    { type: "description", id: "description" },
    { type: "amount", id: "amount" },
    { type: "categoryHeader", id: "categoryHeader" },
    ...categories.map((category) => ({ ...category, type: "category" })),
    { type: "colorPicker", id: "colorPicker" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <FlatList
        data={listData}
        renderItem={({ item }) => {
          switch (item.type) {
            case "header":
              return <Text style={styles.header}>Edit Transaction</Text>;
            case "description":
            case "amount":
              return renderItem({ item });
            case "categoryHeader":
              return <Text style={styles.subHeader}>Select Category</Text>;
            default:
              return renderItem({ item });
          }
        }}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No categories found</Text>
        }
        ListFooterComponent={
          <TouchableOpacity
            style={styles.button}
            onPress={handleSaveTransaction}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        }
        contentContainerStyle={styles.container}
      />
    </ScrollView>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.main,
    paddingTop: SPACING.xl,
     paddingBottom: SPACING.lg,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  header: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    color: THEME_COLORS.text.primary,
    fontWeight: "bold",
    marginVertical: SPACING.md,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.secondary.light,
    backgroundColor: THEME_COLORS.background.card,
    color: THEME_COLORS.text.primary,
    borderRadius: 5,
    marginBottom: SPACING.sm,
  },
  subHeader: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    color: THEME_COLORS.text.primary,
    fontWeight: "bold",
    marginBottom: SPACING.sm,
  },
  categoryItem: {
    padding: SPACING.md,
    borderRadius: 5,
    marginBottom: SPACING.sm,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.primary,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.secondary,
    textAlign: "center",
    marginVertical: SPACING.md,
  },
  button: {
    backgroundColor: THEME_COLORS.accent.main,
    padding: SPACING.md,
    borderRadius: 5,
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  buttonText: {
    color: THEME_COLORS.text.primary,
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: "bold",
  },
  loadingText: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    color: THEME_COLORS.text.primary,
    textAlign: "center",
    marginVertical: SPACING.md,
  },
  colorPickerContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
});

export default EditTransactionScreen;
