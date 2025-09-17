import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { colors, THEME_COLORS, SPACING, TYPOGRAPHY } from "../../global/styles";
import { Fonts } from "../../../assets/fonts/fonts";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");

const EmailVerification = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "No user is currently logged in");
      return;
    }

    try {
      setLoading(true);
      await sendEmailVerification(auth.currentUser);
      Alert.alert(
        "Success",
        "Verification email sent! Please check your inbox.",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to send verification email");
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
        <Text style={styles.welcomeEmoji}>✉️</Text>
        <Text style={styles.title}>Almost There!</Text>
        <Text style={styles.subtitle}>
          We've sent you a verification email. Please check your inbox and click the link to activate your account. ✨
        </Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <View style={styles.infoContainer}>
          <Ionicons name="mail-unread" size={40} color={THEME_COLORS.accent.main} />
          <Text style={styles.infoText}>
            Didn't receive the email? Check your spam folder or request a new verification link below.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={resendVerificationEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={THEME_COLORS.text.primary} />
          ) : (
            <>
              <MaterialIcons name="refresh" size={24} color={THEME_COLORS.text.primary} />
              <Text style={styles.buttonText}>Resend Verification Email</Text>
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
  infoContainer: {
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  infoText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
    lineHeight: 24,
  },
  resendButton: {
    backgroundColor: THEME_COLORS.accent.main,
    borderRadius: 20,
    height: 55,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
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

export default EmailVerification;
