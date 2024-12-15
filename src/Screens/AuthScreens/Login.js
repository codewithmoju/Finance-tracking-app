import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert
} from "react-native";
import React, { useState, useEffect } from "react";
import { colors } from "../../global/styles";
import { Fonts, loadFonts } from "../../../assets/fonts/fonts";
import { useNavigation } from "@react-navigation/native";
import { useWindowDimensions } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth"; // Firebase auth import
import { auth } from "../../../firebaseConfig"; // Firebase config
import { THEME_COLORS } from "../../global/styles";

const Login = () => {
  const navigation = useNavigation();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { width, height } = useWindowDimensions();

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  useEffect(() => {
    loadFonts().then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return null; // Return null while fonts are loading
  }
  const handleLogin = () => {
    // Regular expression for validating email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if email and password fields are filled
    if (email === "" || password === "") {
      Alert.alert("Error", "Please fill in all fields"); // Alert if fields are empty
      return; // Exit the function if validation fails
    }

    // Validate email format
    if (!emailPattern.test(email)) {
      Alert.alert("Error", "Please enter a valid email address"); // Alert for invalid email
      return; // Exit the function if validation fails
    }

    // Validate password length
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long"); // Alert for short password
      return; // Exit the function if validation fails
    }

    // Attempt to sign in with Firebase authentication
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user; // Get the user object from the credential

        // Check if the user's email is verified
        if (user.emailVerified) {
          console.log("Logged in as:", user.email); // Log the user's email
          navigation.navigate("BottomTabs"); // Redirect to Home after successful login
        } else {
          // Alert if the email is not verified
          Alert.alert(
            "Email Not Verified",
            "Please verify your email address before logging in."
          );
          // Optionally, resend the verification email
          user
            .sendEmailVerification()
            .then(() => {
              Alert.alert(
                "Verification Email Sent",
                "A new verification email has been sent to your email address."
              ); // Alert for sent verification email
            })
            .catch((error) => {
              console.error("Error sending email verification", error); // Log error if sending fails
            });
        }
      })
      .catch((error) => {
        // Handle specific error messages
        let errorMessage = ""; // Initialize error message variable
        switch (error.code) {
          case "auth/invalid-email":
            errorMessage = "Invalid email format."; // Error for invalid email
            break;
          case "auth/wrong-password":
            errorMessage = "Incorrect password."; // Error for wrong password
            break;
          case "auth/user-not-found":
            errorMessage = "No account found with this email."; // Error for non-existent account
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many failed attempts. Please try again later."; // Error for too many attempts
            break;
          default:
            errorMessage = error.message; // Default error message
        }
        Alert.alert("Login Error", errorMessage); // Alert for login errors
      });
  };

  return (
    <View style={styles.container(height)}>
      <View>
        <Text style={styles.Logintext(width)}>Login</Text>
        <Text style={styles.text1(width)}>Welcome Back 🎉🎉</Text>
        <Text style={styles.text2(width)}>Good to see you back ✨️</Text>
      </View>

      <View style={styles.TextInputContainer}>
        <TextInput
          placeholder="Enter Your Email"
          placeholderTextColor={colors.white}
          style={styles.input(width, height)}
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <TextInput
          placeholder="Enter Password"
          placeholderTextColor={colors.white}
          style={styles.input(width, height)}
          value={password}
          secureTextEntry={secureTextEntry}
          onChangeText={(text) => setPassword(text)}
        />
      </View>

      <View style={styles.textContainer(width)}>
        <Text style={styles.text3(width)} onPress={toggleSecureEntry}>
          {secureTextEntry ? "Show Password" : "Hide Password"}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.text3(width)}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.LoginBtn(width, height)}
        onPress={handleLogin} // Use the login function
      >
        <Text style={styles.btnText(width)}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.SignUpText(width)}>
        Don't have an account?{" "}
        <Text
          style={{ color: colors.goldAccent, textDecorationLine: "underline" }}
          onPress={() => navigation.navigate("SignUp")}
        >
          Sign Up
        </Text>
      </Text>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: (height) => ({
    flex: 1,
    backgroundColor: THEME_COLORS.primary.main,
    justifyContent: "center",
    paddingVertical: height * 0.1,
    paddingHorizontal: 20,
  }),
  Logintext: (width) => ({
    fontSize: width * 0.1,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_BLACK,
    textAlign: "center",
  }),
  TextInputContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
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
  text1: (width) => ({
    fontSize: width * 0.07,
    color: colors.white,
    fontFamily: Fonts.POPPINS_BOLD,
    marginLeft: 30,
  }),
  text2: (width) => ({
    fontSize: width * 0.04,
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginLeft: 30,
  }),
  text3: (width) => ({
    fontSize: width * 0.03,
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
  }),
  textContainer: (width) => ({
    alignSelf: "center",
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
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
    fontSize: width * 0.06,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_EXTRABOLD,
    textAlign: "center",
  }),
  SignUpText: (width) => ({
    fontSize: width * 0.04,
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_MEDIUM,
    textAlign: "center",
    margin: 20,
  }),
});
