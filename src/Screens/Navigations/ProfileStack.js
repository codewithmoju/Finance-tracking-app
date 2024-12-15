import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Profile from "../ProfileScreens/Profile"
const ProfileStack = () => {
  const ProfileStack = createStackNavigator();
  return (
    <ProfileStack.Navigator initialRouteName="BottomTabs">
      <ProfileStack.Screen
        name="Profile"
        component={Profile}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
};

export default ProfileStack;
