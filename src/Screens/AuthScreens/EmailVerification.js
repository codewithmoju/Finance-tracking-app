import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import React from "react";
import { sendEmailVerification, getAuth } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../global/styles";
import { useWindowDimensions } from "react-native";
import { THEME_COLORS } from "../../global/styles";

const EmailVerification = () => {
  // Get the dimensions of the window for responsive design
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation();
  const auth = getAuth();

  // Function to resend the verification email
  const resendVerificationEmail = () => {
    // Check if the current user is available before sending the email
    if (auth.currentUser) {
      sendEmailVerification(auth.currentUser)
        .then(() => {
          Alert.alert("Success", "Verification email resent."); // Notify user of success
        })
        .catch((error) => {
          Alert.alert("Error", error.message); // Notify user of error
        });
    } else {
      Alert.alert("Error", "No user is currently logged in."); // Handle case where no user is logged in
    }
  };

  return (
    <View style={styles.container(height)}>
      <Text style={styles.title(width)}>Verify Your Email</Text>
      <Text style={styles.text(width)}>
        A verification link has been sent to your email. Please verify your
        email to proceed.
      </Text>
      <TouchableOpacity
        style={styles.btn(width, height)}
        onPress={resendVerificationEmail}
      >
        <Text style={styles.btnText(width)}>Resend Verification Email</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn(width, height)}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.btnText(width)}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmailVerification;

const styles = StyleSheet.create({
  container: (height) => ({
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: THEME_COLORS.primary.main,
    paddingVertical: height * 0.1,
  }),
  title: (width) => ({
    fontSize: width * 0.1,
    color: THEME_COLORS.text.primary,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginBottom: 20,
  }),
  text: (width) => ({
    fontSize: width * 0.05,
    color: THEME_COLORS.text.secondary,
    textAlign: "center",
    marginBottom: 30,
  }),
  btn: (width, height) => ({
    backgroundColor: THEME_COLORS.accent.main,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.2,
    borderRadius: 10,
    marginVertical: 10,
    elevation: 5,
  }),
  btnText: (width) => ({
    fontSize: width * 0.05,
    color: THEME_COLORS.text.primary,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
  }),
});
