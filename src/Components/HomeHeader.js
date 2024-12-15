import { StyleSheet, Text, View, Dimensions, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { colors } from "../global/styles";
import { Fonts, loadFonts } from "../../assets/fonts/fonts";
import Icon from "react-native-vector-icons/Ionicons"; // Import your desired icon set
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEME_COLORS } from "../global/styles";

const { width, height } = Dimensions.get("window"); // Get screen dimensions

const HomeHeader = ({ title, iconName }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadFonts().then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return null; // Return null while fonts are loading
  }

  return (
    <SafeAreaView style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Icon
          name={iconName}
          size={width * 0.08} // Icon size is 8% of screen width
          color={THEME_COLORS.text.primary}
          style={styles.icon}
        />
      </TouchableOpacity>

      <Text style={styles.headerText}>{title}</Text>
    </SafeAreaView>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  header: {
    height: height * 0.12, // Height is 12% of screen height
    backgroundColor: THEME_COLORS.primary.main,
    alignItems: "center",
    flexDirection: "row", // Align items in a row
    borderBottomLeftRadius: Platform.OS === 'ios' ? 20 : 0, // Different radius for iOS
    borderBottomRightRadius: Platform.OS === 'ios' ? 20 : 0, // Different radius for iOS
    borderBottomColor: THEME_COLORS.secondary.main,
    borderBottomWidth: width * 0.02, // Border width is 2% of screen width
    paddingHorizontal: width * 0.01, // Padding is 3% of screen width
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: Platform.OS === 'android' ? 5 : 0, // Elevation for Android only
  },
  headerText: {
    fontSize: width * 0.05,
    color: THEME_COLORS.text.primary,
    marginLeft: width * 0.05,
    fontFamily: Fonts.POPPINS_BOLD,
  },
  icon: {
    marginLeft: width * 0.02, // Icon margin left is 2% of screen width
  },
});
