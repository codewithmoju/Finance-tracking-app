import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Income from "../BudgetScreen/Income";
import AddIncome from "../BudgetScreen/AddIncome";
import IncomeCategories from "../BudgetScreen/IncomeCategories";
import EditIncome from "../BudgetScreen/EditIncome";
const IncomeStack = () => {
  const IncomeStack = createStackNavigator();
  return (
    <IncomeStack.Navigator initialRouteName="BottomTabs">
      <IncomeStack.Screen
        name="Income"
        component={Income}
        options={{ headerShown: false }}
      />
      <IncomeStack.Screen
        name="AddIncome"
        component={AddIncome}
        options={{ headerShown: false }}
      />
      <IncomeStack.Screen
        name="IncomeCategories"
        component={IncomeCategories}
        options={{ headerShown: false }}
      />
      <IncomeStack.Screen
        name="EditIncome"
        component={EditIncome}
        options={{ headerShown: false }}
      />
    </IncomeStack.Navigator>
  );
};

export default IncomeStack;
