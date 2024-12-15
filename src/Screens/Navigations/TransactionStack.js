import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Transactions from "../TransactionScreens/Transactions";
import AddTransaction from "../TransactionScreens/AddTransaction";
import Categories from "../TransactionScreens/Categories";
import EditTransaction from "../TransactionScreens/EditTransaction";
const TransactionStack = () => {
  const TransactionStack = createStackNavigator();
  return (
    <TransactionStack.Navigator initialRouteName="BottomTabs">
      <TransactionStack.Screen
        name="Transaction"
        component={Transactions}
        options={{ headerShown: false }}
      />
      <TransactionStack.Screen
        name="EditTransaction"
        component={EditTransaction}
        options={{ headerShown: false }}
      />
      <TransactionStack.Screen
        name="AddTransaction"
        component={AddTransaction}
        options={{ headerShown: false }}
      />
      <TransactionStack.Screen
        name="Categories"
        component={Categories}
        options={{ headerShown: false }}
      />
    </TransactionStack.Navigator>
  );
};

export default TransactionStack;
