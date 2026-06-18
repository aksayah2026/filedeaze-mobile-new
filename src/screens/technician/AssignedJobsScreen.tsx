import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Animated,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Ticket,
  UserCheck,
  ThumbsUp,
  Car,
  MapPin,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Calendar,
  Briefcase,
  ChevronRight,
  Compass,
  LucideIcon,
  User,
} from "lucide-react-native";

import { useTheme } from "../../theme";
import { useTechnicianJobs } from "../../hooks/useJobs";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { TicketStatus } from "../../services/job.service";
import { StatusBadge } from "../../components/StatusBadge";
import { AppConfirmModal } from "../../components/AppConfirmModal";

type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "AssignedJobs">;
type RouteProps = RouteProp<TechnicianStackParamList, "AssignedJobs">;

type TabFilter = "ALL" | "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "PENDING" | "COMPLETED";

const TAB_FILTERS: { label: string; value: TabFilter }[] = [
  { label: "ALL", value: "ALL" },
  { label: "ASSIGNED", value: "ASSIGNED" },
  { label: "ACCEPTED", value: "ACCEPTED" },
  { label: "IN PROGRESS", value: "IN_PROGRESS" },
  { label: "PENDING", value: "PENDING" },
  { label: "COMPLETED", value: "COMPLETED" },
];

const ACTION_LABEL: Partial<Record<TicketStatus, string>> = {
  ASSIGNED: "Accept Job",
  ACCEPTED: "Start Travelling",
  TRAVELLING: "Mark Reached",
  REACHED: "Start Job",
  IN_PROGRESS: "Complete / Pending",
  PENDING: "Resume Job",
  INVOICE_GENERATED: "Collect Payment",
} as any;

export const AssignedJobsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const [activeTab, setActiveTab] = useState<TabFilter>(route.params?.initialTab || "ALL");
  const [lockModalVisible, setLockModalVisible] = useState(false);
  const [lockModalMessage, setLockModalMessage] = useState("");
  const tabListRef = useRef<FlatList>(null);

  // Sync activeTab whenever the screen focuses (comes into view)
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.initialTab) {
        setActiveTab(route.params.initialTab);
      }
    }, [route.params?.initialTab])
  );

  // Auto-scroll FlatList to activeTab so it's centered in view
  useEffect(() => {
    const index = TAB_FILTERS.findIndex((t) => t.value === activeTab);
    if (index !== -1 && tabListRef.current) {
      setTimeout(() => {
        try {
          tabListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        } catch (e) {
          // Prevent crash if layout is not fully measured yet
        }
      }, 100);
    }
  }, [activeTab]);

  const { data: jobs = [], isLoading, refetch, isRefetching } = useTechnicianJobs();

  const handlePhoneCall = (num: string) => {
    Linking.openURL(`tel:${num}`);
  };

  const getLeftBorderColor = (status: TicketStatus) => {
    switch (status as any) {
      case "ASSIGNED":
      case "NEW":
      case "ACCEPTED":
        return theme.colors.primary;
      case "TRAVELLING":
      case "REACHED":
        return "#E67E22";
      case "IN_PROGRESS":
      case "INVOICE_GENERATED":
        return "#27AE60";
      case "PENDING":
      case "RESCHEDULED":
        return "#F39C12";
      case "COMPLETED":
      case "CLOSED":
        return theme.colors.textMuted || "#94a3b8";
      default:
        return theme.colors.borderLight;
    }
  };

  // Status checks for filtering
  const filteredJobs = useMemo(() => {
    const list = Array.isArray(jobs) ? jobs : [];
    switch (activeTab) {
      case "ASSIGNED":
        return list.filter((j) => j.status === "ASSIGNED" || j.status === "NEW");
      case "ACCEPTED":
        return list.filter((j) => j.status === "ACCEPTED");
      case "IN_PROGRESS":
        return list.filter((j) => j.status === "IN_PROGRESS" || j.status === "TRAVELLING" || j.status === "REACHED" || (j.status as string) === "INVOICE_GENERATED");
      case "PENDING":
        return list.filter((j) => j.status === "PENDING" || j.status === "RESCHEDULED");
      case "COMPLETED":
        return list.filter((j) => j.status === "COMPLETED" || j.status === "CLOSED");
      default:
        return list;
    }
  }, [jobs, activeTab]);

  const renderJobCard = ({ item }: { item: any }) => {
    const todayStr = new Date().toLocaleDateString("sv-SE");
    const isLocked = item.scheduledDateRaw ? item.scheduledDateRaw > todayStr : false;

    const statusColor = getLeftBorderColor(item.status);
    const action = isLocked ? `Locked (Starts ${item.scheduledDate})` : ACTION_LABEL[item.status as TicketStatus];
    const formattedDate = item.scheduledDate;

    const handlePress = () => {
      if (isLocked) {
        setLockModalMessage(`This ticket is scheduled for ${item.scheduledDate}. You cannot view or accept it until that date.`);
        setLockModalVisible(true);
        return;
      }
      navigation.navigate("TechnicianJobDetails", { jobId: item.id });
    };

    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.cardContainer,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.borderLight,
            opacity: isLocked ? 0.6 : (pressed ? 0.92 : 1),
          },
        ]}
      >
        {/* Left colored border strip */}
        <View style={[styles.statusIndicatorStrip, { backgroundColor: statusColor }]} />

        <View style={styles.cardMain}>
          {/* Header Row */}
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.ticketNoText, { color: theme.colors.textMuted }]}>
              {item.ticketNo}
            </Text>
          </View>

          {/* Service Name */}
          <View style={[styles.serviceRow, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
            <Text style={[styles.serviceTitle, { color: theme.colors.text, flex: 1, marginRight: 8 }]} numberOfLines={1}>
              {item.service}
            </Text>
            <StatusBadge status={item.status} paymentCollection={item.paymentCollection} />
          </View>


          {/* Category */}
          {item.category && (
            <View style={styles.metaRow}>
              <Briefcase size={12} color={theme.colors.textLight} />
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                {item.category}
              </Text>
            </View>
          )}

          {/* Description */}
          {item.description ? (
            <Text style={[styles.descText, { color: theme.colors.textMuted }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Customer & Call Row */}
          <View style={styles.customerRow}>
            <View style={styles.customerInfo}>
              <View style={[styles.avatarCircle, { backgroundColor: `${theme.colors.primary}08` }]}>
                <User size={14} color={theme.colors.primary} />
              </View>
              <View style={styles.customerDetails}>
                <Text style={[styles.customerName, { color: theme.colors.text }]} numberOfLines={1}>
                  {item.customerName}
                </Text>
                {item.customerMobile ? (
                  <Text style={[styles.customerPhone, { color: theme.colors.textMuted }]}>
                    {item.customerMobile}
                  </Text>
                ) : null}
              </View>
            </View>

            {item.customerMobile ? (
              <Pressable
                onPress={() => handlePhoneCall(item.customerMobile)}
                style={({ pressed }) => [
                  styles.phoneBtn,
                  {
                    backgroundColor: `${theme.colors.success}15`,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Phone size={14} color={theme.colors.success} />
              </Pressable>
            ) : null}
          </View>

          {/* Date & Time */}
          <View style={styles.metaRow}>
            <Calendar size={13} color={theme.colors.textLight} style={{ marginRight: 6 }} />
            <Text style={[styles.metaText, { color: theme.colors.text }]}>
              {formattedDate} {item.scheduledTime ? `· ${item.scheduledTime}` : ""}
            </Text>
          </View>

          {/* Address */}
          <View style={[styles.metaRow, { alignItems: "flex-start" }]}>
            <MapPin size={13} color={theme.colors.textLight} style={{ marginRight: 6, marginTop: 2 }} />
            <Text style={[styles.metaText, { color: theme.colors.textMuted, flex: 1 }]} numberOfLines={2}>
              {item.address}
            </Text>
          </View>

          {/* Footer Action Button */}
          {action ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
              <Pressable
                onPress={() => navigation.navigate("TechnicianJobDetails", { jobId: item.id })}
                style={styles.actionBtnRow}
              >
                <Text style={[styles.actionLabelText, { color: theme.colors.primary }]}>
                  {action}
                </Text>
                <ChevronRight size={14} color={theme.colors.primary} />
              </Pressable>
            </>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        title="Assigned Jobs"
        subtitle="Your dispatched service tickets"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      {/* Pill Filter Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.borderLight }]}>
        <FlatList
          ref={tabListRef}
          data={TAB_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.tabContentContainer}
          renderItem={({ item }) => {
            const isSel = item.value === activeTab;
            return (
              <Pressable
                onPress={() => setActiveTab(item.value)}
                style={[
                  styles.tabPill,
                  isSel
                    ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                    : { backgroundColor: "transparent", borderColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    { color: isSel ? "#ffffff" : theme.colors.textMuted },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Job Count Indicator */}
      <View style={styles.countContainer}>
        <Text style={[styles.countText, { color: theme.colors.textMuted }]}>
          {filteredJobs.length} Job{filteredJobs.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Main List */}
      {isLoading && !isRefetching ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderJobCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Wrench size={40} color={theme.colors.textLight} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                No jobs found
              </Text>
            </View>
          }
        />
      )}
      <AppConfirmModal
        visible={lockModalVisible}
        title="Ticket Locked"
        message={lockModalMessage}
        confirmText="Close"
        confirmVariant="warning"
        showCancel={false}
        onConfirm={() => setLockModalVisible(false)}
        onCancel={() => setLockModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  tabContentContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  cardContainer: {
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statusIndicatorStrip: {
    width: 6,
  },
  cardMain: {
    flex: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ticketNoText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12.5,
    marginLeft: 6,
    fontWeight: "500",
  },
  descText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  customerDetails: {
    flex: 1,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  customerName: {
    fontSize: 14,
    fontWeight: "600",
  },
  customerPhone: {
    fontSize: 12.5,
  },
  phoneBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  actionLabelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default AssignedJobsScreen;
