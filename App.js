import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/Screens/Navigations/RootNavigator';
import { colors } from './src/global/styles';
import { CurrencyProvider } from './src/global/CurrencyContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <CurrencyProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="light" translucent={true} />
          </NavigationContainer>
        </CurrencyProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.richBlack,
  },
});

