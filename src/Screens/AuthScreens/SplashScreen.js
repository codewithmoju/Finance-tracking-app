import { StyleSheet, View, Image } from "react-native";
import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useWindowDimensions } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { colors, THEME_COLORS } from "../../global/styles";

const SplashScreen = () => {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // If a user is authenticated
      if (user) {
        // Navigate to BottomTabs after 2 seconds
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "BottomTabs" }],
          });
        }, 1000);
      } else {
        // If no user is authenticated, navigate to Login after 2 seconds
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }, 2000);
      }
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [navigation]); // Added navigation to dependency array for better performance

  return (
    <View style={styles.container}>
      <StatusBar barStyle={"light-content"} />
      <Image
        source={require("../../Drawable/Images/BUDGETO.png")}
        style={styles.image(height, width)}
      />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.light,
    justifyContent: "center",
    alignItems: "center",
  },
  image: (height, width) => ({
    width: width * 0.7, // Image width is 70% of the screen width
    height: height * 0.5, // Image height is 50% of the screen height
  }),
});
