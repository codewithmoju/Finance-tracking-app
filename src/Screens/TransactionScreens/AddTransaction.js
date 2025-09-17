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
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
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
  TYPOGRAPHY,
} from "../../global/styles";
import { Fonts } from "../../../assets/fonts/fonts";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCurrency } from '../../global/CurrencyContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get("window");

// Enhanced AI patterns for better category detection
const SMART_PATTERNS = {
  food: {
    keywords: ['restaurant', 'cafe', 'lunch', 'dinner', 'breakfast', 'meal', 'food'],
    emoji: '🍽️',
    icon: 'restaurant',
    suggestions: ['Add location?', 'Save as frequent?', 'Add to budget?']
  },
  transport: {
    keywords: ['uber', 'taxi', 'bus', 'train', 'gas', 'fuel', 'parking'],
    emoji: '🚗',
    icon: 'directions-car',
    suggestions: ['Add route?', 'Business or personal?', 'Save receipt?']
  },
  shopping: {
    keywords: ['amazon', 'store', 'mall', 'shop', 'buy', 'purchase'],
    emoji: '🛍️',
    icon: 'shopping-cart',
    suggestions: ['Add to wishlist?', 'Track delivery?', 'Save warranty?']
  },
  utilities: {
    keywords: ['electricity', 'water', 'internet', 'phone', 'bill', 'utility'],
    emoji: '💡',
    icon: 'lightbulb',
    suggestions: ['Set reminder?', 'Compare rates?', 'Track usage?']
  },
  entertainment: {
    keywords: ['movie', 'game', 'netflix', 'spotify', 'fun', 'entertainment'],
    emoji: '🎮',
    icon: 'movie',
    suggestions: ['Share expense?', 'Add to subscriptions?', 'Set budget limit?']
  },
  health: {
    keywords: ['doctor', 'medicine', 'hospital', 'clinic', 'medical', 'health'],
    emoji: '🏥',
    icon: 'local-hospital',
    suggestions: ['Add to health records?', 'Insurance claim?', 'Set follow-up?']
  },
  education: {
    keywords: ['school', 'course', 'book', 'class', 'tuition', 'education'],
    emoji: '📚',
    icon: 'school',
    suggestions: ['Track progress?', 'Set study reminder?', 'Add to goals?']
  }
};

// Category icons mapping
const CATEGORY_ICONS = {
  food: "restaurant",
  transport: "directions-car",
  shopping: "shopping-cart",
  utilities: "lightbulb",
  entertainment: "movie",
  health: "local-hospital",
  education: "school",
  rent: "home",
  groceries: "local-grocery-store",
  others: "category"
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
        name={CATEGORY_ICONS[item.id.toLowerCase()] || "category"} 
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
              'This will delete all transactions in this category. Are you sure?',
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
  const pattern = SMART_PATTERNS[item.category.toLowerCase()];
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
      </GradientCard>
    </TouchableOpacity>
  );
});

// Enhanced AI patterns for better category detection
const CATEGORY_SUGGESTIONS = {
  food: ['restaurant', 'cafe', 'lunch', 'dinner', 'breakfast', 'meal', 'food'],
  transport: ['uber', 'taxi', 'bus', 'train', 'gas', 'fuel', 'parking'],
  shopping: ['amazon', 'store', 'mall', 'shop', 'buy', 'purchase'],
  utilities: ['electricity', 'water', 'internet', 'phone', 'bill', 'utility'],
  entertainment: ['movie', 'game', 'netflix', 'spotify', 'fun', 'entertainment'],
  health: ['doctor', 'medicine', 'hospital', 'clinic', 'medical', 'health'],
  education: ['school', 'course', 'book', 'class', 'tuition', 'education'],
  rent: ['rent', 'house', 'apartment', 'housing', 'mortgage'],
  groceries: ['grocery', 'supermarket', 'food', 'market'],
  others: []
};

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

  Object.entries(SMART_PATTERNS).forEach(([category, data]) => {
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
    food: '#FF6B6B',
    transport: '#4ECDC4',
    shopping: '#45B7D1',
    utilities: '#96CEB4',
    entertainment: '#FFEEAD',
    health: '#D4A5A5',
    education: '#9B9B9B'
  };
  return colors[category] || '#666666';
};

const AddTransaction = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    selectedColor: "#d63031",
    date: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { currency } = useCurrency();
  const [userCategories, setUserCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const [recentCategories, setRecentCategories] = useState([]);
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

    Object.entries(CATEGORY_SUGGESTIONS).forEach(([category, keywords]) => {
      if (keywords.some(keyword => words.some(word => word.includes(keyword)))) {
        const existingCategory = userCategories.find(c => c.id.toLowerCase() === category);
        if (existingCategory) {
          matches.push(existingCategory);
        }
      }
    });

    setSuggestedCategories(matches);
  }, [userCategories]);

  // Enhanced form handling with AI
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
    // Handle different types of suggestions
    if (suggestion.includes('reminder')) {
      // TODO: Integrate with device calendar
      Alert.alert('Reminder', 'Would you like to set a reminder for this transaction?');
    } else if (suggestion.includes('budget')) {
      // TODO: Update budget tracking
      Alert.alert('Budget', 'Would you like to add this to your budget tracking?');
    } else if (suggestion.includes('receipt')) {
      // TODO: Add receipt scanning
      Alert.alert('Receipt', 'Would you like to scan and attach a receipt?');
    }
  }, []);

  // Load categories and recent transactions
  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setLoadingCategories(false);
          return;
        }

        // Fetch categories
        const categoriesSnap = await getDocs(
          query(collection(db, "categories"), where("userId", "==", userId))
        );
        
        const categories = [];
        categoriesSnap.forEach((doc) => {
          const data = doc.data();
          if (data.name?.trim()) {
            categories.push({
              id: doc.id,
              name: data.name,
              color: data.color || "#d63031",
              icon: CATEGORY_ICONS[data.name.toLowerCase()] || "category"
            });
          }
        });

        // Fetch recent transactions for quick-add
        const recentTxQuery = query(
          collection(db, "transactions"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        
        const recentTxSnap = await getDocs(recentTxQuery);
        const recentTx = recentTxSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setUserCategories(categories);
        setRecentCategories(recentTx);

        // Animate in the content
        Animated.parallel([
          Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(submitScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ]).start();

      } catch (error) {
        console.error("Error loading data:", error);
        Alert.alert("Error", "Failed to load categories and recent transactions");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadData();
  }, [headerOpacity, submitScale]);

  // Handle form updates
  const updateFormField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'description') {
      suggestCategories(value);
    }
  }, [suggestCategories]);

  // Quick-add from recent transaction
  const handleQuickAdd = useCallback((transaction) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFormData(prev => ({
      ...prev,
      amount: transaction.amount.toString(),
      category: transaction.category,
      selectedColor: transaction.color || "#d63031"
    }));
  }, []);

  // Handle category deletion
  const handleDeleteCategory = useCallback(async (category) => {
    try {
      setLoading(true);
      const batch = writeBatch(db);

      // Delete category
      const categoryRef = doc(db, "categories", category.id);
      batch.delete(categoryRef);

      // Delete all transactions in this category
      const transactionsRef = collection(db, "transactions");
      const q = query(
        transactionsRef,
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
  }, []);

  // Form validation and submission
  const handleAddTransaction = async () => {
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
      Alert.alert("Error", "Please sign in to add transaction");
      return;
    }

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const batch = writeBatch(db);

      // Handle category
      let categoryId;
      const existingCategory = userCategories.find(
        (c) => c.name.toLowerCase() === formData.category.toLowerCase()
      );

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const newCatRef = doc(collection(db, "categories"));
        batch.set(newCatRef, {
          userId,
          name: formData.category.trim(),
          color: formData.selectedColor,
          icon: suggestCategoryIcon(formData.category),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          type: "expense",
        });
        categoryId = newCatRef.id;
      }

      // Add transaction
      const txRef = doc(collection(db, "transactions"));
      batch.set(txRef, {
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
        type: "expense",
        status: "active",
        metadata: {
          deviceType: Platform.OS,
          appVersion: "1.0.0",
        },
      });

      await batch.commit();

      Alert.alert("Success", "Transaction added successfully", [
        {
          text: "Add Another",
          style: "cancel",
          onPress: () => {
            setFormData({
              amount: "",
              description: "",
              category: "",
              selectedColor: "#d63031",
              date: new Date()
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
        { 
          text: "Go Back",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.goBack();
          }
        },
      ]);
    } catch (error) {
      console.error("Error adding transaction:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to add transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_SUGGESTIONS)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return CATEGORY_ICONS[category];
      }
    }
    return "category";
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Header with Back Button */}
      <LinearGradient
        colors={THEME_COLORS.gradient.primary}
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
          <Text style={styles.headerEmoji}>💳</Text>
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <Text style={styles.headerSubtitle}>
            Track your spending with ease ✨
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
        {recentCategories.length > 0 && (
          <View style={styles.quickAddSection}>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickAddContainer}
            >
              {recentCategories.map((tx) => (
                <QuickAddCard
                  key={tx.id}
                  item={tx}
                  onPress={handleQuickAdd}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Amount Input */}
        <GradientCard style={[styles.card, commonStyles.glassMorphism]}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="attach-money" size={24} color={colors.silver} />
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              placeholderTextColor={colors.silver}
              keyboardType="decimal-pad"
              maxLength={10}
              value={formData.amount}
              onChangeText={(t) => updateFormField('amount', t.replace(/[^0-9.]/g, ""))}
            />
            <Text style={styles.currencyText}>{currency}</Text>
          </View>
        </GradientCard>

        {/* Description Input with AI */}
        <GradientCard style={[styles.card, commonStyles.glassMorphism]}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="description" size={24} color={colors.silver} />
            <TextInput
              style={styles.input}
              placeholder="Enter description"
              placeholderTextColor={colors.silver}
              maxLength={100}
              value={formData.description}
              onChangeText={handleDescriptionChange}
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

        {/* AI Category Suggestions */}
        <CategorySuggestions
          description={formData.description}
          onSelect={handleCategorySelect}
          loading={loading}
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
                      name={CATEGORY_ICONS[category.name.toLowerCase()] || "category"}
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

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.sectionSubtitle}>
            Long press a category to delete it and its transactions
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
          />
        )}

        {/* New Category Input */}
        <Text style={styles.sectionTitle}>Add New Category</Text>
        <GradientCard style={[styles.card, commonStyles.glassMorphism]}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="category" size={24} color={colors.silver} />
            <TextInput
              style={styles.input}
              placeholder="Enter new category name"
              placeholderTextColor={colors.silver}
              maxLength={20}
              value={formData.category}
              onChangeText={(text) => updateFormField('category', text)}
            />
          </View>
        </GradientCard>

        {/* Color Picker */}
        <Text style={styles.sectionTitle}>Category Color</Text>
        <GradientCard style={[styles.colorPickerCard, commonStyles.glassMorphism]}>
          <View 
            style={[
              styles.colorPreview, 
              { backgroundColor: formData.selectedColor }
            ]} 
          />
          <ColorPicker
            style={styles.colorPicker}
            color={formData.selectedColor}
            onColorChange={(color) => updateFormField('selectedColor', color)}
            hideSliders
            thumbSize={40}
            sliderSize={40}
            noSnap
            row={false}
          />
        </GradientCard>

        {/* Date Picker */}
        <Text style={styles.sectionTitle}>Select Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <GradientCard style={[styles.dateButton, commonStyles.glassMorphism]}>
            <MaterialIcons name="calendar-today" size={24} color={colors.silver} />
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
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) updateFormField('date', d);
            }}
            maximumDate={new Date()}
          />
        )}

        {/* Submit Button with Animation */}
        <Animated.View style={[
          styles.submitContainer,
          { 
            transform: [{ scale: submitScale }],
            paddingBottom: insets.bottom || SPACING.md
          }
        ]}>
          <TouchableOpacity
            onPress={handleAddTransaction}
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
                  <MaterialIcons name="add" size={24} color={colors.white} />
                  <Text style={styles.submitText}>Add Transaction</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
};

// Enhanced styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.dark,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  header: {
    width: '100%',
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
    color: THEME_COLORS.accent.main,
  },
  categoriesContainer: {
    marginBottom: SPACING.md,
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
  submitContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 12,
  },
  submitText: {
    ...TYPOGRAPHY.button,
    color: colors.white,
    marginLeft: SPACING.sm,
  },
  currencyText: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: colors.silver,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginLeft: SPACING.sm,
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

export default React.memo(AddTransaction);
