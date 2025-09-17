import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
  Platform,
  FlatList,
} from "react-native";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, THEME_COLORS, SPACING, TYPOGRAPHY, commonStyles } from "../../global/styles";
import { auth, db, storage } from "../../../firebaseConfig";
import { Fonts } from "../../../assets/fonts/fonts";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
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
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingName, setEditingName] = useState(false);
  const { currency: selectedCurrency, updateCurrency, currencies } = useCurrency();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation();

  useEffect(() => {
    fetchUserData();
    loadSettings();
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupported(compatible && enrolled);
    } catch (error) {
      console.error('Error checking biometric support:', error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric login',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        setBiometricEnabled(true);
        const settings = {
          currency: selectedCurrency,
          notifications: notificationsEnabled,
          biometric: true
        };
        await saveSettings(settings);
        Alert.alert('Success', 'Biometric login enabled successfully');
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Alert.alert('Error', 'Failed to enable biometric login');
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        const { currency, notifications, biometric } = JSON.parse(settings);
        if (currency) await updateCurrency(currency);
        setNotificationsEnabled(notifications ?? true);
        setBiometricEnabled(biometric ?? false);
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
            setNotificationsEnabled(userData.settings.notifications ?? true);
            setBiometricEnabled(userData.settings.biometric ?? false);
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
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
      setImageUri(null);
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
      setShowCurrencyPicker(false);
      Alert.alert("Success", "Currency updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update currency");
    }
  };

  const handleDarkModeToggle = async (value) => {
    // This function is no longer used for dark mode, but kept for consistency
    // Dark mode is now handled by the app's theme or a separate setting.
    // For now, we'll just save the currency.
    const settings = {
      currency: selectedCurrency,
      notifications: notificationsEnabled,
      biometric: biometricEnabled
    };
    await saveSettings(settings);
  };

  const handleNotificationsToggle = async (value) => {
    setNotificationsEnabled(value);
    const settings = {
      currency: selectedCurrency,
      darkMode: false, // Dark mode is no longer a separate setting
      notifications: value,
      biometric: biometricEnabled
    };
    await saveSettings(settings);
  };

  const handleBiometricToggle = async (value) => {
    // This function is no longer used for biometric login, but kept for consistency
    // Biometric login is now handled by the handleBiometricAuth function.
    // For now, we'll just save the currency.
    const settings = {
      currency: selectedCurrency,
      darkMode: false, // Dark mode is no longer a separate setting
      notifications: notificationsEnabled,
      biometric: value
    };
    await saveSettings(settings);
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
    >
      <View style={styles.currencyItemContent}>
        <Text style={styles.currencySymbol}>{item.symbol}</Text>
        <View style={styles.currencyDetails}>
          <Text style={styles.currencyCode}>{item.code}</Text>
          <Text style={styles.currencyName}>{item.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (showCurrencyPicker) {
      return (
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowCurrencyPicker(false)}
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
            />
          </View>

          <FlatList
            data={filteredCurrencies}
            renderItem={renderCurrencyItem}
            keyExtractor={item => item.code}
            contentContainerStyle={styles.currencyList}
            showsVerticalScrollIndicator={false}
          />
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

          {/* Notifications */}
          <GradientCard style={[styles.card, commonStyles.glassMorphism]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={24} color={colors.silver} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Notifications</Text>
                  <Text style={styles.settingSubtitle}>Enable push notifications</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: colors.silver, true: THEME_COLORS.secondary.main }}
                thumbColor={colors.white}
              />
            </View>
          </GradientCard>

          {/* Biometric Authentication */}
          {biometricSupported && (
            <GradientCard style={[styles.card, commonStyles.glassMorphism]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="finger-print" size={24} color={colors.silver} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>Biometric Login</Text>
                    <Text style={styles.settingSubtitle}>
                      {biometricEnabled ? 'Enabled' : 'Tap to enable fingerprint/face ID'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.biometricButton}
                  onPress={handleBiometricAuth}
                >
                  <MaterialIcons 
                    name={biometricEnabled ? "check-circle" : "add-circle"} 
                    size={30} 
                    color={biometricEnabled ? THEME_COLORS.success.main : colors.silver}
                  />
                </TouchableOpacity>
              </View>
            </GradientCard>
          )}

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

  const filteredCurrencies = currencies.filter(currency => 
    currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    padding: width * 0.03,
    borderRadius: width * 0.02,
    marginBottom: width * 0.01,
  },
  selectedCurrency: {
    backgroundColor: THEME_COLORS.secondary.main,
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
    backgroundColor: colors.richBlack,
    borderRadius: width * 0.02,
    padding: width * 0.02,
    marginBottom: width * 0.02,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: Math.min(width * 0.035, 16),
    fontFamily: Fonts.POPPINS_REGULAR,
    marginLeft: width * 0.02,
  },
  currencyList: {
    maxHeight: width * 0.6,
  },
  currencyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: Math.min(width * 0.05, 24),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    width: width * 0.1,
    textAlign: 'center',
  },
  currencyDetails: {
    marginLeft: width * 0.03,
  },
  currencyCode: {
    fontSize: Math.min(width * 0.035, 16),
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  currencyName: {
    fontSize: Math.min(width * 0.03, 14),
    color: colors.silver,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  biometricButton: {
    padding: width * 0.02,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
  },
});

export default Profile;
