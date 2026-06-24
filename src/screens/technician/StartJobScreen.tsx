import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Pressable,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera, ImagePlus, PlayCircle, Clock, CheckCircle } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { useSaveBeforePhotos, useJobDetails } from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppLoader } from "../../components/AppLoader";
import { AppSuccessModal } from "../../components/AppSuccessModal";
import { AppAlertModal } from "../../components/AppAlertModal";
import { AppConfirmModal } from "../../components/AppConfirmModal";

type RouteProps = RouteProp<TechnicianStackParamList, "StartJob">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "StartJob">;

export const StartJobScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, ticketNo } = route.params;

  const { data: job, isLoading } = useJobDetails(jobId);
  const savePhotosMutation = useSaveBeforePhotos();

  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);

  // Styled alert popup states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "warning">("warning");
  const [earlyStartModalVisible, setEarlyStartModalVisible] = useState(false);

  const showAlert = (title: string, message: string, type: "success" | "error" | "warning" = "warning") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  // Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Needed", "Camera access is required to capture before photos.", "error");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setBeforePhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Needed", "Photo library access is required.", "error");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (!result.canceled && result.assets.length > 0) {
      setBeforePhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removePhoto = (index: number) => {
    setBeforePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const startJobMutationCall = async () => {
    try {
      await savePhotosMutation.mutateAsync({ ticketNo: jobId, photos: beforePhotos });
      setTimerRunning(true);
      setSuccessModalVisible(true);
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to start job.", "error");
    }
  };

  const handleStartJob = async () => {
    if (beforePhotos.length === 0) {
      showAlert("Before Photos Required", "Please capture at least 1 before photo of the job site.", "warning");
      return;
    }

    if (job?.scheduledAt) {
      const scheduledTimeMs = new Date(job.scheduledAt).getTime();
      const currentTimeMs = new Date().getTime();
      if (currentTimeMs < scheduledTimeMs) {
        setEarlyStartModalVisible(true);
        return;
      }
    }

    await startJobMutationCall();
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
    navigation.navigate("TechnicianHome");
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Start Job" showBack onBackPress={() => navigation.goBack()} />
        <AppLoader message="Loading ticket..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        title="Start Job"
        subtitle={ticketNo}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Live Timer */}
        <View
          style={[
            styles.timerCard,
            {
              backgroundColor: timerRunning
                ? `${theme.colors.success}10`
                : `${theme.colors.primary}08`,
              borderColor: timerRunning ? theme.colors.success : theme.colors.borderLight,
            },
          ]}
        >
          <View style={styles.timerRow}>
            <Clock size={20} color={timerRunning ? theme.colors.success : theme.colors.textMuted} />
            <Text style={[styles.timerLabel, { color: theme.colors.textMuted }]}>
              {timerRunning ? "WORK TIMER — RUNNING" : "WORK TIMER — READY"}
            </Text>
          </View>
          <Text
            style={[
              styles.timerValue,
              {
                color: timerRunning ? theme.colors.success : theme.colors.text,
              },
            ]}
          >
            {formatTimer(timerSeconds)}
          </Text>
          <Text style={[styles.timerHint, { color: theme.colors.textMuted }]}>
            Timer starts automatically when you begin the job
          </Text>
        </View>

        {/* Job Summary */}
        <AppCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
            Ticket
          </Text>
          <Text style={[styles.serviceName, { color: theme.colors.text }]}>{job?.service}</Text>
          <Text style={[styles.desc, { color: theme.colors.textMuted }]} numberOfLines={2}>
            {job?.description}
          </Text>
        </AppCard>

        {/* Before Photos */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
          Before Photos <Text style={{ color: theme.colors.danger }}>*</Text>
        </Text>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          Capture the site condition BEFORE starting work (required for job record)
        </Text>

        {/* Photo Grid */}
        {beforePhotos.length > 0 && (
          <View style={styles.photoGrid}>
            {beforePhotos.map((uri, idx) => (
              <Pressable key={idx} onLongPress={() => removePhoto(idx)} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photoThumbnail} />
                <View style={[styles.photoIndex, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.photoIndexText}>{idx + 1}</Text>
                </View>
                <Text style={[styles.photoHint, { color: theme.colors.textMuted }]}>
                  Long-press to remove
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Photo Action Buttons */}
        <View style={styles.photoBtnRow}>
          <Pressable
            onPress={pickFromCamera}
            style={({ pressed }) => [
              styles.photoActionBtn,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Camera size={24} color={theme.colors.primary} />
            <Text style={[styles.photoActionLabel, { color: theme.colors.text }]}>Camera</Text>
            <Text style={[styles.photoActionSub, { color: theme.colors.textMuted }]}>Take Photo</Text>
          </Pressable>

          <Pressable
            onPress={pickFromGallery}
            style={({ pressed }) => [
              styles.photoActionBtn,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <ImagePlus size={24} color={theme.colors.primary} />
            <Text style={[styles.photoActionLabel, { color: theme.colors.text }]}>Gallery</Text>
            <Text style={[styles.photoActionSub, { color: theme.colors.textMuted }]}>Choose Files</Text>
          </Pressable>
        </View>

        {beforePhotos.length > 0 && (
          <View
            style={[
              styles.photoStatus,
              { backgroundColor: `${theme.colors.success}10`, borderColor: theme.colors.success },
            ]}
          >
            <CheckCircle size={16} color={theme.colors.success} />
            <Text style={[styles.photoStatusText, { color: theme.colors.success }]}>
              {beforePhotos.length} before photo{beforePhotos.length > 1 ? "s" : ""} ready
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            title="Start Job & Begin Timer"
            onPress={handleStartJob}
            loading={savePhotosMutation.isPending}
            disabled={beforePhotos.length === 0}
            variant="success"
            size="lg"
            icon={<PlayCircle size={22} color="#ffffff" />}
          />
          <AppButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>

      {/* App Success Modal */}
      <AppSuccessModal
        visible={successModalVisible}
        title="Job Started ✓"
        message="Status set to IN PROGRESS. Your work timer has started."
        onClose={handleSuccessClose}
        autoCloseDelay={2000}
      />

      {/* Custom Alert/Warning Modal */}
      <AppAlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />

      {/* Early Start Warning Modal */}
      <AppConfirmModal
        visible={earlyStartModalVisible}
        title="Early Start Warning"
        message={`You are starting this job before the scheduled visit time (${job?.scheduledDate} · ${job?.scheduledTime}).\n\nAre you sure you want to proceed and start work now?`}
        confirmText="Yes, Start Now"
        cancelText="Cancel"
        confirmVariant="warning"
        onConfirm={async () => {
          setEarlyStartModalVisible(false);
          await startJobMutationCall();
        }}
        onCancel={() => setEarlyStartModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  timerCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    marginBottom: 20,
  },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  timerLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  timerValue: { fontSize: 48, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: 2 },
  timerHint: { fontSize: 11, marginTop: 8, textAlign: "center" },
  card: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  serviceName: { fontSize: 15, fontWeight: "700", marginBottom: 6 },
  desc: { fontSize: 13, lineHeight: 20 },
  hint: { fontSize: 12, marginBottom: 14, lineHeight: 18 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  photoWrapper: { width: 100 },
  photoThumbnail: { width: 100, height: 100, borderRadius: 10 },
  photoIndex: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  photoIndexText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  photoHint: { fontSize: 9, textAlign: "center", marginTop: 4 },
  photoBtnRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  photoActionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  photoActionLabel: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  photoActionSub: { fontSize: 11 },
  photoStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  photoStatusText: { fontSize: 13, fontWeight: "600" },
  actions: { gap: 10 },
});
