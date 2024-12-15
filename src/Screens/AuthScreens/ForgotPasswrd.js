import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth"; // Firebase auth import
import { auth } from "../../../firebaseConfig"; // Firebase config
import { THEME_COLORS } from "../../global/styles";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const ForgotPassword = () => {
  const [email, setEmail] = useState(""); // State to hold the email input
  const navigation = useNavigation(); // Hook to navigate between screens

  // Function to handle password reset
  const handlePasswordReset = async () => {
    // Check if the email field is empty
    if (!email) {
      Alert.alert("Error", "Please enter your email address."); // Alert if email is not provided
      return; // Exit the function if no email
    }

    try {
      // Send password reset email using Firebase
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Success",
        "Password reset email has been sent. Please check your inbox." // Alert on success
      );
    } catch (error) {
      console.error("Error sending password reset email:", error.message); // Log error to console
      Alert.alert("Error", error.message); // Alert user with error message
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Forgot Password?</Text>
      <Text style={styles.infoText}>
        Enter your email below and we'll send you a link to reset your password.
      </Text>
      <TextInput
        placeholder="Enter Your Email" // Placeholder text for email input
        placeholderTextColor={THEME_COLORS.text.primary} // Color of placeholder text
        style={styles.input(width, height)} // Style for the input field
        value={email} // Bind input value to email state
        onChangeText={setEmail} // Update email state on text change
      />
      <TouchableOpacity
        style={styles.LoginBtn(width, height)} // Style for the button
        onPress={handlePasswordReset} // Call function on button press
      >
        <Text style={styles.btnText(width)}>Send Reset Email</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.LoginBtn(width, height)} // Style for the back button
        onPress={() => navigation.navigate("Login")} // Navigate to Login screen
      >
        <Text style={styles.btnText(width)}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.05,
    backgroundColor: THEME_COLORS.primary.main,
  },
  header: {
    fontSize: width * 0.08,
    fontWeight: "bold",
    color: THEME_COLORS.text.primary,
    marginBottom: height * 0.03,
  },
  infoText: {
    fontSize: width * 0.04,
    color: THEME_COLORS.text.secondary,
    textAlign: "center",
    marginBottom: height * 0.03,
  },
  input: (width, height) => ({
    height: height * 0.07,
    width: width * 0.9,
    backgroundColor: THEME_COLORS.background.card,
    color: THEME_COLORS.text.primary,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    margin: 20,
    borderColor: THEME_COLORS.secondary.main,
    elevation: 5,
  }),
  LoginBtn: (width, height) => ({
    width: width * 0.9,
    height: height * 0.07,
    backgroundColor: THEME_COLORS.accent.main,
    borderRadius: 20,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 5,
  }),
  btnText: (width) => ({
    fontSize: width * 0.05,
    color: THEME_COLORS.text.primary,
    textAlign: "center",
    fontWeight: 'bold',
  }),
});

export default ForgotPassword; // Export the component for use in other parts of the app
