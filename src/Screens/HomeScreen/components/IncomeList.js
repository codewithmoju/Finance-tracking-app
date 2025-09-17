import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLORS, SPACING, commonStyles, colors } from '../../../global/styles';
import { Fonts } from '../../../../assets/fonts/fonts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const IncomeList = React.memo(({ data, onViewAll, currency, categories }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, commonStyles.heading3]}>
          Income
        </Text>
        <TouchableOpacity 
          onPress={onViewAll}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <MaterialIcons name="arrow-forward" size={20} color={THEME_COLORS.secondary.main} />
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={5}
      >
        {data.map((item) => (
          <LinearGradient
            key={item.id}
            colors={THEME_COLORS.gradient.glass}
            style={[styles.card, commonStyles.glassMorphism]}
          >
            <View style={styles.cardContentContainer}>
              <View style={styles.cardIconContainer}>
                <View
                  style={[
                    styles.categoryIndicator,
                    {
                      backgroundColor: categories[item.color] || THEME_COLORS.success.main,
                    },
                  ]}
                />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.description}
                </Text>
                <Text style={styles.cardAmount}>
                  +{item.currency || currency}
                  {item.amount.toFixed(2)}
                </Text>
                <Text style={styles.cardDate}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </LinearGradient>
        ))}
      </ScrollView>
    </View>
  );
});

IncomeList.displayName = 'IncomeList';

const styles = StyleSheet.create({
  section: {
    marginTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: width * 0.05,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  viewAllText: {
    color: THEME_COLORS.secondary.main,
    marginRight: SPACING.xs,
    fontSize: width * 0.035,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  card: {
    minWidth: width * 0.7,
    margin: SPACING.xs,
    padding: SPACING.lg,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    elevation: 3,
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cardContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  cardTextContainer: {
    flex: 1,
    gap: SPACING.xs,
  },
  cardTitle: {
    ...commonStyles.bodyText1,
    color: THEME_COLORS.text.primary,
    fontSize: width * 0.04,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  cardAmount: {
    ...commonStyles.bodyText2,
    color: THEME_COLORS.success.main,
    fontSize: width * 0.035,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  cardDate: {
    color: colors.silver,
    fontSize: width * 0.03,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginTop: SPACING.xs,
  },
});

export default IncomeList; 