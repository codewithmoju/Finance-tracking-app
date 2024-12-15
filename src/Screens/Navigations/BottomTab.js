import { View, Text, StyleSheet,Platform } from "react-native";
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../HomeScreen/Home";
import { colors, THEME_COLORS } from "../../global/styles";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import TransactionStack from "./TransactionStack";
import ProfileStack from "./ProfileStack";
import IncomeStack from "./IncomeStack";
const BottomTab = () => {
  const BottomTab = createBottomTabNavigator();
  return (
    <BottomTab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        showLabel: false,
        tabBarStyle: {
          backgroundColor: THEME_COLORS.primary.light,
          borderRadius: 0,
          height: Platform.OS==='ios'?80:70,
        },
        tabBarActiveTintColor: THEME_COLORS.secondary.light,
      }}
    >
      <BottomTab.Screen
        name="Home"
        component={Home}
        options={{
          headerShown: false,
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="home"
              color={focused ? THEME_COLORS.secondary.light : THEME_COLORS.text.primary}
              size={focused ? 25 : 30}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="Transactions"
        component={TransactionStack}
        options={{
          headerShown: false,
          tabBarLabel: "Transactions",
          tabBarIcon: ({ focused }) => (
            <AntDesign
              name="swap"
              color={focused ? THEME_COLORS.secondary.light : colors.white}
              size={focused ? 25 : 30}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="IncomeScreen"
        component={IncomeStack}
        options={{
          headerShown: false,
          tabBarLabel: "Budget",
          tabBarIcon: ({ focused }) => (
            <MaterialIcons
              name="attach-money"
              color={focused ? THEME_COLORS.secondary.light : colors.white}
              size={focused ? 25 : 30}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="ProfileStack"
        component={ProfileStack}
        options={{
          headerShown: false,
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => (
            <FontAwesome
              name="user-circle-o"
              color={focused ? THEME_COLORS.secondary.light : colors.white}
              size={focused ? 25 : 30}
            />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
};

export default BottomTab;
const styles = StyleSheet.create({});
