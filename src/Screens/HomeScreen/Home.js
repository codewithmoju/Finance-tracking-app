import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME_COLORS, SPACING, TYPOGRAPHY } from '../../global/styles';
import { Fonts } from '../../../assets/fonts/fonts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { auth, db } from '../../../firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useCurrency } from '../../global/CurrencyContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import TransactionModal from '../../Components/TransactionModal';

const { width, height } = Dimensions.get('window');

// Helper function to safely format dates
const formatDate = (date) => {
  if (!date) return 'No date';
  if (typeof date === 'object' && date.toDate && typeof date.toDate === 'function') {
    try {
      return date.toDate().toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }
  return 'No date';
};

const Home = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { currency, formatAmount } = useCurrency();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          setUserName(user.displayName || 'User');
          await fetchTransactions(user.uid);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
    
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const fetchTransactions = async (userId) => {
    try {
      // Fetch recent transactions
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      
      const transactions = [];
      
      querySnapshot.forEach((doc) => {
        const transaction = { id: doc.id, ...doc.data() };
        transactions.push(transaction);
      });
      
      setRecentTransactions(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleTransactionPress = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.accent.main} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <LinearGradient
          colors={[THEME_COLORS.primary.main, THEME_COLORS.primary.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('ProfileStack')}
            >
              {/* If user has profile image, show it, otherwise show icon */}
              {auth.currentUser?.photoURL ? (
                <Image 
                  source={{ uri: auth.currentUser.photoURL }} 
                  style={styles.profileImage} 
                />
              ) : (
                <View style={styles.profileIconContainer}>
                  <Text style={styles.profileInitial}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Balance Card */}
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: translateY }],
        }}>
          <LinearGradient
            colors={THEME_COLORS.gradient.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.8 }}
            style={styles.balanceCard}
          >
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceTitle}>Current Balance</Text>
              <Text style={styles.balanceAmount}>{formatAmount(balance)}</Text>
            </View>
            <View style={styles.balanceTrend}>
              <MaterialIcons 
                name={balance >= 0 ? "trending-up" : "trending-down"} 
                size={24} 
                color={balance >= 0 ? THEME_COLORS.success.main : THEME_COLORS.danger.main} 
              />
            </View>
          </View>
          
          {/* Balance Visualization */}
          <View style={styles.balanceVisual}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${Math.min(Math.abs(balance) / 1000 * 100, 100)}%`, backgroundColor: balance >= 0 ? THEME_COLORS.success.main : THEME_COLORS.danger.main }]} 
                />
              </View>
              <View style={styles.balanceMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Income</Text>
                  <Text style={[styles.metricValue, { color: THEME_COLORS.success.main }]}>+{formatAmount(Math.max(balance, 0))}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Expenses</Text>
                  <Text style={[styles.metricValue, { color: THEME_COLORS.danger.main }]}>-{formatAmount(Math.max(-balance, 0))}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: THEME_COLORS.danger.light }]}
              onPress={() => navigation.navigate('TransactionStack')}
            >
              <MaterialIcons name="add" size={24} color={THEME_COLORS.danger.main} />
              <Text style={[styles.actionButtonText, { color: THEME_COLORS.danger.main }]}>Add Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: THEME_COLORS.success.light }]}
              onPress={() => navigation.navigate('IncomeStack')}
            >
              <MaterialIcons name="arrow-upward" size={24} color={THEME_COLORS.success.main} />
              <Text style={[styles.actionButtonText, { color: THEME_COLORS.success.main }]}>Add Income</Text>
            </TouchableOpacity>
          </View>
          </LinearGradient>
        </Animated.View>

        {/* Financial Insights Section */}
        <Animated.View 
          style={[styles.insightsContainer, {
            opacity: fadeAnim,
            transform: [{ translateY: translateY }],
          }]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="insights" size={20} color={THEME_COLORS.primary.main} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Financial Insights</Text>
            </View>
          </View>
          
          <View style={styles.insightsGrid}>
            <View style={styles.insightCard}>
              <View style={[styles.insightIconContainer, { backgroundColor: THEME_COLORS.primary.light }]}>
                <MaterialIcons name="trending-up" size={24} color={THEME_COLORS.primary.main} />
              </View>
              <Text style={styles.insightTitle}>Top Category</Text>
              <Text style={styles.insightValue}>{recentTransactions.length > 0 ? 'Food & Drinks' : 'N/A'}</Text>
            </View>
            
            <View style={styles.insightCard}>
              <View style={[styles.insightIconContainer, { backgroundColor: THEME_COLORS.success.light }]}>
                <MaterialIcons name="savings" size={24} color={THEME_COLORS.success.main} />
              </View>
              <Text style={styles.insightTitle}>Monthly Savings</Text>
              <Text style={styles.insightValue}>{formatAmount(Math.max(balance * 0.2, 0))}</Text>
            </View>
            
            <View style={styles.insightCard}>
              <View style={[styles.insightIconContainer, { backgroundColor: THEME_COLORS.danger.light }]}>
                <MaterialIcons name="show-chart" size={24} color={THEME_COLORS.danger.main} />
              </View>
              <Text style={styles.insightTitle}>Highest Expense</Text>
              <Text style={styles.insightValue}>{formatAmount(Math.max(...(recentTransactions.length > 0 ? recentTransactions.filter(t => t.type === 'expense').map(t => t.amount || 0) : [0]), 0))}</Text>
            </View>
            
            <View style={styles.insightCard}>
              <View style={[styles.insightIconContainer, { backgroundColor: THEME_COLORS.warning.light }]}>
                <MaterialIcons name="calendar-today" size={24} color={THEME_COLORS.warning.main} />
              </View>
              <Text style={styles.insightTitle}>This Month</Text>
              <Text style={styles.insightValue}>{formatAmount(balance)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View style={[styles.transactionsContainer, {
          opacity: fadeAnim,
          transform: [{ translateY: translateY }],
        }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="history" size={20} color={THEME_COLORS.accent.main} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('TransactionStack')}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <MaterialIcons name="chevron-right" size={16} color={THEME_COLORS.accent.main} />
            </TouchableOpacity>
          </View>

          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => {
              const isIncome = transaction.type === 'income';
              const iconName = isIncome ? 'arrow-downward' : 'arrow-upward';
              const iconColor = isIncome ? THEME_COLORS.success.main : THEME_COLORS.danger.main;
              const amountPrefix = isIncome ? '+' : '-';
              const amountColor = isIncome ? THEME_COLORS.success.main : THEME_COLORS.danger.main;
              
              return (
                <TouchableOpacity
                  key={transaction.id}
                  style={[styles.transactionItem, index === 0 && styles.transactionItemFirst]}
                  onPress={() => handleTransactionPress(transaction)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.transactionIcon, { backgroundColor: isIncome ? THEME_COLORS.success.light : THEME_COLORS.danger.light }]}>
                    <MaterialIcons
                      name={iconName}
                      size={20}
                      color={iconColor}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle} numberOfLines={1} ellipsizeMode="tail">
                      {transaction.title || transaction.category}
                    </Text>
                    <View style={styles.transactionMeta}>
                      <MaterialIcons name="event" size={12} color={THEME_COLORS.text.secondary} style={styles.metaIcon} />
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </Text>
                      {transaction.category && (
                        <View style={styles.categoryTag}>
                          <Text style={styles.categoryText}>{transaction.category}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.transactionAmountContainer}>
                    <Text style={[styles.transactionAmount, { color: amountColor }]}>
                      {amountPrefix} {formatAmount(transaction.amount)}
                    </Text>
                    <MaterialIcons 
                      name="chevron-right" 
                      size={16} 
                      color={THEME_COLORS.text.secondary} 
                      style={styles.chevronIcon}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyTransactions}>
              <MaterialIcons name="receipt-long" size={48} color={THEME_COLORS.text.secondary} />
              <Text style={styles.emptyText}>No recent transactions</Text>
              <TouchableOpacity 
                style={styles.addTransactionButton}
                onPress={() => navigation.navigate('TransactionStack')}
                activeOpacity={0.7}
              >
                <Text style={styles.addTransactionText}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('TransactionStack')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All Transactions</Text>
            <MaterialIcons name="arrow-forward" size={16} color={THEME_COLORS.accent.main} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Quick Actions */}
        <Animated.View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('TransactionStack')}
            >
              <MaterialIcons name="receipt-long" size={32} color={THEME_COLORS.accent.main} />
              <Text style={styles.quickActionText}>Transactions</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('IncomeStack')}
            >
              <MaterialIcons name="account-balance-wallet" size={32} color={THEME_COLORS.success.main} />
              <Text style={styles.quickActionText}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('ProfileStack')}
            >
              <MaterialIcons name="person" size={32} color={THEME_COLORS.warning.main} />
              <Text style={styles.quickActionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Transaction Modal */}
      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        data={selectedTransaction}
        type={selectedTransaction ? selectedTransaction.type : 'transaction'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.main,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.primary.main,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_REGULAR,
    opacity: 0.9,
  },
  userName: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_BOLD,
    marginBottom: 5,
  },
  dateText: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_REGULAR,
    opacity: 0.8,
  },
  profileButton: {
    backgroundColor: THEME_COLORS.background.card,
    padding: 2,
    borderRadius: 25,
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  profileImage: {
    height: 46,
    width: 46,
    borderRadius: 23,
  },
  profileIconContainer: {
    height: 46,
    width: 46,
    borderRadius: 23,
    backgroundColor: THEME_COLORS.accent.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 20,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  balanceCard: {
    margin: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: THEME_COLORS.background.card,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  balanceTitle: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_BOLD,
    marginBottom: 5,
  },
  balanceTrend: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  balanceVisual: {
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  balanceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 12,
    color: THEME_COLORS.text.secondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.accent.main,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    flex: 0.48,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginLeft: 5,
  },
  transactionsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: THEME_COLORS.accent.main,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginRight: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.background.card,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  transactionItemFirst: {
    borderLeftWidth: 3,
    borderLeftColor: THEME_COLORS.accent.main,
  },
  transactionIcon: {
    backgroundColor: THEME_COLORS.background.overlay,
    padding: 10,
    borderRadius: 10,
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  transactionDate: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_REGULAR,
  },
  categoryTag: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 10,
    color: THEME_COLORS.text.secondary,
    fontWeight: '500',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  chevronIcon: {
    opacity: 0.5,
  },
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME_COLORS.background.card,
    padding: 30,
    borderRadius: 15,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginTop: 10,
    marginBottom: 20,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 5,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  viewAllText: {
    color: THEME_COLORS.accent.main,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    marginRight: 8,
    fontSize: 14,
  },
  insightsContainer: {
    marginBottom: 20,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightCard: {
    width: '48%',
    backgroundColor: THEME_COLORS.background.paper,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 12,
    color: THEME_COLORS.text.secondary,
    fontFamily: Fonts.POPPINS_REGULAR,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_SEMIBOLD,
  },
  addTransactionButton: {
    backgroundColor: THEME_COLORS.accent.main,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  addTransactionText: {
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  quickActionsContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  quickActionItem: {
    backgroundColor: THEME_COLORS.background.card,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '30%',
  },
  quickActionText: {
    fontSize: TYPOGRAPHY.body2.fontSize,
    color: THEME_COLORS.text.primary,
    fontFamily: Fonts.POPPINS_MEDIUM,
    marginTop: 10,
  },
});

export default Home;