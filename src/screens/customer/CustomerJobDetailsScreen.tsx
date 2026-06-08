import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, Linking } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Phone,
  Calendar,
  MapPin,
  User,
  Info,
  CheckCircle2,
  FileCheck,
  CheckCircle,
} from "lucide-react-native";

import { useTheme } from "../../theme";
import { CustomerStackParamList } from "../../types/navigation.types";
import { useJobDetails } from "../../hooks/useJobs";
import { mapToCustomerStatus } from "../../mock/data";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";
import { AppButton } from "../../components/AppButton";

type RouteProps = RouteProp<CustomerStackParamList, "CustomerJobDetails">;
type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, "CustomerJobDetails">;

export const CustomerJobDetailsScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId } = route.params;

  const { data: job, isLoading } = useJobDetails(jobId);

  const openPhone = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader showBack onBackPress={() => navigation.goBack()} title="Tracking Details" />
        <AppLoader message="Retrieving status..." />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader showBack onBackPress={() => navigation.goBack()} title="Error" />
        <View style={styles.errorContent}>
          <Text style={{ color: theme.colors.textMuted }}>Service ticket not found.</Text>
        </View>
      </View>
    );
  }

  const customerStatus = mapToCustomerStatus(job.status);

  // Stepper states mapping
  const steps = [
    { label: "Logged", statuses: ["NEW"] },
    { label: "Assigned", statuses: ["ASSIGNED"] },
    { label: "En Route", statuses: ["TECHNICIAN ASSIGNED", "TECHNICIAN EN ROUTE"] },
    { label: "In Progress", statuses: ["WORK IN PROGRESS"] },
    { label: "Closed", statuses: ["COMPLETED", "CLOSED"] },
  ];

  // Helper to determine active step
  const getActiveStepIndex = () => {
    if (job.status === "NEW") return 0;
    if (job.status === "ASSIGNED") return 1;
    if (job.status === "ACCEPTED" || job.status === "TRAVELLING" || job.status === "REACHED") return 2;
    if (job.status === "IN_PROGRESS") return 3;
    if (job.status === "COMPLETED" || job.status === "CLOSED") return 4;
    return 3; // Fallback for Pending/Rescheduled
  };

  const activeIndex = getActiveStepIndex();

  const getStatusVariant = (status: string) => {
    switch (customerStatus) {
      case "COMPLETED":
      case "CLOSED":
        return "success";
      case "WORK IN PROGRESS":
      case "TECHNICIAN ASSIGNED":
      case "TECHNICIAN EN ROUTE":
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
      <AppHeader showBack onBackPress={() => navigation.goBack()} title={`Track: ${job.ticketNo}`} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Ticket Title Card */}
        <AppCard style={styles.card}>
          <View style={styles.badgeRow}>
            <AppBadge label={customerStatus} variant={getStatusVariant(job.status)} />
          </View>
          <Text
            style={[
              styles.title,
              { color: theme.colors.text, fontSize: theme.typography.fontSize.xl, fontWeight: "700" },
            ]}
          >
            {job.service}
          </Text>
          <Text style={[styles.desc, { color: theme.colors.textMuted }]}>{job.description}</Text>
        </AppCard>

        {/* Visual Progress Stepper */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Visual Status Tracker</Text>
        <AppCard style={styles.card}>
          <View style={styles.stepperContainer}>
            {steps.map((step, idx) => {
              const isPast = idx < activeIndex;
              const isCurrent = idx === activeIndex;
              const isFuture = idx > activeIndex;

              return (
                <View key={idx} style={styles.stepColumn}>
                  {/* Circle */}
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor: isPast || isCurrent ? theme.colors.primary : theme.colors.border,
                        borderColor: isCurrent ? `${theme.colors.primary}40` : "transparent",
                        borderWidth: isCurrent ? 5 : 0,
                      },
                    ]}
                  >
                    {isPast ? (
                      <CheckCircle size={12} color="#ffffff" />
                    ) : (
                      <Text style={{ fontSize: 9, color: isCurrent ? "#ffffff" : theme.colors.textMuted, fontWeight: "700" }}>
                        {idx + 1}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: isCurrent ? theme.colors.primary : theme.colors.textMuted,
                        fontWeight: isCurrent ? "700" : "500",
                      },
                    ]}
                  >
                    {step.label}
                  </Text>
                  {idx < steps.length - 1 && (
                    <View
                      style={[
                        styles.connectorLine,
                        {
                          backgroundColor: idx < activeIndex ? theme.colors.primary : theme.colors.borderLight,
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Pending or Reschedule alerts */}
          {(job.status === "PENDING" || job.status === "RESCHEDULED") && (
            <View style={[styles.alertBanner, { backgroundColor: `${theme.colors.danger}10`, borderColor: theme.colors.danger }]}>
              <Info size={16} color={theme.colors.danger} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: theme.colors.text, flex: 1 }}>
                {job.status === "PENDING"
                  ? `Service temporarily paused: ${job.pendingReason}`
                  : `Next service schedule updated: Rescheduled to visit on ${job.nextVisitDate}`}
              </Text>
            </View>
          )}
        </AppCard>

        {/* Assigned Technician Profile */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Assigned Expert</Text>
        <AppCard style={styles.card}>
          <View style={styles.techRow}>
            <View style={[styles.techAvatarPlaceholder, { backgroundColor: `${theme.colors.primary}15` }]}>
              <User color={theme.colors.primary} size={24} />
            </View>
            <View style={styles.techText}>
              <Text
                style={[
                  styles.techName,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.semibold,
                  },
                ]}
              >
                {job.technicianName || "Assigning Expert..."}
              </Text>
              <Text style={[styles.techRole, { color: theme.colors.textMuted }]}>
                {job.technicianName ? "Certified Field Service Technician" : "Matching available engineers..."}
              </Text>
            </View>
          </View>

          {job.technicianName && job.technicianMobile && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
              <View style={styles.techActionBox}>
                <Text style={{ fontSize: 13, color: theme.colors.textMuted, flex: 1 }}>
                  Contact dispatcher desk:
                </Text>
                <AppButton
                  title="Call Technician"
                  onPress={() => openPhone(job.technicianMobile!)}
                  variant="outline"
                  size="sm"
                  icon={<Phone size={12} color={theme.colors.primary} style={{ marginRight: 4 }} />}
                />
              </View>
            </>
          )}
        </AppCard>

        {/* Completion details, Invoices, Signatures */}
        {(job.status === "COMPLETED" || job.status === "CLOSED") && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Completion Summary</Text>
            <AppCard style={styles.card}>
              <View style={styles.rowItem}>
                <Text style={styles.detailLabel}>Time Spent:</Text>
                <Text style={styles.detailValue}>{job.duration}</Text>
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.detailLabel}>Work Performed:</Text>
                <Text style={[styles.detailValue, { flex: 1, textAlign: "right" }]}>{job.workNotes}</Text>
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.detailLabel}>Client Signature Ref:</Text>
                <Text style={styles.detailValue}>{job.customerSignature}</Text>
              </View>
              {job.paymentCollection && (
                <View style={styles.rowItem}>
                  <Text style={styles.detailLabel}>Amount Collected:</Text>
                  <Text style={{ fontWeight: "700", color: theme.colors.primary }}>
                    ₹{job.paymentCollection} ({job.paymentMethod})
                  </Text>
                </View>
              )}

              {/* Photos */}
              {job.afterPhotos && job.afterPhotos.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", textTransform: "uppercase", color: theme.colors.textMuted, marginBottom: 8 }}>
                    Completed Job Photos
                  </Text>
                  <View style={styles.photoRow}>
                    {job.afterPhotos.map((photo, index) => (
                      <Image key={index} source={{ uri: photo }} style={styles.completionPhoto} />
                    ))}
                  </View>
                </View>
              )}
            </AppCard>
          </View>
        )}

        {/* Service Location details */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Schedule & Site</Text>
        <AppCard style={styles.card}>
          <View style={styles.infoRow}>
            <Calendar size={18} color={theme.colors.textMuted} />
            <View>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Scheduled Time</Text>
              <Text style={[styles.infoVal, { color: theme.colors.text }]}>
                {job.scheduledDate} | {job.scheduledTime}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.infoRow}>
            <MapPin size={18} color={theme.colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Service Address</Text>
              <Text style={[styles.infoVal, { color: theme.colors.text }]}>{job.address}</Text>
            </View>
          </View>
        </AppCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  title: {
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  desc: {
    lineHeight: 20,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
  },
  stepperContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  stepColumn: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    marginBottom: 6,
  },
  stepLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  connectorLine: {
    position: "absolute",
    height: 2,
    width: "100%",
    left: "50%",
    top: 11,
    zIndex: 1,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  techRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  techAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  techText: {
    flex: 1,
  },
  techName: {
    marginBottom: 1,
  },
  techRole: {
    fontSize: 12,
  },
  techActionBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  photoRow: {
    flexDirection: "row",
    gap: 8,
  },
  completionPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: "500",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
