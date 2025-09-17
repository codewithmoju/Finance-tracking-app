import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Share,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLORS, SPACING, TYPOGRAPHY, colors } from '../global/styles';
import { Fonts } from '../../assets/fonts/fonts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCurrency } from '../global/CurrencyContext';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { auth } from '../../firebaseConfig';

const { width, height } = Dimensions.get('window');

const formatDate = (date) => {
  if (!date || !date.toDate) return '';
  try {
    const d = date.toDate();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch (error) {
    return '';
  }
};

const generateInvoiceNumber = (date, id) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${dateStr}-${id?.slice(-4) || '0000'}`;
};

const TransactionModal = ({ 
  visible, 
  onClose, 
  data, 
  type = 'transaction'
}) => {
  const { currency } = useCurrency();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef();
  const userName = auth.currentUser?.displayName || 'User';

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await viewShotRef.current.capture({
        format: 'png',
        quality: 1,
        result: 'data-uri',
        width: width * 3, // Higher resolution
        height: height * 3 // Higher resolution
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `${type === 'income' ? 'Income' : 'Transaction'} Receipt`,
        UTI: 'public.png' // For iOS
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getGradientColors = () => {
    return type === 'income' 
      ? THEME_COLORS.gradient.income
      : THEME_COLORS.gradient.primary;
  };

  const getAccentColor = () => {
    return type === 'income' 
      ? THEME_COLORS.success.main
      : THEME_COLORS.accent.main;
  };

  const getCategoryName = () => {
    if (!data) return 'Uncategorized';
    
    // Handle different possible category structures
    if (typeof data.category === 'string') return data.category;
    if (data.category?.name) return data.category.name;
    if (data.category?.title) return data.category.title;
    if (data.categoryName) return data.categoryName;
    
    return 'Uncategorized';
  };

  if (!data) return null;

  const invoiceNumber = generateInvoiceNumber(data?.date, data?.id);
  const gradientColors = getGradientColors();
  const accentColor = getAccentColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={gradientColors}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                <MaterialIcons name="share" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <ViewShot 
              ref={viewShotRef} 
              style={styles.receiptContainer}
              options={{
                fileName: `receipt-${Date.now()}`,
                format: 'png',
                quality: 1
              }}
            >
              {/* Logo and App Name */}
              <View style={styles.brandingContainer}>
                <Image 
                  source={require('../Drawable/Images/Logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* Receipt Content */}
              <LinearGradient
                colors={[`${accentColor}15`, `${accentColor}05`]}
                style={styles.receiptContent}
              >
                {/* Invoice Header */}
                <View style={styles.invoiceHeader}>
                  <View>
                    <Text style={styles.invoiceTitle}>
                      {type === 'income' ? 'Income Receipt' : 'Transaction Receipt'}
                    </Text>
                    <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(data?.date)}</Text>
                </View>

                {/* User Info */}
                <LinearGradient
                  colors={[`${accentColor}15`, `${accentColor}25`]}
                  style={styles.userInfo}
                >
                  <Text style={styles.userName}>{userName}</Text>
                  <Text style={styles.userEmail}>{auth.currentUser?.email}</Text>
                </LinearGradient>

                {/* Amount Section */}
                <LinearGradient
                  colors={[`${accentColor}20`, `${accentColor}30`]}
                  style={styles.amountSection}
                >
                  <Text style={styles.amountLabel}>Amount</Text>
                  <Text style={[styles.amount, { color: accentColor }]}>
                    {currency}{data?.amount?.toFixed(2)}
                  </Text>
                </LinearGradient>

                {/* Category Section */}
                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category</Text>
                    <View style={styles.categoryContainer}>
                      <LinearGradient
                        colors={[accentColor, `${accentColor}80`]}
                        style={styles.categoryDot}
                      />
                      <Text style={[styles.categoryText, { color: accentColor }]}>
                        {getCategoryName()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{data?.description || 'No description'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference ID</Text>
                    <Text style={styles.detailValue}>{data?.id}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailValue}>{formatDate(data?.date)}</Text>
                  </View>
                </View>

                {/* Footer */}
                <LinearGradient
                  colors={[`${accentColor}15`, `${accentColor}25`]}
                  style={styles.footer}
                >
                  <Text style={[styles.poweredBy, { color: accentColor }]}>
                    Powered by NAM STUDIOS
                  </Text>
                  <Text style={styles.footerTagline}>
                    Track your finances with ease ✨
                  </Text>
                </LinearGradient>
              </LinearGradient>
            </ViewShot>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.dark,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  shareButton: {
    padding: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  receiptContainer: {
    backgroundColor: THEME_COLORS.primary.dark,
    minHeight: height - 100,
  },
  brandingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  logo: {
    width: width * 0.4,
    height: 60,
  },
  receiptContent: {
    margin: SPACING.lg,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  invoiceHeader: {
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  invoiceTitle: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    color: colors.white,
    fontFamily: Fonts.POPPINS_BOLD,
    marginBottom: SPACING.xs,
  },
  invoiceNumber: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: colors.silver,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  dateText: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
    textAlign: 'right',
  },
  userInfo: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  userName: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    color: colors.white,
    fontFamily: Fonts.POPPINS_BOLD,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: colors.silver,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  amountSection: {
    padding: SPACING.xl,
    alignItems: 'center',
    marginVertical: SPACING.lg,
    borderRadius: 15,
    marginHorizontal: SPACING.lg,
  },
  amountLabel: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginBottom: SPACING.sm,
  },
  amount: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    fontFamily: Fonts.POPPINS_BOLD,
  },
  detailsSection: {
    padding: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  detailRow: {
    marginBottom: SPACING.lg,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: colors.silver,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginBottom: SPACING.xs,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: colors.white,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  footer: {
    padding: SPACING.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  poweredBy: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    fontFamily: Fonts.POPPINS_BOLD,
    marginBottom: SPACING.xs,
  },
  footerTagline: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: colors.white,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
});

export default TransactionModal; 