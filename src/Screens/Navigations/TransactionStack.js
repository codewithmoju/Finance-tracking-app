import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { THEME_COLORS, colors } from '../../global/styles';
import Transactions from '../TransactionScreens/Transactions';
import AddTransaction from '../TransactionScreens/AddTransaction';
import EditTransaction from '../TransactionScreens/EditTransaction';
import Categories from '../TransactionScreens/Categories';

const Stack = createStackNavigator();

const TransactionStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerStyle: {
          backgroundColor: 'transparent',
        },
        headerTitleStyle: {
          color: colors.white,
          fontSize: 18,
          fontFamily: 'Poppins-SemiBold',
        },
        headerTintColor: colors.white,
        headerShadowVisible: false,
        cardStyle: {
          backgroundColor: colors.richBlack,
        },
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress,
          },
        }),
      }}
    >
      <Stack.Screen 
        name="Transactions" 
        component={Transactions}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="AddTransaction" 
        component={AddTransaction}
        options={{
          title: 'Add Transaction',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="EditTransaction" 
        component={EditTransaction}
        options={{
          title: 'Edit Transaction',
        }}
      />
      <Stack.Screen 
        name="Categories" 
        component={Categories}
        options={{
          title: 'Categories',
        }}
      />
    </Stack.Navigator>
  );
};

export default TransactionStack;
