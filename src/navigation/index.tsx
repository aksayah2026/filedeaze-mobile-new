import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation.types";
import { AuthNavigator } from "./AuthNavigator";
import { CustomerNavigator } from "./CustomerNavigator";
import { TechnicianNavigator } from "./TechnicianNavigator";
import { useAuthStore } from "../store/auth.store";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user?.role === "TECHNICIAN" ? (
          <Stack.Screen name="TechnicianPortal" component={TechnicianNavigator} />
        ) : (
          // Fallback or explicit Customer route
          <Stack.Screen name="CustomerPortal" component={CustomerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
export default RootNavigator;
