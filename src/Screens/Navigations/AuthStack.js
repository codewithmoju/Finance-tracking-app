import { View, Text } from "react-native";
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SplashScreen from "../AuthScreens/SplashScreen";
import Login from "../AuthScreens/Login";
import SignUp from "../AuthScreens/SignUp";
import BottomTab from "./BottomTab";
import EmailVerification from "../AuthScreens/EmailVerification";
import ForgotPassword from "../AuthScreens/ForgotPasswrd";
const AuthStack = () => {
  const AuthStack = createStackNavigator();
  return (
    <AuthStack.Navigator initialRouteName="SplashScreen">
      <AuthStack.Screen
        name="SplashScreen"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="SignUp"
        component={SignUp}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="EmailVerification"
        component={EmailVerification}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="BottomTabs"
        component={BottomTab}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
};

export default AuthStack;
