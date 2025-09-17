import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "EGP", symbol: "£", name: "Egyptian Pound" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" }
];

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);

  // Get currency details by code
  const getCurrencyDetails = (code) => {
    return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
  };

  // Format amount with currency symbol
  const formatAmount = (amount) => {
    const currencyDetails = getCurrencyDetails(currency);
    return `${currencyDetails.symbol}${Number(amount).toLocaleString()}`;
  };

  useEffect(() => {
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      // First try to get from AsyncStorage for quick load
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        const { currency: savedCurrency } = JSON.parse(settings);
        if (savedCurrency) {
          setCurrency(savedCurrency);
        }
      }

      // Then check Firestore for the most up-to-date value
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().settings?.currency) {
          const firestoreCurrency = userDoc.data().settings.currency;
          setCurrency(firestoreCurrency);
          
          // Update AsyncStorage if different
          if (settings && JSON.parse(settings).currency !== firestoreCurrency) {
            const updatedSettings = settings ? { ...JSON.parse(settings), currency: firestoreCurrency } : { currency: firestoreCurrency };
            await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
          }
        }
      }
    } catch (error) {
      console.error('Error loading currency:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrency = async (newCurrency) => {
    try {
      setCurrency(newCurrency);
      
      // Update AsyncStorage
      const settings = await AsyncStorage.getItem('userSettings');
      const updatedSettings = settings ? { ...JSON.parse(settings), currency: newCurrency } : { currency: newCurrency };
      await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      
      // Update Firestore
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          settings: { currency: newCurrency }
        });
      }
    } catch (error) {
      console.error('Error updating currency:', error);
      throw error;
    }
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      updateCurrency, 
      loading,
      getCurrencyDetails,
      formatAmount,
      currencies: CURRENCIES 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}; 