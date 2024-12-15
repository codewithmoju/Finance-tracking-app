// styles.js

import { Dimensions, Platform, StyleSheet } from 'react-native';
const { width, height } = Dimensions.get('window');
// styles.js

export const colors = {
  // Background color: Creates a luxurious and premium feel for the app background.
  richBlack: "#0D0D0D",

  // Secondary background or section dividers: Use for cards, headers, or different sections.
  darkCharcoal: "#1A1A1A",

  // Input fields and text boxes: Provides subtle contrast for text fields and navigation bars.
  gunmetalGray: "#333333",

  // Secondary text and icons: For less prominent text and icons across the UI.
  slateGray: "#4D4D4D",

  // Tertiary elements and borders: Use for borders around buttons, cards, and input fields.
  silver: "#999999",

  // Accent color for CTAs (Call to Action) and highlights: Ideal for buttons and selected elements.
  goldAccent: "#FFD700",

  // Primary text color: Ensures maximum readability against the dark background.
  white: "#FFFFFF",
  lightGray: "#B0B0B0", // Subtext, secondary text
  deepPurple: "#6A0DAD", // Balance card color
  greenAccent: "#2ECC71", // Income card and success color
  redAccent: "#E74C3C", // Expense card and warning color
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

// Spacing Constants
export const SPACING = {
  xs: width * 0.02,  // 2%
  sm: width * 0.03,  // 3%
  md: width * 0.04,  // 4%
  lg: width * 0.05,  // 5%
  xl: width * 0.07   // 7%
};

// Typography Scale
export const TYPOGRAPHY = {
  h1: {
    fontSize: width * 0.08,
    lineHeight: width * 0.11,
  },
  h2: {
    fontSize: width * 0.06,
    lineHeight: width * 0.09,
  },
  h3: {
    fontSize: width * 0.05,
    lineHeight: width * 0.075,
  },
  body1: {
    fontSize: width * 0.04,
    lineHeight: width * 0.06,
  },
  body2: {
    fontSize: width * 0.035,
    lineHeight: width * 0.0525,
  },
  caption: {
    fontSize: width * 0.03,
    lineHeight: width * 0.045,
  }
};

// Common Styles
export const commonStyles = StyleSheet.create({
  // Layout Styles
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.main,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Card Styles
  card: {
    backgroundColor: THEME_COLORS.background.card,
    borderRadius: 15,
    padding: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  glassMorphism: {
    backgroundColor: THEME_COLORS.background.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
  },

  // Text Styles
  heading1: {
    ...TYPOGRAPHY.h1,
    color: THEME_COLORS.text.primary,
    fontFamily: 'Poppins-Bold',
  },
  heading2: {
    ...TYPOGRAPHY.h2,
    color: THEME_COLORS.text.primary,
    fontFamily: 'Poppins-SemiBold',
  },
  heading3: {
    ...TYPOGRAPHY.h3,
    color: THEME_COLORS.text.primary,
    fontFamily: 'Poppins-Medium',
  },
  bodyText1: {
    ...TYPOGRAPHY.body1,
    color: THEME_COLORS.text.primary,
    fontFamily: 'Poppins-Regular',
  },
  bodyText2: {
    ...TYPOGRAPHY.body2,
    color: THEME_COLORS.text.secondary,
    fontFamily: 'Poppins-Regular',
  },
  caption: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.text.tertiary,
    fontFamily: 'Poppins-Regular',
  },

  // Button Styles
  buttonPrimary: {
    backgroundColor: THEME_COLORS.accent.main,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLORS.accent.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME_COLORS.accent.main,
  },

  // Input Styles
  input: {
    backgroundColor: THEME_COLORS.background.card,
    borderRadius: 10,
    padding: SPACING.md,
    color: THEME_COLORS.text.primary,
    fontFamily: 'Poppins-Regular',
    fontSize: TYPOGRAPHY.body1.fontSize,
  },

  // Image Styles
  roundedImage: {
    borderRadius: 15,
    width: '100%',
    height: undefined,
    aspectRatio: 1,
  },
  avatar: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    borderWidth: 2,
    borderColor: THEME_COLORS.secondary.main,
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.primary.main,
  },
  errorContainer: {
    padding: SPACING.lg,
    backgroundColor: THEME_COLORS.danger.main,
    borderRadius: 10,
    margin: SPACING.md,
  },

  // List Styles
  listContainer: {
    paddingHorizontal: SPACING.md,
  },
  listSeparator: {
    height: 1,
    backgroundColor: THEME_COLORS.background.card,
    marginVertical: SPACING.sm,
  },

  // Animation Presets
  fadeIn: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  fadeOut: {
    opacity: 0,
    transform: [{ scale: 0.9 }],
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME_COLORS.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: THEME_COLORS.primary.light,
    borderRadius: 20,
    padding: SPACING.lg,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },

  // Badge Styles
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: THEME_COLORS.danger.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Enhanced Card Styles
  premiumCard: {
    backgroundColor: THEME_COLORS.background.card,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)', // Subtle gold border
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // Enhanced Input Styles
  inputFocused: {
    backgroundColor: THEME_COLORS.background.card,
    borderRadius: 10,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.secondary.main,
    transform: [{ scale: 1.02 }],
  },

  // Skeleton Loading
  skeletonLoading: {
    backgroundColor: THEME_COLORS.background.card,
    borderRadius: 8,
    opacity: 0.7,
  },

  // Enhanced Button Styles
  buttonIcon: {
    padding: SPACING.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Status Indicators
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chart Container
  chartContainer: {
    padding: SPACING.md,
    borderRadius: 15,
    backgroundColor: THEME_COLORS.background.card,
    marginVertical: SPACING.sm,
  },

  // Enhanced List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: THEME_COLORS.background.card,
    borderRadius: 12,
    marginVertical: SPACING.xs,
  },

  // Bottom Sheet Styles
  bottomSheet: {
    backgroundColor: THEME_COLORS.primary.light,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: SPACING.lg,
    minHeight: height * 0.3,
  },
});
