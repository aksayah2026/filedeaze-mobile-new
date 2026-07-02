import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Bell, BellOff, CheckCheck } from "lucide-react-native";
import { useTheme } from "../../theme";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "../../hooks/useNotifications";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppNotification } from "../../services/notificationService";
import { useAuthStore } from "../../store/auth.store";


function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const NotificationListScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { data: notifications = [], isLoading, refetch, isFetching } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handlePress = (item: AppNotification) => {
    if (!item.read) {
      markRead(item.id);
    }
    if (item.ticketId) {
      if (user?.role === "TECHNICIAN") {
        navigation.navigate("TechnicianJobDetails", { jobId: item.ticketId });
      } else {
        navigation.navigate("CustomerTicketDetails", { ticketId: item.ticketId });
      }
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <Pressable
      style={[
        styles.item,
        {
          backgroundColor: item.read ? theme.colors.card : `${theme.colors.primary}10`,
          borderColor: item.read ? theme.colors.borderLight : `${theme.colors.primary}30`,
        },
      ]}
      onPress={() => handlePress(item)}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}18` }]}>
        <Bell size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemRow}>
          <Text style={[styles.itemTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.read && (
            <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
          )}
        </View>
        <Text style={[styles.itemBody, { color: theme.colors.textMuted }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[styles.itemTime, { color: theme.colors.textLight }]}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );

  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      <BellOff size={48} color={theme.colors.textLight} />
      <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No notifications yet</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        title="Notifications"
        showBack
        onBackPress={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <Pressable
              style={styles.markAllBtn}
              onPress={() => markAllRead()}
              disabled={markingAll}
            >
              <CheckCheck size={16} color={theme.colors.primary} />
              <Text style={[styles.markAllText, { color: theme.colors.primary }]}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      {isLoading ? (
        <AppLoader />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={<ListEmpty />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: { flex: 1 },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 },
  itemTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
  itemBody: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  itemTime: { fontSize: 11 },
  emptyWrap: { alignItems: "center", gap: 12 },
  emptyText: { fontSize: 15 },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8 },
  markAllText: { fontSize: 12, fontWeight: "600" },
});
