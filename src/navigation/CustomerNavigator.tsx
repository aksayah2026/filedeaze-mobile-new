import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CustomerStackParamList } from "../types/navigation.types";
import { CustomerHomeScreen } from "../screens/customer/CustomerHomeScreen";
import { CustomerJobDetailsScreen } from "../screens/customer/CustomerJobDetailsScreen";

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export const CustomerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
      <Stack.Screen name="CustomerJobDetails" component={CustomerJobDetailsScreen} />
    </Stack.Navigator>
  );
};
