import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLORS, SPACING, TYPOGRAPHY } from '../../global/styles';
import { Fonts } from '../../../assets/fonts/fonts';
import { auth } from '../../../firebaseConfig';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Scale animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Check auth state after animations
    const timeout = setTimeout(() => {
      auth.onAuthStateChanged((user) => {
        if (user && user.emailVerified) {
          navigation.replace('Main');
        } else {
          navigation.replace('Login');
        }
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../Drawable/Images/BUDGETO.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>BUDGETO</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.footerContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.poweredBy}>powered by</Text>
          <Text style={styles.studioName}>NAM STUDIOS</Text>
        </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#242442',
    justifyContent: 'center',
    alignItems: 'center',

  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_BLACK,
    letterSpacing: 2,
  },
  footerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    alignItems: 'center',
  },
  poweredBy: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginBottom: SPACING.xs,
  },
  studioName: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_BOLD,
    letterSpacing: 1,
  },
});

export default SplashScreen;
