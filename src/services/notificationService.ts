import { NativeModules, Platform } from 'react-native';
import { apiClient } from '../api/client';

const hasFirebase = !!NativeModules.RNFBAppModule;
const getMessaging = () => {
  if (hasFirebase) {
    try {
      return require('@react-native-firebase/messaging').default;
    } catch (e) {
      console.warn('Failed to load @react-native-firebase/messaging:', e);
    }
  }
  return null;
};

export async function requestNotificationPermission(): Promise<boolean> {
  const messagingInstance = getMessaging();
  if (!messagingInstance) return false;

  try {
    const authStatus = await messagingInstance().requestPermission();
    return (
      authStatus === messagingInstance.AuthorizationStatus.AUTHORIZED ||
      authStatus === messagingInstance.AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
}

export async function registerDeviceToken(accessToken: string): Promise<void> {
  const messagingInstance = getMessaging();
  if (!messagingInstance) return;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    const fcmToken = await messagingInstance().getToken();
    if (!fcmToken) return;

    await apiClient.post(
      '/notifications/device-token',
      { token: fcmToken, platform: Platform.OS },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    // Re-register if token refreshes
    messagingInstance().onTokenRefresh(async (newToken: string) => {
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
  const messagingInstance = getMessaging();
  if (!messagingInstance) return;

  try {
    const fcmToken = await messagingInstance().getToken();
    if (!fcmToken) return;

    await apiClient.delete('/notifications/device-token', {
      data: { token: fcmToken },
      headers: { Authorization: `Bearer ${accessToken}` } ,
    });

    await messagingInstance().deleteToken();
  } catch (error) {
    console.error('Device token unregister failed:', error);
  }
}

// Call this once at app startup (outside any component)
export function setupBackgroundNotificationHandler(): void {
  const messagingInstance = getMessaging();
  if (!messagingInstance) return;

  try {
    messagingInstance().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('Background notification:', remoteMessage);
    });
  } catch (error) {
    console.error('Failed to set background message handler:', error);
  }
}
