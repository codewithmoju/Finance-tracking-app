import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from "react-native";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  setDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import ColorPicker from "react-native-wheel-color-picker";
import HomeHeader from "../../Components/HomeHeader";
import { LinearGradient } from "expo-linear-gradient";
import { 
  colors, 
  THEME_COLORS, 
  SPACING, 
  commonStyles, 
  TYPOGRAPHY 
} from "../../global/styles";
import { Fonts } from "../../../assets/fonts/fonts";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

const { width, height } = Dimensions.get("window");

const AddIncome = ({ navigation }) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [userCategories, setUserCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch user-created categories
  useEffect(() => {
    const fetchCategories = async () => {
      const userId = auth.currentUser?.uid;
      const categoriesQuery = query(
        collection(db, "incomeCategories"), // Change to incomeCategories
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(categoriesQuery);
      const categoriesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUserCategories(categoriesList);
      setLoadingCategories(false);
    };

    fetchCategories();
  }, []);

  const handleAddIncome = async () => {
    const userId = auth.currentUser?.uid;

    try {
      let categoryId;
      const existingCategory = userCategories.find(
        (cat) => cat.name === category
      );

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Add new income category
        const newCategoryRef = doc(collection(db, "incomeCategories")); // Change to incomeCategories
        await setDoc(newCategoryRef, {
          userId: userId,
          name: category,
          color: selectedColor,
        });
        categoryId = newCategoryRef.id;
      }

      const newIncome = {
        userId: userId,
        amount: Number(amount),
        description: description,
        categoryId: categoryId,
        date: date.toISOString().split("T")[0],
        currency: currency,
      };
      await addDoc(collection(db, "income"), newIncome); // Change to income
      Alert.alert("Success", "Income added successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error adding income:", error);
      Alert.alert("Error adding income", error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, commonStyles.container]}>
      <Text style={styles.header}>Add Income</Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Amount Input Section */}
        <LinearGradient
          colors={THEME_COLORS.gradient.glass}
          style={[styles.card, commonStyles.glassMorphism]}
        >
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="attach-money"
              size={24}
              color={colors.silver}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor={colors.silver}
            />
          </View>
        </LinearGradient>

        {/* Description Input Section */}
        <LinearGradient
          colors={THEME_COLORS.gradient.glass}
          style={[styles.card, commonStyles.glassMorphism]}
        >
          <View style={styles.inputContainer}>
            <MaterialIcons name="description" size={24} color={colors.silver} />
            <TextInput
              style={styles.input}
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={colors.silver}
            />
          </View>
        </LinearGradient>

        {/* Currency Input Section */}
        <LinearGradient
          colors={THEME_COLORS.gradient.glass}
          style={[styles.card, commonStyles.glassMorphism]}
        >
          <View style={styles.inputContainer}>
            <FontAwesome6 name="money-bill" size={24} color={colors.silver} />
            <TextInput
              style={styles.input}
              placeholder="Enter currency (e.g., USD)"
              value={currency}
              onChangeText={setCurrency}
              placeholderTextColor={colors.silver}
            />
          </View>
        </LinearGradient>

        {/* Categories Section */}
        <Text style={styles.sectionTitle}>Select Category</Text>
        {loadingCategories ? (
          <Text style={styles.loadingText}>Loading categories...</Text>
        ) : (
          <FlatList
            data={userCategories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setCategory(item.name);
                  setSelectedColor(item.color);
                }}
              >
                <LinearGradient
                  colors={[item.color, `${item.color}80`]}
                  style={[
                    styles.categoryButton,
                    category === item.name && styles.selectedCategory,
                  ]}
                >
                  <Text style={styles.categoryText}>{item.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Custom Category Section */}
        <Text style={styles.sectionTitle}>Add New Category</Text>
        <LinearGradient
          colors={THEME_COLORS.gradient.glass}
          style={[styles.card, commonStyles.glassMorphism]}
        >
          <View style={styles.inputContainer}>
            <MaterialIcons name="category" size={24} color={colors.silver} />
            <TextInput
              style={styles.input}
              placeholder="Enter new category name"
              value={category}
              onChangeText={setCategory}
              placeholderTextColor={colors.silver}
            />
          </View>
        </LinearGradient>

        {/* Color Picker Section */}
        <Text style={styles.sectionTitle}>Category Color</Text>
        <LinearGradient
          colors={THEME_COLORS.gradient.glass}
          style={[styles.colorPickerCard, commonStyles.glassMorphism]}
        >
          <View
            style={[styles.colorPreview, { backgroundColor: selectedColor }]}
          />
          <ColorPicker
            style={styles.colorPicker}
            onColorChange={setSelectedColor}
            hideSliders={true}
          />
        </LinearGradient>

        {/* Date Picker Section */}
        <Text style={styles.sectionTitle}>Select Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <LinearGradient
            colors={THEME_COLORS.gradient.glass}
            style={[styles.dateButton, commonStyles.glassMorphism]}
          >
            <MaterialIcons
              name="calendar-today"
              size={24}
              color={colors.silver}
            />
            <Text style={styles.dateText}>{date.toDateString()}</Text>
          </LinearGradient>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {/* Add Button */}
        <TouchableOpacity onPress={handleAddIncome}>
          <LinearGradient
            colors={THEME_COLORS.gradient.success}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>Add Income</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.richBlack,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  header: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    color: THEME_COLORS.text.primary,
    fontWeight: "bold",
    textAlign: "center",
  },
  card: {
    marginBottom: SPACING.md,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: TYPOGRAPHY.body1.fontSize,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: colors.white,
    marginVertical: SPACING.md,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  categoriesList: {
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  categoryButton: {
    padding: SPACING.md,
    borderRadius: 12,
    marginRight: SPACING.sm,
    minWidth: width * 0.25,
    alignItems: "center",
  },
  selectedCategory: {
    borderWidth: 2,
    borderColor: colors.goldAccent,
  },
  categoryText: {
    ...TYPOGRAPHY.body2,
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  colorPickerCard: {
    padding: SPACING.md,
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  colorPicker: {
    height: width * 0.5,
    width: "100%",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  dateText: {
    ...TYPOGRAPHY.body1,
    color: colors.white,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  addButton: {
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  addButtonText: {
    ...TYPOGRAPHY.h3,
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: colors.silver,
    textAlign: "center",
  },
});

export default AddIncome;
