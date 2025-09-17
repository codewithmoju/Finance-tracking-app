import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SplashScreen from "../AuthScreens/SplashScreen";
import Login from "../AuthScreens/Login";
import SignUp from "../AuthScreens/SignUp";
import EmailVerification from "../AuthScreens/EmailVerification";
import ForgotPassword from "../AuthScreens/ForgotPasswrd";

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator 
      initialRouteName="SplashScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="SplashScreen"
        component={SplashScreen}
      />
      <Stack.Screen
        name="Login"
        component={Login}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUp}
      />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerification}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
