import { NativeModules, Platform } from 'react-native';
import { apiClient } from '../api/client';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  ticketId?: string;
  data?: Record<string, string>;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const response = await apiClient.get('/mobile/notifications');
  const rawList = response.data?.data ?? response.data ?? [];
  const list = Array.isArray(rawList) ? rawList : [];
  return list.map((item: any) => {
    const isRead = item.read !== undefined ? item.read : (item.isRead !== undefined ? item.isRead : false);
    const ticketId = item.ticketId ?? item.data?.ticketId ?? undefined;
    return {
      id: String(item.id ?? item._id ?? Math.random().toString()),
      title: item.title ?? "Notification",
      body: item.body ?? "",
      read: isRead,
      createdAt: item.createdAt ?? new Date().toISOString(),
      ticketId: ticketId ? String(ticketId) : undefined,
      data: item.data,
    };
  });
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/mobile/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/mobile/notifications/read-all');
}

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

export async function registerDeviceToken(accessToken: string): Promise<(() => void) | null> {
  const messagingInstance = getMessaging();
  console.log('[NotificationService] registerDeviceToken called. hasFirebase =', hasFirebase, 'messagingInstance available =', !!messagingInstance);
  if (!messagingInstance) return null;

  try {
    const granted = await requestNotificationPermission();
    console.log('[NotificationService] Notification permission status:', granted);
    if (!granted) return null;

    const fcmToken = await messagingInstance().getToken();
    console.log('[NotificationService] Retrieved FCM Token:', fcmToken);
    if (!fcmToken) return null;

    const response = await apiClient.post(
      '/mobile/notifications/device-token',
      { token: fcmToken, platform: Platform.OS },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    console.log('[NotificationService] Device token registered with backend. Status:', response.status);

    // Return unsubscribe so the caller can clean up on logout/unmount
    const unsubscribeRefresh = messagingInstance().onTokenRefresh(async (newToken: string) => {
      console.log('[NotificationService] FCM Token refreshed:', newToken);
      const refreshResponse = await apiClient.post(
        '/mobile/notifications/device-token',
        { token: newToken, platform: Platform.OS },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      console.log('[NotificationService] Refreshed token registered with backend. Status:', refreshResponse.status);
    });

    return unsubscribeRefresh;
  } catch (error) {
    console.error('[NotificationService] Device token registration failed:', error);
    return null;
  }
}

export async function unregisterDeviceToken(accessToken: string): Promise<void> {
  const messagingInstance = getMessaging();
  console.log('[NotificationService] unregisterDeviceToken called.');
  if (!messagingInstance) return;

  try {
    const fcmToken = await messagingInstance().getToken();
    console.log('[NotificationService] Token to unregister:', fcmToken);
    if (!fcmToken) return;

    const response = await apiClient.delete(`/mobile/notifications/device-token/${fcmToken}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('[NotificationService] Device token deleted from backend. Status:', response.status);

    await messagingInstance().deleteToken();
    console.log('[NotificationService] Local FCM token deleted.');
  } catch (error) {
    console.error('[NotificationService] Device token unregister failed:', error);
  }
}

// Call this once at app startup (outside any component)
export function setupBackgroundNotificationHandler(): void {
  const messagingInstance = getMessaging();
  console.log('[NotificationService] setupBackgroundNotificationHandler called.');
  if (!messagingInstance) return;

  try {
    messagingInstance().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('[NotificationService] Background notification received:', JSON.stringify(remoteMessage, null, 2));
    });
    console.log('[NotificationService] setBackgroundMessageHandler registered.');
  } catch (error) {
    console.error('[NotificationService] Failed to set background message handler:', error);
  }
}
