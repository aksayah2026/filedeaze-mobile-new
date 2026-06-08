import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TechnicianStackParamList } from "../types/navigation.types";
import { TechnicianHomeScreen } from "../screens/technician/TechnicianHomeScreen";
import { TechnicianJobDetailsScreen } from "../screens/technician/TechnicianJobDetailsScreen";

const Stack = createNativeStackNavigator<TechnicianStackParamList>();

export const TechnicianNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="TechnicianHome" component={TechnicianHomeScreen} />
      <Stack.Screen name="TechnicianJobDetails" component={TechnicianJobDetailsScreen} />
    </Stack.Navigator>
  );
};
