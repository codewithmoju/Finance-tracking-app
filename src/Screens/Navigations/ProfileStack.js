import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Profile from "../ProfileScreens/Profile"

const ProfileStack = () => {
  const Stack = createStackNavigator();
  return (
    <Stack.Navigator initialRouteName="ProfileScreen">
      <Stack.Screen
        name="ProfileScreen"
        component={Profile}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;
