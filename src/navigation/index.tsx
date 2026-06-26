import React, { useEffect } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import messaging from "@react-native-firebase/messaging";
import { RootStackParamList } from "../types/navigation.types";
import { AuthNavigator } from "./AuthNavigator";
import { CustomerNavigator } from "./CustomerNavigator";
import { TechnicianNavigator } from "./TechnicianNavigator";
import { useAuthStore } from "../store/auth.store";
import { registerDeviceToken } from "../services/notificationService";

const Stack = createNativeStackNavigator<RootStackParamList>();

function NotificationHandler() {
  const { token } = useAuthStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!token) return;

    // Register FCM token with backend after login
    registerDeviceToken(token);

    // Foreground notification
    const unsubForeground = messaging().onMessage(async (remoteMessage) => {
      const { title, body } = remoteMessage.notification ?? {};
      Alert.alert(title ?? "FieldEaze", body ?? "");
    });

    // Background notification tap
    const unsubBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
      handleNotificationNavigation(remoteMessage, navigation);
    });

    // Quit state notification tap
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        handleNotificationNavigation(remoteMessage, navigation);
      }
    });

    return () => {
      unsubForeground();
      unsubBackground();
    };
  }, [token, navigation]);

  return null;
}

function handleNotificationNavigation(remoteMessage: any, navigation: any) {
  const { ticketId, route } = remoteMessage.data ?? {};
  // Assuming ticketId usually maps to a Job Detail screen for technicians
  if (ticketId) {
    // Modify based on actual navigation structure
    navigation.navigate("TechnicianPortal", {
      screen: "JobDetail",
      params: { id: ticketId },
    });
  } else if (route) {
    navigation.navigate(route);
  }
}

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
      <NotificationHandler />
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
