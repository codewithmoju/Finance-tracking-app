// Firebase imports
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { colors } from "../../global/styles";
import { Fonts, loadFonts } from "../../../assets/fonts/fonts";
import { useNavigation } from "@react-navigation/native";
import { useWindowDimensions } from "react-native";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"; // Email verification import
import { auth, db } from "../../../firebaseConfig"; // Your Firebase config import
import { doc, setDoc } from "firebase/firestore"; // Firestore import
import { THEME_COLORS } from "../../global/styles"; // Import theme colors

const SignUp = () => {
  const navigation = useNavigation();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { width, height } = useWindowDimensions();

  

  // Toggle password visibility
  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  // Form validation
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

  // Save user data in Firestore
  const saveUserData = async (userId) => {
    try {
      // Save user information in Firestore under the 'users' collection
      await setDoc(doc(db, "users", userId), {
        username: username,
        email: email,
        createdAt: new Date(), // Store the current date and time
      });
      console.log("User data saved to Firestore");
    } catch (error) {
      // Handle errors during Firestore data saving
      Alert.alert("Error", "Error saving user data: " + error.message);
    }
  };

  // Handle Sign Up and Send Verification Email
  const handleSignUp = async () => { // Changed to async for better error handling
    if (validateForm()) {
      try {
        // Create a new user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save the username to Firestore
        await saveUserData(user.uid); // Awaiting the saveUserData function for better flow

        // Send a verification email to the user
        await sendEmailVerification(auth.currentUser);
        Alert.alert("Success", "Verification email sent. Please check your inbox.");
        navigation.navigate("EmailVerification"); // Redirect to verification screen
      } catch (error) {
        // Handle errors during sign up or email verification
        Alert.alert("Error", error.message);
      }
    }
  };

  useEffect(() => {
    loadFonts().then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container(height)}>
      <View>
        <Text style={styles.Logintext(width)}>Sign Up</Text>
        <Text style={styles.text1(width)}>
          Welcome To{" "}
          <Text
            style={{
              color: colors.goldAccent,
              fontFamily: Fonts.POPPINS_BLACK,
            }}
          >
            BUDGETO
          </Text>{" "}
          🎉🎉
        </Text>
        <Text style={styles.text2(width)}>
          Create an Account to continue ✨️
        </Text>
      </View>

      <View style={styles.TextInputContainer}>
        <TextInput
          placeholder="Enter Your Name"
          placeholderTextColor={colors.silver}
          style={styles.input(width, height)}
          value={username}
          onChangeText={(text) => setUsername(text)}
        />
        <TextInput
          placeholder="Enter Your Email"
          placeholderTextColor={colors.silver}
          style={styles.input(width, height)}
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <TextInput
          placeholder="Enter Password"
          placeholderTextColor={colors.silver}
          style={styles.input(width, height)}
          value={password}
          secureTextEntry={secureTextEntry}
          onChangeText={(text) => setPassword(text)}
        />
        <TouchableOpacity onPress={toggleSecureEntry}>
          <Text style={styles.togglePassword}>
            {secureTextEntry ? "Show Password" : "Hide Password"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.LoginBtn(width, height)}
        onPress={handleSignUp}
      >
        <Text style={styles.btnText(width)}>Sign Up</Text>
      </TouchableOpacity>

      <Text style={styles.SignUpText(width)}>
        Already have an account?{" "}
        <Text
          style={{ color: colors.goldAccent, textDecorationLine: "underline" }}
          onPress={() => navigation.navigate("Login")}
        >
          Sign In
        </Text>
      </Text>
    </View>
  );
};

export default SignUp;

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
    marginBottom: 20,
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
    margin: 10,
    borderColor: THEME_COLORS.secondary.main,
    elevation: 5,
  }),
  text1: (width) => ({
    fontSize: width * 0.05,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_BOLD,
    marginLeft: 30,
  }),
  text2: (width) => ({
    fontSize: width * 0.035,
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginLeft: 30,
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
  togglePassword: {
    color: THEME_COLORS.accent.main,
    fontSize: 16,
    marginVertical: 5,
    textAlign: "center",
  },
});
