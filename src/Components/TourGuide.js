import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLORS, colors, SPACING } from '../global/styles';
import { Fonts } from '../../assets/fonts/fonts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const TOUR_STEPS = [
  {
    id: 'balance',
    title: 'Total Balance',
    description: 'View your current balance, income, and expenses at a glance.',
    icon: 'account-balance-wallet',
  },
  {
    id: 'analytics',
    title: 'Smart Analytics',
    description: 'Get AI-powered insights and predictions about your spending habits.',
    icon: 'insights',
  },
  {
    id: 'transactions',
    title: 'Recent Activity',
    description: 'Track your recent transactions and income with detailed breakdowns.',
    icon: 'receipt-long',
  },
  {
    id: 'filters',
    title: 'Time Filters',
    description: 'Analyze your finances across different time periods.',
    icon: 'filter-list',
  },
  {
    id: 'premium',
    title: 'Premium Features',
    description: 'Access advanced analytics, predictions, and personalized recommendations.',
    icon: 'star',
  },
];

const TourGuide = ({ visible, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      animation.setValue(0);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('@tour_completed', 'true');
      onComplete();
    } catch (error) {
      console.error('Error saving tour state:', error);
    }
  };

  const renderStep = () => {
    const step = TOUR_STEPS[currentStep];
    return (
      <Animated.View
        style={[
          styles.stepContainer,
          {
            transform: [
              {
                scale: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
            opacity: animation,
          },
        ]}
      >
        <LinearGradient
          colors={THEME_COLORS.gradient.premium}
          style={styles.stepContent}
        >
          <View style={styles.iconContainer}>
            <MaterialIcons name={step.icon} size={40} color={colors.white} />
          </View>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
          <View style={styles.progressContainer}>
            {TOUR_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade">
      <View style={styles.container}>
        {renderStep()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
  },
  stepContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stepTitle: {
    fontSize: width * 0.06,
    color: colors.white,
    fontFamily: Fonts.POPPINS_BOLD,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: width * 0.04,
    color: colors.white,
    fontFamily: Fonts.POPPINS_REGULAR,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    opacity: 0.9,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: colors.white,
    width: 16,
  },
  nextButton: {
    backgroundColor: colors.white,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  nextButtonText: {
    color: THEME_COLORS.primary.main,
    fontSize: width * 0.04,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
});

export default TourGuide; 