import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  Image,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Phone,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Camera,
  Signature,
  DollarSign,
  ChevronDown,
  Calendar,
} from "lucide-react-native";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import {
  useJobDetails,
  useUpdateJobStatus,
  useCompleteJob,
  useRescheduleJob,
  useMarkJobPending,
} from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";

type RouteProps = RouteProp<TechnicianStackParamList, "TechnicianJobDetails">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "TechnicianJobDetails">;

export const TechnicianJobDetailsScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId } = route.params;

  const { data: job, isLoading, refetch } = useJobDetails(jobId);
  const updateStatusMutation = useUpdateJobStatus();
  const completeJobMutation = useCompleteJob();
  const rescheduleJobMutation = useRescheduleJob();
  const markPendingMutation = useMarkJobPending();

  // Completion Form State
  const [completeFormVisible, setCompleteFormVisible] = useState(false);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300",
  ]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [customerSignature, setCustomerSignature] = useState("");
  const [workNotes, setWorkNotes] = useState("");
  const [duration, setDuration] = useState("1.5 Hours");
  const [paymentAmount, setPaymentAmount] = useState("2500");
  const [paymentMethod, setPaymentMethod] = useState("Online");

  // Pending State Form
  const [pendingFormVisible, setPendingFormVisible] = useState(false);
  const [selectedPendingReason, setSelectedPendingReason] = useState("");

  // Reschedule Form State
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [nextVisitDate, setNextVisitDate] = useState("2026-06-08");

  const pendingReasons = [
    "Customer Not Available",
    "Spare Parts Required",
    "Additional Visit Required",
    "Technical Issue",
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader showBack onBackPress={() => navigation.goBack()} title="Ticket Details" />
        <AppLoader message="Retrieving ticket info..." />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader showBack onBackPress={() => navigation.goBack()} title="Error" />
        <View style={styles.errorContent}>
          <Text style={{ color: theme.colors.textMuted }}>Job ticket not found.</Text>
        </View>
      </View>
    );
  }

  const handleStatusChange = async (status: typeof job.status) => {
    try {
      await updateStatusMutation.mutateAsync({ ticketNo: jobId, status });
      Alert.alert("Success", `Status changed to ${status}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to change status.");
    }
  };

  const handleReject = () => {
    Alert.alert("Job Rejected", "You have rejected this job. Dispatch will reassign it.");
    navigation.goBack();
  };

  const handlePendingSubmit = async () => {
    if (!selectedPendingReason) {
      Alert.alert("Required", "Please choose a pending reason.");
      return;
    }
    try {
      await markPendingMutation.mutateAsync({
        ticketNo: jobId,
        pendingReason: selectedPendingReason,
      });
      setPendingFormVisible(false);
      Alert.alert("Success", "Job marked as Pending.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save status.");
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!nextVisitDate) {
      Alert.alert("Required", "Please select a date.");
      return;
    }
    try {
      await rescheduleJobMutation.mutateAsync({
        ticketNo: jobId,
        nextVisitDate,
      });
      setRescheduleVisible(false);
      Alert.alert("Success", "Job rescheduled successfully.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to reschedule.");
    }
  };

  const handleCompletionSubmit = async () => {
    if (afterPhotos.length === 0) {
      Alert.alert("Required", "Please simulate adding an 'After' Photo.");
      return;
    }
    if (!customerSignature.trim()) {
      Alert.alert("Required", "Please record customer signature confirmation.");
      return;
    }
    if (!workNotes.trim()) {
      Alert.alert("Required", "Please enter work resolution notes.");
      return;
    }

    try {
      await completeJobMutation.mutateAsync({
        ticketNo: jobId,
        payload: {
          beforePhotos,
          afterPhotos,
          customerSignature,
          workNotes,
          duration,
          paymentCollection: parseFloat(paymentAmount) || 0,
          paymentMethod,
        },
      });
      setCompleteFormVisible(false);
      Alert.alert(
        "Job Completed & Closed",
        `Invoice generated successfully for amount ₹${paymentAmount}.`
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to complete ticket.");
    }
  };

  const simulateAfterPhoto = () => {
    setAfterPhotos(["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300"]);
    Alert.alert("Photo Recorded", "Simulated AFTER photo has been captured.");
  };

  const openPhone = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openMaps = (address: string) => {
    const formattedAddress = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${formattedAddress}`);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={64}
    >
      <AppHeader showBack onBackPress={() => navigation.goBack()} title={`Ticket: ${job.ticketNo}`} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Basic Header Card */}
        <AppCard style={styles.card}>
          <View style={styles.badgeRow}>
            <AppBadge label={job.status} variant={getStatusVariant(job.status)} />
          </View>
          <Text
            style={[
              styles.jobTitle,
              { color: theme.colors.text, fontSize: theme.typography.fontSize.xl, fontWeight: "700" },
            ]}
          >
            {job.service}
          </Text>
          <Text style={[styles.jobDesc, { color: theme.colors.textMuted }]}>{job.description}</Text>
        </AppCard>

        {/* Client & Address Info */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Client Details</Text>
        <AppCard style={styles.card}>
          <Text style={[styles.customerName, { color: theme.colors.text, fontWeight: "600" }]}>
            {job.customerName}
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.infoRow}>
            <Clock size={16} color={theme.colors.textMuted} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Scheduled: {job.scheduledDate} | {job.scheduledTime}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={16} color={theme.colors.textMuted} />
            <Text style={[styles.infoText, { color: theme.colors.text, flex: 1 }]}>{job.address}</Text>
            <AppButton
              title="Map"
              onPress={() => openMaps(job.address)}
              variant="outline"
              size="sm"
              icon={<Navigation size={12} color={theme.colors.primary} style={{ marginRight: 2 }} />}
            />
          </View>

          <View style={styles.infoRow}>
            <Phone size={16} color={theme.colors.textMuted} />
            <Text style={[styles.infoText, { color: theme.colors.text, flex: 1 }]}>{job.customerMobile}</Text>
            <AppButton
              title="Call"
              onPress={() => openPhone(job.customerMobile)}
              variant="outline"
              size="sm"
              icon={<Phone size={12} color={theme.colors.primary} style={{ marginRight: 2 }} />}
            />
          </View>
        </AppCard>

        {/* Execution Flow Controls */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Execution Controls</Text>
        <View style={{ marginBottom: 16 }}>
          {job.status === "ASSIGNED" && (
            <View style={styles.btnRow}>
              <AppButton
                title="Reject"
                onPress={handleReject}
                variant="outline"
                style={{ flex: 1, borderColor: theme.colors.danger }}
                textStyle={{ color: theme.colors.danger }}
              />
              <AppButton
                title="Accept Job"
                onPress={() => handleStatusChange("ACCEPTED")}
                loading={updateStatusMutation.isPending}
                style={{ flex: 1.5 }}
              />
            </View>
          )}

          {job.status === "ACCEPTED" && (
            <AppButton
              title="Start Travel"
              onPress={() => handleStatusChange("TRAVELLING")}
              loading={updateStatusMutation.isPending}
            />
          )}

          {job.status === "TRAVELLING" && (
            <AppButton
              title="Reached Customer Location"
              onPress={() => handleStatusChange("REACHED")}
              loading={updateStatusMutation.isPending}
            />
          )}

          {job.status === "REACHED" && (
            <AppButton
              title="Start Work"
              onPress={() => handleStatusChange("IN_PROGRESS")}
              loading={updateStatusMutation.isPending}
            />
          )}

          {job.status === "IN_PROGRESS" && (
            <View style={styles.btnRow}>
              <AppButton
                title="Mark Pending"
                onPress={() => {
                  setCompleteFormVisible(false);
                  setPendingFormVisible(true);
                }}
                variant="outline"
                style={{ flex: 1 }}
              />
              <AppButton
                title="Complete Job"
                onPress={() => {
                  setPendingFormVisible(false);
                  setCompleteFormVisible(true);
                }}
                variant="success"
                style={{ flex: 1.5 }}
              />
            </View>
          )}

          {job.status === "PENDING" && (
            <View style={{ gap: 8 }}>
              <View style={[styles.alertBox, { backgroundColor: `${theme.colors.danger}10`, borderColor: theme.colors.danger }]}>
                <AlertCircle size={20} color={theme.colors.danger} />
                <Text style={{ color: theme.colors.text, fontSize: 13, flex: 1 }}>
                  Ticket is currently PENDING. Reason: <Text style={{ fontWeight: "700" }}>{job.pendingReason}</Text>
                </Text>
              </View>
              <AppButton title="Resume Work" onPress={() => handleStatusChange("IN_PROGRESS")} />
              <AppButton
                title="Schedule Next Visit"
                onPress={() => setRescheduleVisible(true)}
                variant="secondary"
              />
            </View>
          )}

          {job.status === "RESCHEDULED" && (
            <View style={{ gap: 8 }}>
              <View style={[styles.alertBox, { backgroundColor: `${theme.colors.warning}10`, borderColor: theme.colors.warning }]}>
                <Calendar size={20} color={theme.colors.warning} />
                <Text style={{ color: theme.colors.text, fontSize: 13, flex: 1 }}>
                  Rescheduled for: <Text style={{ fontWeight: "700" }}>{job.nextVisitDate}</Text>
                </Text>
              </View>
              <AppButton title="Resume Work Now" onPress={() => handleStatusChange("IN_PROGRESS")} />
            </View>
          )}

          {(job.status === "COMPLETED" || job.status === "CLOSED") && (
            <View style={[styles.successBanner, { backgroundColor: `${theme.colors.success}10`, borderColor: theme.colors.success }]}>
              <CheckCircle2 size={24} color={theme.colors.success} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.success, fontWeight: "700", fontSize: 14 }}>
                  Work Completed & Closed
                </Text>
                {job.workNotes && (
                  <Text style={{ color: theme.colors.text, fontSize: 12, marginTop: 4 }}>
                    Note: {job.workNotes}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Reschedule Visit Date Input Form */}
        {rescheduleVisible && (
          <AppCard style={styles.formCard}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Reschedule Ticket</Text>
            <AppInput
              label="Next Visit Date"
              placeholder="YYYY-MM-DD"
              value={nextVisitDate}
              onChangeText={setNextVisitDate}
            />
            <View style={styles.btnRow}>
              <AppButton
                title="Cancel"
                onPress={() => setRescheduleVisible(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <AppButton
                title="Confirm Reschedule"
                onPress={handleRescheduleSubmit}
                loading={rescheduleJobMutation.isPending}
                style={{ flex: 1.5 }}
              />
            </View>
          </AppCard>
        )}

        {/* Pending Reason Picker Form */}
        {pendingFormVisible && (
          <AppCard style={styles.formCard}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Choose Pending Reason</Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {pendingReasons.map((r) => {
                const isSelected = selectedPendingReason === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setSelectedPendingReason(r)}
                    style={[
                      styles.reasonOption,
                      {
                        backgroundColor: isSelected ? `${theme.colors.primary}12` : theme.colors.background,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.borderLight,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected ? theme.colors.primary : theme.colors.text,
                        fontWeight: isSelected ? "700" : "500",
                      }}
                    >
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.btnRow}>
              <AppButton
                title="Cancel"
                onPress={() => setPendingFormVisible(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <AppButton
                title="Submit Status"
                onPress={handlePendingSubmit}
                loading={markPendingMutation.isPending}
                style={{ flex: 1.5 }}
              />
            </View>
          </AppCard>
        )}

        {/* Completion Flow Form */}
        {completeFormVisible && (
          <AppCard style={styles.formCard}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Service Completion Flow</Text>

            {/* Photos Section */}
            <Text style={styles.formLabel}>Service Photos</Text>
            <View style={styles.photoGrid}>
              <View style={styles.photoBox}>
                <Text style={styles.photoTag}>Before Photo</Text>
                {beforePhotos.map((p, i) => (
                  <Image key={i} source={{ uri: p }} style={styles.photoThumbnail} />
                ))}
              </View>
              <View style={styles.photoBox}>
                <Text style={styles.photoTag}>After Photo</Text>
                {afterPhotos.length > 0 ? (
                  afterPhotos.map((p, i) => (
                    <Image key={i} source={{ uri: p }} style={styles.photoThumbnail} />
                  ))
                ) : (
                  <Pressable onPress={simulateAfterPhoto} style={styles.captureBtn}>
                    <Camera size={20} color={theme.colors.primary} />
                    <Text style={{ fontSize: 11, color: theme.colors.primary, marginTop: 4 }}>Capture</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Signature */}
            <AppInput
              label="Customer Signature (Type Name)"
              placeholder="e.g. Raj Kumar"
              value={customerSignature}
              onChangeText={setCustomerSignature}
              leftIcon={<Signature size={18} color={theme.colors.textLight} />}
            />

            {/* Duration */}
            <AppInput
              label="Time Spent / Duration"
              placeholder="e.g. 1.5 Hours"
              value={duration}
              onChangeText={setDuration}
            />

            {/* Work Notes */}
            <AppInput
              label="Work Summary & Resolution Notes"
              placeholder="e.g. Replaced compressor valve..."
              value={workNotes}
              onChangeText={setWorkNotes}
              multiline
              numberOfLines={3}
            />

            {/* Payment Details */}
            <Text style={styles.formLabel}>Billing & Payment Collection</Text>
            <View style={styles.btnRow}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="Total Collected (INR)"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="number-pad"
                  leftIcon={<DollarSign size={18} color={theme.colors.textLight} />}
                />
              </View>
              <View style={{ flex: 1, justifyContent: "flex-end", marginBottom: 12 }}>
                <Text style={styles.inputLabelSub}>Method</Text>
                <View style={styles.methodToggleRow}>
                  {["Online", "Cash"].map((m) => {
                    const isSel = paymentMethod === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setPaymentMethod(m)}
                        style={[
                          styles.methodBtn,
                          {
                            backgroundColor: isSel ? theme.colors.primary : theme.colors.background,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <Text style={{ color: isSel ? "#ffffff" : theme.colors.text, fontSize: 12 }}>{m}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={[styles.btnRow, { marginTop: 12 }]}>
              <AppButton
                title="Cancel"
                onPress={() => setCompleteFormVisible(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <AppButton
                title="Generate Invoice & Close"
                onPress={handleCompletionSubmit}
                loading={completeJobMutation.isPending}
                variant="success"
                style={{ flex: 2 }}
              />
            </View>
          </AppCard>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  formCard: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  jobTitle: {
    marginBottom: 6,
  },
  jobDesc: {
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
  customerName: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 8,
  },
  reasonOption: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
  },
  photoGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  photoBox: {
    flex: 1,
    alignItems: "center",
  },
  photoTag: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
  },
  photoThumbnail: {
    width: "100%",
    height: 90,
    borderRadius: 8,
  },
  captureBtn: {
    width: "100%",
    height: 90,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabelSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 4,
  },
  methodToggleRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    overflow: "hidden",
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
