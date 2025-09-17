import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
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
import { THEME_COLORS, SPACING, TYPOGRAPHY, colors, commonStyles } from "../../global/styles";
import { LinearGradient } from "expo-linear-gradient";
import { Fonts } from "../../../assets/fonts/fonts";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCurrency } from '../../global/CurrencyContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { suggestIncomeCategory } from '../../services/AIService';

const { width } = Dimensions.get("window");

// Income patterns for AI suggestions
const INCOME_PATTERNS = {
  salary: {
    keywords: ['salary', 'wage', 'pay', 'paycheck', 'compensation'],
    emoji: '💰'
  },
  freelance: {
    keywords: ['freelance', 'contract', 'gig', 'project'],
    emoji: '💻'
  },
  investment: {
    keywords: ['dividend', 'interest', 'stock', 'bond', 'investment'],
    emoji: '📈'
  },
  rental: {
    keywords: ['rent', 'lease', 'tenant', 'property'],
    emoji: '🏠'
  },
  business: {
    keywords: ['sale', 'profit', 'revenue', 'business'],
    emoji: '🏢'
  }
};

const EditIncome = ({ route, navigation }) => {
  const { incomeId } = route.params;
  const insets = useSafeAreaInsets();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryColor, setCategoryColor] = useState("#000000");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currency } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [suggestedCategories, setSuggestedCategories] = useState([]);

  // Animation refs
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const submitScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate header on mount
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, []);

  // Hide navigation header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  useEffect(() => {
    fetchIncomeDetails();
    fetchCategories();
  }, []);

  const fetchIncomeDetails = async () => {
    try {
      const incomeRef = doc(db, "income", incomeId);
      const incomeSnap = await getDoc(incomeRef);
      if (incomeSnap.exists()) {
        const income = incomeSnap.data();
        setDescription(income.description || "");
        setAmount(income.amount ? income.amount.toString() : "");
        setSelectedCategory(income.categoryId || null);
      } else {
        setError("Income not found");
      }
    } catch (error) {
      console.error("Error fetching income details:", error);
      setError("Failed to fetch income details");
    }
  };

  const fetchCategories = async () => {
    try {
      const userId = auth.currentUser.uid;
      const categoriesRef = collection(db, "incomeCategories");
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
      setError("Failed to fetch categories");
      setLoading(false);
    }
  };

  const handleSaveIncome = async () => {
    try {
      setIsSubmitting(true);
      const incomeRef = doc(db, "income", incomeId);
      await updateDoc(incomeRef, {
        description: description,
        amount: parseFloat(amount),
        categoryId: selectedCategory,
      });

      if (selectedCategory) {
        const categoryRef = doc(db, "incomeCategories", selectedCategory);
        await updateDoc(categoryRef, {
          color: categoryColor,
        });
      }

      Alert.alert("Success", "Income updated successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating income:", error);
      Alert.alert("Error", "Failed to update income");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add AI suggestion function
  const suggestCategories = useCallback((description) => {
    if (!description) {
      setSuggestedCategories([]);
      return;
    }

    const words = description.toLowerCase().split(' ');
    const matches = [];

    Object.entries(INCOME_PATTERNS).forEach(([category, data]) => {
      if (data.keywords.some(keyword => words.some(word => word.includes(keyword)))) {
        const existingCategory = categories.find(c => c.name.toLowerCase() === category);
        if (existingCategory) {
          matches.push(existingCategory);
        }
      }
    });

    setSuggestedCategories(matches);
  }, [categories]);

  // Handle description change with AI
  const handleDescriptionChange = async (text) => {
    setDescription(text);
    if (aiEnabled && text.length > 2) {
      suggestCategories(text);
      try {
        setLoading(true);
        const suggestion = await suggestIncomeCategory(text);
        if (suggestion) {
          const matchingCategory = categories.find(
            c => c.name.toLowerCase() === suggestion.toLowerCase()
          );
          if (matchingCategory) {
            setSuggestedCategories(prev => 
              [...prev, matchingCategory].filter((v, i, a) => 
                a.findIndex(t => t.id === v.id) === i
              )
            );
          }
        }
      } catch (error) {
        console.error('AI suggestion error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Header with Back Button */}
      <LinearGradient
        colors={THEME_COLORS.gradient.income}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <MaterialIcons name="arrow-back-ios" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>💰</Text>
          <Text style={styles.headerTitle}>Edit Income</Text>
          <Text style={styles.headerSubtitle}>
            Update your income details ✨
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        enableOnAndroid
        enableAutomaticScroll
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + SPACING.xl }
        ]}
      >
        {/* Amount Input */}
        <View style={[styles.card, commonStyles.glassMorphism]}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="attach-money" size={24} color={colors.silver} />
            <TextInput
              placeholder="Edit Amount"
              placeholderTextColor={colors.silver}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
              maxLength={10}
            />
            <Text style={styles.currencyText}>{currency}</Text>
          </View>
        </View>

        {/* Description Input with AI */}
        <View style={[styles.card, commonStyles.glassMorphism]}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="description" size={24} color={colors.silver} />
            <TextInput
              placeholder="Edit Description"
              placeholderTextColor={colors.silver}
              value={description}
              onChangeText={handleDescriptionChange}
              style={styles.input}
              maxLength={100}
            />
            <TouchableOpacity
              onPress={() => setAiEnabled(!aiEnabled)}
              style={styles.aiToggle}
            >
              <MaterialIcons
                name={aiEnabled ? "psychology" : "psychology-alt"}
                size={24}
                color={aiEnabled ? THEME_COLORS.accent.main : colors.silver}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Suggestions */}
        {aiEnabled && suggestedCategories.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionTitle}>AI Suggestions</Text>
    <ScrollView
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {suggestedCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedCategory(category.id);
                    setCategoryColor(category.color || "#000000");
                  }}
                  style={styles.suggestionItem}
                >
                  <LinearGradient
                    colors={[category.color, `${category.color}80`]}
                    style={styles.suggestionCard}
                  >
                    <MaterialIcons
                      name="lightbulb"
                      size={20}
                      color={colors.white}
                    />
                    <Text style={styles.suggestionText}>{category.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.sectionSubtitle}>
            Select a category for your income
          </Text>
        </View>

      <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                {
                  backgroundColor:
                    selectedCategory === item.id
                      ? item.color
                      : THEME_COLORS.secondary.main,
                },
                selectedCategory === item.id && styles.selectedCategory,
              ]}
              onPress={() => {
                setSelectedCategory(item.id);
                setCategoryColor(item.color || "#000000");
              }}
            >
              <Text style={styles.categoryText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No categories found</Text>
        }
        />

        {/* Color Picker Section */}
        <Text style={styles.sectionTitle}>Category Color</Text>
        <View style={[styles.colorPickerCard, commonStyles.glassMorphism]}>
          <View
            style={[styles.colorPreview, { backgroundColor: categoryColor }]}
          />
          <ColorPicker
            style={styles.colorPicker}
            color={categoryColor}
            onColorChange={setCategoryColor}
            hideSliders
            thumbSize={40}
            sliderSize={40}
            noSnap
            row={false}
          />
        </View>

        {/* Add margin top to separate from color picker */}
        <View style={styles.buttonSpacer} />

        {/* Submit Button with Animation */}
        <Animated.View style={[
          styles.submitContainer,
          { 
            transform: [{ scale: submitScale }],
            paddingBottom: insets.bottom || SPACING.md
          }
        ]}>
          <TouchableOpacity
            onPress={handleSaveIncome}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={THEME_COLORS.gradient.success}
              style={styles.submitButton}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <MaterialIcons name="save" size={24} color={colors.white} />
                  <Text style={styles.submitText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.dark,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 40,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: SPACING.lg,
    zIndex: 1,
    padding: SPACING.xs,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 20 : 10,
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
    padding: SPACING.xs,
  },
  sectionContainer: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: colors.white,
    marginVertical: SPACING.md,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: colors.silver,
  },
  categoriesList: {
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  categoryButton: {
    padding: SPACING.md,
    borderRadius: 12,
    minWidth: width * 0.25,
    alignItems: "center",
    marginRight: SPACING.sm,
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
    borderRadius: 15,
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
  submitContainer: {
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    backgroundColor: 'transparent',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  submitText: {
    color: colors.white,
    fontSize: TYPOGRAPHY.h3.fontSize,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    color: THEME_COLORS.text.primary,
    textAlign: "center",
    marginVertical: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.secondary,
    textAlign: "center",
    marginVertical: SPACING.md,
  },
  currencyText: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: colors.silver,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginLeft: SPACING.sm,
  },
  buttonSpacer: {
    height: SPACING.xl,
  },
  suggestionsContainer: {
    marginBottom: SPACING.lg,
  },
  suggestionTitle: {
    ...TYPOGRAPHY.body2,
    color: THEME_COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  suggestionsScroll: {
    paddingHorizontal: SPACING.sm,
    gap: SPACING.sm,
  },
  suggestionItem: {
    marginRight: SPACING.sm,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    gap: SPACING.xs,
  },
  suggestionText: {
    ...TYPOGRAPHY.caption,
    color: colors.white,
  },
  aiToggle: {
    padding: SPACING.xs,
  },
});

export default EditIncome;
