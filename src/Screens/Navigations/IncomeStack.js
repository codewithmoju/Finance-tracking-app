import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { THEME_COLORS, colors } from '../../global/styles';
import Income from '../BudgetScreen/Income';
import AddIncome from '../BudgetScreen/AddIncome';
import EditIncome from '../BudgetScreen/EditIncome';
import IncomeCategories from '../BudgetScreen/IncomeCategories';

const Stack = createStackNavigator();

const IncomeStack = () => {
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
        name="Income" 
        component={Income}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="AddIncome" 
        component={AddIncome}
        options={{
          title: 'Add Income',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="EditIncome" 
        component={EditIncome}
        options={{
          title: 'Edit Income',
        }}
      />
      <Stack.Screen 
        name="IncomeCategories" 
        component={IncomeCategories}
        options={{
          title: 'Categories',
        }}
      />
    </Stack.Navigator>
  );
};

export default IncomeStack;
