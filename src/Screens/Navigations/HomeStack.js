import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { THEME_COLORS } from '../../global/styles';
import Home from '../HomeScreen/Home';

const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: THEME_COLORS.background.main,
        },
      }}
    >
      <Stack.Screen name="Home" component={Home} />
    </Stack.Navigator>
  );
};

export default HomeStack; 