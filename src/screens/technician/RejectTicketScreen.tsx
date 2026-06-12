import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { XCircle, AlertTriangle } from "lucide-react-native";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { useRejectJob, useJobDetails } from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppLoader } from "../../components/AppLoader";

type RouteProps = RouteProp<TechnicianStackParamList, "RejectTicket">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "RejectTicket">;

const QUICK_REASONS = [
  "Outside my service area",
  "Skills mismatch — wrong specialization",
  "Medical / Emergency leave",
  "Schedule conflict",
  "Vehicle unavailable",
];

export const RejectTicketScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, ticketNo } = route.params;

  const { data: job, isLoading } = useJobDetails(jobId);
  const rejectMutation = useRejectJob();

  const [reason, setReason] = useState("");

  const handleReject = async () => {
    if (!reason.trim()) {
      Alert.alert("Required", "Please provide a reason for rejecting this job.");
      return;
    }

    Alert.alert(
      "Confirm Rejection",
      "This will notify the dispatch team and the job will be reassigned. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject Job",
          style: "destructive",
          onPress: async () => {
            try {
              await rejectMutation.mutateAsync({ ticketNo: jobId, reason });
              Alert.alert(
                "Job Rejected",
                "The dispatch team has been notified. This job will be reassigned.",
                [{ text: "OK", onPress: () => navigation.navigate("TechnicianHome") }]
              );
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to reject job.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Reject Job" showBack onBackPress={() => navigation.goBack()} />
        <AppLoader message="Loading ticket..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader
        title="Reject Job"
        subtitle={ticketNo}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Banner */}
        <View
          style={[
            styles.warningBanner,
            { backgroundColor: `${theme.colors.danger}10`, borderColor: theme.colors.danger },
          ]}
        >
          <AlertTriangle size={20} color={theme.colors.danger} />
          <Text style={[styles.warningText, { color: theme.colors.text }]}>
            Rejecting a job should only be done when absolutely necessary. This action will be
            logged and reviewed by your supervisor.
          </Text>
        </View>

        {/* Ticket Mini Summary */}
        <AppCard style={styles.card}>
          <Text style={[styles.ticketNo, { color: theme.colors.textMuted }]}>{ticketNo}</Text>
          <Text
            style={[
              styles.serviceTitle,
              { color: theme.colors.text, fontWeight: "700" },
            ]}
          >
            {job?.service ?? "—"}
          </Text>
          <Text style={[styles.customer, { color: theme.colors.textMuted }]}>
            Client: <Text style={{ fontWeight: "600", color: theme.colors.text }}>{job?.customerName}</Text>
            {"  ·  "}
            {job?.scheduledDate}
          </Text>
        </AppCard>

        {/* Quick Reasons */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
          Quick Select Reason
        </Text>
        <View style={styles.quickReasons}>
          {QUICK_REASONS.map((r) => {
            const isSelected = reason === r;
            return (
              <AppButton
                key={r}
                title={r}
                onPress={() => setReason(isSelected ? "" : r)}
                variant={isSelected ? "primary" : "outline"}
                size="sm"
                style={[styles.quickBtn, !isSelected && { borderColor: theme.colors.borderLight }]}
                textStyle={!isSelected ? { color: theme.colors.text } : {}}
              />
            );
          })}
        </View>

        {/* Free-text reason */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginTop: 16 }]}>
          Rejection Reason <Text style={{ color: theme.colors.danger }}>*</Text>
        </Text>
        <View
          style={[
            styles.textAreaContainer,
            {
              borderColor: reason.trim()
                ? theme.colors.primary
                : theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Describe why you cannot take this job..."
            placeholderTextColor={theme.colors.textLight}
            multiline
            numberOfLines={4}
            style={[
              styles.textArea,
              {
                color: theme.colors.text,
                textAlignVertical: "top",
              },
            ]}
          />
        </View>
        <Text style={[styles.charCount, { color: theme.colors.textLight }]}>
          {reason.length} characters (minimum 10)
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            title="Reject Job"
            onPress={handleReject}
            loading={rejectMutation.isPending}
            disabled={reason.trim().length < 10}
            variant="danger"
            size="lg"
            icon={<XCircle size={20} color="#ffffff" />}
          />
          <AppButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  warningText: { fontSize: 13, lineHeight: 20, flex: 1 },
  card: { marginBottom: 16 },
  ticketNo: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  serviceTitle: { fontSize: 15, marginBottom: 4 },
  customer: { fontSize: 13 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  quickReasons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickBtn: {
    borderRadius: 20,
    paddingHorizontal: 14,
  },
  textAreaContainer: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    minHeight: 110,
  },
  textArea: {
    fontSize: 14,
    lineHeight: 22,
    minHeight: 86,
  },
  charCount: { fontSize: 11, marginTop: 4, marginBottom: 20 },
  actions: { gap: 10 },
});
