import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  FlatList,
} from "react-native";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";

import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, THEME_COLORS, commonStyles } from "../../global/styles";
import { auth, db, storage } from "../../../firebaseConfig";
import { Fonts } from "../../../assets/fonts/fonts";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCurrency } from '../../global/CurrencyContext';

const GradientCard = ({ children, colors: gradientColors, style }) => (
  <LinearGradient
    colors={gradientColors || THEME_COLORS.gradient.glass}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={style}
  >
    {children}
  </LinearGradient>
);

const { width } = Dimensions.get("window");

const Profile = () => {

  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingName, setEditingName] = useState(false);
  const { currency: selectedCurrency, updateCurrency, currencies } = useCurrency();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation();

  // Move useMemo before any early returns to avoid hooks order issues
  const filteredCurrencies = useMemo(() => {
    if (!searchQuery.trim()) {
      return currencies;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return currencies.filter(currency => 
      currency.name.toLowerCase().includes(query) ||
      currency.code.toLowerCase().includes(query) ||
      currency.symbol.includes(query)
    );
  }, [currencies, searchQuery]);

  useEffect(() => {
    fetchUserData();
    loadSettings();
  }, []);



  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        const { currency } = JSON.parse(settings);
        if (currency) await updateCurrency(currency);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (settings) => {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        const currentSettings = userDoc.exists() ? userDoc.data().settings || {} : {};
        
        await updateDoc(userRef, {
          settings: { ...currentSettings, ...settings }
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        setEmail(user.email);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setName(userData.username || "");
          setProfileImageUrl(userData.profileImageUrl || null);
          
          // Load user settings
          if (userData.settings) {
            await updateCurrency(userData.settings.currency || "USD");
          }
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photos to change profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadImage = async (uri) => {
    if (!uri) return;

    try {
      setUploading(true);
      const user = auth.currentUser;
      const storageRef = ref(storage, `profile_pictures/${user.uid}.jpg`);
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      await updateProfileImage(downloadURL);
      setProfileImageUrl(downloadURL);
      Alert.alert("Success", "Profile picture updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const updateProfileImage = async (url) => {
    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { profileImageUrl: url }, { merge: true });
    await AsyncStorage.setItem("profileImageUrl", url);
  };

  const handleNameUpdate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    try {
      const user = auth.currentUser;
      await setDoc(doc(db, "users", user.uid), {
        username: name.trim()
      }, { merge: true });
      
      await AsyncStorage.setItem("username", name.trim());
      setEditingName(false);
      Alert.alert("Success", "Name updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update name");
    }
  };

  const handleCurrencyChange = async (currency) => {
    try {
      await updateCurrency(currency);
      
      // Save to settings
      const settings = { currency };
      await saveSettings(settings);
      
      setShowCurrencyPicker(false);
      setSearchQuery("");
      
      // Provide subtle feedback without intrusive alert
      console.log(`Currency updated to ${currency}`);
    } catch (error) {
      console.error('Error updating currency:', error);
      Alert.alert("Error", "Failed to update currency. Please try again.");
    }
  };



  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              await AsyncStorage.clear();
              navigation.replace("Login");
            } catch (error) {
              Alert.alert("Error", "Failed to logout");
            }
          },
        },
      ]
    );
  };

  const renderCurrencyItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.currencyOption,
        selectedCurrency === item.code && styles.selectedCurrency,
      ]}
      onPress={() => handleCurrencyChange(item.code)}
      activeOpacity={0.7}
    >
      <View style={styles.currencyItemContent}>
        <View style={styles.currencyLeft}>
          <Text style={styles.currencySymbol}>{item.symbol}</Text>
          <View style={styles.currencyDetails}>
            <Text style={styles.currencyCode}>{item.code}</Text>
            <Text style={styles.currencyName}>{item.name}</Text>
          </View>
        </View>
        {selectedCurrency === item.code && (
          <MaterialIcons 
            name="check-circle" 
            size={24} 
            color={colors.white}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (showCurrencyPicker) {
      return (
        <View style={styles.currencyPickerModal}>
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setShowCurrencyPicker(false);
                setSearchQuery("");
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.white} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerText}>Select Currency</Text>
          </View>
          
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={24} color={colors.silver} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search currency..."
              placeholderTextColor={colors.silver}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <MaterialIcons name="clear" size={20} color={colors.silver} />
              </TouchableOpacity>
            )}
          </View>

          {filteredCurrencies.length > 0 ? (
            <FlatList
              data={filteredCurrencies}
              renderItem={renderCurrencyItem}
              keyExtractor={item => item.code}
              contentContainerStyle={styles.currencyList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <MaterialIcons name="search-off" size={48} color={colors.silver} />
              <Text style={styles.noResultsText}>No currencies found</Text>
              <Text style={styles.noResultsSubtext}>
                Try searching with a different term
              </Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Profile Header */}
        <GradientCard
          colors={THEME_COLORS.gradient.primary}
          style={styles.headerCard}
        >
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
              {uploading ? (
                <ActivityIndicator size="large" color={THEME_COLORS.secondary.main} />
              ) : (
                <Image
                  source={
                    profileImageUrl
                      ? { uri: profileImageUrl }
                      : require("../../Drawable/Images/user.png")
                  }
                  style={styles.profileImage}
                />
              )}
              <View style={styles.editIconContainer}>
                <MaterialIcons name="edit" size={20} color={colors.white} />
              </View>
            </TouchableOpacity>

            <View style={styles.userInfo}>
              {editingName ? (
                <View style={styles.nameEditContainer}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    style={styles.nameInput}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.silver}
                  />
                  <TouchableOpacity onPress={handleNameUpdate}>
                    <MaterialIcons name="check" size={24} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.nameContainer}
                  onPress={() => setEditingName(true)}
                >
                  <Text style={styles.nameText}>{name || "Set Name"}</Text>
                  <MaterialIcons name="edit" size={20} color={colors.silver} />
                </TouchableOpacity>
              )}
              <Text style={styles.emailText}>{email}</Text>
            </View>
          </View>
        </GradientCard>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          {/* Currency Selection */}
          <GradientCard style={[styles.card, commonStyles.glassMorphism]}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <View style={styles.settingLeft}>
                <FontAwesome5 name="money-bill-wave" size={24} color={colors.silver} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Currency</Text>
                  <Text style={styles.settingSubtitle}>
                    {currencies.find(c => c.code === selectedCurrency)?.name || 'Set your preferred currency'}
                  </Text>
                </View>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.currencyText}>
                  {currencies.find(c => c.code === selectedCurrency)?.symbol} {selectedCurrency}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-right"
                  size={24}
                  color={colors.silver}
                />
              </View>
            </TouchableOpacity>
          </GradientCard>



          {/* Logout Button */}
          <TouchableOpacity onPress={handleLogout}>
            <GradientCard
              colors={THEME_COLORS.gradient.danger}
              style={styles.logoutButton}
            >
              <SimpleLineIcons name="logout" size={24} color={colors.white} />
              <Text style={styles.logoutText}>Logout</Text>
            </GradientCard>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={THEME_COLORS.secondary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.richBlack,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    borderBottomLeftRadius: width * 0.08,
    borderBottomRightRadius: width * 0.08,
    padding: width * 0.05,
    marginBottom: width * 0.05,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? width * 0.1 : width * 0.05,
  },
  imageContainer: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: width * 0.03,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: width * 0.15,
    borderWidth: width * 0.008,
    borderColor: colors.goldAccent,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: THEME_COLORS.secondary.main,
    padding: width * 0.015,
    borderRadius: width * 0.04,
    borderWidth: width * 0.005,
    borderColor: colors.white,
  },
  userInfo: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: width * 0.05,
  },
  nameEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.02,
    width: "100%",
    justifyContent: "center",
  },
  nameInput: {
    fontSize: Math.min(width * 0.05, 24),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.silver,
    paddingBottom: width * 0.01,
    minWidth: width * 0.4,
    maxWidth: width * 0.6,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.02,
  },
  nameText: {
    fontSize: Math.min(width * 0.05, 24),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textAlign: "center",
  },
  emailText: {
    fontSize: Math.min(width * 0.035, 16),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginTop: width * 0.01,
  },
  section: {
    padding: width * 0.05,
  },
  sectionTitle: {
    fontSize: Math.min(width * 0.045, 20),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginBottom: width * 0.03,
  },
  card: {
    borderRadius: width * 0.04,
    marginBottom: width * 0.03,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: width * 0.04,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.03,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: width * 0.02,
  },
  settingTitle: {
    fontSize: Math.min(width * 0.04, 18),
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  settingSubtitle: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.02,
  },
  currencyText: {
    fontSize: Math.min(width * 0.035, 16),
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  currencyPicker: {
    backgroundColor: colors.darkGray,
    borderRadius: width * 0.04,
    marginTop: -width * 0.02,
    marginBottom: width * 0.03,
    padding: width * 0.02,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    maxHeight: width * 0.6,
  },
  currencyOption: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: width * 0.03,
    marginBottom: width * 0.02,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedCurrency: {
    backgroundColor: THEME_COLORS.secondary.main,
    borderColor: THEME_COLORS.secondary.light,
    borderWidth: 2,
  },
  currencyOptionText: {
    fontSize: Math.min(width * 0.035, 16),
    color: colors.white,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: width * 0.04,
    borderRadius: width * 0.04,
    marginTop: width * 0.05,
    gap: width * 0.03,
  },
  logoutText: {
    fontSize: Math.min(width * 0.04, 18),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  currencyPickerContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: width * 0.04,
    marginTop: -width * 0.02,
    marginBottom: width * 0.03,
    padding: width * 0.02,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    maxHeight: width * 0.8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: width * 0.03,
    padding: width * 0.04,
    margin: width * 0.04,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: Math.min(width * 0.035, 16),
    fontFamily: Fonts.POPPINS_REGULAR,
    marginLeft: width * 0.02,
  },
  currencyList: {
    paddingHorizontal: width * 0.04,
    paddingBottom: width * 0.04,
  },
  currencyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.04,
    justifyContent: 'space-between',
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencySymbol: {
    fontSize: Math.min(width * 0.06, 28),
    color: colors.white,
    fontFamily: Fonts.POPPINS_BOLD,
    width: width * 0.12,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: width * 0.02,
    paddingVertical: width * 0.02,
  },
  currencyDetails: {
    marginLeft: width * 0.04,
    flex: 1,
  },
  currencyCode: {
    fontSize: Math.min(width * 0.04, 18),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginBottom: width * 0.005,
  },
  currencyName: {
    fontSize: Math.min(width * 0.032, 15),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
    lineHeight: Math.min(width * 0.045, 20),
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: width * 0.04,
    paddingTop: Platform.OS === 'ios' ? width * 0.12 : width * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: THEME_COLORS.primary.main,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: width * 0.04,
  },
  backButtonText: {
    color: colors.white,
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginLeft: width * 0.02,
  },
  headerText: {
    color: colors.white,
    fontSize: Math.min(width * 0.05, 20),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    flex: 1,
    textAlign: 'center',
    marginRight: width * 0.1, // Balance the back button
  },
  currencyPickerModal: {
    flex: 1,
    backgroundColor: colors.richBlack,
  },
  clearButton: {
    padding: width * 0.01,
    marginLeft: width * 0.02,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.08,
  },
  noResultsText: {
    fontSize: Math.min(width * 0.045, 18),
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginTop: width * 0.04,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: Math.min(width * 0.035, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginTop: width * 0.02,
    textAlign: 'center',
  },
});

export default Profile;
