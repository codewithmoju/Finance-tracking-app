import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Platform,
  ActivityIndicator,
  Keyboard,
  Animated,
  StatusBar,
} from "react-native";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  setDoc,
  doc,
  writeBatch,
  orderBy,
  limit,
} from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import ColorPicker from "react-native-wheel-color-picker";
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
import { useCurrency } from '../../global/CurrencyContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get("window");

// Enhanced AI patterns for income categories
const INCOME_PATTERNS = {
  salary: {
    keywords: ['salary', 'wage', 'paycheck', 'pay', 'compensation'],
    emoji: '💰',
    icon: 'account-balance',
    suggestions: ['Set monthly reminder?', 'Track taxes?', 'Compare with last month?']
  },
  freelance: {
    keywords: ['freelance', 'contract', 'gig', 'project', 'client'],
    emoji: '💻',
    icon: 'laptop',
    suggestions: ['Generate invoice?', 'Track hours?', 'Set project milestone?']
  },
  investment: {
    keywords: ['dividend', 'interest', 'stock', 'crypto', 'return'],
    emoji: '📈',
    icon: 'trending-up',
    suggestions: ['Track portfolio?', 'Set price alert?', 'Compare returns?']
  },
  rental: {
    keywords: ['rent', 'lease', 'tenant', 'property', 'airbnb'],
    emoji: '🏠',
    icon: 'home',
    suggestions: ['Schedule maintenance?', 'Track expenses?', 'Set payment reminder?']
  },
  business: {
    keywords: ['sales', 'revenue', 'profit', 'business', 'earning'],
    emoji: '🏢',
    icon: 'store',
    suggestions: ['Track inventory?', 'Compare revenue?', 'Generate report?']
  },
  bonus: {
    keywords: ['bonus', 'commission', 'incentive', 'reward'],
    emoji: '🌟',
    icon: 'star',
    suggestions: ['Set performance goal?', 'Compare with target?', 'Track progress?']
  }
};

// Category icons mapping
const CATEGORY_ICONS = {
  salary: "account-balance",
  freelance: "laptop",
  investment: "trending-up",
  rental: "home",
  business: "store",
  bonus: "star",
  gift: "card-giftcard",
  other: "attach-money"
};

const GradientCard = React.memo(({ children, colors: gradientColors, style }) => (
  <LinearGradient
    colors={gradientColors || THEME_COLORS.gradient.glass}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[styles.gradientCard, style]}
  >
    {children}
  </LinearGradient>
));

const CategoryItem = React.memo(({ item, onSelect, isSelected, onDelete }) => (
  <TouchableOpacity 
    style={styles.categoryItemContainer}
    onPress={() => {
      Haptics.selectionAsync();
      onSelect(item);
    }}
  >
    <GradientCard
      colors={[item.color, `${item.color}80`]}
      style={[
        styles.categoryButton,
        isSelected && styles.selectedCategory,
      ]}
    >
      <MaterialIcons 
        name={CATEGORY_ICONS[item.id.toLowerCase()] || "attach-money"} 
        size={24} 
        color={colors.white} 
      />
      <Text style={styles.categoryText}>{item.name}</Text>
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Alert.alert(
              'Delete Category',
              'This will delete all income entries in this category. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => onDelete(item)
                }
              ]
            );
          }}
        >
          <MaterialIcons name="delete" size={20} color={colors.white} />
        </TouchableOpacity>
      )}
    </GradientCard>
  </TouchableOpacity>
));

// Enhanced quick add with AI suggestions
const QuickAddCard = React.memo(({ item, onPress }) => {
  const pattern = INCOME_PATTERNS[item.category.toLowerCase()];
  const emoji = pattern?.emoji || '💰';
  
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(item);
      }}
      style={styles.quickAddItem}
    >
      <GradientCard
        colors={[item.color, `${item.color}80`]}
        style={styles.quickAddCard}
      >
        <Text style={styles.quickAddEmoji}>{emoji}</Text>
        <Text style={styles.quickAddText}>{item.category}</Text>
        <Text style={styles.quickAddAmount}>
          {item.amount} {item.currency}
        </Text>
        <Text style={styles.quickAddDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </GradientCard>
    </TouchableOpacity>
  );
});

// Memoized smart suggestion component
const SmartSuggestions = React.memo(({ description, onSuggestionPress }) => {
  const [suggestions, setSuggestions] = useState([]);
  
  useEffect(() => {
    if (!description) {
      setSuggestions([]);
      return;
    }

    const words = description.toLowerCase().split(' ');
    const matchedPatterns = [];

    Object.entries(INCOME_PATTERNS).forEach(([category, data]) => {
      if (data.keywords.some(keyword => words.some(word => word.includes(keyword)))) {
        matchedPatterns.push({
          category,
          emoji: data.emoji,
          suggestions: data.suggestions
        });
      }
    });

    setSuggestions(matchedPatterns);
  }, [description]);

  if (!suggestions.length) return null;

  return (
    <View style={styles.smartSuggestionsContainer}>
      {suggestions.map((pattern, index) => (
        <View key={index} style={styles.suggestionGroup}>
          <Text style={styles.suggestionCategory}>
            {pattern.emoji} {pattern.category.charAt(0).toUpperCase() + pattern.category.slice(1)}
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          >
            {pattern.suggestions.map((suggestion, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSuggestionPress(suggestion, pattern.category);
                }}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
});

// AI Category Intelligence Component
const CategorySuggestions = React.memo(({ description, onSelect, loading }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!description) {
      setSuggestions([]);
      return;
    }

    setAnalyzing(true);
    const timer = setTimeout(() => {
      // Simulate AI analysis delay
      analyzeCategoryFromDescription(description)
        .then(newSuggestions => {
          setSuggestions(newSuggestions);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }).start();
        })
        .finally(() => setAnalyzing(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [description]);

  if (!description || (!analyzing && !suggestions.length)) return null;

  return (
    <Animated.View 
      style={[
        styles.suggestionsContainer,
        { opacity: fadeAnim }
      ]}
    >
      {analyzing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={THEME_COLORS.accent.main} />
          <Text style={styles.loadingText}>Analyzing description...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.suggestionsTitle}>
            Suggested Categories
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(suggestion);
                }}
                style={styles.suggestionCard}
              >
                <LinearGradient
                  colors={[suggestion.color, `${suggestion.color}80`]}
                  style={styles.suggestionGradient}
                >
                  <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
                  <Text style={styles.suggestionName}>{suggestion.name}</Text>
                  <Text style={styles.suggestionConfidence}>
                    {suggestion.confidence}% match
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
    </Animated.View>
  );
});

// AI Analysis Functions
const analyzeCategoryFromDescription = async (description) => {
  // Simulate AI processing
  const words = description.toLowerCase().split(' ');
  const suggestions = [];

  Object.entries(INCOME_PATTERNS).forEach(([category, data]) => {
    const matchCount = data.keywords.filter(keyword => 
      words.some(word => word.includes(keyword))
    ).length;

    if (matchCount > 0) {
      suggestions.push({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        emoji: data.emoji,
        color: getColorForCategory(category),
        confidence: Math.min(matchCount * 25, 95),
        icon: data.icon
      });
    }
  });

  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence);
};

const getColorForCategory = (category) => {
  const colors = {
    salary: '#4CAF50',
    freelance: '#2196F3',
    investment: '#9C27B0',
    rental: '#FF9800',
    business: '#3F51B5',
    bonus: '#F44336'
  };
  return colors[category] || '#666666';
};

const AddIncome = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  // State management
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    selectedColor: "#00b894",
    date: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { currency } = useCurrency();
  const [userCategories, setUserCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const [recentIncomes, setRecentIncomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  
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

  // Add this useEffect to hide the navigation header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  // Memoized functions
  const suggestCategories = useCallback((description) => {
    if (!description) {
      setSuggestedCategories([]);
      return;
    }

    const words = description.toLowerCase().split(' ');
    const matches = [];

    Object.entries(INCOME_PATTERNS).forEach(([category, data]) => {
      if (data.keywords.some(keyword => words.some(word => word.includes(keyword)))) {
        const existingCategory = userCategories.find(c => c.id.toLowerCase() === category);
        if (existingCategory) {
          matches.push(existingCategory);
        }
      }
    });

    setSuggestedCategories(matches);
  }, [userCategories]);

  // Load categories and recent incomes
  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setLoadingCategories(false);
          return;
        }

        // Fetch categories
        const categoriesQuery = query(
          collection(db, "incomeCategories"),
          where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(categoriesQuery);
        const categoriesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          name: doc.data().name || '',
          color: doc.data().color || '#00b894',
          icon: CATEGORY_ICONS[doc.data().name.toLowerCase()] || "attach-money"
        })).filter(cat => cat.name.trim() !== '');

        // Fetch recent incomes
        const recentIncomesQuery = query(
          collection(db, "income"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        
        const recentIncomesSnap = await getDocs(recentIncomesQuery);
        const recentIncomesList = recentIncomesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setUserCategories(categoriesList);
        setRecentIncomes(recentIncomesList);

        // Animate in the content
        Animated.parallel([
          Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          }),
        ]).start();

      } catch (error) {
        console.error("Error loading data:", error);
        Alert.alert("Error", "Failed to load categories and recent incomes");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadData();
  }, [headerOpacity]);

  // Handle form updates
  const updateFormField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'description') {
      suggestCategories(value);
    }
  }, [suggestCategories]);

  // Quick-add from recent income
  const handleQuickAdd = useCallback((income) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFormData(prev => ({
      ...prev,
      amount: income.amount.toString(),
      category: income.category,
      selectedColor: income.color || "#00b894"
    }));
  }, []);

  // Enhanced form handling with AI suggestions
  const handleDescriptionChange = useCallback((text) => {
    updateFormField('description', text);
    if (aiEnabled) {
      // AI processing handled by CategorySuggestions component
    }
  }, [aiEnabled, updateFormField]);

  // Handle category selection
  const handleCategorySelect = useCallback((suggestion) => {
    updateFormField('category', suggestion.name);
    updateFormField('selectedColor', suggestion.color);
    
    // Animate selection
    Animated.sequence([
      Animated.timing(submitScale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(submitScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  }, [updateFormField]);

  // Handle AI suggestions
  const handleSuggestionPress = useCallback((suggestion, category) => {
    if (suggestion.includes('reminder')) {
      Alert.alert('Reminder', 'Would you like to set a payment reminder?', [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Set Reminder',
          onPress: () => {
            // TODO: Integrate with calendar
            Alert.alert('Success', 'Reminder will be set up in the next update!');
          }
        }
      ]);
    } else if (suggestion.includes('track')) {
      Alert.alert('Track Income', 'Would you like to enable detailed tracking?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable',
          onPress: () => {
            // TODO: Enable tracking
            Alert.alert('Success', 'Tracking will be enabled in the next update!');
          }
        }
      ]);
    } else if (suggestion.includes('invoice')) {
      Alert.alert('Generate Invoice', 'Would you like to generate an invoice?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: () => {
            // TODO: Invoice generation
            Alert.alert('Success', 'Invoice generation coming in the next update!');
          }
        }
      ]);
    }
  }, []);

  // Handle category deletion
  const handleDeleteCategory = useCallback(async (category) => {
    try {
      setLoading(true);
      const batch = writeBatch(db);

      // Delete category
      const categoryRef = doc(db, "incomeCategories", category.id);
      batch.delete(categoryRef);

      // Delete all incomes in this category
      const incomesRef = collection(db, "income");
      const q = query(
        incomesRef,
        where("userId", "==", auth.currentUser?.uid),
        where("categoryId", "==", category.id)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      // Update local state
      setUserCategories(prev => prev.filter(c => c.id !== category.id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error deleting category:", error);
      Alert.alert("Error", "Failed to delete category. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [auth.currentUser?.uid]);

  // Form validation and submission
  const handleAddIncome = async () => {
    if (isSubmitting) return;
    
    const errors = [];
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      errors.push("Please enter a valid amount greater than 0");
    }
    if (!formData.description.trim()) {
      errors.push("Please enter a description");
    }
    if (!formData.category.trim()) {
      errors.push("Please select or create a category");
    }
    if (!currency.trim()) {
      errors.push("Please enter a currency");
    }
    
    if (errors.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Form Validation", errors.join("\n"));
      return false;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "Please sign in to add income");
      return;
    }

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const batch = writeBatch(db);

      // Handle category
      let categoryId;
      const existingCategory = userCategories.find(
        (cat) => cat.name.toLowerCase() === formData.category.toLowerCase()
      );

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const newCategoryRef = doc(collection(db, "incomeCategories"));
        const categoryData = {
          userId,
          name: formData.category.trim(),
          color: formData.selectedColor,
          icon: suggestCategoryIcon(formData.category),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          type: 'income'
        };
        batch.set(newCategoryRef, categoryData);
        categoryId = newCategoryRef.id;
      }

      // Create income document
      const incomeRef = doc(collection(db, "income"));
      const incomeData = {
        userId,
        amount: Number(formData.amount),
        description: formData.description.trim(),
        categoryId,
        category: formData.category.trim(),
        color: formData.selectedColor,
        date: formData.date.toISOString(),
        currency: currency.trim().toUpperCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: 'income',
        status: 'active',
        metadata: {
          deviceType: Platform.OS,
          appVersion: '1.0.0',
        }
      };
      batch.set(incomeRef, incomeData);

      await batch.commit();

      Alert.alert(
        'Success', 
        'Income added successfully',
        [
          {
            text: 'Add Another',
            onPress: () => {
              setFormData({
                amount: "",
                description: "",
                category: "",
                selectedColor: "#00b894",
                date: new Date()
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
            style: 'cancel',
          },
          {
            text: 'Go Back',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error adding income:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to add income. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    for (const [category, keywords] of Object.entries(INCOME_PATTERNS)) {
      if (keywords.keywords.some(keyword => name.includes(keyword))) {
        return CATEGORY_ICONS[category];
      }
    }
    return "attach-money";
  };

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
          <Text style={styles.headerTitle}>Add Income</Text>
          <Text style={styles.headerSubtitle}>
            Track your earnings with ease ✨
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

        {/* Enhanced Quick Add Section */}
        {recentIncomes.length > 0 && (
          <View style={styles.quickAddSection}>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickAddContainer}
            >
              {recentIncomes.map((income) => (
                <QuickAddCard
                  key={income.id}
                  item={income}
                  onPress={handleQuickAdd}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Amount Input Section */}
        <GradientCard style={[styles.card, commonStyles.glassMorphism]}>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="attach-money"
              size={24}
              color={colors.silver}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={formData.amount}
              onChangeText={(text) => updateFormField('amount', text.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.silver}
              maxLength={10}
            />
            <Text style={styles.currencyText}>{currency}</Text>
          </View>
        </GradientCard>

        {/* Enhanced Description Input with AI */}
        <GradientCard style={[styles.card, commonStyles.glassMorphism]}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="description" size={24} color={colors.silver} />
            <TextInput
              style={styles.input}
              placeholder="Enter description"
              value={formData.description}
              onChangeText={handleDescriptionChange}
              placeholderTextColor={colors.silver}
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
        </GradientCard>

        {/* AI-Powered Suggestions */}
        <SmartSuggestions
          description={formData.description}
          onSuggestionPress={handleSuggestionPress}
        />

        {/* Category Suggestions */}
        {suggestedCategories.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionTitle}>Suggested Categories</Text>
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
                    updateFormField('category', category.name);
                    updateFormField('selectedColor', category.color);
                  }}
                  style={styles.suggestionItem}
                >
                  <GradientCard
                    colors={[category.color, `${category.color}80`]}
                    style={styles.suggestionCard}
                  >
                    <MaterialIcons
                      name={CATEGORY_ICONS[category.name.toLowerCase()] || "attach-money"}
                      size={20}
                      color={colors.white}
                    />
                    <Text style={styles.suggestionText}>{category.name}</Text>
                  </GradientCard>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* AI Category Suggestions */}
        <CategorySuggestions
          description={formData.description}
          onSelect={handleCategorySelect}
          loading={loading}
        />

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.sectionSubtitle}>
            Long press a category to delete it and its income entries
          </Text>
        </View>

        {loadingCategories ? (
          <ActivityIndicator size="large" color={THEME_COLORS.accent.main} />
        ) : (
          <FlatList
            data={userCategories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => (
              <CategoryItem
                item={item}
                onSelect={handleCategorySelect}
                isSelected={formData.category === item.name}
                onDelete={handleDeleteCategory}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No categories found</Text>
            }
          />
        )}

        {/* Custom Category Section */}
        <Text style={styles.sectionTitle}>Add New Category</Text>
        <GradientCard style={[styles.card, commonStyles.glassMorphism]}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="category" size={24} color={colors.silver} />
            <TextInput
              style={styles.input}
              placeholder="Enter new category name"
              value={formData.category}
              onChangeText={(text) => updateFormField('category', text)}
              placeholderTextColor={colors.silver}
              maxLength={20}
            />
          </View>
        </GradientCard>

        {/* Color Picker Section */}
        <Text style={styles.sectionTitle}>Category Color</Text>
        <GradientCard style={[styles.colorPickerCard, commonStyles.glassMorphism]}>
          <View
            style={[styles.colorPreview, { backgroundColor: formData.selectedColor }]}
          />
          <ColorPicker
            style={styles.colorPicker}
            color={formData.selectedColor}
            onColorChange={(color) => updateFormField('selectedColor', color)}
            hideSliders={true}
            thumbSize={40}
            sliderSize={40}
            noSnap={true}
            row={false}
          />
        </GradientCard>

        {/* Date Picker Section */}
        <Text style={styles.sectionTitle}>Select Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <GradientCard style={[styles.dateButton, commonStyles.glassMorphism]}>
            <MaterialIcons
              name="calendar-today"
              size={24}
              color={colors.silver}
            />
            <Text style={styles.dateText}>
              {formData.date.toLocaleDateString()}
            </Text>
          </GradientCard>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) updateFormField('date', selectedDate);
            }}
            maximumDate={new Date()}
          />
        )}

        {/* Add Button */}
        <Animated.View style={[
          styles.submitButtonContainer,
          { transform: [{ scale: submitScale }] }
        ]}>
          <TouchableOpacity
            onPress={handleAddIncome}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={THEME_COLORS.gradient.success}
              style={styles.addButton}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <MaterialIcons name="add" size={24} color={colors.white} />
                  <Text style={styles.addButtonText}>Add Income</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAwareScrollView>

      {/* Submit Button with Animation */}
      <Animated.View style={[
        styles.submitContainer,
        { 
          transform: [{ scale: submitScale }],
          paddingBottom: insets.bottom || SPACING.md
        }
      ]}>
        <TouchableOpacity
          onPress={handleAddIncome}
          disabled={loading}
        >
          <LinearGradient
            colors={THEME_COLORS.gradient.success}
            style={styles.submitButton}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <MaterialIcons name="add" size={24} color={colors.white} />
                <Text style={styles.submitText}>Add Income</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
    paddingBottom: SPACING.xl * 2,
  },
  headerContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  header: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    color: THEME_COLORS.text.primary,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  subHeader: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.secondary,
    textAlign: "center",
  },
  quickAddSection: {
    marginBottom: SPACING.lg,
  },
  quickAddContainer: {
    paddingHorizontal: SPACING.sm,
    gap: SPACING.sm,
  },
  quickAddItem: {
    marginRight: SPACING.sm,
  },
  quickAddCard: {
    padding: SPACING.md,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: width * 0.25,
  },
  quickAddText: {
    ...TYPOGRAPHY.caption,
    color: colors.white,
    marginTop: SPACING.xs,
  },
  quickAddAmount: {
    ...TYPOGRAPHY.body2,
    color: colors.white,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  gradientCard: {
    borderRadius: 15,
    overflow: 'hidden',
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
  currencyText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginLeft: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: colors.white,
    marginVertical: SPACING.md,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
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
  categoriesList: {
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  categoryItemContainer: {
    marginRight: SPACING.sm,
  },
  categoryButton: {
    padding: SPACING.md,
    borderRadius: 12,
    minWidth: width * 0.25,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  submitButtonContainer: {
    marginTop: SPACING.xl,
  },
  addButton: {
    padding: SPACING.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    gap: SPACING.sm,
  },
  disabledButton: {
    opacity: 0.7,
  },
  addButtonText: {
    ...TYPOGRAPHY.h3,
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  emptyText: {
    ...TYPOGRAPHY.body2,
    color: colors.silver,
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
  smartSuggestionsContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  suggestionGroup: {
    marginBottom: SPACING.md,
  },
  suggestionCategory: {
    ...TYPOGRAPHY.subtitle1,
    color: THEME_COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  suggestionsList: {
    paddingHorizontal: SPACING.xs,
    gap: SPACING.sm,
  },
  suggestionChip: {
    backgroundColor: `${THEME_COLORS.accent.main}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  suggestionText: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.accent.main,
  },
  quickAddEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  quickAddDate: {
    ...TYPOGRAPHY.caption,
    color: colors.white,
    marginTop: SPACING.xs,
    opacity: 0.8,
  },
  header: {
    width: '100%',
    paddingVertical: SPACING.lg,
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
  contentContainer: {
    padding: SPACING.lg,
  },
  card: {
    marginBottom: SPACING.md,
    borderRadius: 15,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  input: {
    flex: 1,
    color: colors.white,
    ...TYPOGRAPHY.body1,
    marginHorizontal: SPACING.sm,
  },
  aiToggle: {
    padding: SPACING.xs,
  },
  suggestionsContainer: {
    marginVertical: SPACING.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: colors.silver,
    marginLeft: SPACING.sm,
  },
  suggestionsTitle: {
    ...TYPOGRAPHY.subtitle1,
    color: colors.white,
    marginBottom: SPACING.sm,
  },
  suggestionsList: {
    paddingVertical: SPACING.xs,
  },
  suggestionCard: {
    marginRight: SPACING.sm,
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionGradient: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  suggestionEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  suggestionName: {
    ...TYPOGRAPHY.body2,
    color: colors.white,
    marginVertical: SPACING.xs,
  },
  suggestionConfidence: {
    ...TYPOGRAPHY.caption,
    color: colors.white,
    opacity: 0.8,
  },
  submitContainer: {
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    backgroundColor: 'transparent',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  deleteButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  sectionContainer: {
    marginBottom: SPACING.md,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: colors.silver,
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
});

export default React.memo(AddIncome);
