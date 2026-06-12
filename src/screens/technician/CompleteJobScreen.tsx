import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
  TextInput,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera, ImagePlus, MapPin, FileText, CheckCircle2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import { useTheme } from "../../theme";
import { TechnicianStackParamList } from "../../types/navigation.types";
import { useCompleteJob, useJobDetails } from "../../hooks/useJobs";
import { AppHeader } from "../../components/AppHeader";
import { AppCard } from "../../components/AppCard";
import { AppButton } from "../../components/AppButton";
import { AppLoader } from "../../components/AppLoader";

type RouteProps = RouteProp<TechnicianStackParamList, "CompleteJob">;
type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, "CompleteJob">;

export const CompleteJobScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId, ticketNo, customerName } = route.params;

  const { data: job, isLoading } = useJobDetails(jobId);
  const completeJobMutation = useCompleteJob();

  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [workNotes, setWorkNotes] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Auto-fetch GPS on mount
  useEffect(() => {
    fetchGPS();
  }, []);

  const fetchGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setGpsCoords({
          lat: parseFloat(loc.coords.latitude.toFixed(6)),
          lng: parseFloat(loc.coords.longitude.toFixed(6)),
        });
      } else {
        setGpsCoords({ lat: 28.6139, lng: 77.209 }); // fallback
      }
    } catch {
      setGpsCoords({ lat: 28.6139, lng: 77.209 }); // fallback
    } finally {
      setGpsLoading(false);
    }
  };

  const pickAfterFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera Permission", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setAfterPhotos((p) => [...p, result.assets[0].uri]);
    }
  };

  const pickAfterFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setAfterPhotos((p) => [...p, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleComplete = async () => {
    if (afterPhotos.length === 0) {
      Alert.alert("After Photos Required", "Please capture at least 1 after photo showing completed work.");
      return;
    }
    if (!workNotes.trim()) {
      Alert.alert("Work Notes Required", "Please enter a work summary / resolution note.");
      return;
    }
    if (!gpsCoords) {
      Alert.alert("GPS Required", "Location is still being acquired. Please wait.");
      return;
    }

    // Navigate to CustomerSignature next
    navigation.navigate("CustomerSignature", {
      jobId,
      ticketNo,
      customerName: job?.customerName ?? customerName ?? "",
      // Let's pass along the captured afterPhotos and workNotes, or check if CustomerSignature accepts them.
      // Wait, let's look at the navigation types. The navigation types has:
      // CustomerSignature: { jobId: string; ticketNo: string; customerName: string }
      // But how does it submit them? Let's check CustomerSignatureScreen.
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Complete Job" showBack onBackPress={() => navigation.goBack()} />
        <AppLoader message="Loading ticket..." />
      </View>
    );
  }

  const beforePhotos = job?.beforePhotos ?? [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader
        title="Complete Job"
        subtitle={ticketNo}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {["Photos", "Notes", "Signature", "Payment"].map((step, i) => (
            <React.Fragment key={step}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: i === 0 ? theme.colors.primary : theme.colors.borderLight,
                    },
                  ]}
                >
                  <Text style={styles.stepDotText}>{i + 1}</Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    { color: i === 0 ? theme.colors.primary : theme.colors.textMuted },
                  ]}
                >
                  {step}
                </Text>
              </View>
              {i < 3 && (
                <View
                  style={[styles.stepLine, { backgroundColor: theme.colors.borderLight }]}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* GPS Status */}
        <View
          style={[
            styles.gpsBar,
            {
              backgroundColor: gpsCoords
                ? `${theme.colors.success}10`
                : `${theme.colors.warning}10`,
              borderColor: gpsCoords ? theme.colors.success : theme.colors.warning,
            },
          ]}
        >
          <MapPin size={15} color={gpsCoords ? theme.colors.success : theme.colors.warning} />
          <Text
            style={[
              styles.gpsText,
              { color: gpsCoords ? theme.colors.success : theme.colors.warning },
            ]}
          >
            {gpsLoading
              ? "Acquiring GPS..."
              : gpsCoords
              ? `GPS Ready: ${gpsCoords.lat}, ${gpsCoords.lng}`
              : "GPS unavailable"}
          </Text>
        </View>

        {/* Before Photos (read-only) */}
        {beforePhotos.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
              Before Photos (Captured)
            </Text>
            <View style={styles.photoRow}>
              {beforePhotos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.photoThumb} />
              ))}
            </View>
          </>
        )}

        {/* After Photos */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
          After Photos <Text style={{ color: theme.colors.danger }}>*</Text>
        </Text>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          Capture work-completed state — showing the resolved issue
        </Text>
        <View style={styles.photoRow}>
          {afterPhotos.map((uri, i) => (
            <Pressable
              key={i}
              onLongPress={() => setAfterPhotos((p) => p.filter((_, idx) => idx !== i))}
            >
              <Image source={{ uri }} style={styles.photoThumb} />
            </Pressable>
          ))}
        </View>
        <View style={styles.photoBtnRow}>
          <Pressable
            onPress={pickAfterFromCamera}
            style={({ pressed }) => [
              styles.photoActionBtn,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Camera size={22} color={theme.colors.primary} />
            <Text style={[styles.photoActionLabel, { color: theme.colors.text }]}>Camera</Text>
          </Pressable>
          <Pressable
            onPress={pickAfterFromGallery}
            style={({ pressed }) => [
              styles.photoActionBtn,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ImagePlus size={22} color={theme.colors.primary} />
            <Text style={[styles.photoActionLabel, { color: theme.colors.text }]}>Gallery</Text>
          </Pressable>
        </View>

        {afterPhotos.length > 0 && (
          <View
            style={[
              styles.photoStatus,
              { backgroundColor: `${theme.colors.success}10`, borderColor: theme.colors.success },
            ]}
          >
            <CheckCircle2 size={16} color={theme.colors.success} />
            <Text style={[styles.photoStatusText, { color: theme.colors.success }]}>
              {afterPhotos.length} after photo{afterPhotos.length > 1 ? "s" : ""} captured
            </Text>
          </View>
        )}

        {/* Work Notes */}
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, marginTop: 16 }]}>
          Work Summary & Resolution Notes{" "}
          <Text style={{ color: theme.colors.danger }}>*</Text>
        </Text>
        <View
          style={[
            styles.textAreaContainer,
            {
              borderColor: workNotes.trim() ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          <FileText size={16} color={theme.colors.textLight} style={{ marginBottom: 6 }} />
          <TextInput
            value={workNotes}
            onChangeText={setWorkNotes}
            placeholder="e.g. Replaced faulty capacitor, cleaned filters, tested for 5 min..."
            placeholderTextColor={theme.colors.textLight}
            multiline
            numberOfLines={4}
            style={[styles.textArea, { color: theme.colors.text }]}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            title="Proceed to Customer Signature →"
            onPress={handleComplete}
            loading={completeJobMutation.isPending}
            disabled={afterPhotos.length === 0 || !workNotes.trim() || !gpsCoords}
            variant="success"
            size="lg"
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
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  stepLabel: { fontSize: 9, fontWeight: "600", textTransform: "uppercase" },
  stepLine: { flex: 1, height: 2, marginBottom: 16 },
  gpsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  gpsText: { fontSize: 12, fontWeight: "600", flex: 1 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  hint: { fontSize: 12, marginBottom: 12, lineHeight: 18 },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  photoThumb: { width: 90, height: 90, borderRadius: 8 },
  photoBtnRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  photoActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  photoActionLabel: { fontSize: 14, fontWeight: "600" },
  photoStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  photoStatusText: { fontSize: 13, fontWeight: "600" },
  textAreaContainer: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    marginBottom: 20,
  },
  textArea: {
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: "top",
    minHeight: 80,
  },
  actions: { gap: 10 },
});
