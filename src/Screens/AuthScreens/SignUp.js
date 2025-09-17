import React, { useState } from "react";
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
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { colors, THEME_COLORS, SPACING, TYPOGRAPHY } from "../../global/styles";
import { Fonts } from "../../../assets/fonts/fonts";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");

const SignUp = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (username.length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters long");
      return false;
    }
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  const saveUserData = async (userId) => {
    try {
      await setDoc(doc(db, "users", userId), {
        username: username,
        email: email,
        createdAt: new Date().toISOString(),
        settings: {
          currency: "USD",
          notifications: true,
          biometric: false
        }
      });
    } catch (error) {
      throw new Error("Error saving user data: " + error.message);
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await saveUserData(user.uid);
      await sendEmailVerification(auth.currentUser);
      
      Alert.alert(
        "Success",
        "Account created successfully! Please verify your email.",
        [{ text: "OK", onPress: () => navigation.navigate("EmailVerification") }]
      );
    } catch (error) {
      let errorMessage = "Sign up failed";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already registered";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Email/password accounts are not enabled";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak";
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
        <Text style={styles.welcomeEmoji}>🎉</Text>
        <Text style={styles.title}>Join BUDGETO</Text>
        <Text style={styles.subtitle}>
          Start your journey to better financial management today ✨
        </Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={24} color={THEME_COLORS.accent.main} />
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={username}
            onChangeText={setUsername}
            placeholderTextColor={THEME_COLORS.text.secondary}
            autoCapitalize="words"
          />
        </View>

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
            placeholder="Choose a password"
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

        <Text style={styles.passwordHint}>
          🔒 Password must be at least 6 characters
        </Text>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={THEME_COLORS.text.primary} />
          ) : (
            <>
              <MaterialIcons name="person-add" size={24} color={THEME_COLORS.text.primary} />
              <Text style={styles.signupButtonText}>Create Account</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginLink}>Login Here 👋</Text>
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
    lineHeight: 24,
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
  passwordHint: {
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_REGULAR,
    fontSize: TYPOGRAPHY.caption.fontSize,
    marginBottom: SPACING.xl,
    marginTop: -SPACING.sm,
    marginLeft: SPACING.sm,
  },
  signupButton: {
    backgroundColor: THEME_COLORS.accent.main,
    borderRadius: 20,
    height: 55,
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  signupButtonText: {
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_REGULAR,
    fontSize: TYPOGRAPHY.body2.fontSize,
  },
  loginButton: {
    backgroundColor: 'transparent',
  },
  loginLink: {
    color: THEME_COLORS.accent.main,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    fontSize: TYPOGRAPHY.body2.fontSize,
  },
});

export default SignUp;
