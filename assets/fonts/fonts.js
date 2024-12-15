import * as Font from "expo-font";

export const Fonts = {
  POPPINS_BLACK: "Poppins-Black",
  POPPINS_BOLD: "Poppins-Bold",
  POPPINS_EXTRABOLD: "Poppins-ExtraBold",
  POPPINS_EXTRALIGHT: "Poppins-ExtraLight",
  POPPINS_LIGHT: "Poppins-Light",
  POPPINS_MEDIUM: "Poppins-Medium",
  POPPINS_REGULAR: "Poppins-Regular",
  POPPINS_SEMIBOLD: "Poppins-SemiBold",
  POPPINS_THIN: "Poppins-Thin",
};

export const loadFonts = () => {
  return Font.loadAsync({
    [Fonts.POPPINS_BLACK]: require("./Poppins-Black.ttf"),
    [Fonts.POPPINS_BOLD]: require("./Poppins-Bold.ttf"),
    [Fonts.POPPINS_EXTRABOLD]: require("./Poppins-ExtraBold.ttf"),
    [Fonts.POPPINS_EXTRALIGHT]: require("./Poppins-ExtraLight.ttf"),
    [Fonts.POPPINS_LIGHT]: require("./Poppins-Light.ttf"),
    [Fonts.POPPINS_MEDIUM]: require("./Poppins-Medium.ttf"),
    [Fonts.POPPINS_REGULAR]: require("./Poppins-Regular.ttf"),
    [Fonts.POPPINS_SEMIBOLD]: require("./Poppins-SemiBold.ttf"),
    [Fonts.POPPINS_THIN]: require("./Poppins-Thin.ttf"),
  });
};
