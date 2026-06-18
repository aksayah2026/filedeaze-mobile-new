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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
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
} from "lucide-react-native";

import { useTheme } from "../../theme";
import { useTechnicianJobs } from "../../hooks/useJobs";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { TicketStatus } from "../../services/job.service";

type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "AssignedJobs">;

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
};

function StatusAnimatedIcon({ status }: { status: TicketStatus }) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // PULSE — for ASSIGNED, REACHED_LOCATION
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    // BOUNCE — for TRAVELLING
    const bounceAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -5, duration: 400, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    );
    // WIGGLE — for IN_PROGRESS (rotate -15 to +15 deg)
    const wiggleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 300, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    );

    if (["ASSIGNED", "REACHED"].includes(status)) pulseAnim.start();
    else if (status === "TRAVELLING") bounceAnim.start();
    else if (status === "IN_PROGRESS") wiggleAnim.start();

    return () => {
      pulseAnim.stop();
      bounceAnim.stop();
      wiggleAnim.stop();
    };
  }, [status]);

  const rotateInterp = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-15deg", "15deg"],
  });

  // Pick icon + color per status
  const config: Record<string, { icon: LucideIcon; color: string }> = {
    NEW_TICKET: { icon: Ticket, color: theme.colors.textMuted },
    NEW: { icon: Ticket, color: theme.colors.textMuted },
    ASSIGNED: { icon: UserCheck, color: theme.colors.primary },
    ACCEPTED: { icon: ThumbsUp, color: theme.colors.primary },
    TRAVELLING: { icon: Car, color: '#E67E22' },
    REACHED: { icon: MapPin, color: theme.colors.primary },
    IN_PROGRESS: { icon: Wrench, color: '#27AE60' },
    PENDING: { icon: Clock, color: '#F39C12' },
    RESCHEDULED: { icon: Clock, color: '#F39C12' },
    COMPLETED: { icon: CheckCircle2, color: '#27AE60' },
    CLOSED: { icon: CheckCircle2, color: '#27AE60' },
    CANCELLED: { icon: XCircle, color: theme.colors.danger },
    REJECTED: { icon: XCircle, color: theme.colors.danger },
  };

  const { icon: Icon, color } = config[status] ?? config.NEW_TICKET;

  // Apply correct animation per status
  const animStyle =
    ["ASSIGNED", "REACHED"].includes(status) ? { transform: [{ scale: pulse }] } :
      status === "TRAVELLING" ? { transform: [{ translateY: bounce }] } :
        status === "IN_PROGRESS" ? { transform: [{ rotate: rotateInterp }] } :
          {};

  return (
    <Animated.View style={animStyle}>
      <Icon size={20} color={color} />
    </Animated.View>
  );
}

export const AssignedJobsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");

  const { data: jobs = [], isLoading, refetch, isRefetching } = useTechnicianJobs();

  const handlePhoneCall = (num: string) => {
    Linking.openURL(`tel:${num}`);
  };

  const getLeftBorderColor = (status: TicketStatus) => {
    switch (status) {
      case "ASSIGNED":
      case "NEW":
      case "ACCEPTED":
        return theme.colors.primary;
      case "TRAVELLING":
      case "REACHED":
        return "#E67E22";
      case "IN_PROGRESS":
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
        return list.filter((j) => j.status === "IN_PROGRESS" || j.status === "TRAVELLING" || j.status === "REACHED");
      case "PENDING":
        return list.filter((j) => j.status === "PENDING" || j.status === "RESCHEDULED");
      case "COMPLETED":
        return list.filter((j) => j.status === "COMPLETED" || j.status === "CLOSED");
      default:
        return list;
    }
  }, [jobs, activeTab]);

  const renderJobCard = ({ item }: { item: any }) => {
    const statusColor = getLeftBorderColor(item.status);
    const action = ACTION_LABEL[item.status as TicketStatus];
    const formattedDate = item.scheduledDate;

    return (
      <Pressable
        onPress={() => navigation.navigate("TechnicianJobDetails", { jobId: item.id })}
        style={({ pressed }) => [
          styles.cardContainer,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.borderLight,
            opacity: pressed ? 0.92 : 1,
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
            <Compass size={16} color={theme.colors.textLight} />
          </View>

          {/* Service Name & Animated Icon */}
          <View style={styles.serviceRow}>
            <Text style={[styles.serviceTitle, { color: theme.colors.text }]} numberOfLines={1}>
              {item.service}
            </Text>
            <StatusAnimatedIcon status={item.status} />
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
            <View style={styles.customerDetailsCol}>
              <View style={styles.avatarRow}>
                <View style={[styles.avatarDot, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.customerName, { color: theme.colors.text }]} numberOfLines={1}>
                  {item.customerName}
                </Text>
              </View>
              {item.customerMobile ? (
                <Text style={[styles.customerPhone, { color: theme.colors.textMuted }]}>
                  {item.customerMobile}
                </Text>
              ) : null}
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
          keyExtractor={(item) => item.id}
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
  customerDetailsCol: {
    flex: 1,
    gap: 2,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "600",
  },
  customerPhone: {
    fontSize: 12.5,
    paddingLeft: 12,
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
