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
  Pressable,
  Image,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AlertCircle, Camera, CheckCircle2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { useMarkJobPending, useJobDetails } from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppLoader } from "../../components/AppLoader";

type RouteProps = RouteProp<TechnicianStackParamList, "MarkPending">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "MarkPending">;

const PENDING_REASONS = [
  "Customer Not Available",
  "Spare Parts Required",
  "Additional Visit Required",
  "Technical Issue",
];

export const MarkPendingScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, ticketNo } = route.params;

  const { data: job, isLoading } = useJobDetails(jobId);
  const pendingMutation = useMarkJobPending();

  const [selectedReason, setSelectedReason] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      // Try gallery
      const galRes = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: 3,
      });
      if (!galRes.canceled) {
        setPhotos((p) => [...p, ...galRes.assets.map((a) => a.uri)]);
      }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setPhotos((p) => [...p, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Required", "Please select a pending reason.");
      return;
    }

    try {
      await pendingMutation.mutateAsync({
        ticketNo: jobId,
        pendingReason: selectedReason,
        notes: notes.trim(),
      });
      Alert.alert(
        "Marked as Pending",
        `Ticket ${ticketNo} has been marked as Pending.\nReason: ${selectedReason}`,
        [{ text: "OK", onPress: () => navigation.navigate("TechnicianHome") }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to mark as pending.");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Mark Pending" showBack onBackPress={() => navigation.goBack()} />
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
        title="Mark as Pending"
        subtitle={ticketNo}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View
          style={[
            styles.infoBanner,
            { backgroundColor: `${theme.colors.warning}10`, borderColor: theme.colors.warning },
          ]}
        >
          <AlertCircle size={20} color={theme.colors.warning} />
          <Text style={[styles.bannerText, { color: theme.colors.text }]}>
            This will pause the job and flag it for re-scheduling. Dispatch will be notified.
          </Text>
        </View>

        {/* Job Summary */}
        <AppCard style={styles.card}>
          <Text style={[styles.ticketNo, { color: theme.colors.textMuted }]}>{ticketNo}</Text>
          <Text style={[styles.serviceName, { color: theme.colors.text }]}>{job?.service}</Text>
          <Text style={[styles.customer, { color: theme.colors.textMuted }]}>
            {job?.customerName}
          </Text>
        </AppCard>

        {/* Reason Dropdown (radio list) */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
          Pending Reason <Text style={{ color: theme.colors.danger }}>*</Text>
        </Text>
        <View style={styles.reasonList}>
          {PENDING_REASONS.map((r) => {
            const isSelected = selectedReason === r;
            return (
              <Pressable
                key={r}
                onPress={() => setSelectedReason(r)}
                style={[
                  styles.reasonOption,
                  {
                    backgroundColor: isSelected
                      ? `${theme.colors.warning}12`
                      : theme.colors.card,
                    borderColor: isSelected ? theme.colors.warning : theme.colors.borderLight,
                  },
                ]}
              >
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: isSelected ? theme.colors.warning : theme.colors.border },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[styles.radioInner, { backgroundColor: theme.colors.warning }]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.reasonText,
                    {
                      color: isSelected ? theme.colors.text : theme.colors.text,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {r}
                </Text>
                {isSelected && <CheckCircle2 size={16} color={theme.colors.warning} />}
              </Pressable>
            );
          })}
        </View>

        {/* Notes (optional) */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginTop: 16 }]}>
          Additional Notes <Text style={{ color: theme.colors.textLight }}>(optional)</Text>
        </Text>
        <View
          style={[
            styles.textAreaContainer,
            {
              borderColor: notes ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Customer says will be available tomorrow 2PM..."
            placeholderTextColor={theme.colors.textLight}
            multiline
            numberOfLines={3}
            style={[styles.textArea, { color: theme.colors.text }]}
          />
        </View>

        {/* Photos (optional) */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginTop: 16 }]}>
          Evidence Photos <Text style={{ color: theme.colors.textLight }}>(optional)</Text>
        </Text>
        <View style={styles.photoRow}>
          {photos.map((uri, i) => (
            <Pressable
              key={i}
              onLongPress={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
            >
              <Image source={{ uri }} style={styles.photoThumbnail} />
            </Pressable>
          ))}
          {photos.length < 3 && (
            <Pressable
              onPress={pickPhoto}
              style={[styles.addPhotoBtn, { borderColor: theme.colors.border }]}
            >
              <Camera size={22} color={theme.colors.textMuted} />
              <Text style={[styles.addPhotoText, { color: theme.colors.textMuted }]}>Add</Text>
            </Pressable>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            title="Submit Pending Status"
            onPress={handleSubmit}
            loading={pendingMutation.isPending}
            disabled={!selectedReason}
            variant="warning"
            size="lg"
            icon={<AlertCircle size={20} color="#ffffff" />}
          />
          <AppButton
            title="Cancel"
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
  card: { marginBottom: 16 },
  ticketNo: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  serviceName: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  customer: { fontSize: 13 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  reasonList: { gap: 8, marginBottom: 4 },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  reasonText: { fontSize: 14, flex: 1 },
  textAreaContainer: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
  },
  textArea: {
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: "top",
    minHeight: 66,
  },
  photoRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  photoThumbnail: { width: 80, height: 80, borderRadius: 8 },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoText: { fontSize: 11 },
  actions: { gap: 10 },
});
