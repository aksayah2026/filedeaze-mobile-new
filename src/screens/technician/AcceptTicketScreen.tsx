import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CheckCircle2, User, Briefcase, AlertCircle } from "lucide-react-native";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { useUpdateJobStatus, useJobDetails } from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";
import { AppButton } from "../../components/AppButton";
import { AppLoader } from "../../components/AppLoader";

type RouteProps = RouteProp<TechnicianStackParamList, "AcceptTicket">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "AcceptTicket">;

export const AcceptTicketScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, ticketNo, customerName } = route.params;

  const { data: job, isLoading } = useJobDetails(jobId);
  const acceptMutation = useUpdateJobStatus();

  const handleAccept = async () => {
    Alert.alert(
      "Confirm Acceptance",
      `Are you ready to accept ticket ${ticketNo} for ${customerName}?`,
      [
        { text: "Not Yet", style: "cancel" },
        {
          text: "Yes, Accept",
          onPress: async () => {
            try {
              await acceptMutation.mutateAsync({ ticketNo: jobId, status: "ACCEPTED" });
              Alert.alert(
                "Job Accepted ✓",
                `You have accepted ticket ${ticketNo}. It is now active in your job list.`,
                [{ text: "OK", onPress: () => navigation.navigate("TechnicianHome") }]
              );
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to accept job.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader
          title="Accept Job"
          showBack
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
        showBack
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
            {job?.priority && (
              <AppBadge
                label={job.priority}
                variant={
                  job.priority === "URGENT"
                    ? "danger"
                    : job.priority === "HIGH"
                    ? "warning"
                    : "primary"
                }
              />
            )}
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

        {/* Client Details */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Client</Text>
        <AppCard style={styles.card}>
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.primary}12` }]}>
              <User size={18} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Customer</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{customerName}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.success}12` }]}>
              <Briefcase size={18} color={theme.colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
                Scheduled Date & Time
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {job?.scheduledDate} · {job?.scheduledTime}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.warning}12` }]}>
              <Briefcase size={18} color={theme.colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Address</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{job?.address}</Text>
            </View>
          </View>
        </AppCard>

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            title="Accept This Job"
            onPress={handleAccept}
            loading={acceptMutation.isPending}
            variant="success"
            size="lg"
            icon={<CheckCircle2 size={20} color="#ffffff" />}
            style={styles.acceptBtn}
          />
          <AppButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ticketNo: { fontSize: 12, fontWeight: "700" },
  serviceTitle: { marginBottom: 6 },
  desc: { fontSize: 13, lineHeight: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: { fontSize: 11, fontWeight: "500", textTransform: "uppercase", marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "600" },
  divider: { height: 1, marginVertical: 12 },
  actions: { gap: 10, marginTop: 8 },
  acceptBtn: { marginBottom: 0 },
});
