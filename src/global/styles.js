// styles.js

import { Dimensions } from 'react-native';
import { Fonts } from '../../assets/fonts/fonts';

const { width, height } = Dimensions.get('window');

// Colors
export const colors = {
  richBlack: "#0D0D0D",
  darkCharcoal: "#1A1A1A",
  gunmetalGray: "#333333",
  slateGray: "#4D4D4D",
  silver: "#999999",
  goldAccent: "#FFD700",
  white: "#FFFFFF",
  lightGray: "#B0B0B0",
  deepPurple: "#6A0DAD",
  greenAccent: "#2ECC71",
  redAccent: "#E74C3C",
  shadowColor: "rgba(0, 0, 0, 0.1)",
};

// Theme Colors
export const THEME_COLORS = {
  primary: {
    main: '#1A1A2E',
    light: '#242442',
    dark: '#12121E',
  },
  secondary: {
    main: '#16CAC9',
    light: '#1CE8E7',
    dark: '#14B8B7',
  },
  accent: {
    main: '#4D7CFE',
    light: '#6B93FF',
    dark: '#3A69EB',
  },
  success: {
    main: '#42CD00',
    light: '#4EF700',
    dark: '#3AB100',
  },
  danger: {
    main: '#FF6B6B',
    light: '#FF8585',
    dark: '#FF5252',
  },
  warning: {
    main: '#FFB037',
    light: '#FFC060',
    dark: '#FFA01F',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A0AEC0',
    tertiary: '#718096',
  },
  background: {
    card: 'rgba(255,255,255,0.08)',
    overlay: 'rgba(0,0,0,0.5)',
  },
  gradient: {
    primary: ['#4D7CFE', '#16CAC9'],
    expense: ['#FF6B6B', '#FF8BA7'],
    income: ['#16CAC9', '#42CD00'],
    card: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
    dark: ['#1A1A2E', '#141428'],
    success: ['#42CD00', '#2ECC71'],
    warning: ['#FFB037', '#FFA01F'],
    glass: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.08)'],
    premium: ['#FFD700', '#FFA500'],
  }
};

// Typography
export const TYPOGRAPHY = {
  h1: {
    fontSize: width * 0.08,
    fontFamily: Fonts.POPPINS_BOLD,
    lineHeight: width * 0.12,
  },
  h2: {
    fontSize: width * 0.06,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    lineHeight: width * 0.09,
  },
  h3: {
    fontSize: width * 0.05,
    fontFamily: Fonts.POPPINS_MEDIUM,
    lineHeight: width * 0.075,
  },
  h4: {
    fontSize: width * 0.04,
    fontFamily: Fonts.POPPINS_MEDIUM,
    lineHeight: width * 0.06,
  },
  subtitle1: {
    fontSize: width * 0.045,
    fontFamily: Fonts.POPPINS_MEDIUM,
    lineHeight: width * 0.0675,
  },
  subtitle2: {
    fontSize: width * 0.035,
    fontFamily: Fonts.POPPINS_MEDIUM,
    lineHeight: width * 0.0525,
  },
  body1: {
    fontSize: width * 0.04,
    fontFamily: Fonts.POPPINS_REGULAR,
    lineHeight: width * 0.06,
  },
  body2: {
    fontSize: width * 0.035,
    fontFamily: Fonts.POPPINS_REGULAR,
    lineHeight: width * 0.0525,
  },
  button: {
    fontSize: width * 0.04,
    fontFamily: Fonts.POPPINS_MEDIUM,
    lineHeight: width * 0.06,
  },
  caption: {
    fontSize: width * 0.03,
    fontFamily: Fonts.POPPINS_REGULAR,
    lineHeight: width * 0.045,
  },
  overline: {
    fontSize: width * 0.025,
    fontFamily: Fonts.POPPINS_MEDIUM,
    lineHeight: width * 0.0375,
    textTransform: 'uppercase',
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

// Common Styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.main,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading1: {
    ...TYPOGRAPHY.h1,
    color: THEME_COLORS.text.primary,
  },
  heading2: {
    ...TYPOGRAPHY.h2,
    color: THEME_COLORS.text.primary,
  },
  heading3: {
    ...TYPOGRAPHY.h3,
    color: THEME_COLORS.text.primary,
  },
  subtitle1: {
    ...TYPOGRAPHY.subtitle1,
    color: THEME_COLORS.text.primary,
  },
  subtitle2: {
    ...TYPOGRAPHY.subtitle2,
    color: THEME_COLORS.text.primary,
  },
  bodyText1: {
    ...TYPOGRAPHY.body1,
    color: THEME_COLORS.text.primary,
  },
  bodyText2: {
    ...TYPOGRAPHY.body2,
    color: THEME_COLORS.text.primary,
  },
  caption: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.text.secondary,
  },
  button: {
    ...TYPOGRAPHY.button,
    color: THEME_COLORS.text.primary,
  },
  glassMorphism: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  premiumCard: {
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 1,
  },
  shadow: {
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
};
