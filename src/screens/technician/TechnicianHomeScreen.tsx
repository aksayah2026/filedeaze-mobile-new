import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  LogOut,
  History,
  MapPin,
  ChevronRight,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileCheck,
} from "lucide-react-native";

import { useTheme } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import {
  useTechnicianJobs,
  useAttendanceStatus,
  useCheckIn,
  useCheckOut,
} from "../../hooks/useJobs";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppEmptyState } from "../../components/AppEmptyState";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";
import { AppButton } from "../../components/AppButton";

type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "TechnicianHome">;

export const TechnicianHomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const { data: jobs = [], isLoading: isJobsLoading, refetch } = useTechnicianJobs();
  const { data: attendance, isLoading: isAttendanceLoading } = useAttendanceStatus();

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationInput, setLocationInput] = useState("Main Office HQ, Sector 62");

  // Calculate statistics
  const jobsList = Array.isArray(jobs) ? jobs : [];
  const assignedCount = jobsList.filter((j) => j.status === "ASSIGNED" || j.status === "NEW").length;
  const inProgressCount = jobsList.filter(
    (j) => j.status === "IN_PROGRESS" || j.status === "ACCEPTED" || j.status === "TRAVELLING" || j.status === "REACHED"
  ).length;
  const pendingCount = jobsList.filter((j) => j.status === "PENDING" || j.status === "RESCHEDULED").length;
  const completedCount = jobsList.filter((j) => j.status === "COMPLETED" || j.status === "CLOSED").length;

  const handleCheckInPress = () => {
    if (attendance?.shiftCompleted) {
      Alert.alert("Shift Completed", "Your shift for today has already been completed.");
      return;
    }
    if (attendance?.checkedIn) {
      Alert.alert("Already Checked In", "You are already checked in today.");
      return;
    }
    setLocationModalVisible(true);
  };

  const handleCheckInSubmit = async () => {
    if (attendance?.shiftCompleted) {
      Alert.alert("Shift Completed", "Your shift for today has already been completed.");
      return;
    }
    if (!locationInput.trim()) {
      Alert.alert("Required", "Please enter your check-in location.");
      return;
    }
    try {
      await checkInMutation.mutateAsync({ location: locationInput });
      setLocationModalVisible(false);
      setLocationInput("");
      Alert.alert("Success", "Attendance checked in successfully.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to check in.");
    }
  };

  const handleCheckOutSubmit = async () => {
    if (!attendance?.checkedIn) {
      Alert.alert("Not Checked In", "You must be checked in to perform checkout.");
      return;
    }
    Alert.alert(
      "Confirm Check Out",
      "Are you sure you want to check out for the day?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Check Out",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await checkOutMutation.mutateAsync({});
              Alert.alert(
                "Checked Out",
                `Successfully checked out.\nWorking hours today: ${res.workingHours || "N/A"}`
              );
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to check out.");
            }
          },
        },
      ]
    );
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "danger";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "primary";
      default:
        return "secondary";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "CLOSED":
        return "success";
      case "IN_PROGRESS":
      case "ACCEPTED":
      case "TRAVELLING":
      case "REACHED":
        return "warning";
      case "PENDING":
      case "RESCHEDULED":
        return "danger";
      default:
        return "primary";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        showTenantBranding
        rightAction={
          <Pressable
            onPress={logout}
            style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.7 }]}
          >
            <LogOut color={theme.colors.danger} size={20} />
          </Pressable>
        }
      />

      {/* Technician Banner */}
      <View
        style={[
          styles.profileBanner,
          {
            backgroundColor: theme.colors.card,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.borderLight,
          },
        ]}
      >
        <View style={[styles.avatarCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
          <User color={theme.colors.primary} size={24} />
        </View>
        <View style={styles.profileText}>
          <Text style={[styles.welcomeText, { color: theme.colors.textMuted, fontSize: theme.typography.fontSize.xs }]}>
            Technician Dashboard
          </Text>
          <Text
            style={[
              styles.nameText,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semibold,
              },
            ]}
          >
            {user?.name} ({user?.mobile})
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate("AttendanceHistory")}
          style={({ pressed }) => [
            {
              padding: 8,
              borderRadius: 8,
              backgroundColor: `${theme.colors.primary}12`,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <History color={theme.colors.primary} size={20} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Attendance Card */}
        <AppCard style={styles.attendanceCard}>
          <View style={styles.attendanceHeader}>
            <Clock size={20} color={theme.colors.primary} />
            <Text
              style={[
                styles.attendanceTitle,
                { color: theme.colors.text, fontSize: theme.typography.fontSize.sm, fontWeight: "700" },
              ]}
            >
              ATTENDANCE TRACKING
            </Text>
            {attendance?.shiftCompleted ? (
              <AppBadge label="Shift Completed" variant="success" />
            ) : attendance?.checkedIn ? (
              <AppBadge label="Active Check-in" variant="success" />
            ) : (
              <AppBadge label="Not Checked In" variant="secondary" />
            )}
          </View>

          {attendance?.shiftCompleted ? (
            <View style={styles.attendanceInfo}>
              <View style={styles.infoRow}>
                <Clock size={16} color={theme.colors.textMuted} />
                <Text style={[styles.attendanceInfoText, { color: theme.colors.text }]}>
                  Checked in at: <Text style={{ fontWeight: "700" }}>{attendance.checkInTime}</Text>
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Clock size={16} color={theme.colors.textMuted} />
                <Text style={[styles.attendanceInfoText, { color: theme.colors.text }]}>
                  Checked out at: <Text style={{ fontWeight: "700" }}>{attendance.checkOutTime}</Text>
                </Text>
              </View>
              <AppButton
                title="Shift Completed"
                onPress={() => { }}
                variant="secondary"
                size="sm"
                disabled
                style={{ marginTop: 12 }}
              />
              {/* CHANGED: Removed duplicate Attendance History link from Shift Completed view */}
            </View>
          ) : attendance?.checkedIn ? (
            <View style={styles.attendanceInfo}>
              <View style={styles.infoRow}>
                <Clock size={16} color={theme.colors.textMuted} />
                <Text style={[styles.attendanceInfoText, { color: theme.colors.text }]}>
                  Checked in at: <Text style={{ fontWeight: "700" }}>{attendance.checkInTime}</Text>
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MapPin size={16} color={theme.colors.textMuted} />
                <Text style={[styles.attendanceInfoText, { color: theme.colors.text }]}>
                  Location: <Text style={{ fontWeight: "600" }}>{attendance.checkInLocation}</Text>
                </Text>
              </View>
              <AppButton
                title="Check Out for the Day"
                onPress={handleCheckOutSubmit}
                variant="danger"
                size="sm"
                style={{ marginTop: 12 }}
              />
              {/* CHANGED: Removed duplicate Attendance History link from Active Check-in view */}
            </View>
          ) : (
            <View style={styles.attendanceInfo}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 12 }}>
                {attendance?.workingHours
                  ? `Last session completed: ${attendance.workingHours} (Check out: ${attendance.checkOutTime})`
                  : "Start your shifts to record working hours, track travel progress, and begin executing dispatched jobs."}
              </Text>
              <AppButton
                title="Perform Check In"
                onPress={handleCheckInPress}
                variant="primary"
                size="sm"
              />
            </View>
          )}
        </AppCard>

        {/* Stats Grid */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Job Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{assignedCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Assigned</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>{inProgressCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Active</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statValue, { color: theme.colors.danger }]}>{pendingCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Pending</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>{completedCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Completed</Text>
          </View>
        </View>

        {/* Jobs List */}
        <View style={styles.jobsHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted, marginVertical: 0 }]}>
            Dispatched Tickets
          </Text>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Pressable onPress={() => navigation.navigate("AssignedJobs")}>
              <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: "700" }}>View All</Text>
            </Pressable>
            <Pressable onPress={() => refetch()}>
              <Text style={{ fontSize: 12, color: theme.colors.textMuted, fontWeight: "600" }}>Refresh</Text>
            </Pressable>
          </View>
        </View>

        {isJobsLoading ? (
          <AppLoader message="Loading assigned jobs..." />
        ) : jobsList.length === 0 ? (
          <AppEmptyState
            title="No Assigned Jobs"
            description="You have no tickets currently dispatched to you today."
          />
        ) : (
          jobsList.map((item) => (
            <AppCard
              key={item.ticketNo}
              onPress={() => navigation.navigate("TechnicianJobDetails", { jobId: item.ticketNo })}
              style={styles.jobCard}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.jobId, { color: theme.colors.textMuted }]}>{item.ticketNo}</Text>
                <View style={styles.badgeRow}>
                  <AppBadge label={item.status} variant={getStatusVariant(item.status)} />
                </View>
              </View>

              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.semibold,
                  },
                ]}
              >
                {item.service}
              </Text>

              <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 12 }} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.infoLine}>
                <History size={14} color={theme.colors.textMuted} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>
                  {item.scheduledDate} | {item.scheduledTime}
                </Text>
              </View>

              <View style={styles.infoLine}>
                <MapPin size={14} color={theme.colors.textMuted} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

              <View style={styles.cardFooter}>
                <Text style={[styles.customerLabel, { color: theme.colors.textLight }]}>
                  Client: <Text style={{ color: theme.colors.text, fontWeight: "600" }}>{item.customerName}</Text>
                </Text>
                <View style={styles.actionLink}>
                  <Text style={[styles.actionLinkText, { color: theme.colors.primary }]}>View</Text>
                  <ChevronRight size={16} color={theme.colors.primary} />
                </View>
              </View>
            </AppCard>
          ))
        )}
      </ScrollView>

      {/* Location Check-In Modal */}
      <Modal visible={locationModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}>
            <Text
              style={[
                styles.modalTitle,
                { color: theme.colors.text, fontSize: theme.typography.fontSize.md, fontWeight: "700" },
              ]}
            >
              Verify Check-In Location
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 16 }}>
              Please enter or confirm your current physical dispatch location:
            </Text>
            <TextInput
              value={locationInput}
              onChangeText={setLocationInput}
              style={[
                styles.locationInput,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                },
              ]}
              placeholder="e.g. Noida Sector 62 Office"
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setLocationModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: theme.colors.borderLight }]}
              >
                <Text style={{ color: theme.colors.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCheckInSubmit}
                style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={{ color: "#ffffff", fontWeight: "700" }}>Check In</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoutButton: {
    padding: 8,
  },
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileText: {
    flex: 1,
  },
  welcomeText: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nameText: {
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  attendanceCard: {
    marginBottom: 16,
    padding: 16,
  },
  attendanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  attendanceTitle: {
    flex: 1,
    letterSpacing: 0.5,
  },
  attendanceInfo: {
    paddingTop: 4,
  },
  attendanceInfoText: {
    fontSize: 13,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 4,
  },
  jobsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  jobCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  jobId: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  cardTitle: {
    marginBottom: 8,
  },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerLabel: {
    fontSize: 12,
    flex: 1,
  },
  actionLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: "600",
    marginRight: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 24,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 12,
  },
  locationInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
