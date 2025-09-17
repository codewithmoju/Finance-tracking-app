import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { colors, THEME_COLORS, SPACING, TYPOGRAPHY } from "../../global/styles";
import { Fonts } from "../../../assets/fonts/fonts";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from 'expo-local-authentication';
import { commonStyles } from "../../global/styles";

const { width } = Dimensions.get("window");

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState(null);

  useEffect(() => {
    checkBiometricSupport();
    loadSavedCredentials();
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

  const loadSavedCredentials = async () => {
    try {
      const credentials = await AsyncStorage.getItem('userCredentials');
      if (credentials) {
        setSavedCredentials(JSON.parse(credentials));
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      if (!savedCredentials) {
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with biometrics',
        fallbackLabel: 'Use password',
      });

      if (result.success) {
        await handleLogin(savedCredentials.email, savedCredentials.password);
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleLogin = async (loginEmail = email, loginPassword = password) => {
    if (!loginEmail || !loginPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );

      // Check if biometric login is enabled for this user
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      const userData = userDoc.data();
      
      if (userData?.settings?.biometric) {
        // Save credentials for biometric login
        await AsyncStorage.setItem('userCredentials', JSON.stringify({
          email: loginEmail,
          password: loginPassword
        }));
      }

      navigation.replace("Main");
    } catch (error) {
      let errorMessage = "Login failed";
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled";
          break;
        case "auth/user-not-found":
          errorMessage = "User not found";
          break;
        case "auth/wrong-password":
          errorMessage = "Invalid password";
          break;
        default:
          errorMessage = error.message;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[THEME_COLORS.primary.main, THEME_COLORS.primary.dark]}
        style={styles.headerGradient}
      >
        <Text style={styles.welcomeEmoji}>👋</Text>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>
          Let's help you manage your finances better ✨
        </Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        {biometricSupported && savedCredentials && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricAuth}
          >
            <MaterialIcons name="fingerprint" size={30} color={THEME_COLORS.text.primary} />
            <Text style={styles.biometricText}>
              Quick Login with Biometrics 🔐
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={24} color={THEME_COLORS.accent.main} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={THEME_COLORS.text.secondary}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={24} color={THEME_COLORS.accent.main} />
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor={THEME_COLORS.text.secondary}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={24}
              color={THEME_COLORS.accent.main}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password? 🔑</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => handleLogin()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={THEME_COLORS.text.primary} />
          ) : (
            <>
              <MaterialIcons name="login" size={24} color={THEME_COLORS.text.primary} />
              <Text style={styles.loginButtonText}>Login</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity 
            style={styles.signupButton}
            onPress={() => navigation.navigate("SignUp")}
          >
            <Text style={styles.signupLink}>Create Account ✨</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.main,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 50,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_BLACK,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.background.card,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    height: 55,
    borderWidth: 1,
    borderColor: THEME_COLORS.accent.main,
  },
  input: {
    flex: 1,
    color: THEME_COLORS.text.primary,
    marginLeft: SPACING.sm,
    fontFamily: Fonts.POPPINS_REGULAR,
    fontSize: TYPOGRAPHY.body1.fontSize,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: SPACING.xl,
  },
  forgotPasswordText: {
    color: THEME_COLORS.accent.main,
    fontFamily: Fonts.POPPINS_MEDIUM,
    fontSize: TYPOGRAPHY.body2.fontSize,
  },
  loginButton: {
    backgroundColor: THEME_COLORS.accent.main,
    borderRadius: 20,
    height: 55,
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  loginButtonText: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_EXTRABOLD,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: THEME_COLORS.text.secondary,
    opacity: 0.2,
  },
  dividerText: {
    color: THEME_COLORS.text.secondary,
    marginHorizontal: SPACING.md,
    fontFamily: Fonts.POPPINS_MEDIUM,
    fontSize: TYPOGRAPHY.body2.fontSize,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_REGULAR,
    fontSize: TYPOGRAPHY.body2.fontSize,
  },
  signupButton: {
    backgroundColor: 'transparent',
  },
  signupLink: {
    color: THEME_COLORS.accent.main,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    fontSize: TYPOGRAPHY.body2.fontSize,
  },
  biometricButton: {
    backgroundColor: THEME_COLORS.accent.main,
    borderRadius: 20,
    height: 55,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  biometricText: {
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_MEDIUM,
    fontSize: TYPOGRAPHY.body1.fontSize,
  },
});

export default Login;
