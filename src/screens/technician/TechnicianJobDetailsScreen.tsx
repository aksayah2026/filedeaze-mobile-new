import React, { useState, useEffect } from "react";
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
  Switch,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Phone,
  MapPin,
  Clock,
  Navigation as NavigationIcon,
  CheckCircle2,
  AlertCircle,
  Camera,
  DollarSign,
  Calendar,
  XCircle,
  Mail,
  Tag,
  PhoneCall,
  PlayCircle,
  AlertTriangle,
  Upload,
  ArrowLeft,
  ChevronDown,
  Smartphone,
} from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { TicketStatus } from "../../services/job.service";
import {
  useJobDetails,
  useUpdateJobStatus,
  useCompleteJob,
  useRescheduleJob,
  useMarkJobPending,
  useRejectJob,
  useCollectPayment,
  useUploadTicketImage,
  useTechnicianJobs,
} from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppLoader } from "../../components/AppLoader";
import { AppCard } from "../../components/AppCard";
import { AppBadge } from "../../components/AppBadge";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { AppConfirmModal } from "../../components/AppConfirmModal";
import { AppSuccessModal } from "../../components/AppSuccessModal";

type RouteProps = RouteProp<TechnicianStackParamList, "TechnicianJobDetails">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "TechnicianJobDetails">;

const QUICK_REASONS = [
  "Outside my service area",
  "Skills mismatch — wrong specialization",
  "Medical / Emergency leave",
  "Schedule conflict",
  "Vehicle unavailable",
];

const PENDING_REASONS = [
  "Customer Not Available",
  "Spare Parts Required",
  "Additional Visit Required",
  "Technical Issue",
];

export const TechnicianJobDetailsScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId } = route.params;

  const { data: job, isLoading, refetch } = useJobDetails(jobId);
  const { data: allJobs = [] } = useTechnicianJobs();
  const updateStatusMutation = useUpdateJobStatus();
  const completeJobMutation = useCompleteJob();
  const rescheduleJobMutation = useRescheduleJob();
  const markPendingMutation = useMarkJobPending();
  const rejectJobMutation = useRejectJob();
  const collectPaymentMutation = useCollectPayment();
  const uploadImageMutation = useUploadTicketImage();

  // Dialog / Popups Visibility
  const [successVisible, setSuccessVisible] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    confirmVariant: "success" | "danger" | "primary";
    onConfirm: () => void;
  } | null>(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertModalTitle, setAlertModalTitle] = useState("");
  const [alertModalMessage, setAlertModalMessage] = useState("");

  // Reject State
  const [rejectFormVisible, setRejectFormVisible] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState("");
  const [rejectReasonText, setRejectReasonText] = useState("");

  // Pending State Form
  const [pendingFormVisible, setPendingFormVisible] = useState(false);
  const [selectedPendingReason, setSelectedPendingReason] = useState("");
  const [pendingNotes, setPendingNotes] = useState("");

  // Reschedule Form State
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [nextVisitDate, setNextVisitDate] = useState("");

  // Complete Form State
  const [completeFormVisible, setCompleteFormVisible] = useState(false);
  const [workNotes, setWorkNotes] = useState("");
  const [duration, setDuration] = useState("1.5 Hours");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [liveDuration, setLiveDuration] = useState("");

  useEffect(() => {
    if (job?.status !== "IN_PROGRESS") {
      setLiveDuration("");
      return;
    }

    if (completeFormVisible) {
      return;
    }

    const inProgressLog = job.statusLogs?.find((log: any) => log.status === "IN_PROGRESS");
    if (!inProgressLog) return;

    const startTime = new Date(inProgressLog.changedAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diffMs = now - startTime;
      if (diffMs <= 0) {
        setLiveDuration("00:00:00");
        return;
      }
      const totalSecs = Math.floor(diffMs / 1000);
      const secs = totalSecs % 60;
      const totalMins = Math.floor(totalSecs / 60);
      const mins = totalMins % 60;
      const hrs = Math.floor(totalMins / 60);

      const pad = (num: number) => String(num).padStart(2, "0");
      setLiveDuration(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [job?.status, job?.statusLogs, completeFormVisible]);

  useEffect(() => {
    if (completeFormVisible) {
      setDuration(liveDuration || "00:00:00");
    }
  }, [completeFormVisible]);

  // Payment Form State
  const [paymentFormVisible, setPaymentFormVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Reached Location GPS State
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Auto-fetch GPS onTravelling status mount
  useEffect(() => {
    if (job?.status === "TRAVELLING") {
      fetchGPS();
    }
  }, [job?.status]);

  const fetchGPS = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsError("Location permission denied. Please enable location service.");
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setGpsCoords({
        lat: parseFloat(loc.coords.latitude.toFixed(6)),
        lng: parseFloat(loc.coords.longitude.toFixed(6)),
      });
    } catch (e) {
      setGpsError("Could not fetch GPS. Using fallback coordinates.");
      setGpsCoords({ lat: 28.6139, lng: 77.2090 });
    } finally {
      setGpsLoading(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (status === "ACCEPTED") {
      // 1. Check if the technician already has another active job
      const hasActiveJob = Array.isArray(allJobs) && allJobs.some(
        (j) => j.id !== jobId && ["ACCEPTED", "TRAVELLING", "REACHED", "IN_PROGRESS", "PENDING", "RESCHEDULED", "INVOICE_GENERATED", "COMPLETED"].includes(j.status)
      );
      if (hasActiveJob) {
        setAlertModalTitle("Active Job Pending");
        setAlertModalMessage("You can only accept one job at a time. Please complete your current active job first.");
        setAlertModalVisible(true);
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
        setAlertModalTitle("Date Mismatch");
        setAlertModalMessage("You can only accept jobs scheduled for today.");
        setAlertModalVisible(true);
        return;
      }
    }

    try {
      await updateStatusMutation.mutateAsync({ ticketId: jobId, status });
      setSuccessTitle("Status Updated");
      setSuccessMessage(`Ticket status is now ${status}.`);
      setSuccessVisible(true);
      await refetch();
    } catch (err: any) {
      setAlertModalTitle("Error");
      setAlertModalMessage(err.message || "Failed to update status.");
      setAlertModalVisible(true);
    }
  };

  const triggerConfirm = (title: string, message: string, confirmText: string, confirmVariant: "success" | "danger" | "primary", onConfirm: () => void) => {
    setConfirmConfig({ title, message, confirmText, confirmVariant, onConfirm });
    setConfirmVisible(true);
  };

  const handleRejectSubmit = async () => {
    const finalReason = selectedRejectReason === "Other" ? rejectReasonText : selectedRejectReason;
    if (!finalReason.trim()) {
      Alert.alert("Required", "Please select or describe a rejection reason.");
      return;
    }
    try {
      await rejectJobMutation.mutateAsync({ ticketId: jobId, reason: finalReason });
      setRejectFormVisible(false);
      setSuccessTitle("Job Rejected");
      setSuccessMessage("This ticket has been rejected and will be reassigned.");
      setSuccessVisible(true);
      await refetch();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to reject job.");
    }
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
        notes: pendingNotes,
      });
      setPendingFormVisible(false);
      setSuccessTitle("Status Marked Pending");
      setSuccessMessage(`Ticket is now marked as pending. Reason: ${selectedPendingReason}`);
      setSuccessVisible(true);
      await refetch();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save status.");
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!nextVisitDate) {
      Alert.alert("Required", "Please enter reschedule date.");
      return;
    }
    try {
      await rescheduleJobMutation.mutateAsync({
        ticketNo: jobId,
        nextVisitDate,
      });
      setRescheduleVisible(false);
      setSuccessTitle("Job Rescheduled");
      setSuccessMessage(`Job has been rescheduled for ${nextVisitDate}.`);
      setSuccessVisible(true);
      await refetch();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to reschedule.");
    }
  };

  const handlePhotoUpload = async (type: "BEFORE" | "AFTER") => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Camera access is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        setUploadingImage(true);
        await uploadImageMutation.mutateAsync({
          ticketNo: jobId,
          imageUri: result.assets[0].uri,
          type,
        });
        await refetch();
      } catch (err: any) {
        Alert.alert("Upload Error", err.message || "Failed to upload image.");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleGalleryUpload = async (type: "BEFORE" | "AFTER") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Library access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        setUploadingImage(true);
        await uploadImageMutation.mutateAsync({
          ticketNo: jobId,
          imageUri: result.assets[0].uri,
          type,
        });
        await refetch();
      } catch (err: any) {
        Alert.alert("Upload Error", err.message || "Failed to upload image.");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleCompletionSubmit = async () => {
    if (!workNotes.trim()) {
      Alert.alert("Required", "Please provide work summary notes.");
      return;
    }
    try {
      await completeJobMutation.mutateAsync({
        ticketNo: jobId,
        payload: {
          beforePhotos: job?.beforePhotos || [],
          afterPhotos: job?.afterPhotos || [],
          customerSignature: "SIGNED IN CLIENT APP",
          workNotes,
          duration,
        },
      });
      setCompleteFormVisible(false);
      setSuccessTitle("Job Completed");
      setSuccessMessage("Work records saved successfully. Proceed to payment collection.");
      setSuccessVisible(true);
      await refetch();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to complete ticket.");
    }
  };

  const handlePaymentSubmit = async () => {
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Required", "Please enter a valid collection amount.");
      return;
    }
    if (!paymentMethod) {
      Alert.alert("Required", "Please select a payment method.");
      return;
    }
    if (!paymentConfirmed) {
      Alert.alert("Required", "Please confirm payment collection before submitting.");
      return;
    }
    try {
      await collectPaymentMutation.mutateAsync({
        ticketNo: jobId,
        amount: amt,
        paymentMethod,
      });
      setPaymentFormVisible(false);
      setSuccessTitle("Payment Captured");
      setSuccessMessage(`Collected ₹${amt} via ${paymentMethod}. Ticket status updated to CLOSED.`);
      setSuccessVisible(true);
      await refetch();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to log payment.");
    }
  };

  const openPhone = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openMaps = (address: string) => {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader showBack onBackPress={() => navigation.goBack()} title="Ticket Details" />
        <AppLoader message="Loading ticket details..." />
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

  const getActiveStep = (status: string) => {
    switch (status) {
      case "ASSIGNED":
      case "NEW":
        return 0;
      case "ACCEPTED":
        return 1;
      case "TRAVELLING":
        return 2;
      case "REACHED":
        return 3;
      case "IN_PROGRESS":
      case "PENDING":
      case "RESCHEDULED":
        return 4;
      case "COMPLETED":
        return 5;
      case "CLOSED":
        return 6;
      default:
        return 0;
    }
  };

  const activeStep = getActiveStep(job.status);
  const steps = ["Assigned", "Accepted", "Travel", "Reached", "Working", "Completed", "Closed"];

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case "URGENT":
      case "HIGH":
        return theme.colors.danger;
      case "MEDIUM":
        return theme.colors.warning;
      default:
        return theme.colors.primary;
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
        {/* Service Details Card */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Service Details</Text>
        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[styles.ticketNo, { color: theme.colors.textMuted }]}>{job.ticketNo}</Text>
          </View>
          <Text
            style={[
              styles.jobTitle,
              { color: theme.colors.text, fontSize: theme.typography.fontSize.lg, fontWeight: "700" },
            ]}
          >
            {job.service}
          </Text>
          <Text style={[styles.jobDesc, { color: theme.colors.textMuted, marginBottom: 12 }]}>
            {job.description}
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.success}12` }]}>
              <Calendar size={18} color={theme.colors.success} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Scheduled Time</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {job.scheduledDate} | {job.scheduledTime}
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
                {job.category || "—"}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Customer Details Card */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Customer Details</Text>
        <AppCard style={styles.card}>
          <Text style={[styles.customerName, { color: theme.colors.text, fontWeight: "600", fontSize: 16, marginBottom: 12 }]}>
            {job.customerName}
          </Text>

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.primary}12` }]}>
              <MapPin size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Service Address</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text, paddingRight: 8 }]}>
                {job.address}
              </Text>
            </View>
            <AppButton
              title="Map"
              onPress={() => openMaps(job.address)}
              variant="outline"
              size="sm"
              icon={<NavigationIcon size={12} color={theme.colors.primary} />}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.success}12` }]}>
              <Phone size={18} color={theme.colors.success} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Mobile Phone</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {job.customerMobile}
              </Text>
            </View>
            <AppButton
              title="Call"
              onPress={() => openPhone(job.customerMobile)}
              variant="outline"
              size="sm"
              icon={<Phone size={12} color={theme.colors.primary} />}
            />
          </View>

          {!!job.customerAlternatePhone && (
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
                <AppButton
                  title="Call"
                  onPress={() => openPhone(job.customerAlternatePhone!)}
                  variant="outline"
                  size="sm"
                  icon={<Phone size={12} color={theme.colors.primary} />}
                />
              </View>
            </>
          )}

          {!!job.customerEmail && (
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

        {/* Dynamic Action Controls */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Execution Controls</Text>

        {/* 1. ASSIGNED / NEW */}
        {(job.status === "ASSIGNED" || job.status === "NEW") && !rejectFormVisible && (
          <AppCard style={styles.card}>
            <Text style={[styles.actionCardTitle, { color: theme.colors.text }]}>Pending Acceptance</Text>
            <Text style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 16 }}>
              Review customer details and accept this ticket to start the execution flow.
            </Text>
            <View style={styles.btnRow}>
              <AppButton
                title="Reject"
                variant="outline"
                onPress={() => setRejectFormVisible(true)}
                style={{ flex: 1, borderColor: theme.colors.danger }}
                textStyle={{ color: theme.colors.danger }}
              />
              <AppButton
                title="Accept Ticket"
                onPress={() =>
                  triggerConfirm(
                    "Accept Job",
                    "Do you want to accept this job ticket?",
                    "Accept",
                    "success",
                    () => handleStatusChange("ACCEPTED")
                  )
                }
                style={{ flex: 1.5 }}
              />
            </View>
          </AppCard>
        )}

        {/* Reject Form Inline */}
        {rejectFormVisible && (
          <AppCard style={styles.formCard}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Rejection Reason</Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {QUICK_REASONS.map((r) => {
                const isSel = selectedRejectReason === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => {
                      setSelectedRejectReason(r);
                      setRejectReasonText("");
                    }}
                    style={[
                      styles.reasonOption,
                      {
                        backgroundColor: isSel ? `${theme.colors.danger}10` : theme.colors.background,
                        borderColor: isSel ? theme.colors.danger : theme.colors.borderLight,
                      },
                    ]}
                  >
                    <Text style={{ color: isSel ? theme.colors.danger : theme.colors.text }}>{r}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setSelectedRejectReason("Other")}
                style={[
                  styles.reasonOption,
                  {
                    backgroundColor: selectedRejectReason === "Other" ? `${theme.colors.danger}10` : theme.colors.background,
                    borderColor: selectedRejectReason === "Other" ? theme.colors.danger : theme.colors.borderLight,
                  },
                ]}
              >
                <Text style={{ color: selectedRejectReason === "Other" ? theme.colors.danger : theme.colors.text }}>Other Reason</Text>
              </Pressable>
            </View>
            {selectedRejectReason === "Other" && (
              <AppInput
                placeholder="Describe rejection reason..."
                value={rejectReasonText}
                onChangeText={setRejectReasonText}
              />
            )}
            <View style={styles.btnRow}>
              <AppButton title="Cancel" variant="outline" onPress={() => setRejectFormVisible(false)} style={{ flex: 1 }} />
              <AppButton title="Submit Reject" onPress={handleRejectSubmit} loading={rejectJobMutation.isPending} style={{ flex: 1.5 }} />
            </View>
          </AppCard>
        )}

        {/* 2. ACCEPTED */}
        {job.status === "ACCEPTED" && (
          <AppCard style={styles.card}>
            <Text style={[styles.actionCardTitle, { color: theme.colors.text }]}>Ticket Accepted</Text>
            <Text style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 16 }}>
              You have accepted the ticket. Tap below to start travelling to client location.
            </Text>
            <AppButton
              title="Start Travel"
              onPress={() => handleStatusChange("TRAVELLING")}
              loading={updateStatusMutation.isPending}
            />
          </AppCard>
        )}

        {/* 3. TRAVELLING */}
        {job.status === "TRAVELLING" && (
          <AppCard style={styles.card}>
            <Text style={[styles.actionCardTitle, { color: theme.colors.text }]}>On the Way</Text>
            <Text style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 16 }}>
              Fetching real-time GPS coordinate as proof of location arrival.
            </Text>

            {gpsLoading ? (
              <AppLoader message="Acquiring location coordinates..." />
            ) : gpsError ? (
              <View style={[styles.gpsErrorContainer, { backgroundColor: `${theme.colors.warning}10` }]}>
                <Text style={{ color: theme.colors.warning, fontSize: 12 }}>{gpsError}</Text>
                <AppButton title="Retry Location Capture" onPress={fetchGPS} variant="outline" size="sm" style={{ marginTop: 8 }} />
              </View>
            ) : gpsCoords ? (
              <View style={[styles.gpsSuccessContainer, { backgroundColor: `${theme.colors.success}10`, borderColor: theme.colors.success }]}>
                <Text style={{ color: theme.colors.success, fontSize: 12, fontWeight: "600" }}>
                  GPS Coords Captured: {gpsCoords.lat}, {gpsCoords.lng}
                </Text>
              </View>
            ) : null}

            <AppButton
              title="Mark as Reached"
              disabled={gpsLoading} // Commented out for testing: !gpsCoords || gpsLoading
              onPress={() => handleStatusChange("REACHED")}
              loading={updateStatusMutation.isPending}
              style={{ marginTop: 12 }}
            />
          </AppCard>
        )}

        {/* 4. REACHED */}
        {job.status === "REACHED" && (
          <AppCard style={styles.card}>
            <Text style={[styles.actionCardTitle, { color: theme.colors.text }]}>Reached Site Location</Text>
            <Text style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 16 }}>
              You have reached the client's location. Tap below to start executing the job.
            </Text>

            <AppButton
              title="Start Job"
              onPress={() => handleStatusChange("IN_PROGRESS")}
              loading={updateStatusMutation.isPending}
            />
          </AppCard>
        )}

        {/* 5. IN_PROGRESS */}
        {job.status === "IN_PROGRESS" && !pendingFormVisible && !completeFormVisible && (
          <AppCard style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={[styles.actionCardTitle, { color: theme.colors.text, marginBottom: 0 }]}>Job in Progress</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success }} />
                <Text style={{ fontSize: 12, color: theme.colors.success, fontWeight: "600" }}>ACTIVE</Text>
              </View>
            </View>

            <Text style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 14 }}>
              Update ticket status to Pending or mark it as Completed after resolution.
            </Text>

            {liveDuration ? (
              <View style={[styles.timerContainer, { backgroundColor: `${theme.colors.success}05`, borderColor: `${theme.colors.success}15`, paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6, marginBottom: 16 }]}>
                <Text style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Work Time Elapsed
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Clock size={20} color={theme.colors.success} />
                  <Text style={{ fontSize: 26, color: theme.colors.success, fontWeight: "700", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", letterSpacing: 1 }}>
                    {liveDuration}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.btnRow}>
              <AppButton
                title="Mark Pending"
                variant="warning"
                onPress={() => setPendingFormVisible(true)}
                style={{ flex: 1 }}
                icon={<AlertTriangle size={14} color="#ffffff" />}
              />
              <AppButton
                title="Complete Job"
                variant="success"
                onPress={() => setCompleteFormVisible(true)}
                style={{ flex: 1.5 }}
              />
            </View>
          </AppCard>
        )}

        {/* Mark Pending Inline Form */}
        {pendingFormVisible && (
          <AppCard style={styles.formCard}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Mark Ticket Pending</Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {PENDING_REASONS.map((r) => {
                const isSel = selectedPendingReason === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setSelectedPendingReason(r)}
                    style={[
                      styles.reasonOption,
                      {
                        backgroundColor: isSel ? `${theme.colors.primary}10` : theme.colors.background,
                        borderColor: isSel ? theme.colors.primary : theme.colors.borderLight,
                      },
                    ]}
                  >
                    <Text style={{ color: isSel ? theme.colors.primary : theme.colors.text }}>{r}</Text>
                  </Pressable>
                );
              })}
            </View>
            <AppInput
              label="Pending Notes / Comments"
              placeholder="e.g. Compressor unit needs order..."
              value={pendingNotes}
              onChangeText={setPendingNotes}
            />
            <View style={styles.btnRow}>
              <AppButton title="Cancel" variant="outline" onPress={() => setPendingFormVisible(false)} style={{ flex: 1 }} />
              <AppButton title="Submit" onPress={handlePendingSubmit} loading={markPendingMutation.isPending} style={{ flex: 1.5 }} />
            </View>
          </AppCard>
        )}

        {/* Complete Job Inline Form */}
        {completeFormVisible && (
          <AppCard style={styles.completeFormCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight, paddingBottom: 10 }}>
              <CheckCircle2 size={20} color={theme.colors.success} />
              <Text style={[styles.formTitle, { color: theme.colors.text, marginBottom: 0 }]}>Complete Job Details</Text>
            </View>

            {/* Work Duration Digital Stopwatch Readout Input */}
            <View style={{ backgroundColor: `${theme.colors.success}05`, borderWidth: 1, borderColor: `${theme.colors.success}20`, borderRadius: 12, padding: 14, marginBottom: 16, alignItems: "center" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Captured Work Duration</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Clock size={18} color={theme.colors.success} />
                <TextInput
                  value={duration}
                  onChangeText={setDuration}
                  style={{ fontSize: 24, fontWeight: "700", color: theme.colors.success, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", letterSpacing: 1, padding: 0, textAlign: "center" }}
                  placeholder="00:00:00"
                  placeholderTextColor={`${theme.colors.success}50`}
                />
              </View>
              <Text style={{ fontSize: 10, color: theme.colors.textLight, marginTop: 6, fontWeight: "500" }}>Tap readout to manually adjust</Text>
            </View>

            <AppInput
              label="Resolution Work Notes"
              value={workNotes}
              onChangeText={setWorkNotes}
              placeholder="Describe resolution summary, parts replaced, etc..."
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 8 }}
            />

            {/* Photo Upload Section */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>After Photos (Optional)</Text>

              {job.afterPhotos && job.afterPhotos.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                  {job.afterPhotos.map((p, idx) => (
                    <View key={idx} style={{ position: "relative" }}>
                      <Image source={{ uri: p }} style={{ width: 90, height: 90, borderRadius: 10 }} />
                    </View>
                  ))}
                  <Pressable
                    onPress={() => handlePhotoUpload("AFTER")}
                    style={{ width: 90, height: 90, borderRadius: 10, borderWidth: 1.5, borderStyle: "dashed", borderColor: theme.colors.primary, justifyContent: "center", alignItems: "center", backgroundColor: `${theme.colors.primary}05` }}
                  >
                    <Camera size={20} color={theme.colors.primary} />
                    <Text style={{ fontSize: 10, color: theme.colors.primary, fontWeight: "600", marginTop: 4 }}>Add Photo</Text>
                  </Pressable>
                </ScrollView>
              ) : (
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={() => handlePhotoUpload("AFTER")}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingVertical: 14,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderStyle: "dashed",
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.background,
                        opacity: pressed ? 0.8 : 1,
                      }
                    ]}
                  >
                    <Camera size={20} color={theme.colors.textMuted} />
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: theme.colors.text }}>Use Camera</Text>
                      <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>Take photo</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => handleGalleryUpload("AFTER")}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingVertical: 14,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderStyle: "dashed",
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.background,
                        opacity: pressed ? 0.8 : 1,
                      }
                    ]}
                  >
                    <Upload size={20} color={theme.colors.textMuted} />
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: theme.colors.text }}>Browse Gallery</Text>
                      <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>Upload files</Text>
                    </View>
                  </Pressable>
                </View>
              )}
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <AppButton title="Cancel" variant="outline" onPress={() => setCompleteFormVisible(false)} style={{ flex: 1, borderRadius: 10 }} />
              <AppButton title="Complete Ticket" variant="success" onPress={handleCompletionSubmit} loading={completeJobMutation.isPending} style={{ flex: 1.5, borderRadius: 10 }} />
            </View>
          </AppCard>
        )}

        {/* 6. COMPLETED */}
        {job.status === "COMPLETED" && !paymentFormVisible && (
          <AppCard style={styles.card}>
            <Text style={[styles.actionCardTitle, { color: theme.colors.text }]}>Service Completed</Text>
            <Text style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 16 }}>
              Tap below to log the payment collected from client.
            </Text>
            <AppButton
              title="Collect Payment"
              variant="success"
              onPress={() => setPaymentFormVisible(true)}
            />
          </AppCard>
        )}

        {/* Payment Collection Inline Form */}
        {paymentFormVisible && (
          <AppCard style={styles.completeFormCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight, paddingBottom: 10 }}>
              <DollarSign size={20} color={theme.colors.success} />
              <Text style={[styles.formTitle, { color: theme.colors.text, marginBottom: 0 }]}>Payment Collection</Text>
            </View>

            {/* Ticket & Customer Metadata Double Column Display */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1, backgroundColor: `${theme.colors.primary}05`, borderWidth: 1, borderColor: `${theme.colors.primary}10`, borderRadius: 10, padding: 12 }}>
                <Text style={{ fontSize: 9, fontWeight: "700", color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Ticket ID</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text }}>{job.ticketNo}</Text>
              </View>
              <View style={{ flex: 1.2, backgroundColor: `${theme.colors.success}05`, borderWidth: 1, borderColor: `${theme.colors.success}10`, borderRadius: 10, padding: 12 }}>
                <Text style={{ fontSize: 9, fontWeight: "700", color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Customer</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text }} numberOfLines={1}>{job.customerName}</Text>
              </View>
            </View>

            {/* Collected Amount Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Collection Amount</Text>
              <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: theme.colors.borderLight, borderRadius: 12, paddingHorizontal: 14, backgroundColor: theme.colors.background }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: theme.colors.textLight, marginRight: 6 }}>₹</Text>
                <TextInput
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textLight}
                  keyboardType="decimal-pad"
                  style={{ flex: 1, fontSize: 18, fontWeight: "700", color: theme.colors.text, height: 48, paddingVertical: 0 }}
                />
              </View>
            </View>

            {/* Payment Method Selector */}
            <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Select Payment Mode</Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 18 }}>
              {["CASH", "UPI"].map((mode) => {
                const isSel = paymentMethod === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setPaymentMethod(mode)}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      paddingVertical: 14,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: isSel ? theme.colors.primary : theme.colors.borderLight,
                      backgroundColor: isSel ? `${theme.colors.primary}08` : theme.colors.card,
                    }}
                  >
                    <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: isSel ? theme.colors.primary : theme.colors.textLight, alignItems: "center", justifyContent: "center" }}>
                      {isSel && <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: theme.colors.primary }} />}
                    </View>
                    <Text style={{ color: isSel ? theme.colors.primary : theme.colors.text, fontSize: 13, fontWeight: "700", textTransform: "uppercase" }}>{mode}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* UPI QR Code Scanner Display */}
            {paymentMethod === "UPI" && parseFloat(paymentAmount) > 0 && (
              <View style={{ alignItems: "center", padding: 16, backgroundColor: `${theme.colors.primary}05`, borderRadius: 12, borderWidth: 1, borderColor: `${theme.colors.primary}10`, marginBottom: 18 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <Smartphone size={16} color={theme.colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.textMuted, textTransform: "uppercase" }}>Scan UPI QR Code</Text>
                </View>
                <View style={{ padding: 12, backgroundColor: "#ffffff", borderRadius: 12, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 }}>
                  <QRCode
                    value={`upi://pay?pa=srinarmatha304@okicici&pn=FieldEaze+Services&am=${paymentAmount}&cu=INR&tn=ServicePayment`}
                    size={140}
                    backgroundColor="#ffffff"
                    color="#0f172a"
                  />
                </View>
                <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.primary, marginTop: 10 }}>₹{paymentAmount}</Text>
                <Text style={{ fontSize: 9, color: theme.colors.textLight, marginTop: 2 }}>UPI ID: srinarmatha304@okicici</Text>
              </View>
            )}

            {paymentMethod === "UPI" && (!paymentAmount || parseFloat(paymentAmount) <= 0) && (
              <View style={{ padding: 16, borderRadius: 10, borderWidth: 1.5, borderStyle: "dashed", borderColor: theme.colors.border, alignItems: "center", marginBottom: 18, backgroundColor: theme.colors.background }}>
                <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>Enter amount to generate scan QR code</Text>
              </View>
            )}

            {/* Customer Signature Requirement Notice */}
            <View style={{ backgroundColor: `${theme.colors.warning}05`, borderWidth: 1, borderColor: `${theme.colors.warning}15`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.warning, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Customer Signature</Text>
              <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>Pending backend signature capture API support.</Text>
            </View>

            {/* Payment Confirmation Toggle */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                backgroundColor: paymentConfirmed ? `${theme.colors.success}08` : theme.colors.background,
                borderColor: paymentConfirmed ? theme.colors.success : theme.colors.borderLight,
                marginBottom: 20,
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text }}>Confirm Payment Received</Text>
                <Text style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 1 }}>Toggle only after money is collected</Text>
              </View>
              <Switch
                value={paymentConfirmed}
                onValueChange={setPaymentConfirmed}
                trackColor={{ false: theme.colors.borderLight, true: `${theme.colors.success}60` }}
                thumbColor={paymentConfirmed ? theme.colors.success : theme.colors.textLight}
              />
            </View>

            <View style={styles.btnRow}>
              <AppButton title="Cancel" variant="outline" onPress={() => setPaymentFormVisible(false)} style={{ flex: 1, borderRadius: 10 }} />
              <AppButton
                title="Submit Payment"
                variant="success"
                onPress={handlePaymentSubmit}
                loading={collectPaymentMutation.isPending}
                disabled={!paymentConfirmed || !paymentAmount || parseFloat(paymentAmount) <= 0}
                style={{ flex: 1.6, borderRadius: 10 }}
              />
            </View>
          </AppCard>
        )}

        {/* 7. CLOSED */}
        {job.status === "CLOSED" && (
          <View style={[styles.successBanner, { backgroundColor: `${theme.colors.success}10`, borderColor: theme.colors.success }]}>
            <CheckCircle2 size={24} color={theme.colors.success} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.success, fontWeight: "700", fontSize: 14 }}>
                Ticket Closed & Settled
              </Text>
              {job.paymentCollection !== undefined && (
                <Text style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
                  Payment: ₹{job.paymentCollection} via {job.paymentMethod}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* 8. PENDING / RESCHEDULED */}
        {job.status === "PENDING" && !rescheduleVisible && (
          <AppCard style={styles.card}>
            <View style={[styles.alertBox, { backgroundColor: `${theme.colors.danger}10`, borderColor: theme.colors.danger }]}>
              <AlertCircle size={20} color={theme.colors.danger} />
              <Text style={{ color: theme.colors.text, fontSize: 13, flex: 1 }}>
                Reason: <Text style={{ fontWeight: "700" }}>{job.pendingReason}</Text>
              </Text>
            </View>
            <View style={[styles.btnRow, { marginTop: 16 }]}>
              <AppButton
                title="Resume Work"
                onPress={() => handleStatusChange("IN_PROGRESS")}
                style={{ flex: 1.5 }}
                loading={updateStatusMutation.isPending}
              />
              <AppButton
                title="Reschedule"
                variant="outline"
                onPress={() => setRescheduleVisible(true)}
                style={{ flex: 1 }}
              />
            </View>
          </AppCard>
        )}

        {job.status === "RESCHEDULED" && !rescheduleVisible && (
          <AppCard style={styles.card}>
            <View style={[styles.alertBox, { backgroundColor: `${theme.colors.warning}10`, borderColor: theme.colors.warning }]}>
              <Calendar size={20} color={theme.colors.warning} />
              <Text style={{ color: theme.colors.text, fontSize: 13, flex: 1 }}>
                Rescheduled date: <Text style={{ fontWeight: "700" }}>{job.nextVisitDate}</Text>
              </Text>
            </View>
            <AppButton
              title="Resume Work Now"
              onPress={() => handleStatusChange("IN_PROGRESS")}
              style={{ marginTop: 16 }}
              loading={updateStatusMutation.isPending}
            />
          </AppCard>
        )}

        {/* Reschedule Visit Date Input Form */}
        {rescheduleVisible && (
          <AppCard style={styles.formCard}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Reschedule Ticket</Text>
            <AppInput
              label="Next Visit Date (YYYY-MM-DD)"
              placeholder="e.g. 2026-06-25"
              value={nextVisitDate}
              onChangeText={setNextVisitDate}
            />
            <View style={styles.btnRow}>
              <AppButton title="Cancel" variant="outline" onPress={() => setRescheduleVisible(false)} style={{ flex: 1 }} />
              <AppButton title="Reschedule" onPress={handleRescheduleSubmit} loading={rescheduleJobMutation.isPending} style={{ flex: 1.5 }} />
            </View>
          </AppCard>
        )}

        {/* Customer Attached Images */}
        {job.images && job.images.length > 0 && job.status !== "COMPLETED" && job.status !== "CLOSED" && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Attached Images</Text>
            <View style={styles.photoGrid}>
              {job.images.map((imgUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: imgUrl }}
                  style={styles.photoThumbnail}
                />
              ))}
            </View>
          </>
        )}

        {/* Upload Status State Overlay */}
        {uploadingImage && (
          <AppLoader message="Uploading image to server..." />
        )}
      </ScrollView>

      {/* Confirmation Dialog Modal */}
      {confirmVisible && confirmConfig && (
        <AppConfirmModal
          visible={confirmVisible}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          cancelText="Cancel"
          confirmVariant={confirmConfig.confirmVariant}
          onConfirm={() => {
            setConfirmVisible(false);
            confirmConfig.onConfirm();
          }}
          onCancel={() => setConfirmVisible(false)}
        />
      )}

      {/* Success Notification Modal */}
      <AppSuccessModal
        visible={successVisible}
        title={successTitle}
        message={successMessage}
        onClose={() => setSuccessVisible(false)}
        autoCloseDelay={2000}
      />

      {/* App Alert Warning Modal */}
      <AppConfirmModal
        visible={alertModalVisible}
        title={alertModalTitle}
        message={alertModalMessage}
        confirmText="Close"
        confirmVariant="warning"
        showCancel={false}
        onConfirm={() => setAlertModalVisible(false)}
        onCancel={() => setAlertModalVisible(false)}
      />
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
    marginBottom: 16,
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
    flexWrap: "wrap",
    gap: 12,
    marginVertical: 12,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  methodToggleRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
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
  stepsCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  stepInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stepStatusLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stepCurrentText: {
    fontSize: 16,
    fontWeight: "700",
  },
  stepNextText: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  stepLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepMinLabel: {
    fontSize: 9,
    textAlign: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketNo: {
    fontSize: 13,
    fontWeight: "600",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  gpsErrorContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  gpsSuccessContainer: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  gridCol: {
    flex: 1,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    gap: 8,
  },
  tileIcon: {
    marginRight: 4,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tileValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  miniActionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  completeFormCard: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderTopWidth: 4,
    borderTopColor: "#10b981", // Success green
  },
  uploadPlaceholder: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
});
