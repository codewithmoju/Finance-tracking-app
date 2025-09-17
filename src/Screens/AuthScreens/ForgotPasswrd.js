import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { colors, THEME_COLORS, SPACING, TYPOGRAPHY } from "../../global/styles";
import { Fonts } from "../../../assets/fonts/fonts";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Success",
        "Password reset email sent! Please check your inbox.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      let errorMessage = "Failed to send reset email";
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
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
        <Text style={styles.welcomeEmoji}>🔐</Text>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Don't worry! It happens to the best of us. Enter your email and we'll help you get back in. ✨
        </Text>
      </LinearGradient>

      <View style={styles.formContainer}>
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

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handlePasswordReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={THEME_COLORS.text.primary} />
          ) : (
            <>
              <MaterialIcons name="send" size={24} color={THEME_COLORS.text.primary} />
              <Text style={styles.buttonText}>Send Reset Link</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Login")}
        >
          <MaterialIcons name="arrow-back" size={24} color={THEME_COLORS.text.primary} />
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
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
    gap: SPACING.lg,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.background.card,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
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
  resetButton: {
    backgroundColor: THEME_COLORS.accent.main,
    borderRadius: 20,
    height: 55,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
  backButton: {
    backgroundColor: THEME_COLORS.accent.dark,
    borderRadius: 20,
    height: 55,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_EXTRABOLD,
  },
});

export default ForgotPassword;
