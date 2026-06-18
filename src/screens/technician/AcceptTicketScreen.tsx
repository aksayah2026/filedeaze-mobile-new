import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  CheckCircle2,
  User,
  Briefcase,
  AlertCircle,
  XCircle,
  Phone,
  Mail,
  Tag,
  Calendar,
  MapPin,
  PhoneCall,
  Clock,
} from "lucide-react-native";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { useUpdateJobStatus, useJobDetails, useTechnicianJobs } from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";
import { AppButton } from "../../components/AppButton";
import { AppLoader } from "../../components/AppLoader";
import { AppConfirmModal } from "../../components/AppConfirmModal";
import { AppSuccessModal } from "../../components/AppSuccessModal";

type RouteProps = RouteProp<TechnicianStackParamList, "AcceptTicket">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "AcceptTicket">;

export const AcceptTicketScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, ticketNo, customerName } = route.params;

  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const { data: job, isLoading } = useJobDetails(jobId);
  const { data: allJobs = [] } = useTechnicianJobs();
  const acceptMutation = useUpdateJobStatus();

  const handleConfirmAccept = async () => {
    setAcceptModalVisible(false);

    // 1. Check if the technician already has another active job
    const hasActiveJob = Array.isArray(allJobs) && allJobs.some(
      (j) => j.id !== jobId && ["ACCEPTED", "TRAVELLING", "REACHED", "IN_PROGRESS"].includes(j.status)
    );
    if (hasActiveJob) {
      Alert.alert(
        "Active Job Pending",
        "You can only accept one job at a time. Please complete your current active job first."
      );
      return;
    }

    // 2. Check if the scheduled date matches today's date
    const getTodayStr = () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const todayStr = getTodayStr();
    if (job?.scheduledDateRaw !== todayStr) {
      Alert.alert(
        "Date Mismatch",
        "You can only accept jobs scheduled for today."
      );
      return;
    }

    try {
      await acceptMutation.mutateAsync({ ticketId: jobId, status: "ACCEPTED" });
      setSuccessModalVisible(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to accept job.");
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
    navigation.navigate("TechnicianHome");
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader
          title="Accept Job"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <AppLoader message="Loading ticket..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        title="Accept Job"
        subtitle={ticketNo}
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Confirmation Banner */}
        <View
          style={[
            styles.infoBanner,
            { backgroundColor: `${theme.colors.primary}10`, borderColor: theme.colors.primary },
          ]}
        >
          <AlertCircle size={20} color={theme.colors.primary} />
          <Text style={[styles.bannerText, { color: theme.colors.text }]}>
            Review the job details below before accepting. Once accepted, you are committed to this
            job.
          </Text>
        </View>

        {/* Ticket Summary Card */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Ticket Summary</Text>
        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[styles.ticketNo, { color: theme.colors.textMuted }]}>{ticketNo}</Text>
          </View>

          <Text
            style={[
              styles.serviceTitle,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.lg,
                fontWeight: "700",
              },
            ]}
          >
            {job?.service ?? "—"}
          </Text>
          <Text style={[styles.desc, { color: theme.colors.textMuted }]}>
            {job?.description ?? "—"}
          </Text>
        </AppCard>

        {/* Customer Details Card */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Customer Details</Text>
        <AppCard style={styles.card}>
          <Text style={[styles.customerNameTitle, { color: theme.colors.text, fontWeight: "600", fontSize: 16, marginBottom: 12 }]}>
            {job?.customerName || customerName}
          </Text>

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.primary}12` }]}>
              <MapPin size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Service Address</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {job?.address || "—"}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.success}12` }]}>
              <Phone size={18} color={theme.colors.success} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Mobile Phone</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {job?.customerMobile || "—"}
              </Text>
            </View>
          </View>

          {!!job?.customerAlternatePhone && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
              <View style={styles.infoRow}>
                <View style={[styles.iconBox, { backgroundColor: `#f59e0b12` }]}>
                  <PhoneCall size={18} color="#f59e0b" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Alternate Phone</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                    {job.customerAlternatePhone}
                  </Text>
                </View>
              </View>
            </>
          )}

          {!!job?.customerEmail && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
              <View style={styles.infoRow}>
                <View style={[styles.iconBox, { backgroundColor: `#8b5cf612` }]}>
                  <Mail size={18} color="#8b5cf6" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Email Address</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                    {job.customerEmail}
                  </Text>
                </View>
              </View>
            </>
          )}
        </AppCard>

        {/* Service Schedule Card */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Service Schedule</Text>
        <AppCard style={styles.card}>
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.success}12` }]}>
              <Calendar size={18} color={theme.colors.success} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Scheduled Time</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {job?.scheduledDate || "—"} | {job?.scheduledTime || "—"}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.primary}12` }]}>
              <Tag size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Category</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {job?.category || "—"}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Customer Attached Images */}
        {job?.images && job.images.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Attached Images</Text>
            <View style={styles.imageGrid}>
              {job.images.map((imgUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: imgUrl }}
                  style={styles.attachedImage}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky Action Footer */}
      <View style={[styles.stickyFooter, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.borderLight }]}>
        <View style={styles.actionsRow}>
          <AppButton
            title="Reject Job"
            onPress={() => navigation.navigate("RejectTicket", { jobId, ticketNo })}
            variant="danger"
            size="lg"
            icon={<XCircle size={18} color="#ffffff" />}
            style={styles.rejectBtn}
          />
          <AppButton
            title="Accept Job"
            onPress={() => setAcceptModalVisible(true)}
            loading={acceptMutation.isPending}
            variant="success"
            size="lg"
            icon={<CheckCircle2 size={18} color="#ffffff" />}
            style={styles.acceptBtn}
          />
        </View>
      </View>

      {/* Accept Job Confirm Modal */}
      <AppConfirmModal
        visible={acceptModalVisible}
        title="Accept Ticket"
        message={`Are you ready to accept ticket ${ticketNo} for ${customerName}? Once accepted, you will start the job flow.`}
        confirmText="Accept Job"
        cancelText="Cancel"
        confirmVariant="success"
        onConfirm={handleConfirmAccept}
        onCancel={() => setAcceptModalVisible(false)}
        loading={acceptMutation.isPending}
      />

      {/* App Success Modal */}
      <AppSuccessModal
        visible={successModalVisible}
        title="Job Accepted ✓"
        message={`You have accepted ticket ${ticketNo}. It is now active in your job list.`}
        onClose={handleSuccessClose}
        autoCloseDelay={2000}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerText: { fontSize: 13, lineHeight: 20, flex: 1 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  card: { marginBottom: 16 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ticketNo: { fontSize: 12, fontWeight: "700" },
  serviceTitle: { marginBottom: 6 },
  desc: { fontSize: 13, lineHeight: 20 },
  customerNameTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  divider: { height: 1, marginVertical: 12 },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
  },
  acceptBtn: {
    flex: 1.3,
  },
  stickyFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  attachedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
});
