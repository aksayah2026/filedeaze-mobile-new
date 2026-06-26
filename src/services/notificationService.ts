import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function registerDeviceToken(accessToken: string): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    const fcmToken = await messaging().getToken();
    if (!fcmToken) return;

    await apiClient.post(
      '/notifications/device-token',
      { token: fcmToken, platform: Platform.OS },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    // Re-register if token refreshes
    messaging().onTokenRefresh(async (newToken) => {
      await apiClient.post(
        '/notifications/device-token',
        { token: newToken, platform: Platform.OS },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    });
  } catch (error) {
    console.error('Device token registration failed:', error);
  }
}

export async function unregisterDeviceToken(accessToken: string): Promise<void> {
  try {
    const fcmToken = await messaging().getToken();
    if (!fcmToken) return;

    await apiClient.delete('/notifications/device-token', {
      data: { token: fcmToken },
      headers: { Authorization: `Bearer ${accessToken}` } ,
    });

    await messaging().deleteToken();
  } catch (error) {
    console.error('Device token unregister failed:', error);
  }
}

// Call this once at app startup (outside any component)
export function setupBackgroundNotificationHandler(): void {
  // App is in background/quit — notification tap opens the app
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background notification:', remoteMessage);
    // Navigation is handled by getInitialNotification
  });
}
